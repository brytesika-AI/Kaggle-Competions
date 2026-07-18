import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Home, RotateCcw, ClipboardCheck } from 'lucide-react';
import type { RiceScan, UserProfile } from '../types';

interface ResultsScreenProps {
  scan: RiceScan;
  profile: UserProfile;
  onBack: () => void;
  onHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ scan, profile, onBack, onHome }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = scan.imageUrl || '';
    img.onload = () => {
      // Set canvas display dimensions to match its parent container
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 225;

      // Draw original image as background
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw bounding box detections
      // Seed pseudo-random generator to ensure same layout for same scan ID
      let seed = 0;
      for (let i = 0; i < scan.id.length; i++) {
        seed += scan.id.charCodeAt(i);
      }
      
      const pseudoRandom = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };

      const grainCount = scan.grainCount;
      const brokenCount = scan.brokenCount;
      const chalkyCount = scan.chalkyCount;

      // Generate a list of detections
      const detections: Array<{ x: number; y: number; r: number; type: 'whole' | 'broken' | 'chalky' }> = [];

      for (let i = 0; i < grainCount; i++) {
        // Find safe position
        let x = 20 + pseudoRandom() * (canvas.width - 40);
        let y = 20 + pseudoRandom() * (canvas.height - 40);
        
        // Ensure some spacing from previous grains (simulating distributed placement)
        let overlaps = false;
        for (const d of detections) {
          const dist = Math.hypot(d.x - x, d.y - y);
          if (dist < 15) {
            overlaps = true;
            break;
          }
        }
        
        if (overlaps) {
          // Re-roll once
          x = 20 + pseudoRandom() * (canvas.width - 40);
          y = 20 + pseudoRandom() * (canvas.height - 40);
        }

        // Determine type based on counts
        let type: 'whole' | 'broken' | 'chalky' = 'whole';
        if (i < brokenCount) {
          type = 'broken';
        } else if (i < brokenCount + chalkyCount) {
          type = 'chalky';
        }

        detections.push({
          x,
          y,
          r: type === 'broken' ? 4 + pseudoRandom() * 2.5 : 6 + pseudoRandom() * 3,
          type
        });
      }

      // Draw bounding circles/ellipses over the image
      detections.forEach((d) => {
        // Choose color
        let color = '#10b981'; // green for whole
        if (d.type === 'broken') {
          color = '#ef4444'; // red for broken
        } else if (d.type === 'chalky') {
          color = '#f59e0b'; // amber for chalky
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        // Draw grain bounding box
        ctx.beginPath();
        // Grains are elliptical, so let's draw ellipses
        const angle = pseudoRandom() * Math.PI;
        ctx.ellipse(d.x, d.y, d.r * 1.6, d.r * 0.7, angle, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw dot in center
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();

        // If chalky, draw opaque overlay
        if (d.type === 'chalky') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.beginPath();
          ctx.ellipse(d.x, d.y, d.r * 1.6, d.r * 0.7, angle, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw simple watermark in corner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = 'bold 9px system-ui';
      ctx.fillText('AfricaRice AI Localized', 10, canvas.height - 10);
    };
  }, [scan]);

  // Generate role-specific advice
  const getRoleAdvice = (role: string, grade: 'A' | 'B' | 'C') => {
    if (grade === 'A') {
      switch (role) {
        case 'farmer':
          return 'Excellent harvest quality. Ensure moisture remains below 14% to prevent molding during storage. Your batch is ready for top premium buyers.';
        case 'trader':
          return 'High-grade premium sample. This batch meets Export/Jasmine Grade specifications. Set your pricing at the high end of the regional Ghana commodity index.';
        case 'miller':
          return 'Optimal whole-grain structure. Milling yield is maximized. This batch can go straight to high-value retail packaging without extra color/sorting runs.';
        default:
          return 'Premium grade batch showing high whole grain aspect ratio and minimal chalkiness. Suitable for first-grade distribution.';
      }
    } else if (grade === 'B') {
      switch (role) {
        case 'farmer':
          return 'Moderate quality. Check threshing speeds to reduce broken kernels. Allow additional drying time if moisture is slightly damp.';
        case 'trader':
          return 'Standard Grade batch. Pricing should follow average local market indices. Consider blending with other Grade A batches if you need higher-value stock.';
        case 'miller':
          return 'Average quality batch. Adjust separator cylinders to filter out broken kernels. Run a second sorting pass to upgrade the visual consistency.';
        default:
          return 'Standard Grade batch with moderate broken and chalky percentages. Fits requirements for general domestic consumer packaging.';
      }
    } else {
      switch (role) {
        case 'farmer':
          return 'High broken percentage. High risk of crop devaluation. Review moisture control pre-harvest and lower speed of mechanised thresher to avoid grain shearing.';
        case 'trader':
          return 'Substandard/Low Grade. Pricing must reflect significant discounts. Batch is NOT suitable for premium retail. Defer to local processing or animal feed buyers.';
        case 'miller':
          return 'Substandard feed. Requires aggressive sorting and separation of brokens. Grains are highly chalky and prone to breaking further during polishing.';
        default:
          return 'Substandard quality. Grains do not meet standard commercial retail quality thresholds. Best used for specialty processing or animal feed.';
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Premium':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Premium Grade A</span>;
      case 'Standard':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">Standard Grade B</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">Substandard Grade C</span>;
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
          <span className="text-sm font-bold text-slate-800">Scan Results</span>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">{scan.timestamp}</span>
      </div>

      {/* Main Results Scrollable Area */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        
        {/* Bounding Box Image Canvas */}
        <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
          
          {/* Edge AI Legend */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[8px] font-bold text-white select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Whole ({scan.grainCount - scan.brokenCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Broken ({scan.brokenCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Chalky ({scan.chalkyCount})</span>
            </div>
          </div>
        </div>

        {/* Grade summary header */}
        <div className="flex justify-between items-center bg-white p-4 border border-slate-200/80 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Classification</span>
            <h3 className="text-sm font-extrabold text-slate-950 leading-tight">{scan.sampleName}</h3>
          </div>
          {getStatusBadge(scan.status)}
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Scientific Indicators</h4>
          
          <div className="flex flex-col gap-2.5">
            {/* Row 1: Broken grains */}
            <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
              <span className="text-slate-500">Broken Grains</span>
              <div className="text-right">
                <span className="font-extrabold text-slate-900">{scan.brokenPercentage}%</span>
                <span className="text-[10px] text-slate-400 block">{scan.brokenCount} of {scan.grainCount} grains</span>
              </div>
            </div>

            {/* Row 2: Chalky grains */}
            <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
              <span className="text-slate-500">Chalkiness</span>
              <div className="text-right">
                <span className="font-extrabold text-slate-900">{scan.chalkyPercentage}%</span>
                <span className="text-[10px] text-slate-400 block">{scan.chalkyCount} grains affected</span>
              </div>
            </div>

            {/* Row 3: Grain Count */}
            <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100">
              <span className="text-slate-500">Total Count</span>
              <span className="font-extrabold text-slate-900">{scan.grainCount} grains</span>
            </div>

            {/* Row 4: Dimensions */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Avg Dimensions</span>
              <div className="text-right">
                <span className="font-extrabold text-slate-900">{scan.avgLength} x {scan.avgWidth} mm</span>
                <span className="text-[10px] text-slate-400 block">L/W Aspect Ratio: {scan.avgAspectRatio}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable recommendations card */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex gap-3 items-start">
          <ClipboardCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-950">Advice for {profile.role[0].toUpperCase() + profile.role.slice(1)}</h4>
            <p className="text-[10px] text-emerald-800/90 leading-relaxed mt-1">
              {getRoleAdvice(profile.role, scan.grade)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex gap-3 shrink-0">
        <button 
          onClick={onHome}
          className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <button 
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Scan Again</span>
        </button>
      </div>
    </div>
  );
};
