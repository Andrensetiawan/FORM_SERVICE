'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ColorKey = 'green' | 'blue' | 'yellow' | 'gray';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue: string;
  icon: ReactNode;
  color: ColorKey;
}

const colorSchemes: Record<ColorKey, { gradient: string; iconBg: string; iconColor: string; accentColor: string }> = {
  green: {
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-green-500',
    iconColor: 'text-white',
    accentColor: 'text-emerald-600',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    iconColor: 'text-white',
    accentColor: 'text-blue-600',
  },
  yellow: {
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    iconColor: 'text-white',
    accentColor: 'text-amber-600',
  },
  gray: {
    gradient: 'from-slate-500 to-gray-600',
    iconBg: 'bg-gradient-to-br from-slate-400 to-gray-500',
    iconColor: 'text-white',
    accentColor: 'text-slate-600',
  },
};

export const StatCard = ({ title, value, subValue, icon, color }: StatCardProps) => {
  const { gradient, iconBg, iconColor, accentColor } = colorSchemes[color] || colorSchemes.gray;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="relative bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group"
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
          <p className={`text-4xl font-extrabold ${accentColor} mb-2`}>{value}</p>
          <p className="text-sm text-gray-600 font-medium">{subValue}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor} shadow-md`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};