import React from 'react';
import { ArrowLeft, BookOpen, Cpu, Globe, Users } from 'lucide-react';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-slate-50 text-slate-800 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200/60 mb-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-800">Technical Details</span>
      </div>

      {/* Scrollable info */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
        {/* Partnership section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <Users className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900">UNIDO & AfricaRice Alliance</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            This digital tool was engineered in collaboration with the United Nations Industrial Development Organization (UNIDO) and the Africa Rice Center (AfricaRice) to enhance rice competitiveness across the African continent. It helps rice processors and local farmers quickly assess quality metrics at the point of sale.
          </p>
        </div>

        {/* AI Engine section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <Cpu className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">Computer Vision Algorithm</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
            The app works in two modes:
          </p>
          <ul className="text-[10px] text-slate-500 list-disc list-inside flex flex-col gap-1">
            <li>
              <strong className="text-slate-700">Offline Edge Model:</strong> An optimized, client-side computer vision segmentation algorithm that runs entirely in the browser to isolate grains, count objects, and measure aspect ratios without internet.
            </li>
            <li>
              <strong className="text-slate-700">Cloudflare Workers AI:</strong> Sends the grain image to Cloudflare's serverless GPU infrastructure to run the open-source <code className="bg-slate-100 px-1 py-0.5 rounded text-[9px] text-slate-800">Llama 3.2 11B Vision Instruct</code> model for state-of-the-art visual reasoning.
            </li>
          </ul>
        </div>

        {/* Scoring Methodology */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2">
            <BookOpen className="w-4.5 h-4.5 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-900">Scoring Methodology</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
            Our grading structure strictly aligns with standard laboratory reference specifications:
          </p>
          <div className="flex flex-col gap-1.5 text-[9px] bg-slate-50 p-2.5 rounded-lg border border-slate-200/50">
            <div className="flex justify-between">
              <strong className="text-emerald-700">Grade A (Premium):</strong>
              <span className="text-slate-500">Broken &lt; 8%, Chalkiness &lt; 3%</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-amber-700">Grade B (Standard):</strong>
              <span className="text-slate-500">Broken 8% - 20%, Chalkiness 3% - 12%</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-rose-700">Grade C (Substandard):</strong>
              <span className="text-slate-500">Broken &gt; 20% or Chalkiness &gt; 12%</span>
            </div>
          </div>
        </div>

        {/* Geographic baseline */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-2">
          <div className="flex items-center gap-2.5 mb-2">
            <Globe className="w-4.5 h-4.5 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-900">Geographic Base</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            The model baselines and color spaces are calibrated using ground-truth laboratory measurements from key rice-growing corridors in Ghana (including the Volta Region, Accra Plains, and Northern Region).
          </p>
        </div>
      </div>

      {/* Back Button Footer */}
      <div className="pt-4 shrink-0">
        <button 
          onClick={onBack}
          className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-xl text-center text-xs transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
