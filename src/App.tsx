import React, { useState, useRef, useEffect } from 'react';
import { MOCK_EPISODES, Scene, TimelineVersion, Episode, SceneAsset, TimelineViewMode, CustomView } from './types';
import { SceneBlock } from './components/SceneBlock';
import { ColorEditorModal } from './components/ColorEditorModal';
import { ShotTimeline } from './components/ShotTimeline';
import { SceneAssetModal } from './components/SceneAssetModal';
import { ShotAssetManager } from './components/ShotAssetManager';
import { AssetLandingPage } from './components/AssetLandingPage';
import { GlobalPlayer } from './components/GlobalPlayer';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Play, SkipBack, SkipForward, ZoomIn, ZoomOut, Layers, Film, ArrowLeft, Info, ChevronDown, ChevronRight as ChevronRightIcon, Box, CheckCircle2, Clock, Zap, BarChart3, Pause, Lock, AlertTriangle, Calendar, User, TrendingUp, LayoutGrid, List, Kanban, ExternalLink, Search, X, Settings, Plus, Database } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode>(MOCK_EPISODES[0]);
  const [currentVersion, setCurrentVersion] = useState<TimelineVersion>(MOCK_EPISODES[0].versions[0]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAssetScene, setSelectedAssetScene] = useState<Scene | null>(null);
  const [selectedInspectorScene, setSelectedInspectorScene] = useState<Scene | null>(MOCK_EPISODES[0].versions[0].scenes[0]);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'script' | 'assets' | 'callsheet'>('script');
  const [assetViewMode, setAssetViewMode] = useState<'card' | 'list' | 'board'>('list');
  const [assetSubTab, setAssetSubTab] = useState<'digital' | 'tasks'>('digital');
  const [taskViewMode, setTaskViewMode] = useState<'card' | 'list' | 'board'>('list');
  const [expandedEpisodes, setExpandedEpisodes] = useState<string[]>([MOCK_EPISODES[0].id]);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [detailLevel, setDetailLevel] = useState<'overview' | 'management'>('management');
  const [view, setView] = useState<'main' | 'shot-manager' | 'asset-detail'>('main');
  const [timelineViewMode, setTimelineViewMode] = useState<TimelineViewMode>('production');
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [isColorEditorOpen, setIsColorEditorOpen] = useState(false);

  const handleSaveCustomView = (newView: CustomView) => {
    setCustomViews(prev => [...prev, newView]);
    setTimelineViewMode(newView.id);
  };
  const [selectedAsset, setSelectedAsset] = useState<{asset: SceneAsset, scene: Scene} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultCount, setSearchResultCount] = useState<number | null>(null);
  
  const [scale, setScale] = useState(12); // Increased scale for better readability
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);

  const getEffectiveDuration = (scene: Scene) => {
    // In overview mode, we can be much more compact since we show less info
    const minDuration = detailLevel === 'overview' ? 8 : 30;
    return Math.max(scene.duration, minDuration);
  };

  // Playback logic
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPosition(prev => {
          const scenes = currentVersion.scenes;
          const totalDur = currentScene 
            ? currentScene.duration 
            : scenes.reduce((acc, s) => acc + getEffectiveDuration(s), 0);
            
          if (prev >= totalDur) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentScene, currentVersion.scenes]);

  // Wheel zoom logic for timeline
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Zoom with Ctrl or Meta key
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY;
        const zoomSpeed = 0.001;
        
        const container = scrollContainerRef.current;
        if (!container) return;

        const prevScale = scale;
        const zoomFactor = prevScale; 
        const newScale = Math.max(0.5, Math.min(30, prevScale - delta * zoomSpeed * zoomFactor));
        
        if (newScale !== prevScale) {
          const rect = container.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          
          // Absolute X position in the content:
          const contentX = mouseX + container.scrollLeft;
          
          // Ratio of new scale to old scale
          const ratio = newScale / prevScale;
          
          // Update scale
          setScale(newScale);
          
          // Adjust scroll position after render
          const targetScrollLeft = contentX * ratio - mouseX;
          
          requestAnimationFrame(() => {
            if (container) {
              container.scrollLeft = targetScrollLeft;
            }
          });
        }
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scale]);

  const handleSceneDoubleClick = (scene: Scene) => {
    setCurrentScene(scene);
    setPlayheadPosition(0);
    setScale(5); // Zoom in when entering a scene
    setIsPlaying(false);
  };

  const handleAssetClick = (scene: Scene) => {
    setSelectedAssetScene(scene);
    setIsAssetModalOpen(true);
  };

  const handleAssetDoubleClick = (asset: SceneAsset, scene: Scene) => {
    setSelectedAsset({ asset, scene });
    setView('asset-detail');
  };

  const handleBackToMain = () => {
    setCurrentScene(null);
    setPlayheadPosition(0);
    setScale(2);
    setIsPlaying(false);
  };

  const toggleEpisode = (id: string) => {
    setExpandedEpisodes(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const scenes = currentVersion.scenes;

  // Search results count effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResultCount(null);
      return;
    }
    const count = scenes.filter(scene => 
      scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.assets.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ).length;
    setSearchResultCount(count);

    // Auto-scroll to first match
    if (count > 0 && searchQuery.trim()) {
      const firstMatchIndex = scenes.findIndex(scene => 
        scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.assets.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      if (firstMatchIndex !== -1 && scrollContainerRef.current) {
        // Calculate offset: sum of durations of preceding scenes * scale
        const precedingDuration = scenes.slice(0, firstMatchIndex).reduce((acc, s) => acc + getEffectiveDuration(s), 0);
        const scrollOffset = precedingDuration * scale;
        
        scrollContainerRef.current.scrollTo({
          left: scrollOffset,
          behavior: 'smooth'
        });
      }
    }
  }, [searchQuery, scenes, scale]);
  
  const totalDuration = currentScene 
    ? currentScene.duration 
    : scenes.reduce((acc, s) => acc + getEffectiveDuration(s), 0);

  // Generate time markers
  const timeMarkers = [];
  const step = scale < 1 ? 60 : scale < 3 ? 30 : 10;
  for (let i = 0; i <= totalDuration; i += step) {
    timeMarkers.push(i);
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] text-gray-200 overflow-hidden font-sans">
      {/* Header / Toolbar */}
      <header className="h-14 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-500">
            <Film size={20} />
            <span className="font-bold tracking-tight">剧本制作时间线</span>
          </div>
          <div className="h-4 w-[1px] bg-[#333]" />
          <nav className="flex items-center gap-2 text-sm text-gray-400">
            {currentScene && (
              <>
                <button 
                  onClick={handleBackToMain}
                  className="hover:text-white transition-colors"
                >
                  剧本时间线
                </button>
                <ChevronRight size={14} />
                <span className="text-white font-medium">m-e{currentEpisode.number.toString().padStart(3, '0')}-{currentScene.sceneNumber}</span>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group flex items-center">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <Search size={14} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索s001、内容或资产..."
                className="bg-[#1a1a1a] border border-[#333] rounded-md pl-9 pr-8 py-1.5 text-xs w-64 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {searchQuery && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-3 flex items-center gap-2"
                >
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                    searchResultCount === 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  )}>
                    {searchResultCount === 0 ? '无结果' : `找到 ${searchResultCount} 个结果`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] px-2 py-1 rounded border border-[#333] relative group/view">
            <div className="flex items-center gap-2 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              视图:
            </div>
            <select 
              value={timelineViewMode}
              onChange={(e) => {
                if (e.target.value === 'add-new') {
                  setIsColorEditorOpen(true);
                } else {
                  setTimelineViewMode(e.target.value);
                }
              }}
              className="bg-transparent border-none text-[10px] font-bold text-blue-400 focus:ring-0 cursor-pointer hover:text-blue-300 transition-colors pr-8"
            >
              <option value="production" className="bg-[#1a1a1a]">制片视图</option>
              <option value="previs" className="bg-[#1a1a1a]">预演视图</option>
              <option value="asset" className="bg-[#1a1a1a]">资产视图</option>
              {customViews.map(view => (
                <option key={view.id} value={view.id} className="bg-[#1a1a1a]">{view.name}</option>
              ))}
              <option value="add-new" className="bg-[#1a1a1a] text-emerald-400 font-bold">+ 新增视图</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] px-2 py-1 rounded border border-[#333]">
            <button 
              onClick={() => setIsColorEditorOpen(true)}
              className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-gray-500 hover:text-gray-300 flex items-center gap-1"
            >
              <Settings size={12} />
              配置当前视图
            </button>
            <div className="w-[1px] h-3 bg-[#333]" />
            <button 
              onClick={() => setDetailLevel(detailLevel === 'overview' ? 'management' : 'overview')}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                detailLevel === 'management' ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300"
              )}
            >
              {detailLevel === 'management' ? '管理详情' : '概览模式'}
            </button>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-[#333]">
            <button onClick={() => setScale(Math.max(0.5, scale - 0.5))} className="hover:text-blue-400 transition-colors">
              <ZoomOut size={16} />
            </button>
            <div className="w-24 h-1 bg-[#333] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${(scale / 30) * 100}%` }} />
            </div>
            <button onClick={() => setScale(Math.min(30, scale + 0.5))} className="hover:text-blue-400 transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xl font-mono font-medium text-blue-500">
              {Math.floor(playheadPosition / 60).toString().padStart(2, '0')}:
              {Math.floor(playheadPosition % 60).toString().padStart(2, '0')}:00
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'shot-manager' && (
            <motion.div
              key="shot-manager"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <ShotAssetManager 
                scenes={currentVersion.scenes} 
                onBack={() => setView('main')} 
              />
            </motion.div>
          )}

          {view === 'asset-detail' && selectedAsset && (
            <AssetLandingPage 
              asset={selectedAsset.asset} 
              scene={selectedAsset.scene}
              onBack={() => setView('main')} 
            />
          )}

          {view === 'main' && (
            <motion.div
              key="main-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Sidebar - Only show on main timeline */}
              <AnimatePresence>
          {!currentScene && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[#222] bg-[#141414] flex flex-col shrink-0 overflow-hidden"
            >
              <div className="p-4 border-b border-[#222]">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layers size={14} />
                  项目资产
                </h3>
                <div className="space-y-1">
                  {MOCK_EPISODES.map(episode => (
                    <div key={episode.id} className="space-y-1">
                      <div 
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 cursor-pointer text-sm font-medium"
                        onClick={() => toggleEpisode(episode.id)}
                      >
                        {expandedEpisodes.includes(episode.id) ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                        <span>e{episode.number.toString().padStart(3, '0')}</span>
                      </div>
                      
                      {expandedEpisodes.includes(episode.id) && (
                        <div className="ml-4 space-y-1">
                          {episode.versions.map(version => (
                            <div 
                              key={version.id}
                              className={cn(
                                "p-2 rounded-md text-xs cursor-pointer transition-colors flex items-center gap-2",
                                currentVersion.id === version.id ? "bg-blue-500/10 text-blue-400" : "hover:bg-white/5 text-gray-400"
                              )}
                              onClick={() => {
                                setCurrentEpisode(episode);
                                setCurrentVersion(version);
                                setCurrentScene(null);
                              }}
                            >
                              <div className={cn("w-1.5 h-1.5 rounded-full", currentVersion.id === version.id ? "bg-blue-500" : "bg-gray-600")} />
                              <span className="truncate">{version.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info size={14} />
                      详情
                    </h3>
                    <div className="p-3 rounded bg-blue-500/5 border border-blue-500/10">
                      <p className="text-xs text-blue-400 font-medium mb-1">当前版本</p>
                      <p className="text-sm text-white">e{currentEpisode.number.toString().padStart(3, '0')} - {currentVersion.name}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#222]">
                    <button 
                      onClick={() => setIsLegendExpanded(!isLegendExpanded)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 hover:text-gray-300 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <BarChart3 size={14} />
                        状态图例
                      </span>
                      {isLegendExpanded ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                    </button>
                    
                    <AnimatePresence>
                      {isLegendExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          {timelineViewMode === 'production' && (
                            <>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>已完成 (Completed)</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>进行中 (In Progress)</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
                                <span>未开始 (Not Started)</span>
                              </div>
                            </>
                          )}
                          {timelineViewMode === 'previs' && (
                            <>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>拍摄已完成</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>QC已完成</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span>资产未就绪</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
                                <span>未开始</span>
                              </div>
                            </>
                          )}
                          {timelineViewMode === 'asset' && (
                            <>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>资产全部完成</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>美术设定完成</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-2 h-2 rounded-full bg-gray-600" />
                                <span>未开始</span>
                              </div>
                            </>
                          )}
                          <div className="h-2" />
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <Box size={14} className="text-emerald-400" />
                            <span>资产/预演已就绪</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <Box size={14} className="text-blue-400" />
                            <span>资产制作中</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <Lock size={14} className="text-orange-400" />
                            <span>依赖资产未就绪</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] relative overflow-hidden">
          {/* Timeline Ruler */}
          <div 
            className="h-8 border-b border-[#222] bg-[#141414] relative overflow-hidden shrink-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              setPlayheadPosition(Math.max(0, Math.min(totalDuration, x / scale)));
            }}
          >
            <div 
              className="absolute inset-0 flex items-end"
              style={{ width: totalDuration * scale + 200 }}
            >
              {timeMarkers.map(time => (
                <div 
                  key={time} 
                  className="absolute bottom-0 border-l border-[#333] h-3 flex flex-col justify-end"
                  style={{ left: time * scale }}
                >
                  <span className="text-[9px] text-gray-500 font-mono -translate-x-1/2 mb-4">
                    {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Tracks */}
          <div className="flex-1 overflow-hidden" ref={timelineRef}>
            <AnimatePresence mode="wait">
              {!currentScene ? (
                <motion.div 
                  key="main-timeline-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full overflow-y-auto custom-scrollbar"
                >
                  <div className={cn(
                    "overflow-x-auto custom-scrollbar relative border-b border-[#222] bg-[#0f0f0f]",
                    detailLevel === 'management' ? "p-4" : "p-3"
                  )} ref={scrollContainerRef}>
                    <div style={{ width: totalDuration * scale + 100 }}>
                      <motion.div 
                        key="main-timeline"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className={cn(
                          "flex",
                          detailLevel === 'management' ? "mb-6" : "mb-2"
                        )}>
                          {scenes.map(scene => {
                            const isHighlighted = searchQuery && (
                              scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              scene.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              scene.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              scene.assets.some(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            );
                            
                            return (
                              <SceneBlock 
                                key={scene.id} 
                                scene={scene} 
                                isSelected={selectedInspectorScene?.id === scene.id}
                                isHighlighted={!!isHighlighted}
                                isDimmed={!!searchQuery && !isHighlighted}
                                onDoubleClick={handleSceneDoubleClick}
                                onClick={(s) => {
                                  setSelectedInspectorScene(s);
                                }}
                                onAssetClick={handleAssetClick}
                                scale={scale}
                                viewMode={timelineViewMode}
                                customView={customViews.find(v => v.id === timelineViewMode)}
                                detailLevel={detailLevel}
                                effectiveDuration={getEffectiveDuration(scene)}
                              />
                            );
                          })}
                        </div>
                      </motion.div>
                      
                      {/* Playhead for main timeline */}
                      <div 
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none"
                        style={{ left: playheadPosition * scale + (detailLevel === 'management' ? 32 : 12) }}
                      >
                        <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rotate-45" />
                      </div>
                    </div>
                  </div>

                  {/* Scene Details Area - Below Timeline */}
                  <div className="p-8 flex flex-col bg-[#0a0a0a]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <Info size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white tracking-tight">场次详情</h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Scene Information</p>
                          </div>
                        </div>

                        {selectedInspectorScene && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-in fade-in slide-in-from-left-2">
                            <span className="text-xs font-bold text-blue-400">{selectedInspectorScene.sceneNumber}</span>
                            <span className="text-xs text-white">{selectedInspectorScene.title}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex bg-[#1a1a1a]/50 p-1 rounded-lg border border-white/5">
                        {(['script', 'assets', 'callsheet'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveInspectorTab(tab)}
                            className={cn(
                              "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-widest",
                              activeInspectorTab === tab 
                                ? "text-blue-400 bg-blue-500/10" 
                                : "text-gray-500 hover:text-gray-300"
                            )}
                          >
                            {tab === 'script' ? '剧本' : tab === 'assets' ? '资产' : '通告'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="min-h-[450px] bg-[#141414] border border-[#222] rounded-xl overflow-hidden flex flex-col">
                      <AnimatePresence mode="wait">
                        {selectedInspectorScene ? (
                          <div className="flex-1 flex flex-col">
                            {/* Tab Content */}
                            <div className="flex-1 p-8">
                              <AnimatePresence mode="wait">
                                {activeInspectorTab === 'script' && (
                                  <motion.div
                                    key="script"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                  >
                                    <div className="flex items-center gap-4 mb-6">
                                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase">
                                        {selectedInspectorScene.sceneNumber} 就绪
                                      </div>
                                      <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={12} />
                                        预计时长: {Math.floor(selectedInspectorScene.duration / 60)}分{selectedInspectorScene.duration % 60}秒
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-400 italic leading-relaxed border-l-2 border-blue-500/30 pl-4 mb-6">
                                      {selectedInspectorScene.description}
                                    </p>
                                    <div className="text-base text-gray-200 leading-loose whitespace-pre-wrap font-serif bg-black/20 p-6 rounded-lg border border-white/5">
                                      {selectedInspectorScene.content}
                                    </div>
                                  </motion.div>
                                )}

                                {activeInspectorTab === 'assets' && (
                            <motion.div
                              key="assets"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-6"
                            >
                              {/* Asset Sub-tabs Selector */}
                              <div className="flex bg-[#1a1a1a]/50 p-1 rounded-lg border border-white/5 self-start">
                                {(['digital', 'tasks'] as const).map((tab) => (
                                  <button
                                    key={tab}
                                    onClick={() => setAssetSubTab(tab)}
                                    className={cn(
                                      "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-widest",
                                      assetSubTab === tab 
                                        ? "text-blue-400 bg-blue-500/10" 
                                        : "text-gray-500 hover:text-gray-300"
                                    )}
                                  >
                                    {tab === 'digital' ? '数字资产' : '任务'}
                                  </button>
                                ))}
                              </div>

                              {assetSubTab === 'digital' && (
                                <>
                                  {/* Asset Tab Header */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                                      <button 
                                        onClick={() => setAssetViewMode('card')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          assetViewMode === 'card' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                        title="卡片视图"
                                      >
                                        <LayoutGrid size={14} />
                                      </button>
                                      <button 
                                        onClick={() => setAssetViewMode('list')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          assetViewMode === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                        title="列表视图"
                                      >
                                        <List size={14} />
                                      </button>
                                      <button 
                                        onClick={() => setAssetViewMode('board')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          assetViewMode === 'board' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                        title="看板视图"
                                      >
                                        <Kanban size={14} />
                                      </button>
                                    </div>

                                    <button 
                                      className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-all"
                                      onClick={() => setView('shot-manager')}
                                    >
                                      <ExternalLink size={14} />
                                      管理资产库
                                    </button>
                                  </div>

                                  {assetViewMode === 'card' && (
                                    <div className="grid grid-cols-3 gap-6">
                                      {(['场景', '角色', '道具', '特效', '元素'] as const).map(type => {
                                        const typeAssets = selectedInspectorScene.assets.filter(a => a.type === type);
                                        return (
                                          <div key={type} className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                              <Box size={12} />
                                              {type}资产 ({typeAssets.length})
                                            </h4>
                                            <div className="space-y-2">
                                              {typeAssets.length > 0 ? typeAssets.map(asset => (
                                                <div 
                                                  key={asset.id} 
                                                  className="p-3 bg-black/30 border border-white/5 rounded-lg flex flex-col group hover:border-blue-500/30 transition-all cursor-pointer select-none"
                                                  onDoubleClick={() => handleAssetDoubleClick(asset, selectedInspectorScene)}
                                                >
                                                  <div className="flex items-center justify-between mb-1">
                                                    <div className="min-w-0 flex-1">
                                                      <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-white truncate">{asset.name}</span>
                                                        <span className="text-[9px] text-gray-500 font-mono bg-white/5 px-1 rounded">{asset.version}</span>
                                                        <span className={cn(
                                                          "text-[8px] px-1 py-0.5 rounded uppercase font-bold",
                                                          asset.status === '已完成' ? "bg-emerald-500/20 text-emerald-400" :
                                                          asset.status === '制作中' ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"
                                                        )}>
                                                          {asset.status}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn(
                                                          "text-[8px] px-1 py-0.5 rounded font-bold",
                                                          asset.versionStatus === '已通过' ? "text-emerald-400 border border-emerald-500/30" :
                                                          asset.versionStatus === '审核中' ? "text-blue-400 border border-blue-500/30" :
                                                          asset.versionStatus === '已驳回' ? "text-red-400 border border-red-500/30" : "text-gray-500 border border-gray-500/30"
                                                        )}>
                                                          {asset.versionStatus}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <div className="ml-4 text-[10px] text-gray-500 font-mono shrink-0">{asset.progress}%</div>
                                                  </div>
                                                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${asset.progress}%` }} />
                                                  </div>
                                                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-blue-400 font-bold uppercase tracking-tighter">
                                                    双击查看详情
                                                  </div>
                                                </div>
                                              )) : (
                                                <div className="p-4 border border-dashed border-[#333] rounded-lg text-center">
                                                  <span className="text-[10px] text-gray-600">暂无{type}资产</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {assetViewMode === 'list' && (
                                    <div className="bg-black/20 rounded-lg border border-white/5 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                        <table className="w-full text-left border-collapse min-w-[1200px]">
                                          <thead>
                                            <tr className="bg-white/5 border-b border-white/10">
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[120px]">资产标识</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[150px]">资产名称</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[150px]">剧本资产名称</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[120px]">资产昵称</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">制作等级</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">制作难度</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">资产类型</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">资产状态</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">当前版本号</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">制作步骤</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">操作</th>
                                            </tr>
                                          </thead>
                                        <tbody className="divide-y divide-white/5">
                                          {selectedInspectorScene.assets.map((asset, idx) => (
                                            <tr 
                                              key={asset.id} 
                                              className="hover:bg-white/5 transition-colors cursor-pointer select-none group"
                                              onDoubleClick={() => handleAssetDoubleClick(asset, selectedInspectorScene)}
                                            >
                                              <td className="px-4 py-4 text-xs font-mono text-blue-400">AST_{(100 + idx).toString()}</td>
                                              <td className="px-4 py-4 text-xs font-bold text-white uppercase">{asset.name}</td>
                                              <td className="px-4 py-4 text-xs text-gray-400 italic">SceneAsset_{asset.name.split('_')[0]}</td>
                                              <td className="px-4 py-4 text-xs text-gray-300 font-medium">{asset.name.split('_').pop()}</td>
                                              <td className="px-4 py-4">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">L{(idx % 3) + 1}</span>
                                              </td>
                                              <td className="px-4 py-4">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">D{(idx % 4) + 1}</span>
                                              </td>
                                              <td className="px-4 py-4 text-xs text-gray-400">{asset.type}</td>
                                              <td className="px-4 py-4 text-xs">
                                                <span className={cn(
                                                  "px-2 py-0.5 rounded-full font-bold text-[9px]",
                                                  asset.status === '已完成' ? "bg-emerald-500/20 text-emerald-400" :
                                                  asset.status === '制作中' ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"
                                                )}>
                                                  {asset.status}
                                                </span>
                                              </td>
                                              <td className="px-4 py-4 text-xs text-gray-500 font-mono italic">{asset.version}</td>
                                              <td className="px-4 py-4 text-xs text-gray-400 font-medium">模型/材质</td>
                                              <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                  <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-blue-400">
                                                    <ExternalLink size={12} />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {assetViewMode === 'board' && (
                                    <div className="grid grid-cols-3 gap-6 h-full min-h-[300px]">
                                      {(['待制作', '制作中', '已完成'] as const).map(status => {
                                        const statusAssets = selectedInspectorScene.assets.filter(a => a.status === status);
                                        return (
                                          <div key={status} className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                            <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{status}</h4>
                                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{statusAssets.length}</span>
                                            </div>
                                            <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                              {statusAssets.map(asset => (
                                                <div 
                                                  key={asset.id} 
                                                  className="p-3 bg-[#1a1a1a] border border-white/5 rounded-lg shadow-lg hover:border-blue-500/30 transition-all cursor-pointer select-none group"
                                                  onDoubleClick={() => handleAssetDoubleClick(asset, selectedInspectorScene)}
                                                >
                                                  <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-white">{asset.name}</span>
                                                    <span className="text-[9px] text-gray-500 font-mono">{asset.version}</span>
                                                  </div>
                                                  <div className="flex items-center justify-between mb-3">
                                                    <span className="text-[8px] text-gray-500 uppercase">{asset.type}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                      <div className="h-full bg-blue-500" style={{ width: `${asset.progress}%` }} />
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-mono">{asset.progress}%</span>
                                                  </div>
                                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-blue-400 font-bold uppercase tracking-tighter">
                                                    双击查看详情
                                                  </div>
                                                </div>
                                              ))}
                                              {statusAssets.length === 0 && (
                                                <div className="h-20 flex items-center justify-center border border-dashed border-white/5 rounded-lg">
                                                  <span className="text-[10px] text-gray-600 italic">暂无资产</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              )}

                              {assetSubTab === 'tasks' && (
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                                      <button 
                                        onClick={() => setTaskViewMode('list')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          taskViewMode === 'list' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                      >
                                        <List size={14} />
                                      </button>
                                      <button 
                                        onClick={() => setTaskViewMode('card')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          taskViewMode === 'card' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                      >
                                        <LayoutGrid size={14} />
                                      </button>
                                      <button 
                                        onClick={() => setTaskViewMode('board')}
                                        className={cn(
                                          "p-1.5 rounded transition-all",
                                          taskViewMode === 'board' ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                                        )}
                                      >
                                        <Kanban size={14} />
                                      </button>
                                    </div>
                                    <button className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all">
                                      <Plus size={14} />
                                      新增任务
                                    </button>
                                  </div>

                                  {taskViewMode === 'list' && (
                                    <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                      <table className="w-full text-left border-collapse">
                                        <thead>
                                          <tr className="bg-white/5 border-b border-white/10">
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">任务名称</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">资产名称</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">剧本资产名</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">资产编码</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">负责人</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">状态</th>
                                            <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">优先级</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                          {[
                                            { id: 't1', title: '灯光烘焙', assetName: '主场景_A', scriptAssetName: 'MainHall', assetCode: 'ENV_01_A', assignee: '张三', status: '进行中', priority: '高' },
                                            { id: 't2', title: '材质贴图更新', assetName: '角色_王二', scriptAssetName: 'Protagonist', assetCode: 'CHR_02_B', assignee: '李四', status: '待处理', priority: '中' },
                                            { id: 't3', title: '模型拓扑优化', assetName: '道具_宝箱', scriptAssetName: 'MysteryBox', assetCode: 'PRP_05_C', assignee: '王五', status: '已预排', priority: '低' },
                                            { id: 't4', title: '面部动画修正', assetName: '角色_小美', scriptAssetName: 'Sidekick', assetCode: 'CHR_03_A', assignee: '赵六', status: '进行中', priority: '高' },
                                            { id: 't5', title: '骨骼绑定检查', assetName: '怪物_A', scriptAssetName: 'Monster_A', assetCode: 'CHR_08_D', assignee: '孙七', status: '待处理', priority: '中' },
                                          ].map(task => (
                                            <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                                              <td className="px-4 py-3 text-xs font-medium text-gray-200">{task.title}</td>
                                              <td className="px-4 py-3 text-xs text-gray-400">{task.assetName}</td>
                                              <td className="px-4 py-3 text-xs text-gray-400 italic">{task.scriptAssetName}</td>
                                              <td className="px-4 py-3 text-xs text-gray-500 font-mono">{task.assetCode}</td>
                                              <td className="px-4 py-3 text-xs text-gray-300">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-400">
                                                    {task.assignee[0]}
                                                  </div>
                                                  {task.assignee}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                  <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    task.status === '进行中' ? "bg-blue-500" :
                                                    task.status === '待处理' ? "bg-gray-500" : "bg-emerald-500"
                                                  )} />
                                                  <span className="text-[10px] text-gray-400 font-bold">{task.status}</span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-center">
                                                <span className={cn(
                                                  "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                  task.priority === '高' ? "bg-red-500/10 text-red-400" :
                                                  task.priority === '中' ? "bg-blue-500/10 text-blue-400" : "bg-gray-800 text-gray-500"
                                                )}>{task.priority}</span>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {taskViewMode === 'card' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {[
                                        { id: 't1', title: '灯光烘焙', assetName: '主场景_A', scriptAssetName: 'MainHall', assetCode: 'ENV_01_A', assignee: '张三', priority: '高' },
                                        { id: 't2', title: '材质贴图更新', assetName: '角色_王二', scriptAssetName: 'Protagonist', assetCode: 'CHR_02_B', assignee: '李四', priority: '中' },
                                        { id: 't3', title: '模型拓扑优化', assetName: '道具_宝箱', scriptAssetName: 'MysteryBox', assetCode: 'PRP_05_C', assignee: '王五', priority: '低' },
                                      ].map(task => (
                                        <div key={task.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 transition-all group flex flex-col justify-between min-h-[160px]">
                                          <div>
                                            <div className="flex items-center justify-between mb-3">
                                              <span className={cn(
                                                "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                                task.priority === '高' ? "bg-red-500/20 text-red-400" :
                                                task.priority === '中' ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"
                                              )}>{task.priority}优先级</span>
                                              <span className="text-[9px] text-gray-500 font-mono">{task.assetCode}</span>
                                            </div>
                                            <h5 className="text-xs font-bold text-gray-200 mb-2">{task.title}</h5>
                                            <div className="space-y-1">
                                              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Box size={10} className="text-blue-400" />
                                                <span>资产: {task.assetName}</span>
                                              </div>
                                              <div className="text-[10px] text-gray-500 italic">
                                                剧本: {task.scriptAssetName}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 rounded-full bg-blue-600 border border-[#0a0a0a] flex items-center justify-center text-[8px] font-bold">
                                                {task.assignee[0]}
                                              </div>
                                              <span className="text-[10px] text-gray-400">{task.assignee}</span>
                                            </div>
                                            <Plus size={12} className="text-gray-600 hover:text-white cursor-pointer" />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {taskViewMode === 'board' && (
                                    <div className="grid grid-cols-3 gap-6 h-full min-h-[350px]">
                                      {(['待处理', '进行中', '今日截止'] as const).map(status => (
                                        <div key={status} className="flex flex-col bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                          <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{status}</h4>
                                            <Plus size={12} className="text-gray-500 hover:text-white cursor-pointer" />
                                          </div>
                                          <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                            {[
                                              { id: 't1', title: '灯光烘焙', assetName: '主场景_A', priority: '高', assignee: '张三' },
                                              { id: 't2', title: '材质贴图', assetName: '角色_王二', priority: '中', assignee: '李四' },
                                              { id: 't3', title: '拓扑优化', assetName: '道具_宝箱', priority: '低', assignee: '王五' },
                                            ].map(task => (
                                              <div key={task.id} className="p-3 bg-[#1a1a1a] border border-white/5 rounded-lg shadow-sm hover:border-white/20 transition-all cursor-move">
                                                <div className="flex items-center justify-between mb-2">
                                                  <div className={cn(
                                                    "w-8 h-1 rounded-full",
                                                    task.priority === '高' ? "bg-red-500" :
                                                    task.priority === '中' ? "bg-blue-500" : "bg-gray-600"
                                                  )} />
                                                  <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[7px] font-bold text-blue-400">
                                                    {task.assignee[0]}
                                                  </div>
                                                </div>
                                                <h6 className="text-xs font-medium text-gray-200 mb-1">{task.title}</h6>
                                                <p className="text-[10px] text-gray-500">{task.assetName}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}

                          {activeInspectorTab === 'callsheet' && (
                            <motion.div
                              key="callsheet"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="h-full flex flex-col items-center justify-center py-12"
                            >
                              {selectedInspectorScene.callSheet ? (
                                <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-xl p-8 space-y-6">
                                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h4 className="text-lg font-bold text-white">拍摄通告单</h4>
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                      {selectedInspectorScene.callSheet.status === 'published' ? '已发布' : '草稿'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-6">
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">拍摄日期</p>
                                      <p className="text-sm text-gray-200">{selectedInspectorScene.callSheet.date}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">拍摄地点</p>
                                      <p className="text-sm text-gray-200">{selectedInspectorScene.callSheet.location}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">核心人员</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedInspectorScene.callSheet.crew.map(c => (
                                        <span key={c} className="px-2 py-1 bg-black/40 rounded text-xs text-gray-400 border border-white/5">{c}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">备注说明</p>
                                    <p className="text-sm text-gray-400 leading-relaxed">{selectedInspectorScene.callSheet.notes}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center space-y-4">
                                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto border border-[#333]">
                                    <Calendar size={24} className="text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold text-gray-400">暂时没有拍摄计划</p>
                                    <p className="text-sm text-gray-600">该s001尚未排入通告单，请联系统筹安排。</p>
                                  </div>
                                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all">
                                    创建通告单
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 space-y-4">
                      <Layers size={48} className="opacity-20" />
                      <p className="text-sm">请在时间线上选择一个s001以查看详情</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="scene-timeline"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="h-full"
                  >
                    <ShotTimeline 
                      scene={currentScene!}
                      episodeNumber={currentEpisode.number}
                      scale={scale}
                      setScale={setScale}
                      playheadPosition={playheadPosition}
                      setPlayheadPosition={setPlayheadPosition}
                      isPlaying={isPlaying}
                      setIsPlaying={setIsPlaying}
                      onOpenAssetManager={() => setView('shot-manager')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </main>

      {/* Footer / Status Bar */}
      <footer className="h-6 bg-[#0a0a0a] border-t border-[#222] flex items-center px-4 justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-4">
          <span>项目: 未命名影片_V1</span>
          <span>帧率: 24.00 FPS</span>
        </div>
        <div className="flex items-center gap-4">
          <span>点击标尺移动播放头</span>
          <span>双击片段进入下钻视图</span>
        </div>
      </footer>
      {/* Modals */}
      {selectedAssetScene && (
        <SceneAssetModal 
          scene={selectedAssetScene}
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
        />
      )}

      <ColorEditorModal 
        isOpen={isColorEditorOpen}
        onClose={() => setIsColorEditorOpen(false)}
        onSave={handleSaveCustomView}
        currentViewMode={timelineViewMode}
      />
    </div>
  );
}
