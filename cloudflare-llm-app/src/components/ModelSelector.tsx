import React from 'react';
import { Cpu, Settings2, Sliders, MessageSquareCode, Globe2, Sparkles } from 'lucide-react';
import type { AIModel } from '../types';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (id: string) => void;
  systemPrompt: string;
  onChangeSystemPrompt: (prompt: string) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
}

export const modelsList: AIModel[] = [
  {
    id: '@cf/meta/llama-3-8b-instruct',
    name: 'Llama 3 8B Instruct',
    description: 'Highly capable, general-purpose conversational LLM by Meta.',
    type: 'Text Generation'
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    description: 'Updated Llama architecture with expanded reasoning capability.',
    type: 'Text Generation'
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.1',
    name: 'Mistral 7B Instruct',
    description: 'Lightweight yet highly efficient open-weight model by Mistral AI.',
    type: 'Code'
  },
  {
    id: '@cf/qwen/qwen1.5-7b-chat',
    name: 'Qwen 1.5 7B Chat',
    description: 'Strong multi-lingual abilities and logical reasoning by Alibaba.',
    type: 'Translation'
  },
  {
    id: '@cf/gemma/gemma-7b-it',
    name: 'Gemma 7B IT',
    description: 'Instruction-tuned open model built by Google research.',
    type: 'Text Generation'
  }
];

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  systemPrompt,
  onChangeSystemPrompt,
  temperature,
  onChangeTemperature
}) => {
  return (
    <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-full overflow-hidden shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
        <h2 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">
          @BryteSikaStrategy AI
        </h2>
      </div>

      {/* Model Selection List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
          Select Active Model
        </span>

        {modelsList.map((model) => {
          const isSelected = selectedModelId === model.id;
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`p-3 border rounded-xl flex flex-col text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center w-full mb-1">
                <span className="text-xs font-bold text-slate-100">{model.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                  model.type === 'Code' 
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20' 
                    : model.type === 'Translation'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                }`}>
                  {model.type}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                {model.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Parameter Configurations */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5" /> Parameters
        </span>

        {/* System Prompt Customizer */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
            <MessageSquareCode className="w-3 h-3 text-slate-500" /> System Prompt
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => onChangeSystemPrompt(e.target.value)}
            placeholder="e.g. You are a helpful assistant who answers in clear bullet points..."
            className="input-field w-full h-20 resize-none py-2 text-[11px] leading-relaxed"
          />
        </div>

        {/* Temperature Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-slate-500" /> Temperature
            </span>
            <span className="font-mono text-blue-400 font-bold">{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={temperature}
            onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[8px] text-slate-500 font-medium">
            <span>Deterministic (0.1)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
