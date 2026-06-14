import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { assessItemThreat, ThreatAssessment } from '../utils/parser';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  BarChart4, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  SlidersHorizontal,
  CalendarDays,
  Info,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface DashboardChartsProps {
  items: HistoryItem[];
}

export function DashboardCharts({ items }: DashboardChartsProps) {
  // Determine absolute boundaries of dates in items pool
  const { minDate, maxDate } = useMemo(() => {
    if (items.length === 0) return { minDate: '', maxDate: '' };
    const dates = items.map(itm => itm.date).filter(Boolean);
    if (dates.length === 0) return { minDate: '', maxDate: '' };
    const sorted = [...dates].sort();
    return { minDate: sorted[0], maxDate: sorted[sorted.length - 1] };
  }, [items]);

  // Dashboard Date Filters States
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');

  // Synchronize dashboard date pickers with newly uploaded/loaded history items
  useEffect(() => {
    if (minDate && maxDate) {
      setDashboardStartDate(minDate);
      setDashboardEndDate(maxDate);
    }
  }, [minDate, maxDate]);

  // Handle Quick Range presets specifically for visualizations
  const handleDashboardPreset = (days: number) => {
    if (!maxDate) return;
    const end = new Date(maxDate);
    const start = new Date(maxDate);
    start.setDate(end.getDate() - days);

    const formatDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setDashboardStartDate(formatDateStr(start));
    setDashboardEndDate(maxDate);
  };

  // Perform filtering on the items pool strictly for visualization components
  const filteredVisItems = useMemo(() => {
    return items.filter(item => {
      let matchesStart = true;
      let matchesEnd = true;
      if (dashboardStartDate) {
        matchesStart = item.date >= dashboardStartDate;
      }
      if (dashboardEndDate) {
        matchesEnd = item.date <= dashboardEndDate;
      }
      return matchesStart && matchesEnd;
    });
  }, [items, dashboardStartDate, dashboardEndDate]);

  // Dashboard Tab Options: 'trend' | 'risks'
  const [dashboardTab, setDashboardTab] = useState<'trends' | 'risks'>('trends');

  // Trend Chart Visual Options: 'area' | 'bar' | 'pie'
  const [trendChartStyle, setTrendChartStyle] = useState<'area' | 'bar' | 'pie'>('area');

  // 1. Process Activity volume Trend timeline
  const trendTimelineData = useMemo(() => {
    if (filteredVisItems.length === 0) return [];
    
    // Group count by date
    const grouped: Record<string, number> = {};
    filteredVisItems.forEach(itm => {
      if (itm.date) {
        grouped[itm.date] = (grouped[itm.date] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(grouped).sort();
    
    return sortedDates.map(date => {
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
  }, [filteredVisItems]);

  // Process top 7 busiest dates to feed the trend Pie chart representation
  const trendPieData = useMemo(() => {
    if (trendTimelineData.length === 0) return [];
    const sorted = [...trendTimelineData].sort((a, b) => b.count - a.count);
    const topDays = sorted.slice(0, 5);
    const otherVolume = sorted.slice(5).reduce((sum, curr) => sum + curr.count, 0);
    if (otherVolume > 0) {
      topDays.push({ date: 'other', formattedDate: 'Other Days', count: otherVolume });
    }
    return topDays.map(item => ({
      name: item.formattedDate,
      value: item.count
    }));
  }, [trendTimelineData]);

  // 2. Process hourly routine distribution
  const hourTimelineData = useMemo(() => {
    const hours: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      hours[String(h).padStart(2, '0')] = 0;
    }

    filteredVisItems.forEach(itm => {
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
  }, [filteredVisItems]);

  // 3. Process platform service split dataset
  const dynamicCategorySplit = useMemo(() => {
    if (filteredVisItems.length === 0) return [];

    const grouped: Record<string, number> = {};
    filteredVisItems.forEach(itm => {
      if (itm.category) {
        grouped[itm.category] = (grouped[itm.category] || 0) + 1;
      }
    });

    const entries = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (entries.length > 5) {
      const top = entries.slice(0, 5);
      const otherValue = entries.slice(5).reduce((sum, curr) => sum + curr.value, 0);
      top.push({ name: 'Other Services', value: otherValue });
      return top;
    }

    return entries;
  }, [filteredVisItems]);

  // 4. PROCESS ACCOUNT SECURITY & PRIVACY RISKS
  const securityRiskAnalysis = useMemo(() => {
    let adultRiskCount = 0;
    let scamRiskCount = 0;
    const flaggedItems: { item: HistoryItem; assessment: ThreatAssessment }[] = [];

    filteredVisItems.forEach(itm => {
      const assessment = assessItemThreat(itm.title);
      if (assessment.riskType === 'ADULT_OUTLET') {
        adultRiskCount++;
        flaggedItems.push({ item: itm, assessment });
      } else if (assessment.riskType === 'SCAM_HAZARD') {
        scamRiskCount++;
        flaggedItems.push({ item: itm, assessment });
      }
    });

    const totalRisks = adultRiskCount + scamRiskCount;
    
    // Privacy and Safety Score (starts at 100%, drops relative to vulnerabilities found)
    const safetyIndexScore = Math.max(0, 100 - (adultRiskCount * 10) - (scamRiskCount * 12));

    let safetyStatus = 'Guarded & Secured';
    let safetyThemeColor = 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (safetyIndexScore < 50) {
      safetyStatus = 'Action Recommended / At Risk';
      safetyThemeColor = 'text-red-500 bg-red-50 border-red-100';
    } else if (safetyIndexScore < 90) {
      safetyStatus = 'Security Review Recommended';
      safetyThemeColor = 'text-amber-500 bg-amber-50 border-amber-100';
    }

    // Pie chart dataset mapping the overall safety composition
    const safetyPieData = [
      { name: 'Clean Interactions', value: Math.max(0, filteredVisItems.length - totalRisks), color: '#10b981' },
      { name: 'Scam Target/Hazard Warning', value: scamRiskCount, color: '#f59e0b' },
      { name: 'Sensitive/Adult Exposures', value: adultRiskCount, color: '#f43f5e' }
    ];

    // Bar chart representation dataset
    const safetySeverityBarData = [
      { category: 'Sensitive/Adult', count: adultRiskCount, color: '#f43f5e' },
      { category: 'Scam & Link Hazards', count: scamRiskCount, color: '#f59e0b' },
      { category: 'No Risks Flagged', count: Math.max(0, filteredVisItems.length - totalRisks), color: '#10b981' }
    ];

    return {
      adultRiskCount,
      scamRiskCount,
      totalRisks,
      safetyIndexScore,
      safetyStatus,
      safetyThemeColor,
      flaggedItems,
      safetyPieData,
      safetySeverityBarData,
    };
  }, [filteredVisItems]);

  const STYLISH_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      
      {/* GLOBAL VISUALIZATION CONTROLS PANEL */}
      <div className="bg-white border border-slate-100/80 p-5 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80">
            <SlidersHorizontal className="w-4 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">
              Dashboard Visualization Core
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              Filter dates dynamically across all primary charts & privacy safety audits
            </p>
          </div>
        </div>

        {/* Date Filters Inputs & Quick Ranges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-xl">
            <CalendarDays className="w-4 h-4 text-slate-400 ml-1" />
            <input
              type="date"
              value={dashboardStartDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDashboardStartDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer p-0.5"
              title="Dashboard visualizations start date"
            />
            <span className="text-slate-300 text-sm">|</span>
            <input
              type="date"
              value={dashboardEndDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setDashboardEndDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer p-0.5"
              title="Dashboard visualizations end date"
            />
          </div>

          <div className="flex gap-1">
            <button
              onClick={() => handleDashboardPreset(7)}
              className="px-2.5 py-2 text-[10px] font-black text-slate-600 hover:text-indigo-600 bg-slate-100/60 hover:bg-slate-100 border border-slate-100/30 hover:border-slate-100 rounded-xl transition"
            >
              7 Days
            </button>
            <button
              onClick={() => handleDashboardPreset(14)}
              className="px-2.5 py-2 text-[10px] font-black text-slate-600 hover:text-indigo-600 bg-slate-100/60 hover:bg-slate-100 border border-slate-100/30 hover:border-slate-100 rounded-xl transition"
            >
              14 Days
            </button>
            <button
              onClick={() => {
                setDashboardStartDate(minDate);
                setDashboardEndDate(maxDate);
              }}
              className="px-2.5 py-2 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition border border-indigo-100/30"
            >
              reset Range
            </button>
          </div>
        </div>

        {/* Dashboard Sections Toggle between Trends and Privacy Risk Analysis */}
        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
          <button
            onClick={() => setDashboardTab('trends')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              dashboardTab === 'trends'
                ? 'bg-white text-slate-800 shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-slate-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Activities & Routines
          </button>
          <button
            onClick={() => setDashboardTab('risks')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              dashboardTab === 'risks'
                ? 'bg-indigo-600 text-white shadow-[0_2px_5px_rgba(99,102,241,0.25)]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Safety & Risk Assessment
            {securityRiskAnalysis.totalRisks > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.25 shrink-0 animate-bounce">
                {securityRiskAnalysis.totalRisks}
              </span>
            )}
          </button>
        </div>
      </div>

      {filteredVisItems.length === 0 ? (
        <div className="bg-white border border-slate-100/80 p-12 text-center rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
          <Info className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800">No events matched active Date Filter</h4>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto mt-1">
            Try resetting the start date ({dashboardStartDate}) and end date ({dashboardEndDate}) to contain the full duration of logs.
          </p>
          <button
            onClick={() => {
              setDashboardStartDate(minDate);
              setDashboardEndDate(maxDate);
            }}
            className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Display All Recorded Dates
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {dashboardTab === 'trends' ? (
            <motion.div
              key="trends-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* CHART 1: Primary trend timeline chart with customization selections */}
                <div className="lg:col-span-8 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-slate-800 tracking-tight text-lg">Activity Trend</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">
                        Daily interaction volumes across active timeline phases
                      </p>
                    </div>

                    {/* Chart toggles options (Area, Bar, Pie) */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start">
                      <button
                        onClick={() => setTrendChartStyle('area')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                          trendChartStyle === 'area'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        📈 Area
                      </button>
                      <button
                        onClick={() => setTrendChartStyle('bar')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                          trendChartStyle === 'bar'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        📊 Bar
                      </button>
                      <button
                        onClick={() => setTrendChartStyle('pie')}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                          trendChartStyle === 'pie'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        🍰 pie split
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Render block based on Active Style choice */}
                  <div className="h-[280px] w-full pt-2">
                    {trendTimelineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {trendChartStyle === 'area' ? (
                          <AreaChart data={trendTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                              name="Recorded interactions" 
                              stroke="#6366f1" 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#gradientTrend)" 
                            />
                          </AreaChart>
                        ) : trendChartStyle === 'bar' ? (
                          <BarChart data={trendTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                            <Bar 
                              dataKey="count" 
                              name="Recorded interactions" 
                              fill="#6366f1" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        ) : (
                          <PieChart>
                            <Pie
                              data={trendPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {trendPieData.map((entry, index) => (
                                <Cell key={`trend-cell-${index}`} fill={STYLISH_COLORS[index % STYLISH_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '12px', 
                                border: '1px solid #f1f5f9', 
                                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
                                fontSize: '12px',
                                fontFamily: 'Inter, sans-serif'
                              }}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36} 
                              iconType="circle"
                              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <p className="text-sm font-medium">Insufficient timeline distribution points.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CHART 2: Product Breakdown representation */}
                <div className="lg:col-span-4 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart4 className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-slate-800 tracking-tight text-lg">Platform Split</h3>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold">Breakdown by active log platform types</p>
                  </div>

                  <div className="h-[200px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dynamicCategorySplit}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {dynamicCategorySplit.map((entry, index) => (
                            <Cell key={`plat-cell-${index}`} fill={STYLISH_COLORS[index % STYLISH_COLORS.length]} />
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
                      <span className="text-xl font-black text-slate-800 tracking-tight">
                        {dynamicCategorySplit.length}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">services</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3 pt-3 border-t border-slate-50">
                    {dynamicCategorySplit.map((data, index) => (
                      <div key={`${data.name}-${index}`} className="flex items-center gap-1.5 truncate">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: STYLISH_COLORS[index % STYLISH_COLORS.length] }}
                        />
                        <span className="text-[11px] font-semibold text-slate-600 truncate">{data.name}</span>
                        <span className="text-[9.5px] font-bold text-slate-400 ml-auto bg-slate-50 px-1 py-0.25 rounded">
                          {data.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CHART 3: Diurnal phase Hour map */}
                <div className="lg:col-span-12 bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <h3 className="font-bold text-slate-800 tracking-tight text-lg">Hourly Routine density</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold">
                        Action distribution index across 24-hour diurnal phases
                      </p>
                    </div>
                    <p className="text-[11px] text-indigo-500 font-bold bg-indigo-50 border border-indigo-100/30 px-3 py-1 rounded-lg">
                      Visualizes peak focus or interaction intervals
                    </p>
                  </div>

                  <div className="h-[180px] w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourTimelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                          {hourTimelineData.map((entry, index) => {
                            const isNight = entry.rawHour >= 22 || entry.rawHour < 6;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isNight ? '#a5b4fc' : '#4f46e5'} 
                                opacity={0.88}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="risks-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              
              {/* PRIMARY RISK METRIC GRID (BENTO CARD OVERVIEW) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Score Index Card */}
                <div className="md:col-span-4 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between items-center text-center">
                  <div className="w-full">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">
                      SAFETY STATUS RATIO
                    </span>
                    <h3 className="font-bold text-slate-800 text-base tracking-tight mb-4">
                      Digital Privacy Score
                    </h3>
                  </div>

                  {/* Circular visual rating */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke="#f1f5f9"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        stroke={securityRiskAnalysis.safetyIndexScore > 80 ? '#10b981' : securityRiskAnalysis.safetyIndexScore > 50 ? '#f59e0b' : '#f43f5e'}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={376.8}
                        strokeDashoffset={376.8 - (376.8 * securityRiskAnalysis.safetyIndexScore) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-800 tracking-tight">
                        {securityRiskAnalysis.safetyIndexScore}%
                      </span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        Secure index
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 w-full">
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${securityRiskAnalysis.safetyThemeColor}`}>
                      {securityRiskAnalysis.safetyStatus}
                    </span>
                  </div>
                </div>

                {/* Risk Distribution Visual representation: Pie vs Bar toggles */}
                <div className="md:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                        <BarChart4 className="w-4 h-4 text-indigo-500" />
                        Exposure Risk Splits
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Relative proportion of flagged exposure vulnerabilities
                    </p>
                  </div>

                  <div className="h-[180px] w-full flex items-center justify-center">
                    {securityRiskAnalysis.totalRisks > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={securityRiskAnalysis.safetyPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {securityRiskAnalysis.safetyPieData.map((entry, index) => (
                              <Cell key={`risk-cell-${index}`} fill={entry.color} />
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
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-10 h-10 text-emerald-500 stroke-[1.5]" />
                        <span className="text-slate-400 text-xs font-semibold">Perfect Safety! No threats found.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Adult & Mature Exposures:
                      </span>
                      <span className="text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded">
                        {securityRiskAnalysis.adultRiskCount} items
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Scam warnings & dangerous clicks:
                      </span>
                      <span className="text-slate-800 font-bold bg-slate-50 px-2 py-0.5 rounded">
                        {securityRiskAnalysis.scamRiskCount} items
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanatory Safety Advisory Advice */}
                <div className="md:col-span-3 bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 mb-1">
                      <ShieldCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      Cyber Security Advisory
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Proactive protective steps for shared workstation accounts:
                    </p>
                  </div>

                  <div className="space-y-3 my-4 text-xs">
                    <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl leading-relaxed text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                      <strong>Private Sandbox</strong>: None of these analyzed keywords or logs are dispatched to our backend.
                    </div>
                    <div className="p-2 bg-indigo-50/40 border border-indigo-100 rounded-xl leading-relaxed text-slate-700">
                      <Info className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />
                      <strong>Sanitize Account</strong>: Delete matched items from Takeout to prevent shared family device exposures.
                    </div>
                  </div>

                  <a 
                    href="https://myactivity.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100/50 transition cursor-pointer"
                  >
                    Open Google MyActivity console
                  </a>
                </div>

              </div>

              {/* DETAILED TRIGGERED RISK ITEMS AUDIT LOG */}
              <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
                <div className="pb-4 border-b border-slate-100/80 mb-5">
                  <h4 className="font-bold text-slate-800 text-base tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    Security Audit Record ({securityRiskAnalysis.flaggedItems.length} findings detected)
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Please review these matched records found in your uploaded activity timeline files.
                  </p>
                </div>

                {securityRiskAnalysis.flaggedItems.length > 0 ? (
                  <div className="space-y-4">
                    {securityRiskAnalysis.flaggedItems.map(({ item, assessment }, index) => {
                      const isScam = assessment.riskType === 'SCAM_HAZARD';
                      return (
                        <div 
                          key={`flagged-${item.id}-${index}`}
                          className={`p-4 rounded-xl border border-dashed flex flex-col md:flex-row md:items-start md:justify-between gap-4 transition-all duration-150 ${
                            isScam 
                              ? 'bg-amber-50/40 border-amber-200/80' 
                              : 'bg-red-50/30 border-red-200/80'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                isScam 
                                  ? 'bg-amber-100 text-amber-800 border-amber-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {assessment.label}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                Matched signal: <strong>"{assessment.matchedTerm}"</strong>
                              </span>
                              <span className="text-slate-300 text-xs">•</span>
                              <span className="text-[11px] font-bold text-slate-500 font-mono">
                                #{item.order} ({item.date} {item.time})
                              </span>
                            </div>
                            
                            <h5 className="font-bold text-slate-800 text-sm leading-relaxed" title={item.title}>
                              "{item.title}"
                            </h5>
                            
                            <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                              <span className="font-bold text-slate-600 block mb-0.5">Recommended Safety step</span>
                              {assessment.recodeAdvice}
                            </p>
                          </div>

                          <div className="flex md:flex-col justify-end gap-2 shrink-0 self-end md:self-center">
                            <a 
                              href={`https://www.google.com/search?q=${encodeURIComponent(item.title)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition text-center shadow-xs"
                            >
                              Search Term
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 bg-emerald-50/20 border border-dashed border-emerald-100 p-8 text-center rounded-2xl flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 border border-emerald-100">
                      <ShieldCheck className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800">Your Google History file is safe!</h5>
                      <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto mt-1 leading-relaxed">
                        No sensitive adult search terms, pornographic metadata, crack bypass keywords, binary keygens, or phishing prize claims were matched. Perfect safety score!
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}

// Custom icons implemented cleanly using standard lucide components
function ShieldCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l7-2a1 1 0 0 1 .48 0l7 2A1 1 0 0 1 20 6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
