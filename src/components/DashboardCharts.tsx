import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { HistoryItem } from '../types';
import { Sparkles, Calendar, Clock, BarChart4 } from 'lucide-react';

interface DashboardChartsProps {
  items: HistoryItem[];
}

export function DashboardCharts({ items }: DashboardChartsProps) {
  // 1. Process Trend Over Time Dataset
  const trendData = useMemo(() => {
    if (items.length === 0) return [];
    
    // Group by date
    const grouped: Record<string, number> = {};
    items.forEach(itm => {
      if (itm.date) {
        grouped[itm.date] = (grouped[itm.date] || 0) + 1;
      }
    });

    // Sort by chronological keys
    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(date => {
      // Format to readable, short, e.g. "Jun 12"
      let formattedDate = date;
      try {
        const parts = date.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } catch {
        // Fallback
      }

      return {
        date,
        formattedDate,
        count: grouped[date],
      };
    });
  }, [items]);

  // 2. Process Hourly Distribution Dataset
  const hourData = useMemo(() => {
    // Standardize 24 hour buckets
    const hours: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      hours[String(h).padStart(2, '0')] = 0;
    }

    items.forEach(itm => {
      if (itm.time) {
        const hr = itm.time.split(':')[0];
        if (hr && hours[hr] !== undefined) {
          hours[hr] += 1;
        }
      }
    });

    return Object.entries(hours).map(([hr, count]) => {
      const hrNum = Number(hr);
      const ampm = hrNum >= 12 ? 'PM' : 'AM';
      const displayHr = hrNum % 12 === 0 ? 12 : hrNum % 12;
      return {
        hour: `${displayHr} ${ampm}`,
        count,
        rawHour: hrNum,
      };
    });
  }, [items]);

  // 3. Process Categories Dataset (Pie/Bar combination)
  const categoryData = useMemo(() => {
    if (items.length === 0) return [];

    const grouped: Record<string, number> = {};
    items.forEach(itm => {
      if (itm.category) {
        grouped[itm.category] = (grouped[itm.category] || 0) + 1;
      }
    });

    const entries = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // If there are more than 5, group the rest as "Other"
    if (entries.length > 5) {
      const top = entries.slice(0, 5);
      const otherValue = entries.slice(5).reduce((sum, curr) => sum + curr.value, 0);
      top.push({ name: 'Other Services', value: otherValue });
      return top;
    }

    return entries;
  }, [items]);

  // Tailwind friendly hex colors
  const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* Chart 1: Activity Trend over time */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="lg:col-span-8 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-800 tracking-tight text-lg">Activity Trend</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">Daily interaction volume timeline</p>
          </div>
          <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 fill-indigo-600/15" />
            Analyzing {trendData.length} records
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="formattedDate" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={11}
                  fontWeight={500}
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={11}
                  fontWeight={500}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '12px'
                  }}
                  labelClassName="font-semibold text-slate-700"
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Interactions" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#gradientTrend)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm font-medium">Insufficient timeline distribution points.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Chart 2: Product Breakdown Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="lg:col-span-4 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between"
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart4 className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-slate-800 tracking-tight text-lg">Platform Split</h3>
          </div>
          <p className="text-xs text-slate-400 font-medium">Breakdown by Google services</p>
        </div>

        <div className="h-[220px] w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                  fontSize: '11px',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-800 font-sans tracking-tight">
              {categoryData.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Products</span>
          </div>
        </div>

        {/* Custom Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-slate-50">
          {categoryData.map((data, index) => (
            <div key={data.name} className="flex items-center gap-1.5 truncate">
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs font-semibold text-slate-600 truncate">{data.name}</span>
              <span className="text-[10px] font-bold text-slate-400 ml-auto bg-slate-50 px-1 py-0.25 rounded">
                {data.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Chart 3: Active Hour of Day bar chart query */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="lg:col-span-12 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-slate-800 tracking-tight text-lg">Hourly Routine</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">Activity density map across 24-hour diurnal phases</p>
          </div>
          <p className="text-xs text-slate-400 font-medium bg-slate-50 border border-slate-100/80 px-2.5 py-1 rounded-lg">
            Helps reveal when you use Google platforms the most
          </p>
        </div>

        <div className="h-[180px] w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis 
                dataKey="hour" 
                tickLine={false} 
                axisLine={false} 
                stroke="#cbd5e1" 
                fontSize={10}
                fontWeight={600}
                interval={1}
              />
              <YAxis 
                allowDecimals={false}
                tickLine={false} 
                axisLine={false} 
                stroke="#cbd5e1" 
                fontSize={10}
                fontWeight={600}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #f1f5f9', 
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif'
                }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Hourly Actions" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                {hourData.map((entry, index) => {
                  // highlight peak hours
                  const isNight = entry.rawHour >= 22 || entry.rawHour < 6;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isNight ? '#818cf8' : '#3b82f6'} 
                      opacity={0.88}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
