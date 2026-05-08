import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Palette, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronDown, 
  User, 
  Box, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Settings2
} from 'lucide-react';
import { TimelineViewMode, CustomView, ColorEvent, Condition } from '../types';

interface ColorEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (view: CustomView) => void;
  currentViewMode: TimelineViewMode;
}

const FIELDS = [
  { id: 'owner', label: '负责人', icon: <User size={14} /> },
  { id: 'shootingStatus', label: '拍摄状态', icon: <Clock size={14} /> },
  { id: 'assetStatus', label: '资产状态', icon: <Box size={14} /> },
  { id: 'assetProgress', label: '资产进度', icon: <TrendingUp size={14} /> },
  { id: 'qcStatus', label: 'QC状态', icon: <CheckCircle2 size={14} /> },
  { id: 'budgetStatus', label: '预算状态', icon: <AlertTriangle size={14} /> },
];

const OPERATORS = [
  { id: 'equals', label: '等于' },
  { id: 'notEquals', label: '不等于' },
  { id: 'greaterThan', label: '大于' },
  { id: 'lessThan', label: '小于' },
];

const STATUS_OPTIONS: Record<string, string[]> = {
  shootingStatus: ['not-started', 'scheduled', 'shooting', 'completed', 'ng'],
  assetStatus: ['pending', 'ready'],
  qcStatus: ['pending', 'completed'],
  budgetStatus: ['on-budget', 'warning', 'over-budget'],
};

export const ColorEditorModal: React.FC<ColorEditorModalProps> = ({ isOpen, onClose, onSave, currentViewMode }) => {
  const [viewName, setViewName] = useState('');
  const [events, setEvents] = useState<ColorEvent[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with some default events based on current mode
      const initialEvents: ColorEvent[] = [
        {
          id: 'event-1',
          label: '已完成状态',
          color: '#10b981',
          conditions: [{ field: 'shootingStatus', operator: 'equals', value: 'completed' }]
        },
        {
          id: 'event-2',
          label: '进行中状态',
          color: '#3b82f6',
          conditions: [{ field: 'shootingStatus', operator: 'equals', value: 'shooting' }]
        }
      ];
      setEvents(initialEvents);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleAddEvent = () => {
    const newEvent: ColorEvent = {
      id: `event-${Date.now()}`,
      label: '新颜色事件',
      color: '#6366f1',
      conditions: [{ field: 'shootingStatus', operator: 'equals', value: 'not-started' }]
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleUpdateEvent = (id: string, updates: Partial<ColorEvent>) => {
    setEvents(events.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleAddCondition = (eventId: string) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          conditions: [...e.conditions, { field: 'owner', operator: 'equals', value: '' }]
        };
      }
      return e;
    }));
  };

  const handleRemoveCondition = (eventId: string, conditionIdx: number) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const newConditions = [...e.conditions];
        newConditions.splice(conditionIdx, 1);
        return { ...e, conditions: newConditions };
      }
      return e;
    }));
  };

  const handleUpdateCondition = (eventId: string, conditionIdx: number, updates: Partial<Condition>) => {
    setEvents(events.map(e => {
      if (e.id === eventId) {
        const newConditions = [...e.conditions];
        newConditions[conditionIdx] = { ...newConditions[conditionIdx], ...updates };
        return { ...e, conditions: newConditions };
      }
      return e;
    }));
  };

  const handleSave = () => {
    const newView: CustomView = {
      id: `custom-${Date.now()}`,
      name: viewName || `自定义视图 ${Date.now().toString().slice(-4)}`,
      events: events
    };
    onSave(newView);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#141414] border border-[#333] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Palette size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">新增/编辑视图</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Create or Edit View with Conditions</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="space-y-6">
              {/* View Name Input */}
              <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">视图名称 (View Name)</label>
                <input 
                  type="text" 
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  placeholder="输入新视图名称..."
                  className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-300">颜色触发规则 (Color Trigger Rules)</h4>
                <button 
                  onClick={handleAddEvent}
                  className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 uppercase tracking-wider"
                >
                  <Plus size={12} />
                  添加新颜色事件
                </button>
              </div>

              {/* Events List */}
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
                    {/* Event Header */}
                    <div className="px-5 py-3 bg-[#222]/30 border-b border-[#222] flex items-center gap-4">
                      <input 
                        type="color" 
                        value={event.color}
                        onChange={(e) => handleUpdateEvent(event.id, { color: e.target.value })}
                        className="w-8 h-8 bg-transparent border-none cursor-pointer shrink-0"
                      />
                      <input 
                        type="text" 
                        value={event.label}
                        onChange={(e) => handleUpdateEvent(event.id, { label: e.target.value })}
                        className="bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0 flex-1"
                        placeholder="事件名称..."
                      />
                      <button 
                        onClick={() => handleRemoveEvent(event.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Conditions Builder */}
                    <div className="p-5 space-y-4">
                      <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-gray-400">满足</span>
                          
                          <div className="flex-1 space-y-3">
                            {event.conditions.map((condition, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-3">
                                <div className="w-16 shrink-0">
                                  {cIdx === 0 ? (
                                    <div className="h-9" />
                                  ) : (
                                    <select className="w-full bg-[#222] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white focus:ring-0 appearance-none text-center font-bold">
                                      <option>且</option>
                                      <option>或</option>
                                    </select>
                                  )}
                                </div>
                                
                                {/* Field Select */}
                                <div className="relative flex-[1.5]">
                                  <select 
                                    value={condition.field}
                                    onChange={(e) => handleUpdateCondition(event.id, cIdx, { field: e.target.value })}
                                    className="w-full bg-[#222] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-xs text-white appearance-none focus:border-blue-500 transition-all"
                                  >
                                    {FIELDS.map(f => (
                                      <option key={f.id} value={f.id}>{f.label}</option>
                                    ))}
                                  </select>
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {FIELDS.find(f => f.id === condition.field)?.icon}
                                  </div>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                                    <ChevronDown size={12} />
                                  </div>
                                </div>

                                {/* Operator Select */}
                                <div className="relative flex-1">
                                  <select 
                                    value={condition.operator}
                                    onChange={(e) => handleUpdateCondition(event.id, cIdx, { operator: e.target.value as any })}
                                    className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-xs text-white appearance-none focus:border-blue-500 transition-all"
                                  >
                                    {OPERATORS.map(o => (
                                      <option key={o.id} value={o.id}>{o.label}</option>
                                    ))}
                                  </select>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                                    <ChevronDown size={12} />
                                  </div>
                                </div>

                                {/* Value Input/Select */}
                                <div className="relative flex-[2]">
                                  {STATUS_OPTIONS[condition.field] ? (
                                    <>
                                      <select 
                                        value={condition.value}
                                        onChange={(e) => handleUpdateCondition(event.id, cIdx, { value: e.target.value })}
                                        className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-xs text-white appearance-none focus:border-blue-500 transition-all"
                                      >
                                        <option value="">请选择状态...</option>
                                        {STATUS_OPTIONS[condition.field].map(opt => (
                                          <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">
                                        <ChevronDown size={12} />
                                      </div>
                                    </>
                                  ) : (
                                    <input 
                                      type={condition.field === 'assetProgress' ? 'number' : 'text'}
                                      value={condition.value}
                                      onChange={(e) => handleUpdateCondition(event.id, cIdx, { value: e.target.value })}
                                      placeholder="输入值..."
                                      className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-xs text-white focus:border-blue-500 transition-all"
                                    />
                                  )}
                                </div>

                                <button 
                                  onClick={() => handleRemoveCondition(event.id, cIdx)}
                                  className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 pt-4 border-t border-[#222] mt-2">
                          <button 
                            onClick={() => handleAddCondition(event.id)}
                            className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                          >
                            <Plus size={14} />
                            添加条件
                          </button>
                          <button className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors">
                            <Plus size={14} />
                            添加条件组
                          </button>
                          <div className="flex-1" />
                          <button 
                            onClick={() => handleUpdateEvent(event.id, { conditions: [] })}
                            className="text-xs font-bold text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw size={14} />
                            全部清空
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#222] bg-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <Settings2 size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">高级配置模式</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20"
              >
                <Save size={14} />
                保存并创建视图
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
