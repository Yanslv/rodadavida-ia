
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

interface WheelChartProps {
  scores: Record<string, number>;
  categories: string[];
}

const WheelChart: React.FC<WheelChartProps> = ({ scores, categories }) => {
  const data = categories.map((cat) => ({
    subject: cat,
    A: scores[cat] || 0,
    fullMark: 10,
  }));

  // Split long labels for better display on mobile
  const formatLabel = (label: string) => {
    if (window.innerWidth < 640 && label.includes('&')) {
      return label.split(' & ')[0];
    }
    // Truncate very long custom labels
    if (label.length > 15) {
      return label.substring(0, 12) + '...';
    }
    return label;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 border border-indigo-100 rounded-xl shadow-xl shadow-indigo-500/10">
          <p className="font-bold text-slate-800 text-sm mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <p className="text-indigo-600 font-bold text-lg">
              {payload[0].value}<span className="text-slate-400 text-xs font-normal">/10</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[300px] sm:h-[400px] block font-sans relative z-10 min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
            </linearGradient>
            <filter id="glow" height="130%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> 
              <feOffset dx="0" dy="0" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.5"/>
              </feComponentTransfer>
              <feMerge> 
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          
          <PolarGrid 
            gridType="polygon" 
            stroke="#e2e8f0" 
            strokeDasharray="4 4" 
          />
          
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            tickFormatter={formatLabel}
          />
          
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 10]} 
            tick={false} 
            axisLine={false} 
          />
          
          <Radar
            name="Minha Roda"
            dataKey="A"
            stroke="#4f46e5"
            strokeWidth={3}
            fill="url(#radarFill)"
            fillOpacity={1}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          
          <Tooltip content={<CustomTooltip />} cursor={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WheelChart;
