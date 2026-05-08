import React from 'react';
import { Shot } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ShotBlockProps {
  shot: Shot;
  scale: number;
}

export const ShotBlock: React.FC<ShotBlockProps> = ({ shot, scale }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "relative h-32 bg-[#2a2a2a] border border-[#444] rounded-md overflow-hidden cursor-pointer group hover:border-blue-500/50 transition-colors"
      )}
      style={{ 
        width: shot.duration * scale,
        marginLeft: shot.startTime * scale
      }}
    >
      <img 
        src={shot.thumbnail} 
        alt={shot.name}
        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 p-2 flex flex-col justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div>
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{shot.type.replace('-', ' ')}</div>
          <div className="text-xs font-medium truncate">{shot.name}</div>
        </div>
        
        <div className="flex justify-between items-end">
          <span className="text-[10px] text-gray-400 font-mono">
            {shot.duration} 秒
          </span>
        </div>
      </div>
    </motion.div>
  );
};
