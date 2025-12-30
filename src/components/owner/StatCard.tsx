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

const colorSchemes: Record<ColorKey, { bg: string; text: string }> = {
  green: {
    bg: 'bg-green-100',
    text: 'text-green-800',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
  },
};

export const StatCard = ({ title, value, subValue, icon, color }: StatCardProps) => {
  const { bg, text } = colorSchemes[color] || colorSchemes.gray;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
          <p className="text-3xl font-bold text-gray-900 my-1">{value}</p>
          <p className={`text-xs ${text} font-medium`}>{subValue}</p>
        </div>
        <div className={`p-4 rounded-full ${bg} ${text}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};