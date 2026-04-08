import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  labelHi: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  labelHi,
  value,
  trend,
  color = '#E53935',
}: StatsCardProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 hover:border-[#E53935] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs text-green-500 font-medium">{trend}</span>
        )}
      </div>

      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-300 text-sm">{label}</div>
      <div className="text-gray-500 text-xs">{labelHi}</div>
    </div>
  );
}
