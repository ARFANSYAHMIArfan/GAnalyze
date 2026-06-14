import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StatsGrid } from './components/StatsGrid';
import { DashboardCharts } from './components/DashboardCharts';
import { HistoryTable } from './components/HistoryTable';
import { FileUpload } from './components/FileUpload';
import { HistoryItem, FileSummary } from './types';
import { 
  History, 
  HelpCircle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FolderSync,
  Info 
} from 'lucide-react';

export default function App() {
  const [uploadedFiles, setUploadedFiles] = useState<FileSummary[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHowToOpen, setIsHowToOpen] = useState(false);

  // Handle addition of freshly parsed file content
  const handleDataLoaded = (newItems: HistoryItem[], fileMeta: FileSummary) => {
    // Append the newly uploaded file metadata to the queue
    setUploadedFiles(prev => [...prev, fileMeta]);
    
    // Merge the new list and re-calculate continuous order sequence
    setHistoryItems(prev => {
      const mergedList = [...prev, ...newItems];
      // Sort chronologically by date and time to assign proper orders, then re-sort as desired
      mergedList.sort((a, b) => (a.rawDate?.getTime() || 0) - (b.rawDate?.getTime() || 0));
      return mergedList.map((item, idx) => ({
        ...item,
        order: idx + 1 // uniform overall order matching the merged dataset
      })).reverse(); // show latest activity first by default
    });
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setHistoryItems([]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-[0_4px_12px_-4px_rgba(99,102,241,0.2)]">
              <History className="w-6 h-6 stroke-[2.25]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight font-sans">
                  Google History Analyzer
                </h1>
                <span className="bg-indigo-100 text-indigo-700 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Browser Engine v1.0
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 leading-relaxed">
                Inspect, filter, and map trends of your Google Takeout CSV or JSON interaction archives locally.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsHowToOpen(!isHowToOpen)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl border border-slate-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              How to retrieve Google Takeout Files?
              {isHowToOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
              )}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100/50 border border-slate-100/80 px-3.5 py-2.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Private client-only sandbox</span>
            </div>
          </div>
        </div>
      </header>

      {/* HOW-TO COMPONENT ACCORDION */}
      <AnimatePresence>
        {isHowToOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-b border-indigo-100 bg-gradient-to-r from-white via-indigo-50/10 to-white"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-600 text-xs font-medium space-y-4">
              <div className="border border-indigo-100/80 p-5 rounded-2xl bg-indigo-50/20 max-w-4xl space-y-3">
                <h4 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Quick Tutorial: Exporting your Google Account History
                </h4>
                <p className="leading-relaxed">
                  Google Takeout allows you to easily extract copies of your activity on Google products. Best file candidates for this analyzer tool include your <strong>YouTube watch & search history</strong> or <strong>Google Assistant & Web Searches</strong>.
                </p>
                <ol className="list-decimal list-inside space-y-2 pl-1 leading-relaxed text-slate-700 font-semibold">
                  <li>
                    Visit <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">Google Takeout <FolderSync className="w-3 h-3 inline" /></a> and sign in.
                  </li>
                  <li>
                    Click <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border">Deselect all</span>, then scroll down and check <strong className="text-slate-800">My Activity</strong>.
                  </li>
                  <li>
                    Click <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border">Multiple formats</span> next to it and choose either <strong className="text-indigo-600">JSON</strong> (recommended for high fidelity detail) or <strong className="text-emerald-600">HTML/CSV</strong>.
                  </li>
                  <li>
                    Proceed to the next step, select <strong className="text-slate-800">Export once</strong>, and click <strong className="text-slate-800">Create export</strong>.
                  </li>
                  <li>
                    Download the temporary link zip, extract it, and find files like <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">MyActivity.json</code> or browser logs to drag here!
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* FILE UPLOAD PANEL */}
        <section>
          <FileUpload 
            onDataLoaded={handleDataLoaded} 
            uploadedFiles={uploadedFiles}
            onClearAll={handleClearAll}
          />
        </section>

        {/* INTEGRATION VIEW */}
        {historyItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* KPI STATS CARDS */}
            <section>
              <StatsGrid items={historyItems} />
            </section>

            {/* DASHBOARD CHARTS */}
            <section>
              <DashboardCharts items={historyItems} />
            </section>

            {/* HISTORY LOGS TABLE */}
            <section>
              <HistoryTable items={historyItems} />
            </section>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-slate-100/90 rounded-2xl bg-white p-12 text-center shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border-dashed border-2 flex flex-col items-center justify-center gap-4 py-16"
          >
            <div className="p-4 bg-slate-50 text-slate-400 border border-slate-100/80 rounded-2xl">
              <Info className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Ready for digital timeline analysis
              </h3>
              <p className="text-slate-400 text-xs font-semibold max-w-md mx-auto leading-relaxed">
                Upload your extracted CSV or JSON activity records above to explore platform metrics, search trends, privacy safety ratings, and routine schedules.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-100 text-center text-slate-400 text-xs font-semibold max-w-7xl mx-auto mt-12 px-4">
        <p>© 2026 Google History Analyzer • Private, secure processing inside the local browser container</p>
        <p className="text-[10px] text-slate-300 mt-1">
          No data is uploaded or processed server-side. Your Google Takeout files remain secure in your local runtime sandbox.
        </p>
      </footer>

    </div>
  );
}
