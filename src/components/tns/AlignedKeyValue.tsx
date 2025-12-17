// src/components/tns/AlignedKeyValue.tsx
import React from 'react';

interface AlignedKeyValueProps {
  label: string;
  value: string | number | null | undefined;
  fallback?: string;
}

const AlignedKeyValue: React.FC<AlignedKeyValueProps> = ({ label, value, fallback = "-" }) => {
  return (
    <div className="grid grid-cols-[max-content_min-content_1fr] gap-x-2 items-center text-sm">
      <span className="text-gray-400 font-medium text-left">{label}</span>
      <span className="text-gray-400 font-medium text-right">:</span>
      <span className="text-white font-normal text-left">{value || fallback}</span>
    </div>
  );
};

export default AlignedKeyValue;
