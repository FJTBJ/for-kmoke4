import React, { useState, useEffect, useRef } from 'react';
import { Scene, Shot } from '../types';
import { ShotBlock } from './ShotBlock';
import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, Settings, Film, Info, Grid, List, Search, FolderOpen, MoreVertical, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShotTimelineProps {
  scene: Scene;
  episodeNumber: number;
  scale: number;
  setScale: (scale: number | ((prev: number) => number)) => void;
  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onOpenAssetManager: () => void;
}

export const ShotTimeline: React.FC<ShotTimelineProps> = ({ 
  scene, 
  episodeNumber,
  scale, 
  setScale,
  playheadPosition, 
  setPlayheadPosition,
  isPlaying,
  setIsPlaying,
  onOpenAssetManager
}) => {
  const [activeShot, setActiveShot] = useState<Shot | null>(null);
  const [mediaPoolView, setMediaPoolView] = useState<'grid' | 'list'>('grid');
  const [hoveredShotId, setHoveredShotId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Wheel zoom logic for shot timeline
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomSpeed = 0.001;
        
        const container = timelineRef.current;
        if (!container) return;

        const prevScale = scale;
        const zoomFactor = prevScale; 
        const newScale = Math.max(0.5, Math.min(30, prevScale - delta * zoomSpeed * zoomFactor));
        
        if (newScale !== prevScale) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const contentX = mouseX + container.scrollLeft;
          const ratio = newScale / prevScale;
          
          setScale(newScale);
          
          const targetScrollLeft = contentX * ratio - mouseX;
          requestAnimationFrame(() => {
            if (container) {
              container.scrollLeft = targetScrollLeft;
            }
          });
        }
      }
    };

    const container = timelineRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale, setScale]);

  // Find active shot based on playhead position
  useEffect(() => {
    const shot = scene.shots.find(s => 
      playheadPosition >= s.startTime && playheadPosition < s.startTime + s.duration
    );
    setActiveShot(shot || null);
  }, [playheadPosition, scene.shots]);

  // Handle timeline click to seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPos = Math.max(0, Math.min(scene.duration, x / scale));
    setPlayheadPosition(newPos);
  };

  const handleMouseMove = (e: React.MouseEvent, shotId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const index = Math.floor(percent * 10);
    setPreviewIndex(index);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
      {/* Top Section: Media Pool & Player */}
      <div className="flex-1 flex min-h-0 border-b border-[#222]">
        {/* Media Pool (DaVinci Style) */}
        <div className="w-1/3 flex flex-col border-r border-[#222] bg-[#111]">
          <div className="h-10 border-b border-[#222] bg-[#161616] flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-gray-300">素材池 (Media Pool)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMediaPoolView('grid')}
                className={cn("p-1 rounded hover:bg-white/5", mediaPoolView === 'grid' ? "text-blue-500 bg-blue-500/10" : "text-gray-500")}
              >
                <Grid size={14} />
              </button>
              <button 
                onClick={() => setMediaPoolView('list')}
                className={cn("p-1 rounded hover:bg-white/5", mediaPoolView === 'list' ? "text-blue-500 bg-blue-500/10" : "text-gray-500")}
              >
                <List size={14} />
              </button>
              <div className="w-[1px] h-3 bg-[#333] mx-1" />
              <button 
                onClick={onOpenAssetManager}
                className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                title="更多素材管理"
              >
                <span className="text-[10px] font-bold">更多</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
          
          <div className="h-10 border-b border-[#222] bg-[#141414] flex items-center px-3 gap-2">
            <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded px-2 py-1">
              <Search size={12} className="text-gray-600" />
              <input type="text" placeholder="搜索素材..." className="bg-transparent border-none text-[10px] text-gray-400 focus:outline-none w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {mediaPoolView === 'grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {scene.shots.map(shot => (
                  <div 
                    key={shot.id} 
                    className={cn(
                      "group relative aspect-video rounded bg-[#1a1a1a] overflow-hidden border transition-all cursor-pointer",
                      activeShot?.id === shot.id ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-white/5 hover:border-white/20"
                    )}
                    onClick={() => setPlayheadPosition(shot.startTime)}
                    onMouseMove={(e) => handleMouseMove(e, shot.id)}
                    onMouseEnter={() => setHoveredShotId(shot.id)}
                    onMouseLeave={() => {
                      setHoveredShotId(null);
                      setPreviewIndex(0);
                    }}
                  >
                    <img 
                      src={hoveredShotId === shot.id ? `https://picsum.photos/seed/${shot.id}-${previewIndex}/200/120` : shot.thumbnail} 
                      alt={shot.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-100" 
                      referrerPolicy="no-referrer" 
                    />
                    {hoveredShotId === shot.id && (
                      <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/20">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-100" 
                          style={{ width: `${(previewIndex + 1) * 10}%` }}
                        />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/80 backdrop-blur-sm flex items-center justify-between">
                      <span className="text-[9px] font-medium truncate text-gray-300">{shot.name}</span>
                      <span className="text-[8px] font-mono text-gray-500">{shot.duration}s</span>
                    </div>
                    {activeShot?.id === shot.id && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full shadow-glow" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {scene.shots.map(shot => (
                  <div 
                    key={shot.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded text-[10px] cursor-pointer transition-colors",
                      activeShot?.id === shot.id ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-gray-400"
                    )}
                    onClick={() => setPlayheadPosition(shot.startTime)}
                  >
                    <div className="w-12 aspect-video rounded overflow-hidden bg-black">
                      <img src={shot.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <span className="flex-1 truncate">{shot.name}</span>
                    <span className="font-mono text-gray-600">{shot.duration}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Player Area (DaVinci Style) */}
        <div className="flex-1 flex flex-col bg-black relative group">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative w-full max-w-4xl aspect-video bg-[#111] rounded shadow-2xl border border-white/5 overflow-hidden">
              {activeShot ? (
                <img 
                  src={activeShot.thumbnail.replace('200/120', '1280/720')} 
                  alt={activeShot.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700">
                  <Film size={64} />
                </div>
              )}
              
              {/* Player Overlay Controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-white">
                    <span>{Math.floor(playheadPosition / 60)}:{Math.floor(playheadPosition % 60).toString().padStart(2, '0')}</span>
                    <span className="text-gray-500">/</span>
                    <span>{Math.floor(scene.duration / 60)}:{Math.floor(scene.duration % 60).toString().padStart(2, '0')}</span>
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
          
          {/* Player Info Bar & Controls */}
          <div className="h-14 bg-[#161616] border-t border-[#222] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Source Viewer</span>
              <div className="h-3 w-[1px] bg-[#333]" />
              <span className="text-[10px] text-gray-500 font-mono">{activeShot?.name || 'No Clip Selected'}</span>
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

            <div className="flex items-center gap-4 text-right">
              <div className="flex flex-col">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Timecode</div>
                <div className="text-sm font-mono text-blue-500 font-bold">
                  {Math.floor(playheadPosition / 60).toString().padStart(2, '0')}:
                  {Math.floor(playheadPosition % 60).toString().padStart(2, '0')}:00
                </div>
              </div>
              <MoreVertical size={14} className="text-gray-600 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Timeline */}
      <div className="h-80 bg-[#111] flex flex-col">
        {/* Timeline Header */}
        <div className="px-6 py-2 border-b border-[#222] flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-1 h-6 rounded-full", 
              scene.productionStatus === 'completed' ? "bg-emerald-500" :
              scene.assetStatus === 'ready' ? "bg-blue-500" : "bg-gray-700"
            )} />
            <div>
              <h2 className="text-xs font-bold text-white">m-e{episodeNumber.toString().padStart(3, '0')}-{scene.sceneNumber}</h2>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Timeline - Video Track 1</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded border border-white/5">
              <span className="text-[11px] font-mono text-blue-500">
                {Math.floor(playheadPosition / 60).toString().padStart(2, '0')}:
                {Math.floor(playheadPosition % 60).toString().padStart(2, '0')}:00
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="flex-1 overflow-x-auto custom-scrollbar relative bg-[#0a0a0a]" ref={timelineRef} onClick={handleTimelineClick}>
          <div 
            className="h-full p-8 relative"
            style={{ width: scene.duration * scale + 200 }}
          >
            {/* Time Markers */}
            <div className="absolute inset-0 flex items-end pointer-events-none">
              {Array.from({ length: Math.ceil(scene.duration / 10) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bottom-0 border-l border-white/5 h-full flex flex-col justify-end"
                  style={{ left: i * 10 * scale }}
                >
                  <span className="text-[9px] text-gray-600 font-mono -translate-x-1/2 mb-2">
                    {Math.floor((i * 10) / 60)}:{((i * 10) % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>

            {/* Shot Track */}
            <div className="relative h-24 mt-4">
              <div className="absolute left-[-100px] top-0 w-20 text-[10px] text-gray-600 font-bold uppercase tracking-widest py-2">Video 1</div>
              {scene.shots.map(shot => (
                <ShotBlock key={shot.id} shot={shot} scale={scale} />
              ))}
            </div>

            {/* Playhead */}
            <motion.div 
              className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-50 pointer-events-none"
              style={{ left: playheadPosition * scale }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rotate-45 -translate-y-1/2 shadow-lg" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
