import React, { useState } from 'react';
import { Shot, Scene } from '../types';
import { 
  Grid, List, Kanban, Table as MatrixIcon, Search, Filter, 
  Download, Share2, MoreHorizontal, ChevronRight, 
  Play, Clock, User, Camera, Maximize2, ExternalLink, ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ShotAssetManagerProps {
  scenes: Scene[];
  onBack: () => void;
}

interface ShotPreviewCardProps {
  shot: Shot;
  onClick: (shot: Shot) => void;
}

const ShotPreviewCard: React.FC<ShotPreviewCardProps> = ({ shot, onClick }) => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    // Simulate 10 frames of preview
    const index = Math.floor(percent * 10);
    setPreviewIndex(index);
  };

  return (
    <div 
      ref={cardRef}
      className="group relative bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setPreviewIndex(0);
      }}
      onClick={() => onClick(shot)}
    >
      <div className="aspect-video relative overflow-hidden bg-black">
        <img 
          src={isHovering ? `https://picsum.photos/seed/${shot.id}-${previewIndex}/400/225` : shot.thumbnail} 
          alt={shot.name}
          className="w-full h-full object-cover transition-opacity duration-200"
          referrerPolicy="no-referrer"
        />
        {isHovering && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
            <div 
              className="h-full bg-blue-500 transition-all duration-100" 
              style={{ width: `${(previewIndex + 1) * 10}%` }}
            />
          </div>
        )}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-white border border-white/10">
          {shot.duration}s
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play size={32} className="text-white fill-white" />
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xs font-bold text-gray-200 truncate flex-1">{shot.name}</h3>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
            shot.status === '已渲染' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
          )}>
            {shot.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <Camera size={10} />
            <span>{shot.type}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User size={10} />
            <span>{shot.director}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} />
            <span>{shot.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Maximize2 size={10} />
            <span>{shot.focalLength}mm f/{shot.aperture}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShotAssetManager: React.FC<ShotAssetManagerProps> = ({ scenes, onBack }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'board' | 'matrix'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  const allShots = scenes.flatMap(s => s.shots);
  const filteredShots = allShots.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.director?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#0a0a0a] text-gray-300">
      {/* Header */}
      <div className="h-16 border-b border-[#222] bg-[#111] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">镜头素材管理 (Shot Media Manager)</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total {allShots.length} shots across {scenes.length} scenes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 w-64">
            <Search size={14} className="text-gray-600" />
            <input 
              type="text" 
              placeholder="搜索镜头、导演、状态..." 
              className="bg-transparent border-none text-xs text-gray-400 focus:outline-none w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-6 w-[1px] bg-[#222]" />
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1 border border-white/5">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300")}
            >
              <Grid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300")}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'board' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300")}
            >
              <Kanban size={16} />
            </button>
            <button 
              onClick={() => setViewMode('matrix')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'matrix' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300")}
            >
              <MatrixIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-[11px] font-medium text-gray-400 hover:text-white transition-colors">
              <Filter size={14} />
              <span>筛选器</span>
            </button>
            <div className="h-4 w-[1px] bg-[#222]" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Sort by:</span>
              <select className="bg-transparent border-none text-[11px] text-gray-400 focus:outline-none cursor-pointer hover:text-white">
                <option>镜头名称</option>
                <option>拍摄日期</option>
                <option>渲染状态</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
              <Download size={16} />
            </button>
            <button className="p-2 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredShots.map(shot => (
                <ShotPreviewCard 
                  key={shot.id} 
                  shot={shot} 
                  onClick={(s) => setSelectedShot(s)}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-[#222]">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">预览</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">镜头名称</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">景别</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">导演</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">状态</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">参数</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">日期</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {filteredShots.map(shot => (
                    <tr key={shot.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="w-16 aspect-video rounded bg-black overflow-hidden border border-white/5">
                          <img src={shot.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-200">{shot.name}</span>
                          <span className="text-[9px] text-gray-600 font-mono">ID: {shot.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.director}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
                          shot.status === '已渲染' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {shot.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-500 font-mono">
                        {shot.focalLength}mm f/{shot.aperture} ISO{shot.iso}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.date}</td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1.5 hover:bg-white/5 rounded text-gray-600 hover:text-white transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'board' && (
            <div className="flex gap-6 h-full min-h-[600px]">
              {['待渲染', '已渲染'].map(status => (
                <div key={status} className="flex-1 flex flex-col bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                  <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#161616]">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", status === '已渲染' ? "bg-emerald-500" : "bg-blue-500")} />
                      <span className="text-xs font-bold text-gray-300">{status}</span>
                      <span className="text-[10px] text-gray-600 bg-black/40 px-1.5 py-0.5 rounded-full">
                        {filteredShots.filter(s => s.status === status).length}
                      </span>
                    </div>
                    <button className="text-gray-600 hover:text-white"><MoreHorizontal size={14} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {filteredShots.filter(s => s.status === status).map(shot => (
                      <div key={shot.id} className="bg-[#1a1a1a] rounded-lg border border-white/5 p-3 hover:border-blue-500/30 transition-all cursor-pointer">
                        <div className="aspect-video rounded overflow-hidden mb-3">
                          <img src={shot.thumbnail} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-200 mb-2 truncate">{shot.name}</h4>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{shot.director}</span>
                          <span>{shot.duration}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'matrix' && (
            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-[#222]">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky left-0 bg-[#1a1a1a] z-10">镜头名称</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Take</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">机位 (Placement)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">景别 (Shot Size)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">焦距 (Focus)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">光孔 (Aperture)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">色温 (Temp)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">曝光 (ISO)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">帧率 (FPS)</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">渲染状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {filteredShots.map(shot => (
                    <tr key={shot.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-[#111] z-10 border-r border-[#222]">
                        <span className="text-xs font-bold text-gray-200">{shot.name}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.take || 1}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.placement || 'Main'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{shot.shotSize}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{shot.focalLength}mm</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">f/{shot.aperture}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{shot.temperature || 5600}K</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{shot.iso}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{shot.fps}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
                          shot.status === '已渲染' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                        )}>
                          {shot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Shot Detail Modal (Simplified) */}
      <AnimatePresence>
        {selectedShot && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-12 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedShot(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] w-full max-w-5xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="aspect-video bg-black relative group">
                <img 
                  src={selectedShot.thumbnail.replace('200/120', '1280/720')} 
                  alt="" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={64} className="text-white fill-white" />
                </div>
                <button 
                  onClick={() => setSelectedShot(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
              <div className="p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedShot.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-widest">
                      <span>{selectedShot.type}</span>
                      <div className="w-1 h-1 rounded-full bg-gray-700" />
                      <span>{selectedShot.duration} Seconds</span>
                      <div className="w-1 h-1 rounded-full bg-gray-700" />
                      <span>{selectedShot.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                      <ExternalLink size={16} />
                      <span>在编辑器中打开</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-8 py-6 border-y border-[#222]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">Director</span>
                    <span className="text-sm text-gray-200">{selectedShot.director}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">Photographer</span>
                    <span className="text-sm text-gray-200">{selectedShot.photographer}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">Focal Length</span>
                    <span className="text-sm text-gray-200">{selectedShot.focalLength}mm</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-600 uppercase font-bold">Aperture</span>
                    <span className="text-sm text-gray-200">f/{selectedShot.aperture}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-600 uppercase font-bold">Script Content</span>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {selectedShot.scriptContents || "暂无剧本内容描述。该镜头主要展示了角色在环境中的情绪变化，光影效果需要重点关注。"}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
