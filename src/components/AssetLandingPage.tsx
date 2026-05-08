import React from 'react';
import { SceneAsset, Scene } from '../types';
import { motion } from 'motion/react';
import { ArrowLeft, Box, Clock, User, Calendar, CheckCircle2, AlertCircle, History, FileText, Download, ExternalLink, MessageSquare, Tag, Layers, Share2, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface AssetLandingPageProps {
  asset: SceneAsset;
  scene: Scene;
  onBack: () => void;
}

export const AssetLandingPage: React.FC<AssetLandingPageProps> = ({ asset, scene, onBack }) => {
  // Mock version history
  const history = [
    { version: asset.version, date: '2026-04-07 14:30', user: asset.owner || '张三', status: asset.versionStatus, note: '当前最新版本，优化了材质细节。' },
    { version: 'v003', date: '2026-04-05 09:15', user: '李四', status: '已通过', note: '修复了模型边缘锯齿问题。' },
    { version: 'v002', date: '2026-04-02 16:45', user: '王五', status: '已驳回', note: '光影效果不符合剧本氛围，需要重调。' },
    { version: 'v001', date: '2026-03-30 11:00', user: '赵六', status: '已通过', note: '初始模型导入。' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已通过': return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case '审核中': return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case '已驳回': return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex-1 flex flex-col bg-[#0a0a0a] overflow-hidden"
    >
      {/* Top Navigation */}
      <div className="h-14 border-b border-[#222] bg-[#141414] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-[#333]" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Box size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none mb-1">{asset.name}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {asset.type}资产 · 场次 #{scene.sceneNumber}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-bold transition-all">
            <Share2 size={14} />
            分享
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/20 transition-all">
            <Download size={14} />
            下载资产包
          </button>
          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          
          {/* Left Column: Preview & Details */}
          <div className="col-span-8 space-y-8">
            {/* Asset Preview */}
            <div className="aspect-video bg-[#111] rounded-2xl border border-white/5 overflow-hidden relative group">
              <img 
                src={`https://picsum.photos/seed/${asset.id}/1280/720`} 
                alt={asset.name}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded uppercase">
                      Preview
                    </span>
                    <span className="text-xs text-gray-400 font-mono">1920 x 1080 · 24fps</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">资产实时预览</h2>
                </div>
                <button className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full text-white transition-all">
                  <ExternalLink size={20} />
                </button>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: '当前版本', value: asset.version, icon: <Layers size={14} />, color: 'text-blue-400' },
                { label: '制作进度', value: `${asset.progress}%`, icon: <Clock size={14} />, color: 'text-emerald-400' },
                { label: '负责人', value: asset.owner || '未分配', icon: <User size={14} />, color: 'text-purple-400' },
                { label: '截止日期', value: asset.dueDate || '未设置', icon: <Calendar size={14} />, color: 'text-orange-400' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-[#141414] border border-white/5 rounded-xl">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </p>
                  <p className={cn("text-lg font-bold", item.color)}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Description & Notes */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                资产描述与备注
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                该资产是场次 #{scene.sceneNumber} 的核心视觉元素。在设计上需要重点考虑与整体美术风格的统一性。
                目前的版本已经完成了基础建模和 PBR 材质贴图，下一步将进行动力学解算和细节微调。
              </p>
              <div className="flex flex-wrap gap-2">
                {['PBR', '4K Texture', 'High Poly', 'Rigged', 'Production Ready'].map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <Tag size={10} className="inline mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Version History & Status */}
          <div className="col-span-4 space-y-8">
            {/* Status Card */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                审核状态
              </h3>
              <div className={cn(
                "p-4 rounded-xl border flex flex-col items-center text-center gap-2 mb-6",
                getStatusColor(asset.versionStatus)
              )}>
                <span className="text-xs font-bold uppercase tracking-widest">当前状态</span>
                <span className="text-2xl font-black">{asset.versionStatus}</span>
              </div>
              <div className="space-y-4">
                <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  通过审核
                </button>
                <button className="w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  驳回修改
                </button>
              </div>
            </div>

            {/* Version History */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <History size={16} className="text-blue-400" />
                  版本历史
                </span>
                <span className="text-[10px] text-gray-500 font-mono">共 {history.length} 个版本</span>
              </h3>
              <div className="space-y-6 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-[#333]" />
                {history.map((item, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={cn(
                      "absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-[#141414] flex items-center justify-center z-10",
                      i === 0 ? "bg-blue-500" : "bg-[#333]"
                    )}>
                      {i === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-bold", i === 0 ? "text-white" : "text-gray-400")}>
                        {item.version}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{item.date}</span>
                    </div>
                    <div className="p-3 bg-black/20 border border-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <User size={10} />
                          {item.user}
                        </span>
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded font-bold uppercase",
                          getStatusColor(item.status)
                        )}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {item.note}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-400" />
                讨论区
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold shrink-0">
                    张
                  </div>
                  <div className="flex-1 p-3 bg-black/20 rounded-lg border border-white/5">
                    <p className="text-[11px] text-gray-300">纹理分辨率建议提升到 4K，特写镜头可能会穿帮。</p>
                    <p className="text-[9px] text-gray-500 mt-1">10 分钟前</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <textarea 
                  placeholder="发表评论..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 min-h-[80px] resize-none"
                />
                <button className="absolute bottom-3 right-3 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all">
                  <MessageSquare size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
