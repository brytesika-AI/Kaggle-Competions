import React from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GuidanceScreenProps {
  onBack: () => void;
  onProceed: () => void;
}

export const GuidanceScreen: React.FC<GuidanceScreenProps> = ({ onBack, onProceed }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-800 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60 mb-4">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">Capture Guidelines</span>
      </div>

      {/* Main Guidance Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex gap-3 items-start">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-blue-900">Why are guidelines important?</h4>
            <p className="text-[10px] text-blue-800/90 leading-relaxed mt-0.5">
              The AI model requires clean images to identify individual rice grains, calculate dimensions, and detect broken elements. Poor images yield inaccurate results.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Preparation Steps
          </h3>
          
          {/* Step 1: Blue Background */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3 items-start shadow-sm">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-sm">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Use a Solid Blue Background</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Place your grains on a solid, non-reflective <strong className="text-blue-600">blue surface</strong> (e.g. plastic sheet, folder). This provides high contrast for edge detection.
              </p>
            </div>
          </div>

          {/* Step 2: Separate grains */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3 items-start shadow-sm">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-sm">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Spread Grains Evenly</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Scatter a small representative sample (~50-100 grains). Make sure grains do <strong className="text-emerald-700">not overlap</strong> or touch, otherwise they count as single broken pieces.
              </p>
            </div>
          </div>

          {/* Step 3: Lighting and shadow */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3 items-start shadow-sm">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-sm">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Avoid Direct Shadows / Blur</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Take the photo in indirect, uniform daylight. Avoid strong overhead light that casts sharp shadows, and keep the phone steady to avoid camera blur.
              </p>
            </div>
          </div>

          {/* Step 4: Parallel angle */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-3 items-start shadow-sm">
            <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-sm">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Hold Phone Parallel</h4>
              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                Hold your phone flat, parallel to the surface, about 20-30 cm directly above the grains.
              </p>
            </div>
          </div>
        </div>

        {/* Dos and Don'ts */}
        <div className="grid grid-cols-2 gap-3.5 mt-1 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> DO
            </span>
            <span className="text-[9px] text-slate-500">• Blue background</span>
            <span className="text-[9px] text-slate-500">• Separated grains</span>
            <span className="text-[9px] text-slate-500">• Flat overhead shot</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> DON'T
            </span>
            <span className="text-[9px] text-slate-500">• Paper with text/grid</span>
            <span className="text-[9px] text-slate-500">• Overlapping pile</span>
            <span className="text-[9px] text-slate-500">• Angle perspective</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex gap-3">
        <button 
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-xl text-center text-xs transition-all cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={onProceed}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-center text-xs shadow-sm transition-all cursor-pointer"
        >
          Proceed to Scan
        </button>
      </div>
    </div>
  );
};
