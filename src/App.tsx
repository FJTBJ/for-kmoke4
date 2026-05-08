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
import { ChevronRight, Play, SkipBack, SkipForward, ZoomIn, ZoomOut, Layers, Film, ArrowLeft, Info, ChevronDown, ChevronRight as ChevronRightIcon, Box, CheckCircle2, Clock, Zap, BarChart3, Pause, Lock, AlertTriangle, Calendar, User, TrendingUp, LayoutGrid, List, Kanban, ExternalLink, Search, X, Settings, Plus } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode>(MOCK_EPISODES[0]);
  const [currentVersion, setCurrentVersion] = useState<TimelineVersion>(MOCK_EPISODES[0].versions[0]);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [selectedAssetScene, setSelectedAssetScene] = useState<Scene | null>(null);
  const [selectedInspectorScene, setSelectedInspectorScene] = useState<Scene | null>(MOCK_EPISODES[0].versions[0].scenes[0]);
  const [activeMainTab, setActiveMainTab] = useState<'player' | 'details'>('player');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'script' | 'assets' | 'callsheet' | 'shots' | 'previz'>('script');
  const [shotsViewMode, setShotsViewMode] = useState<'card' | 'list' | 'board'>('list');
  const [assetViewMode, setAssetViewMode] = useState<'card' | 'list' | 'board'>('card');
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
  const [playerTab, setPlayerTab] = useState<'edit' | 'storyboard' | 'ai'>('edit');
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
                                  setActiveMainTab('details');
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
                        <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                          <button
                            onClick={() => setActiveMainTab('player')}
                            className={cn(
                              "px-6 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2",
                              activeMainTab === 'player' 
                                ? "bg-blue-600 text-white shadow-lg" 
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                            )}
                          >
                            <Play size={14} fill={activeMainTab === 'player' ? "currentColor" : "none"} />
                            播放器
                          </button>
                          <button
                            onClick={() => setActiveMainTab('details')}
                            className={cn(
                              "px-6 py-2 rounded-md text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2",
                              activeMainTab === 'details' 
                                ? "bg-blue-600 text-white shadow-lg" 
                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                            )}
                          >
                            <Layers size={14} />
                            详情
                          </button>
                        </div>

                        {activeMainTab === 'details' && selectedInspectorScene && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full animate-in fade-in slide-in-from-left-2">
                            <span className="text-xs font-bold text-blue-400">{selectedInspectorScene.sceneNumber}</span>
                            <span className="text-xs text-white">{selectedInspectorScene.title}</span>
                          </div>
                        )}
                      </div>
                      
                      {activeMainTab === 'details' && (
                        <div className="flex bg-[#1a1a1a]/50 p-1 rounded-lg border border-white/5">
                          {(['script', 'assets', 'callsheet', 'previz', 'shots'] as const).map((tab) => (
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
                              {tab === 'script' ? '剧本' : tab === 'assets' ? '资产' : tab === 'callsheet' ? '通告' : tab === 'previz' ? '场记' : '镜头'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="min-h-[450px] bg-[#141414] border border-[#222] rounded-xl overflow-hidden flex flex-col">
                      {activeMainTab === 'player' && (
                        <div className="flex bg-[#1a1a1a] p-1 border-b border-[#222] shrink-0">
                          {(['edit', 'storyboard', 'ai'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setPlayerTab(tab)}
                              className={cn(
                                "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all uppercase tracking-widest",
                                playerTab === tab 
                                  ? "text-blue-400 bg-blue-500/10" 
                                  : "text-gray-500 hover:text-gray-300"
                              )}
                            >
                              {tab === 'edit' ? '剪辑时间线' : tab === 'storyboard' ? 'Moke故事板' : 'Ai粗剪视频'}
                            </button>
                          ))}
                        </div>
                      )}
                      <AnimatePresence mode="wait">
                        {activeMainTab === 'player' ? (
                          <motion.div
                            key={`global-player-${playerTab}`}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="h-full"
                          >
                            <GlobalPlayer 
                              scenes={scenes}
                              playheadPosition={playheadPosition}
                              setPlayheadPosition={setPlayheadPosition}
                              isPlaying={isPlaying}
                              setIsPlaying={setIsPlaying}
                              totalDuration={totalDuration}
                              mode={playerTab}
                            />
                          </motion.div>
                        ) : selectedInspectorScene ? (
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

                                {activeInspectorTab === 'shots' && (
                                  <motion.div
                                    key="shots"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                          <Film size={20} />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-white">镜头库</h4>
                                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">SHOTS FOR {selectedInspectorScene.sceneNumber}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
                                        <button 
                                          onClick={() => setShotsViewMode('list')}
                                          className={cn(
                                            "p-1.5 rounded transition-all",
                                            shotsViewMode === 'list' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
                                          )}
                                        >
                                          <List size={14} />
                                        </button>
                                        <button 
                                          onClick={() => setShotsViewMode('card')}
                                          className={cn(
                                            "p-1.5 rounded transition-all",
                                            shotsViewMode === 'card' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"
                                          )}
                                        >
                                          <LayoutGrid size={14} />
                                        </button>
                                      </div>
                                    </div>

                                    {shotsViewMode === 'card' && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedInspectorScene.shots.map((shot, idx) => (
                                          <div 
                                            key={shot.id} 
                                            className="group bg-[#1a1a1a] border border-[#222] hover:border-blue-500/50 rounded-xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer"
                                          >
                                            <div className="relative aspect-video bg-black/40 overflow-hidden">
                                              <img 
                                                src={shot.thumbnail} 
                                                alt={shot.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                referrerPolicy="no-referrer"
                                              />
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] font-bold text-blue-400 border border-blue-500/30">
                                                #{idx + 1}
                                              </div>
                                              <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                                                <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{shot.name}</span>
                                                <span className="text-[9px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">
                                                  {Math.floor(shot.duration / 60)}:{(shot.duration % 60).toString().padStart(2, '0')}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="p-3 flex items-center justify-between bg-[#1f1f1f]/30">
                                              <div className="flex items-center gap-3">
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">景别</span>
                                                  <span className="text-[11px] text-gray-200 font-medium">{shot.type}</span>
                                                </div>
                                                <div className="w-[1px] h-4 bg-white/5" />
                                                <div className="flex flex-col">
                                                  <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">渲染状态</span>
                                                  <span className={cn(
                                                    "text-[10px] font-bold",
                                                    shot.status === '已完成' || shot.status === '已渲染' ? "text-emerald-400" :
                                                    shot.status === '进行中' ? "text-blue-400" : "text-gray-500"
                                                  )}>
                                                    {shot.status || '待处理'}
                                                  </span>
                                                </div>
                                              </div>
                                              <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all">
                                                <Play size={12} fill="currentColor" className="ml-0.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {shotsViewMode === 'list' && (
                                      <div className="bg-[#1a1a1a] border border-[#222] rounded-xl overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr className="border-b border-[#222] bg-[#1f1f1f]/50">
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[60px]">序号</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">镜头号</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">素材名</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">开始帧</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">结束帧</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">帧长</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">状态</th>
                                              <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">步骤</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-[#222]">
                                            {selectedInspectorScene.shots.map((shot, idx) => {
                                              const fps = 24;
                                              const startFrame = Math.floor(shot.startTime * fps);
                                              const frameCount = Math.floor(shot.duration * fps);
                                              const endFrame = startFrame + frameCount;
                                              
                                              return (
                                                <tr key={shot.id} className="hover:bg-white/5 transition-colors group cursor-pointer text-xs">
                                                  <td className="px-4 py-3 text-[10px] font-mono text-gray-500">{(idx + 1).toString().padStart(2, '0')}</td>
                                                  <td className="px-4 py-3 font-mono text-blue-400 font-bold">{shot.shortName || shot.name.split('_').pop() || `shot-${idx+1}`}</td>
                                                  <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                      <img src={shot.thumbnail} alt="" className="w-8 h-5 object-cover rounded bg-black/40" referrerPolicy="no-referrer" />
                                                      <span className="text-gray-200 truncate max-w-[150px]">{shot.name}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-4 py-3 text-right font-mono text-gray-400">{startFrame}</td>
                                                  <td className="px-4 py-3 text-right font-mono text-gray-400">{endFrame}</td>
                                                  <td className="px-4 py-3 text-right font-mono text-emerald-500 font-medium">{frameCount}</td>
                                                  <td className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                      "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                                      shot.status === '已完成' || shot.status === '已渲染' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                      shot.status === '进行中' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-gray-500/10 text-gray-500 border-white/5"
                                                    )}>
                                                      {shot.status || '待处理'}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-3 text-right">
                                                    <span className="text-[10px] text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded">
                                                      {shot.type || 'N/A'}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}

                                    {shotsViewMode === 'board' && (
                                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                                        {(['待处理', '进行中', '已渲染'] as const).map(status => (
                                          <div key={status} className="flex-shrink-0 w-72 flex flex-col gap-3">
                                            <div className="flex items-center justify-between px-2">
                                              <div className="flex items-center gap-2">
                                                <div className={cn(
                                                  "w-2 h-2 rounded-full",
                                                  status === '已渲染' ? "bg-emerald-500" :
                                                  status === '进行中' ? "bg-blue-500" : "bg-gray-600"
                                                )} />
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{status}</span>
                                              </div>
                                              <span className="text-[10px] font-mono text-gray-600 bg-black/20 px-1.5 py-0.5 rounded">
                                                {selectedInspectorScene.shots.filter(s => (s.status === status) || (!s.status && status === '待处理') || (s.status === '已完成' && status === '已渲染')).length}
                                              </span>
                                            </div>
                                            <div className="flex-1 space-y-3 p-2 bg-black/20 rounded-xl border border-white/5">
                                              {selectedInspectorScene.shots
                                                .filter(s => (s.status === status) || (!s.status && status === '待处理') || (s.status === '已完成' && status === '已渲染'))
                                                .map((shot, idx) => (
                                                  <div 
                                                    key={shot.id}
                                                    className="bg-[#1a1a1a] border border-[#222] p-3 rounded-lg hover:border-gray-600 transition-all cursor-pointer group"
                                                  >
                                                    <div className="flex gap-3">
                                                      <img src={shot.thumbnail} alt="" className="w-16 h-10 object-cover rounded bg-black/40" referrerPolicy="no-referrer" />
                                                      <div className="min-w-0 flex-1">
                                                        <div className="text-[10px] font-bold text-gray-200 truncate mb-1">{shot.name}</div>
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-[9px] text-blue-400 font-bold">#{idx + 1}</span>
                                                          <span className="text-[9px] text-gray-500 font-medium px-1.5 py-0.5 bg-white/5 rounded lowercase tracking-tight">{shot.type}</span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
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
                                  管理资产
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
                                <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-white/5 border-b border-white/10">
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">资产名称</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">版本</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">版本状态</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">类型</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">状态</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">进度</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                      {selectedInspectorScene.assets.map(asset => (
                                        <tr 
                                          key={asset.id} 
                                          className="hover:bg-white/5 transition-colors cursor-pointer select-none"
                                          onDoubleClick={() => handleAssetDoubleClick(asset, selectedInspectorScene)}
                                        >
                                          <td className="px-4 py-3 text-xs font-bold text-white">
                                            <div className="flex flex-col">
                                              {asset.name}
                                              <span className="text-[8px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">双击查看详情</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">{asset.version}</td>
                                          <td className="px-4 py-3">
                                            <span className={cn(
                                              "text-[9px] px-2 py-0.5 rounded-full font-bold",
                                              asset.versionStatus === '已通过' ? "bg-emerald-500/10 text-emerald-400" :
                                              asset.versionStatus === '审核中' ? "bg-blue-500/10 text-blue-400" :
                                              asset.versionStatus === '已驳回' ? "bg-red-500/10 text-red-400" : "bg-gray-800 text-gray-500"
                                            )}>
                                              {asset.versionStatus}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-xs text-gray-400">{asset.type}</td>
                                          <td className="px-4 py-3">
                                            <span className={cn(
                                              "text-[9px] px-2 py-0.5 rounded-full uppercase font-bold",
                                              asset.status === '已完成' ? "bg-emerald-500/20 text-emerald-400" :
                                              asset.status === '制作中' ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-500"
                                            )}>
                                              {asset.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                                                <div className="h-full bg-blue-500" style={{ width: `${asset.progress}%` }} />
                                              </div>
                                              <span className="text-[10px] text-gray-500 font-mono">{asset.progress}%</span>
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
                                                <span className={cn(
                                                  "text-[8px] px-1 py-0.5 rounded font-bold",
                                                  asset.versionStatus === '已通过' ? "text-emerald-400 border border-emerald-500/20" :
                                                  asset.versionStatus === '审核中' ? "text-blue-400 border border-blue-500/20" :
                                                  asset.versionStatus === '已驳回' ? "text-red-400 border border-red-500/20" : "text-gray-500 border border-gray-500/20"
                                                )}>
                                                  {asset.versionStatus}
                                                </span>
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

                          {activeInspectorTab === 'previz' && (
                            <motion.div
                              key="previz"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-6"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Zap size={20} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-white">场记</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Script Supervisor Log</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition-all border border-white/5">
                                    导出清单
                                  </button>
                                </div>
                              </div>

                              <div className="bg-[#1a1a1a] border border-[#222] rounded-xl overflow-hidden flex flex-col">
                                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                  <table className="w-full text-left border-collapse min-w-[1600px]">
                                    <thead>
                                      <tr className="bg-[#222]/50 border-b border-[#222]">
                                        <th className="sticky left-0 z-10 bg-[#1a1a1a] px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[60px]">序号</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[140px]">数据名</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">短名称</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">截图</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[60px]">Take</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">景别</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">状态</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">拍摄时间</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">渲染时间</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">焦距</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">焦段</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">光孔</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">色温</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">感光度</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[80px]">拍摄模式</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">摄影</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[100px]">导演</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[150px]">修改意见</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-[150px]">备注</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#222]">
                                      {selectedInspectorScene.shots.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                          <td className="sticky left-0 z-10 bg-[#1a1a1a] group-hover:bg-[#222] px-4 py-4 transition-colors">
                                            <span className="text-xs font-mono font-bold text-blue-400">{(idx + 1).toString().padStart(2, '0')}</span>
                                          </td>
                                          <td className="px-4 py-4 text-xs text-gray-400 truncate max-w-[140px] font-mono">{item.name}</td>
                                          <td className="px-4 py-4 text-xs text-gray-300 font-bold">{item.shortName || `${item.name.split('_').pop()}`}</td>
                                          <td className="px-4 py-4">
                                            <div className="w-16 aspect-video bg-black rounded border border-white/10 overflow-hidden shadow-sm">
                                              <img src={item.thumbnail} alt="Shot" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                                            </div>
                                          </td>
                                          <td className="px-4 py-4 text-xs font-mono text-gray-300">{item.take || '01'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400">{item.shotSize || item.type}</td>
                                          <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                              <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                item.status === '已完成' || item.status === '已渲染' ? "bg-emerald-500" :
                                                item.status === '进行中' ? "bg-blue-500" :
                                                item.status === '待审核' ? "bg-yellow-500" : "bg-gray-600"
                                              )} />
                                              <span className="text-xs text-gray-300 whitespace-nowrap">{item.status || '待渲染'}</span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">{item.shootingTime || '14:20:05'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">{item.renderTime || '02:45'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 font-mono">{item.focalLength}mm</td>
                                          <td className="px-4 py-4 text-xs text-gray-400">{item.focalRange || 'Prime'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 font-mono">f/{item.aperture || '2.8'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 font-mono">{item.colorTemp || '5600'}K</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 font-mono">{item.iso}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400">{item.shootingMode || 'Manual'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 truncate font-medium">{item.photographer}</td>
                                          <td className="px-4 py-4 text-xs text-gray-400 truncate font-medium">{item.director}</td>
                                          <td className="px-4 py-4 text-xs text-gray-500 italic truncate max-w-[150px]">{item.comments || '-'}</td>
                                          <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-[150px]">{item.notes || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-[#1a1a1a] border border-[#222] rounded-xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">镜头总时长</span>
                                    <Clock size={14} className="text-blue-400" />
                                  </div>
                                  <p className="text-xl font-bold text-white">12:45 <span className="text-xs text-gray-500 font-normal">min</span></p>
                                </div>
                                <div className="p-4 bg-[#1a1a1a] border border-[#222] rounded-xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">平均渲染时间</span>
                                    <Zap size={14} className="text-yellow-400" />
                                  </div>
                                  <p className="text-xl font-bold text-white">4.2 <span className="text-xs text-gray-500 font-normal">min/shot</span></p>
                                </div>
                                <div className="p-4 bg-[#1a1a1a] border border-[#222] rounded-xl space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">资产就绪率</span>
                                    <Box size={14} className="text-emerald-400" />
                                  </div>
                                  <p className="text-xl font-bold text-white">85 <span className="text-xs text-gray-500 font-normal">%</span></p>
                                </div>
                              </div>
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
