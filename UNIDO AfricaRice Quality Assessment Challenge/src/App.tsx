import { useState, useEffect } from 'react';
import { MobileShell } from './components/MobileShell';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { HomeScreen } from './components/HomeScreen';
import { GuidanceScreen } from './components/GuidanceScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { AboutScreen } from './components/AboutScreen';
import type { UserProfile, RiceScan } from './types';
import type { CloudflareConfig } from './utils/cloudflare';
import { Sparkles, BookOpen, ShieldCheck, Heart } from 'lucide-react';

function App() {
  const [page, setPage] = useState<string>('welcome');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<RiceScan[]>([]);
  const [cloudflareConfig, setCloudflareConfig] = useState<CloudflareConfig>({
    accountId: '',
    apiToken: '',
    model: '@cf/meta/llama-3.2-11b-vision-instruct',
  });

  // Load state on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('rice_profile');
    const storedHistory = localStorage.getItem('rice_history');
    const storedCF = localStorage.getItem('rice_cloudflare');

    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
      setPage('home');
    }
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    if (storedCF) {
      setCloudflareConfig(JSON.parse(storedCF));
    }
  }, []);

  const handleRegister = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('rice_profile', JSON.stringify(newProfile));
    setPage('home');
  };

  const handleScanComplete = (newScan: RiceScan) => {
    const updatedHistory = [...history, newScan];
    setHistory(updatedHistory);
    localStorage.setItem('rice_history', JSON.stringify(updatedHistory));
    setPage(`results-${newScan.id}`);
  };

  const handleSaveCFConfig = (newCF: CloudflareConfig) => {
    setCloudflareConfig(newCF);
    localStorage.setItem('rice_cloudflare', JSON.stringify(newCF));
  };

  const handleResetProfile = () => {
    setProfile(null);
    setHistory([]);
    setCloudflareConfig({
      accountId: '',
      apiToken: '',
      model: '@cf/meta/llama-3.2-11b-vision-instruct',
    });
    localStorage.removeItem('rice_profile');
    localStorage.removeItem('rice_history');
    localStorage.removeItem('rice_cloudflare');
    setPage('welcome');
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all saved scan logs?')) {
      setHistory([]);
      localStorage.removeItem('rice_history');
    }
  };

  // Routing render
  const renderActiveScreen = () => {
    if (!profile && page !== 'welcome' && page !== 'register') {
      return <WelcomeScreen onNext={() => setPage('register')} />;
    }

    if (page === 'welcome') {
      return <WelcomeScreen onNext={() => setPage(profile ? 'home' : 'register')} />;
    }
    
    if (page === 'register') {
      return <RegisterScreen onRegister={handleRegister} />;
    }

    if (page === 'home') {
      return (
        <HomeScreen 
          profile={profile!} 
          history={history} 
          onNavigate={(target) => setPage(target)} 
        />
      );
    }

    if (page === 'guidance') {
      return (
        <GuidanceScreen 
          onBack={() => setPage('home')} 
          onProceed={() => setPage('capture')} 
        />
      );
    }

    if (page === 'capture') {
      return (
        <CaptureScreen 
          cloudflareConfig={cloudflareConfig}
          onBack={() => setPage('home')}
          onScanComplete={handleScanComplete}
        />
      );
    }

    if (page === 'settings') {
      return (
        <SettingsScreen 
          config={cloudflareConfig}
          onSaveConfig={handleSaveCFConfig}
          onResetProfile={handleResetProfile}
          onBack={() => setPage('home')}
        />
      );
    }

    if (page === 'about') {
      return <AboutScreen onBack={() => setPage('home')} />;
    }

    if (page === 'history') {
      return (
        <HistoryScreen 
          history={history}
          onSelectScan={(scan) => setPage(`results-${scan.id}`)}
          onClearHistory={handleClearHistory}
          onBack={() => setPage('home')}
        />
      );
    }

    if (page.startsWith('results-')) {
      const scanId = page.replace('results-', '');
      const scan = history.find((s) => s.id === scanId);
      if (scan) {
        return (
          <ResultsScreen 
            scan={scan} 
            profile={profile!} 
            onBack={() => setPage('capture')} 
            onHome={() => setPage('home')} 
          />
        );
      }
    }

    return <HomeScreen profile={profile!} history={history} onNavigate={(target) => setPage(target)} />;
  };

  return (
    <div className="app-container">
      
      {/* Desktop Dashboard Explainer Panel */}
      <div className="hidden md:flex flex-col max-w-[420px] text-slate-300 p-6 self-center animate-fade-in gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Zindi App Builder Challenge
          </span>
          <h2 className="text-3xl font-black text-white font-display tracking-tight">
            UNIDO Rice Quality Assessment
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mt-2">
            This interactive simulator demonstrates a field-ready, offline-first mobile application designed to evaluate rice sample grades at purchasing stations in Ghana.
          </p>
        </div>

        {/* Info card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Prototype Features
          </h3>
          <ul className="text-[11px] text-slate-400 flex flex-col gap-2 list-none p-0 m-0">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Interactive Bounding Boxes:</strong> Visualizes AI particle segmentation on custom canvas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span><strong>Role-Tailored Insights:</strong> Dynamic guidelines tailored for farmers, traders, and millers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">✓</span>
              <span><strong>Cloudflare Workers AI:</strong> Run real open-source vision models (Llama 3.2) using your credentials.</span>
            </li>
          </ul>
        </div>

        {/* Settings advice banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex gap-2.5 items-start">
          <ShieldCheck className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-blue-200/90 leading-relaxed">
            <strong>Want live AI classification?</strong> Tap the gear icon in the mobile app header, add your Cloudflare Account ID & API Token, and upload custom images to query the real <code className="bg-blue-900/40 text-blue-200 px-1 py-0.5 rounded text-[9px]">Llama 3.2 Vision</code> model!
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-4">
          <span>Developed with</span> <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> <span>for UNIDO & AfricaRice Challenge.</span>
        </div>
      </div>

      {/* Interactive Mobile Emulator */}
      <MobileShell>
        {renderActiveScreen()}
      </MobileShell>
    </div>
  );
}

export default App;
