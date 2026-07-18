import React, { useState } from 'react';
import { User, Shield, Briefcase, Building2, ArrowRight } from 'lucide-react';
import type { UserProfile } from '../types';

interface RegisterScreenProps {
  onRegister: (profile: UserProfile) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'farmer' | 'trader' | 'miller' | 'researcher' | 'officer'>('farmer');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!organization.trim()) {
      setError('Please enter your organization or town');
      return;
    }
    
    setError('');
    onRegister({
      name: name.trim(),
      role,
      organization: organization.trim(),
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-slate-50 text-slate-800 animate-fade-in">
      {/* Top Section / Header */}
      <div className="pt-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">
          Create Profile
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Setting up your profile helps customize the quality recommendations for your role.
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 my-6 flex flex-col justify-center gap-4">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Full Name
          </label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bright Sikazwe"
            className="form-input"
          />
        </div>

        {/* Role select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            Your Role
          </label>
          <select 
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="form-select"
          >
            <option value="farmer">Rice Farmer (Production & Harvest)</option>
            <option value="trader">Rice Trader (Buying & Selling)</option>
            <option value="miller">Rice Miller (Processing & Sorting)</option>
            <option value="officer">Extension Officer (Advisory)</option>
            <option value="researcher">Quality Researcher</option>
          </select>
        </div>

        {/* Organization / Town */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Organization or Location
          </label>
          <input 
            type="text" 
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="e.g. Volta Rice Cooperative / Kumasi"
            className="form-input"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
            {error}
          </p>
        )}
      </form>

      {/* Button footer */}
      <div className="pb-4">
        {/* Privacy Note */}
        <div className="flex gap-2 items-start mb-4 bg-slate-100 border border-slate-200/60 rounded-lg p-3">
          <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-normal">
            Your data is stored 100% locally on this device. No personal details are uploaded or transmitted.
          </p>
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer group"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
