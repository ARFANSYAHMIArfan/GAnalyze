import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { HistoryItem } from '../types';
import { Activity, CalendarRange, Clock3, Compass, Search } from 'lucide-react';

interface StatsGridProps {
  items: HistoryItem[];
}

export function StatsGrid({ items }: StatsGridProps) {
  const stats = useMemo(() => {
    if (items.length === 0) {
      return {
        total: 0,
        dateRange: 'No data',
        topCategory: 'N/A',
        topCategoryCount: 0,
        topHour: 'N/A',
        uniqueQueries: 0,
      };
    }

    // 1. Total
    const total = items.length;

    // 2. Date Range
    let minDateStr = '';
    let maxDateStr = '';
    
    // Sort items or run reducing
    const dates = items.map(itm => itm.date).filter(Boolean);
    if (dates.length > 0) {
      dates.sort();
      minDateStr = dates[0];
      maxDateStr = dates[dates.length - 1];
    }
    
    const formatDateFriendly = (dateStr: string) => {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };
    
    const dateRange = minDateStr && maxDateStr 
      ? `${formatDateFriendly(minDateStr)} - ${formatDateFriendly(maxDateStr)}`
      : 'N/A';

    // 3. Top Category
    const categoriesMap: Record<string, number> = {};
    items.forEach((item) => {
      categoriesMap[item.category] = (categoriesMap[item.category] || 0) + 1;
    });
    
    let topCategory = 'N/A';
    let topCategoryCount = 0;
    Object.entries(categoriesMap).forEach(([cat, cnt]) => {
      if (cnt > topCategoryCount) {
        topCategory = cat;
        topCategoryCount = cnt;
      }
    });

    // 4. Top Hour
    const hoursMap: Record<string, number> = {};
    items.forEach((item) => {
      if (item.time) {
        const hour = item.time.split(':')[0]; // e.g. "14"
        if (hour && !isNaN(Number(hour))) {
          hoursMap[hour] = (hoursMap[hour] || 0) + 1;
        }
      }
    });

    let topHourNum = -1;
    let topHourCount = 0;
    Object.entries(hoursMap).forEach(([hr, cnt]) => {
      if (cnt > topHourCount) {
        topHourNum = Number(hr);
        topHourCount = cnt;
      }
    });

    let topHourStr = 'N/A';
    if (topHourNum !== -1) {
      const ampm = topHourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = topHourNum % 12 === 0 ? 12 : topHourNum % 12;
      topHourStr = `${formattedHour} ${ampm}`;
    }

    // 5. Unique search words or distinct queries
    const uniqueTitles = new Set(items.map(itm => itm.title)).size;

    return {
      total,
      dateRange,
      topCategory,
      topCategoryCount,
      topHour: topHourStr,
      uniqueQueries: uniqueTitles,
    };
  }, [items]);

  const cards = [
    {
      title: 'Total Interactions',
      value: stats.total.toLocaleString(),
      subtext: 'Accumulated logs and actions',
      icon: Activity,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Primary Service / Product',
      value: stats.topCategory,
      subtext: `${stats.topCategoryCount.toLocaleString()} events recorded`,
      icon: Compass,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Timespan Range',
      value: stats.dateRange,
      subtext: 'Duration of logs analyzed',
      icon: CalendarRange,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Peak Activity Hours',
      value: stats.topHour,
      subtext: 'Most frequent interactive hour',
      icon: Clock3,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      title: 'Unique Queries / Titles',
      value: stats.uniqueQueries.toLocaleString(),
      subtext: 'Distinct distinct terms & topics',
      icon: Search,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <IconComponent className="w-4 h-4 stroke-[2.25]" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-800 tracking-tight font-sans truncate mb-1">
                {card.value}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {card.subtext}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
