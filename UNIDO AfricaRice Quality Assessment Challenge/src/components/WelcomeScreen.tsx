import React from 'react';
import { ShieldAlert, Award, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white animate-fade-in">
      {/* Logos and Header */}
      <div className="flex flex-col items-center pt-8 text-center">
        {/* Mock Logo emblem */}
        <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 flex items-center justify-center mb-4 shadow-[0_8px_30px_rgb(16,185,129,0.1)] animate-float">
          <Award className="w-10 h-10 text-emerald-400" />
        </div>
        
        <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-emerald-400 mb-1">
          UNIDO & AfricaRice
        </span>
        <h1 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
          RiceGrade AI
        </h1>
        <p className="text-xs text-slate-400 max-w-[280px]">
          Assessing rice quality for Ghana's smallholder farmers, millers, and traders.
        </p>
      </div>

      {/* Center Graphics / Benefit illustration */}
      <div className="my-auto py-6 flex flex-col gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Rapid Camera Analysis</h3>
            <p className="text-xs text-slate-400">Scan and count whole vs broken grains in seconds from a single photo.</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-start">
          <div className="bg-blue-500/20 p-2 rounded-xl text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Offline-First Engine</h3>
            <p className="text-xs text-slate-400">Run local AI models completely offline in remote field settings.</p>
          </div>
        </div>
      </div>

      {/* Footer Legal Disclaimer and Action Button */}
      <div className="flex flex-col gap-5 pb-4">
        {/* Legal Disclaimer Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex gap-2.5 items-start">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] text-amber-200/90 leading-normal">
            <strong className="text-amber-400">Indicative Tool Disclaimer:</strong> This application is a decision-support tool. It provides indicative quality assessment metrics only and does not constitute a formal laboratory certification or trade quality guarantee.
          </div>
        </div>

        {/* Start Button */}
        <button 
          onClick={onNext}
          className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer group"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
