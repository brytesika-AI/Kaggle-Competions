import React from 'react';
import { Camera, BookOpen, History, Settings, Award, ChevronRight, UserCircle2 } from 'lucide-react';
import type { UserProfile, RiceScan } from '../types';

interface HomeScreenProps {
  profile: UserProfile;
  history: RiceScan[];
  onNavigate: (page: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ profile, history, onNavigate }) => {
  const latestScan = history.length > 0 ? history[history.length - 1] : null;
  const totalScans = history.length;
  
  // Calculate average broken percentage
  const avgBroken = totalScans > 0 
    ? Math.round(history.reduce((sum, item) => sum + item.brokenPercentage, 0) / totalScans) 
    : 0;

  // Grade color mapper
  const getGradeBadge = (grade: 'A' | 'B' | 'C') => {
    switch (grade) {
      case 'A':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Grade A</span>;
      case 'B':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Grade B</span>;
      case 'C':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Grade C</span>;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'farmer': return 'Rice Farmer';
      case 'trader': return 'Rice Trader';
      case 'miller': return 'Rice Miller';
      case 'officer': return 'Extension Officer';
      case 'researcher': return 'Quality Researcher';
      default: return role;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-50 text-slate-800 animate-fade-in">
      {/* Top Banner / User Bar */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            {profile.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {profile.name}
            </h3>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">
              {getRoleLabel(profile.role)} • {profile.organization}
            </span>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Feature Action (Big Assess Button) */}
      <button 
        onClick={() => onNavigate('capture')}
        className="w-full py-6 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl flex flex-col items-center justify-center gap-2.5 shadow-[0_4px_15px_rgba(22,163,74,0.25)] transition-all cursor-pointer relative overflow-hidden group mb-5"
      >
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full border border-emerald-400/10 transition-transform group-hover:scale-110"></div>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
          <Camera className="w-6 h-6" />
        </div>
        <div className="text-center">
          <span className="text-base font-extrabold block">Assess Quality</span>
          <span className="text-[10px] text-emerald-100 font-medium">Scan new rice grain sample (Offline AI)</span>
        </div>
      </button>

      {/* Grid of secondary actions */}
      <div className="grid grid-cols-2 gap-3.5 mb-5">
        <button 
          onClick={() => onNavigate('guidance')}
          className="p-4 bg-white border border-slate-200/80 rounded-xl flex flex-col items-start gap-2 hover:bg-slate-50 transition-all text-left cursor-pointer shadow-sm"
        >
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Capture Guide</span>
            <span className="text-[9px] text-slate-500">How to snap perfect pictures</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('history')}
          className="p-4 bg-white border border-slate-200/80 rounded-xl flex flex-col items-start gap-2 hover:bg-slate-50 transition-all text-left cursor-pointer shadow-sm"
        >
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">View History</span>
            <span className="text-[9px] text-slate-500">{totalScans} assessments saved</span>
          </div>
        </button>
      </div>

      {/* Analytics Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm mb-5">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
          Dashboard Stats
        </h4>
        <div className="grid grid-cols-2 gap-4 divide-x divide-slate-100">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{totalScans}</span>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">Total Assessments</span>
          </div>
          <div className="flex flex-col pl-4">
            <span className="text-2xl font-extrabold text-slate-900 leading-none">{avgBroken}%</span>
            <span className="text-[10px] font-semibold text-slate-500 mt-1">Avg. Broken Grains</span>
          </div>
        </div>
      </div>

      {/* Latest Scan Card */}
      <div className="flex-1 flex flex-col justify-end">
        {latestScan ? (
          <div 
            onClick={() => onNavigate(`results-${latestScan.id}`)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3.5 shadow-sm transition-all cursor-pointer flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-600">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">{latestScan.sampleName}</span>
                  {getGradeBadge(latestScan.grade)}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {latestScan.brokenPercentage}% broken • {latestScan.grainCount} grains counted
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        ) : (
          <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
            <UserCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">No assessments recorded yet</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Your scan results will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};
