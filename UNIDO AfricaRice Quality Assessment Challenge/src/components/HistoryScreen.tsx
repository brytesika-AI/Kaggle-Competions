import React, { useState } from 'react';
import { ArrowLeft, Search, Download, Trash2, ChevronRight, Award, Calendar } from 'lucide-react';
import type { RiceScan } from '../types';

interface HistoryScreenProps {
  history: RiceScan[];
  onSelectScan: (scan: RiceScan) => void;
  onClearHistory: () => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onSelectScan,
  onClearHistory,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  const filteredHistory = history.filter((scan) => {
    const matchesSearch = scan.sampleName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || scan.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  // Export history to CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    
    // Construct CSV content
    const headers = ['Scan ID', 'Timestamp', 'Sample Name', 'Grade', 'Status', 'Grains Count', 'Broken %', 'Chalkiness %', 'Avg Length (mm)', 'Avg Width (mm)'];
    const rows = history.map((scan) => [
      scan.id,
      `"${scan.timestamp}"`,
      `"${scan.sampleName}"`,
      scan.grade,
      scan.status,
      scan.grainCount,
      scan.brokenPercentage,
      scan.chalkyPercentage,
      scan.avgLength,
      scan.avgWidth
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rice_quality_scans_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGradeBadge = (grade: 'A' | 'B' | 'C') => {
    switch (grade) {
      case 'A':
        return <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-200">Grade A</span>;
      case 'B':
        return <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-200">Grade B</span>;
      case 'C':
        return <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold border border-rose-200">Grade C</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-800 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-800">Scan History</span>
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleExportCSV}
              title="Export CSV"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={onClearHistory}
              title="Clear History"
              className="p-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 active:bg-rose-200 text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-2.5 mb-4 shrink-0">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sample name..."
            className="form-input pl-10 py-2.5"
          />
        </div>

        {/* Grade tabs filter */}
        <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
          {(['all', 'A', 'B', 'C'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setGradeFilter(tab)}
              className={`flex-1 py-1.5 text-center rounded-md transition-all cursor-pointer ${
                gradeFilter === tab 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? 'All Grades' : `Grade ${tab}`}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 min-h-0">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((scan) => (
            <div 
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 shadow-sm transition-all cursor-pointer flex justify-between items-center group shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{scan.sampleName}</span>
                    {getGradeBadge(scan.grade)}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{scan.timestamp.split(',')[0]}</span>
                    <span>•</span>
                    <span>{scan.brokenPercentage}% broken</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </div>
          ))
        ) : (
          <div className="my-auto text-center py-8">
            <p className="text-xs font-semibold text-slate-500">No matching scans found</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Try widening your search or scan new samples.</p>
          </div>
        )}
      </div>

      {/* CSV download prompt */}
      {filteredHistory.length > 0 && (
        <div className="pt-3 border-t border-slate-200/60 mt-4 text-center shrink-0">
          <button 
            onClick={handleExportCSV}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export complete logs as CSV sheet</span>
          </button>
        </div>
      )}
    </div>
  );
};
