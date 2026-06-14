import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HistoryItem } from '../types';
import { 
  Search, 
  Calendar, 
  Download, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileCode,
  Info
} from 'lucide-react';

interface HistoryTableProps {
  items: HistoryItem[];
}

type SortField = 'order' | 'id' | 'date' | 'title';
type SortOrder = 'asc' | 'desc';

export function HistoryTable({ items }: HistoryTableProps) {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'CSV' | 'JSON'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Sorting State
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  // Handle resets
  const handleResetFilters = () => {
    setSearchTerm('');
    setFormatFilter('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSelectQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    // Format YYYY-MM-DD
    const formatDate = (d: Date) => {
      return d.toISOString().split('T')[0];
    };
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setCurrentPage(1);
  };

  // 1. Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search Box Filter (match title, category, id, order)
      const matchesSearch = searchTerm.trim() === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item.order).includes(searchTerm);

      // File Format Filter
      const matchesFormat = formatFilter === 'ALL' || item.fileType === formatFilter;

      // Date Range Filter
      let matchesStartDate = true;
      let matchesEndDate = true;
      if (startDate) {
        matchesStartDate = item.date >= startDate;
      }
      if (endDate) {
        matchesEndDate = item.date <= endDate;
      }

      return matchesSearch && matchesFormat && matchesStartDate && matchesEndDate;
    });
  }, [items, searchTerm, formatFilter, startDate, endDate]);

  // 2. Sorting Logic
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    return list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle custom multi-level sorting for dates
      if (sortField === 'date') {
        const aT = a.rawDate?.getTime() || 0;
        const bT = b.rawDate?.getTime() || 0;
        return sortOrder === 'asc' ? aT - bT : bT - aT;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortField, sortOrder]);

  // 3. Pagination calculation
  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIdx, startIdx + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  // Auto adjusting active page if filter causes list height shrinkage
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // default desc for dates, asc for others
    }
    setCurrentPage(1);
  };

  const renderSortArrow = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 ml-1 text-indigo-600 inline-block" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 ml-1 text-indigo-600 inline-block" />
    );
  };

  const handleDownloadFiltered = () => {
    if (filteredItems.length === 0) return;
    const jsonStr = JSON.stringify(filteredItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_history_filtered_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] p-6 mt-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-100/85 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Interactive User History Log
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Displaying {filteredItems.length} of {items.length} total activity logs
          </p>
        </div>

        {/* File Format Seperation Tab selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100/80 self-start shrink-0">
          <button
            onClick={() => { setFormatFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 ${
              formatFilter === 'ALL'
                ? 'bg-white text-slate-800 shadow-[0_2px_5px_-2px_rgba(0,0,0,0.1)] border border-slate-100/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Formats ({items.length})
          </button>
          <button
            onClick={() => { setFormatFilter('CSV'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
              formatFilter === 'CSV'
                ? 'bg-emerald-600 text-white shadow-[0_2px_5px_-2px_rgba(16,185,129,0.2)]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            .CSV Data ({items.filter(i => i.fileType === 'CSV').length})
          </button>
          <button
            onClick={() => { setFormatFilter('JSON'); setCurrentPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
              formatFilter === 'JSON'
                ? 'bg-indigo-600 text-white shadow-[0_2px_5px_-2px_rgba(99,102,241,0.2)]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            .JSON Data ({items.filter(i => i.fileType === 'JSON').length})
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-slate-50">
        {/* Search SearchTerm */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Search Content
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search keyword, ID, format..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-700 text-sm pl-10 pr-4 py-2.5 rounded-xl transition-all duration-150 outline-none placeholder-slate-400/90 font-medium font-sans"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-700 text-sm pl-10 pr-4 py-2.5 rounded-xl transition-all duration-150 outline-none font-semibold font-sans"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-100 hover:border-slate-200 focus:border-indigo-400 focus:bg-white text-slate-700 text-sm pl-10 pr-4 py-2.5 rounded-xl transition-all duration-150 outline-none font-semibold font-sans"
            />
          </div>
        </div>

        {/* Quick Date Anchors & Controls */}
        <div className="flex flex-col justify-end">
          <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Quick Actions
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectQuickRange(7)}
              className="flex-1 bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-xs py-2.5 font-bold rounded-xl transition-all"
            >
              7 Days
            </button>
            <button
              onClick={() => handleSelectQuickRange(14)}
              className="flex-1 bg-slate-50 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-xs py-2.5 font-bold rounded-xl transition-all"
            >
              14 Days
            </button>
            <button
              onClick={handleResetFilters}
              title="Reset all search/dates"
              className="px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl transition-all flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.25]" />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      <div className="overflow-x-auto w-full mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100/90 text-[11px] uppercase tracking-widest text-slate-400 font-black">
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-50/70 select-none transition-colors w-[100px]"
                onClick={() => handleSort('order')}
              >
                Order {renderSortArrow('order')}
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-50/70 select-none transition-colors w-[160px]"
                onClick={() => handleSort('id')}
              >
                Log ID {renderSortArrow('id')}
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-50/70 select-none transition-colors w-[130px]"
                onClick={() => handleSort('date')}
              >
                Date {renderSortArrow('date')}
              </th>
              <th className="py-3 px-4 w-[110px]">Time</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:bg-slate-50/70 select-none transition-colors"
                onClick={() => handleSort('title')}
              >
                Action Title {renderSortArrow('title')}
              </th>
              <th className="py-3 px-4 text-center w-[120px]">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-600 text-sm font-medium">
            {paginatedItems.map((item, index) => {
              const fileTypeIsCSV = item.fileType === 'CSV';
              return (
                <tr 
                  key={`${item.id}-${item.order}-${index}`} 
                  className="hover:bg-slate-50/40 transition-colors group"
                >
                  <td className="py-3 px-4 font-mono text-xs text-slate-400">
                    #{item.order}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-400 truncate max-w-[150px]" title={item.id}>
                    {item.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                    {item.date}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {item.time}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 max-w-[500px]">
                      {/* Format tag badge */}
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide shrink-0 ${
                        fileTypeIsCSV 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}>
                        {item.fileType}
                      </span>
                      {/* Category tag badge */}
                      {item.category && item.category !== 'Google Activity' && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 max-w-[130px] truncate" title={item.category}>
                          {item.category}
                        </span>
                      )}
                      <span className="text-slate-800 text-[13px] font-medium truncate" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-100 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {paginatedItems.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Info className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                    <p className="text-sm">No activity logs meet your search or filter requirements.</p>
                    <button 
                      onClick={handleResetFilters}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                      Reset active queries
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION PANEL */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-50 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-100 text-slate-600 text-xs px-2.5 py-1.5 rounded-lg font-bold outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 px-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent text-xs transition font-semibold flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <span className="text-xs font-bold text-slate-500 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 px-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent text-xs transition font-semibold flex items-center justify-center"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <button
            onClick={handleDownloadFiltered}
            disabled={filteredItems.length === 0}
            className="text-xs font-bold bg-slate-50 border border-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 self-center disabled:opacity-40 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered JSON
          </button>
        </div>
      )}

      {/* INSPECT MODAL DRAWER */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-900"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden z-10 border border-slate-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      Category details
                    </span>
                    <h3 className="font-bold text-slate-800 text-lg mt-1.5 tracking-tight">
                      Log Details Inspection
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1 hover:bg-slate-50 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 text-slate-700">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Item Index (Order)
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-700">
                        #{selectedItem.order}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Unique identifier (ID)
                      </span>
                      <span className="font-mono text-xs text-slate-600 select-all block break-all">
                        {selectedItem.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Interaction Date
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {selectedItem.date}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Interaction Time
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {selectedItem.time}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Platform / Format Source
                      </span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 capitalize mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {selectedItem.category} ({selectedItem.fileType})
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Action Activity Title
                    </span>
                    <div className="bg-amber-50/50 border border-amber-100/70 p-4 rounded-xl text-slate-800 text-sm font-semibold leading-relaxed">
                      {selectedItem.title}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 font-bold rounded-xl transition"
                  >
                    Dismiss
                  </button>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(selectedItem.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 font-bold rounded-xl transition flex items-center gap-1.5 shadow-[0_2px_6px_-2px_rgba(99,102,241,0.3)]"
                  >
                    Google Search
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
