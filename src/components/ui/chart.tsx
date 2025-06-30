import React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  TooltipProps
} from 'recharts';

// Color palette for charts
const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
];

// Bar Chart Component
interface BarChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
}

export function BarChart({
  data,
  categories,
  index,
  colors = COLORS,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          formatter={valueFormatter}
          contentStyle={{ 
            backgroundColor: 'white', 
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #E5E7EB'
          }}
        />
        {showLegend && <Legend />}
        {categories.map((category, index) => (
          <Bar 
            key={category}
            dataKey={category} 
            fill={colors[index % colors.length]} 
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Line Chart Component
interface LineChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
}

export function LineChart({
  data,
  categories,
  index,
  colors = COLORS,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey={index} 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          formatter={valueFormatter}
          contentStyle={{ 
            backgroundColor: 'white', 
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #E5E7EB'
          }}
        />
        {showLegend && <Legend />}
        {categories.map((category, index) => (
          <Line 
            key={category}
            type="monotone" 
            dataKey={category} 
            stroke={colors[index % colors.length]} 
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
interface PieChartProps {
  data: any[];
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
}

export function PieChart({
  data,
  category,
  index,
  colors = COLORS,
  valueFormatter = (value) => `${value}`,
  showLegend = true,
}: PieChartProps) {
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-medium">{data[index]}</p>
          <p className="text-sm text-gray-600">{valueFormatter(data[category])}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          innerRadius={40}
          dataKey={category}
          nameKey={index}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}