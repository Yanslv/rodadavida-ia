import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { CATEGORIES } from '../types';

interface WheelChartProps {
  scores: Record<string, number>;
}

const WheelChart: React.FC<WheelChartProps> = ({ scores }) => {
  const data = CATEGORIES.map((cat) => ({
    subject: cat,
    A: scores[cat],
    fullMark: 10,
  }));

  // Split long labels for better display on mobile
  const formatLabel = (label: string) => {
    if (window.innerWidth < 640 && label.includes('&')) {
      return label.split(' & ')[0];
    }
    return label;
  };

  return (
    <div className="w-full h-[300px] sm:h-[400px] flex justify-center items-center font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            tickFormatter={formatLabel}
          />
          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
          <Radar
            name="Minha Roda"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={3}
            fill="#818cf8"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WheelChart;