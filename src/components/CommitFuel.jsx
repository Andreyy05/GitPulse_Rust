import React, { useState } from 'react';
import { Flame, Copy, Check, Dices } from 'lucide-react';
import { getRandomCommit } from '../services/commitFuel';

export function CommitFuel() {
  const [category, setCategory] = useState('all');
  const [currentMessage, setCurrentMessage] = useState(() => getRandomCommit('all'));
  const [copied, setCopied] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    setIsRolling(true);
    setTimeout(() => {
      setCurrentMessage(getRandomCommit(category));
      setIsRolling(false);
    }, 150);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setCurrentMessage(getRandomCommit(newCat));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm shadow-zinc-950/5 dark:shadow-none flex flex-col space-y-3 sm:space-y-4 transition-colors">
      {/* Header with Title and Mode Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm md:text-base font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
          <Flame size={13} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Commit Fuel</span>
        </div>

        {/* Category Pills: Apple-style Segmented Track */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-zinc-200/70 dark:bg-white/[0.04] p-1 rounded-lg sm:rounded-xl border border-zinc-200/60 dark:border-white/[0.06]">
          {[
            { id: 'all', label: 'Mix' },
            { id: 'conventional', label: 'Clean' },
            { id: 'witty', label: 'Witty' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs md:text-sm tracking-tight transition-all ${
                category === cat.id
                  ? 'bg-white text-zinc-900 shadow-xs font-medium dark:bg-white/10 dark:text-white dark:shadow-none'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generated Message Box */}
      <div className="relative group bg-zinc-50 dark:bg-black/20 border border-zinc-200/90 dark:border-white/[0.06] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 min-h-[54px] sm:min-h-[64px] md:min-h-[76px] flex items-center justify-between transition-all">
        <span
          className={`font-mono text-xs sm:text-sm md:text-base text-zinc-800 dark:text-zinc-200 select-text leading-relaxed pr-2 transition-opacity ${
            isRolling ? 'opacity-30' : 'opacity-100'
          }`}
        >
          {currentMessage}
        </span>

        {/* Action Buttons in Message Box */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          <button
            onClick={handleRoll}
            disabled={isRolling}
            title="Generate new message"
            className="p-1.5 sm:p-2 rounded-md sm:rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Dices size={13} className={`sm:w-4 sm:h-4 md:w-5 md:h-5 ${isRolling ? 'animate-spin text-zinc-500 dark:text-zinc-300' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-colors ${
              copied
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06]'
            }`}
          >
            {copied ? <Check size={13} className="sm:w-4 sm:h-4 md:w-5 md:h-5" /> : <Copy size={13} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />}
          </button>
        </div>
      </div>

      {/* Footer feedback hint */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm text-zinc-500 dark:text-zinc-400 px-0.5 tracking-tight">
        <span>Click copy to use in git commit</span>
        {copied && <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied to clipboard</span>}
      </div>
    </div>
  );
}

