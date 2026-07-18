import React, { useState } from 'react';
import { ArrowLeft, Save, Sparkles, KeyRound, User, Database } from 'lucide-react';
import type { CloudflareConfig } from '../utils/cloudflare';

interface SettingsScreenProps {
  config: CloudflareConfig;
  onSaveConfig: (newConfig: CloudflareConfig) => void;
  onResetProfile: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  config,
  onSaveConfig,
  onResetProfile,
  onBack
}) => {
  const [accountId, setAccountId] = useState(config.accountId || '');
  const [apiToken, setApiToken] = useState(config.apiToken || '');
  const [model, setModel] = useState(config.model || '@cf/meta/llama-3.2-11b-vision-instruct');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      accountId: accountId.trim(),
      apiToken: apiToken.trim(),
      model: model.trim()
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearCredentials = () => {
    setAccountId('');
    setApiToken('');
    onSaveConfig({
      accountId: '',
      apiToken: '',
      model: '@cf/meta/llama-3.2-11b-vision-instruct'
    });
  };

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
        <span className="text-sm font-bold text-slate-800">Application Settings</span>
      </div>

      {/* Main Settings Body */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
        
        {/* Cloudflare settings box */}
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">Cloudflare Workers AI</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal mb-1">
            Connect to real open-source models (like Llama 3.2 Vision) running on Cloudflare's serverless GPU network. Leave empty to run in simulated local mode.
          </p>

          {/* Account ID */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" /> Account ID
            </label>
            <input 
              type="text" 
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter Account ID"
              className="form-input py-2 text-xs"
            />
          </div>

          {/* API Token */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400" /> API Token
            </label>
            <input 
              type="password" 
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter Bearer Token"
              className="form-input py-2 text-xs"
            />
          </div>

          {/* Model Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Model Identifier</label>
            <input 
              type="text" 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="@cf/meta/llama-3.2-11b-vision-instruct"
              className="form-input py-2 text-xs"
            />
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={handleClearCredentials}
              className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
            >
              Clear Keys
            </button>
            
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>{isSaved ? 'Saved!' : 'Save Keys'}</span>
            </button>
          </div>
        </form>

        {/* Profile reset section */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-0.5">
            <User className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-900">User Profile</h3>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Resetting your profile will wipe your registration metadata and stored scan history.
          </p>
          <button
            onClick={onResetProfile}
            className="w-full py-2.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 active:bg-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition-all mt-1 cursor-pointer"
          >
            Reset App State & Profile
          </button>
        </div>
      </div>

      {/* Done Button Footer */}
      <div className="pt-4 shrink-0">
        <button 
          onClick={onBack}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center text-xs transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
};
