'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type ColorKey = 'green' | 'blue' | 'yellow' | 'indigo';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue: string;
  icon: ReactNode;
  color: ColorKey;
}

const colorSchemes: Record<ColorKey, { bg: string; text: string; border: string }> = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-500',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-500',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-500',
  },
};

export const StatCard = ({ title, value, subValue, icon, color }: StatCardProps) => {
  const { bg, text, border } = colorSchemes[color] || colorSchemes.indigo;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border-l-4 ${border}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 my-1">{value}</p>
          <p className={`text-xs ${text.replace('700', '600')} font-medium`}>{subValue}</p>
        </div>
        <div className={`p-4 rounded-full ${bg} ${text}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};