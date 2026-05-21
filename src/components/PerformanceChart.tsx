"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function PerformanceChart({ data }: { data: any[] }) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--positive)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--positive)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#555', fontSize: 10 }}
            dy={10}
            tickFormatter={(str) => {
              const parts = str.split('-'); // YYYY-MM-DD
              if (parts.length < 3) return str;
              return `${parts[2]}/${parts[1]}`; // DD/MM
            }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#555', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: 'var(--positive)' }}
            labelStyle={{ color: '#888' }}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="var(--positive)" 
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
