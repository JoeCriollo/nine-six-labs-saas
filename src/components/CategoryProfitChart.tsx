"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CategoryProfitData {
  category: string;
  profit: number;
}

export default function CategoryProfitChart({ data }: { data: Record<string, number> }) {
  const chartData: CategoryProfitData[] = Object.entries(data)
    .map(([category, profit]) => ({
      category,
      profit: Math.max(0, profit), // Only show positive profit for visual clarity, or handle negatives
    }))
    .sort((a, b) => b.profit - a.profit);

  const colors = [
    '#32FF00', // Neon Green
    '#00E5FF', // Cyan
    '#D400FF', // Purple
    '#FF3D00', // Orange/Red
    '#FFEA00', // Yellow
    '#888888', // Gray
  ];

  return (
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#222" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="category" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888', fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: '#222' }}
            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#888' }}
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, 'Ganancia']}
          />
          <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
