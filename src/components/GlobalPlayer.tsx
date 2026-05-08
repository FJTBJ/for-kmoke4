import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Settings, Maximize2, Film, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface GlobalPlayerProps {
  scenes: Scene[];
  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  totalDuration: number;
  mode?: 'edit' | 'storyboard' | 'ai';
}

export const GlobalPlayer: React.FC<GlobalPlayerProps> = ({
  scenes,
  playheadPosition,
  setPlayheadPosition,
  isPlaying,
  setIsPlaying,
  totalDuration,
  mode = 'edit'
}) => {
  const [activeScene, setActiveScene] = useState<Scene | null>(null);
  const [sceneStartTime, setSceneStartTime] = useState(0);

  useEffect(() => {
    let currentStart = 0;
    const scene = scenes.find(s => {
      const duration = Math.max(s.duration, 30);
      const isMatch = playheadPosition >= currentStart && playheadPosition < currentStart + duration;
      if (!isMatch) currentStart += duration;
      return isMatch;
    });
    setActiveScene(scene || null);
    setSceneStartTime(currentStart);
  }, [playheadPosition, scenes]);

  const isNotProduced = activeScene?.productionStatus !== 'completed';

  const getPlayerContent = () => {
    if (!activeScene) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-700">
          <Film size={64} />
        </div>
      );
    }

    if (mode === 'storyboard') {
      return (
        <div className="w-full h-full relative">
          <img 
            src={`https://picsum.photos/seed/${activeScene.id}-storyboard/1280/720?grayscale`} 
            alt={activeScene.title}
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded border border-white/10 text-white font-bold tracking-widest uppercase text-sm">
              STORYBOARD MODE
            </div>
          </div>
        </div>
      );
    }

    if (mode === 'ai') {
      return (
        <div className="w-full h-full relative">
          <img 
            src={`https://picsum.photos/seed/${activeScene.id}-ai/1280/720?blur=2`} 
            alt={activeScene.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-blue-500/10 flex flex-col items-center justify-center gap-4">
            <div className="px-4 py-2 bg-blue-600/80 backdrop-blur-md rounded border border-blue-400/30 text-white font-bold tracking-widest uppercase text-sm animate-pulse">
              AI ROUGH CUT GENERATING...
            </div>
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-400"
                animate={{ x: [-256, 256] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </div>
          </div>
        </div>
      );
    }

    // Default Edit mode
    if (isNotProduced) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] text-gray-500 gap-4">
          <div className="relative">
            <Film size={80} className="opacity-20" />
            <AlertCircle size={32} className="absolute -top-2 -right-2 text-orange-500/50" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl font-bold tracking-widest text-gray-600 uppercase">尚未制作</span>
            <span className="text-xs text-gray-700 font-mono">SCENE {activeScene.sceneNumber} - {activeScene.title}</span>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[10px] font-mono text-gray-500">
            PLACEHOLDER PREVIEW (30s)
          </div>
        </div>
      );
    }

    return (
      <img 
        src={`https://picsum.photos/seed/${activeScene.id}/1280/720`} 
        alt={activeScene.title}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  };

  return (
    <div className="flex flex-col bg-black h-full">
      <div className="flex-1 flex items-center justify-center p-6 relative group">
        <div className="relative w-full aspect-video bg-[#111] rounded shadow-2xl border border-white/5 overflow-hidden">
          {getPlayerContent()}

          {/* Player Overlay Controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-mono text-white">
                <span>{Math.floor(playheadPosition / 60)}:{Math.floor(playheadPosition % 60).toString().padStart(2, '0')}</span>
                <span className="text-gray-500">/</span>
                <span>{Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="flex items-center gap-4 text-gray-400">
                <Volume2 size={20} className="hover:text-white cursor-pointer" />
                <Settings size={20} className="hover:text-white cursor-pointer" />
                <Maximize2 size={20} className="hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Info & Playback Controls Bar */}
      <div className="h-14 bg-[#161616] border-t border-[#222] flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mb-1">Global Timeline</span>
            <span className="text-[11px] text-gray-300 font-medium">{activeScene ? `SCENE ${activeScene.sceneNumber}: ${activeScene.title}` : 'No Scene Selected'}</span>
          </div>
          <div className="h-6 w-[1px] bg-[#333]" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", isNotProduced ? "bg-orange-500" : "bg-emerald-500")} />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{isNotProduced ? 'In Production' : 'Completed'}</span>
            </div>
          </div>
        </div>

        {/* Central Playback Controls */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
            <SkipBack size={18} />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-all shadow-lg shadow-blue-600/20"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="p-2 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
            <SkipForward size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Timecode</div>
            <div className="text-sm font-mono text-blue-500 font-bold">
              {Math.floor(playheadPosition / 60).toString().padStart(2, '0')}:
              {Math.floor(playheadPosition % 60).toString().padStart(2, '0')}:00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
