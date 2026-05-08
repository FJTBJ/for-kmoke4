import React from 'react';
import { Scene, ShootingStatus, AssetRisk, TimelineViewMode, CustomView, Condition } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Box, 
  Zap, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  User, 
  Calendar,
  Film,
  TrendingUp
} from 'lucide-react';

interface SceneBlockProps {
  scene: Scene;
  isSelected?: boolean;
  onDoubleClick: (scene: Scene) => void;
  onClick: (scene: Scene) => void;
  onAssetClick: (scene: Scene) => void;
  scale: number;
  viewMode?: TimelineViewMode;
  customView?: CustomView;
  detailLevel?: 'overview' | 'management';
  effectiveDuration?: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const evaluateCondition = (scene: Scene, condition: Condition): boolean => {
  const { field, operator, value } = condition;
  const sceneValue = (scene as any)[field];

  switch (operator) {
    case 'equals':
      return String(sceneValue) === String(value);
    case 'notEquals':
      return String(sceneValue) !== String(value);
    case 'greaterThan':
      return Number(sceneValue) > Number(value);
    case 'lessThan':
      return Number(sceneValue) < Number(value);
    case 'contains':
      return String(sceneValue).toLowerCase().includes(String(value).toLowerCase());
    default:
      return false;
  }
};

const matchesAllConditions = (scene: Scene, conditions: Condition[]): boolean => {
  if (!conditions || conditions.length === 0) return false;
  return conditions.every(c => evaluateCondition(scene, c));
};

const getStepLabel = (status: ShootingStatus) => {
  switch (status) {
    case 'not-started': return '待拍摄';
    case 'scheduled': return '已排期';
    case 'shooting': return '拍摄中';
    case 'completed': return '已完成';
    case 'ng': return '重拍';
    default: return '未知';
  }
};

export const SceneBlock: React.FC<SceneBlockProps> = ({ 
  scene, 
  isSelected,
  onDoubleClick, 
  onClick,
  onAssetClick, 
  scale,
  viewMode = 'production',
  customView,
  detailLevel = 'management',
  effectiveDuration,
  isHighlighted,
  isDimmed
}) => {
  const isReadyToProduce = scene.assetStatus === 'ready';
  const duration = effectiveDuration || scene.duration;
  
  // Scene Status Styles based on View Mode
  const getStatusStyles = () => {
    if (isHighlighted) {
      return { 
        className: "bg-yellow-500/30 border-yellow-400/80 text-yellow-50 shadow-[0_0_15px_rgba(250,204,21,0.3)]",
        barClassName: "bg-yellow-400"
      };
    }
    if (isDimmed) {
      return { 
        className: "bg-gray-900/20 border-gray-800/20 text-gray-600 opacity-20 grayscale scale-[0.98]",
        barClassName: "bg-gray-700"
      };
    }

    if (customView) {
      // Find the first event whose conditions are all met
      const matchingEvent = customView.events.find(event => matchesAllConditions(scene, event.conditions));
      
      if (matchingEvent) {
        return {
          style: { backgroundColor: `${matchingEvent.color}20`, borderColor: `${matchingEvent.color}50` },
          barStyle: { backgroundColor: matchingEvent.color },
          className: "text-white"
        };
      }
    }

    if (viewMode === 'production') {
      switch (scene.shootingStatus) {
        case 'completed': return { className: "bg-emerald-500/20 border-emerald-500/50 text-emerald-100", barClassName: "bg-emerald-500" };
        case 'shooting': return { className: "bg-blue-500/20 border-blue-500/50 text-blue-100", barClassName: "bg-blue-500" };
        default: return { className: "bg-gray-800/40 border-gray-700/50 text-gray-400", barClassName: "bg-gray-600" };
      }
    }

    if (viewMode === 'previs') {
      if (scene.shootingStatus === 'completed') return { className: "bg-emerald-500/20 border-emerald-500/50 text-emerald-100", barClassName: "bg-emerald-500" };
      if (scene.qcStatus === 'completed') return { className: "bg-blue-500/20 border-blue-500/50 text-blue-100", barClassName: "bg-blue-500" };
      if (scene.assetStatus !== 'ready') return { className: "bg-yellow-500/20 border-yellow-500/50 text-yellow-100", barClassName: "bg-yellow-500" };
      return { className: "bg-gray-800/40 border-gray-700/50 text-gray-400", barClassName: "bg-gray-600" };
    }

    if (viewMode === 'asset') {
      if (scene.assetProgress === 100) return { className: "bg-emerald-500/20 border-emerald-500/50 text-emerald-100", barClassName: "bg-emerald-500" };
      if (scene.conceptStatus === 'completed' && scene.assetProgress < 100) return { className: "bg-blue-500/20 border-blue-500/50 text-blue-100", barClassName: "bg-blue-500" };
      return { className: "bg-gray-800/40 border-gray-700/50 text-gray-400", barClassName: "bg-gray-600" };
    }

    return { className: "bg-gray-800/40 border-gray-700/50 text-gray-400", barClassName: "bg-gray-600" };
  };

  const status = getStatusStyles();

  const getRiskIcon = (risk: AssetRisk) => {
    switch (risk) {
      case 'high': return <AlertTriangle size={14} className="text-red-500" />;
      case 'medium': return <AlertTriangle size={14} className="text-orange-500" />;
      default: return <CheckCircle2 size={14} className="text-emerald-500" />;
    }
  };

  const isManagement = detailLevel === 'management';

  return (
    <motion.div
      layoutId={`scene-${scene.id}`}
      onDoubleClick={() => onDoubleClick(scene)}
      onClick={() => onClick(scene)}
      className={cn(
        "relative border-r border-y cursor-pointer select-none group transition-all flex flex-col",
        isManagement ? "h-24" : "h-16",
        status.className,
        isSelected && "ring-2 ring-blue-500 ring-inset z-20",
        isHighlighted && "z-30"
      )}
      style={{ width: duration * scale, ...status.style }}
      whileHover={{ y: -2, zIndex: 10 }}
      animate={isHighlighted ? {
        scale: [1, 1.01, 1],
        transition: { repeat: Infinity, duration: 2 }
      } : { scale: 1 }}
    >
      {/* Left Status Bar */}
      <div 
        className={cn("absolute left-0 top-0 bottom-0 w-1.5", status.barClassName)} 
        style={status.barStyle}
      />

      <div className={cn(
        "flex-1 overflow-hidden flex flex-col",
        isManagement ? "p-3 gap-2" : "p-2 gap-1"
      )}>
        {/* Header: ID & Step/Shot Count */}
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "font-bold rounded bg-black/40 shrink-0",
              isManagement ? "text-[10px] px-1.5 py-0.5" : "text-[9px] px-1 py-0"
            )}>
              #{scene.sceneNumber}
            </span>
            <span className={cn(
              "font-medium truncate text-gray-300",
              isManagement ? "text-[11px]" : "text-[9px]"
            )}>
              {getStepLabel(scene.shootingStatus)}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn(
              "font-mono text-gray-400",
              isManagement ? "text-[10px]" : "text-[8px]"
            )}>
              {scene.shots.length} 镜头
            </span>
          </div>
        </div>

        {/* Asset Progress (Percentage only as requested) */}
        <div 
          className={cn(
            "group/asset relative bg-black/30 rounded border border-white/5 flex items-center justify-between overflow-hidden",
            isManagement ? "h-5 px-2" : "h-4 px-1.5"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onAssetClick(scene);
          }}
        >
          <div className="flex items-center gap-1.5">
            <Box size={isManagement ? 12 : 10} className={cn("relative z-10", isReadyToProduce ? "text-emerald-400" : "text-blue-400")} />
            {isManagement && <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">资产进度</span>}
          </div>
          <span className={cn("relative z-10 font-mono font-bold", isManagement ? "text-[10px]" : "text-[8px]", isReadyToProduce ? "text-emerald-400" : "text-blue-400")}>
            {scene.assetProgress}%
          </span>
        </div>

        {/* Management Level Info - Simplified (Removed owner and planned date as requested) */}
      </div>

      {/* Hover Detail Overlay */}
      <div className="absolute inset-x-0 -bottom-1 h-1 bg-white/0 group-hover:bg-white/20 transition-all" />
      
      {/* Tooltip for extended info */}
      <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-[100] w-56 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-2xl pointer-events-none">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 tracking-wider">依赖资产</p>
            <div className="flex flex-wrap gap-1.5">
              {scene.assets.slice(0, 4).map(a => (
                <span key={a.id} className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{a.name}</span>
              ))}
              {scene.assets.length > 4 && <span className="text-[10px] text-gray-500">+{scene.assets.length - 4}</span>}
            </div>
          </div>
          {scene.dependencies.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-gray-500 font-bold mb-1.5 tracking-wider">前置场次</p>
              <div className="flex gap-1.5">
                {scene.dependencies.map(d => (
                  <span key={d} className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-mono">#{d.split('-')[1]}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
