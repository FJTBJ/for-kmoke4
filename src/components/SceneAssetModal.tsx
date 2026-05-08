import React from 'react';
import { Scene, SceneAsset } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Box, CheckCircle2, Clock, AlertCircle, ExternalLink, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SceneAssetModalProps {
  scene: Scene;
  isOpen: boolean;
  onClose: () => void;
}

export const SceneAssetModal: React.FC<SceneAssetModalProps> = ({ scene, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[#141414] border border-[#222] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#222] flex items-center justify-between bg-[#1a1a1a]">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">资产制作驾驶舱</h2>
                  <p className="text-sm text-gray-500">{scene.sceneNumber}: {scene.title}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Overall Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">总资产进度</span>
                  <span className="text-sm font-bold text-blue-500">{scene.assetProgress}%</span>
                </div>
                <div className="h-3 bg-[#222] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${scene.assetProgress}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>

              {/* Asset List */}
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">依赖资产清单</h3>
                {scene.assets.map(asset => (
                  <div key={asset.id} className="p-4 bg-[#1a1a1a] border border-[#222] rounded-lg flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-[#222] rounded-md">
                        <Box size={18} className={cn(
                          asset.status === '已完成' ? "text-emerald-400" : 
                          asset.status === '制作中' ? "text-blue-400" : "text-gray-500"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{asset.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#222] text-gray-400 rounded uppercase">{asset.type}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span className="font-bold">负责人:</span> {asset.owner || '未分配'}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span className="font-bold">交付日期:</span> {asset.dueDate || '未设置'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-32 h-1 bg-[#222] rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500/50" style={{ width: `${asset.progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">{asset.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={cn(
                          "text-xs font-medium",
                          asset.status === '已完成' ? "text-emerald-400" : 
                          asset.status === '制作中' ? "text-blue-400" : "text-gray-500"
                        )}>
                          {asset.status}
                        </div>
                      </div>
                      {asset.status === '已完成' ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                       asset.status === '制作中' ? <Clock size={16} className="text-blue-400" /> : 
                       <AlertCircle size={16} className="text-gray-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-[#1a1a1a] border-t border-[#222] flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                <ExternalLink size={16} />
                前往资产落地页 (已过滤 {scene.sceneNumber})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
