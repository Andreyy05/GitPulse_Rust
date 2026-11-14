import React, { useState, useRef, useEffect } from 'react';
import { Flame, Copy, Check, Dices, Pencil, RotateCcw } from 'lucide-react';
import { getRandomCommit, CATEGORIES } from '../services/commitFuel';

export function CommitFuel() {
  const [category, setCategory] = useState('all');
  const [generatedMessage, setGeneratedMessage] = useState(() => getRandomCommit('all'));
  const [editedMessage, setEditedMessage] = useState(() => getRandomCommit('all'));
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const textareaRef = useRef(null);

  // Keep editedMessage in sync whenever a new message is generated (unless user is actively editing)
  useEffect(() => {
    if (!isEditing) {
      setEditedMessage(generatedMessage);
    }
  }, [generatedMessage, isEditing]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editedMessage]);

  const handleRoll = () => {
    setIsRolling(true);
    setIsEditing(false);
    setTimeout(() => {
      const next = getRandomCommit(category);
      setGeneratedMessage(next);
      setEditedMessage(next);
      setIsRolling(false);
    }, 150);
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setIsEditing(false);
    const next = getRandomCommit(newCat);
    setGeneratedMessage(next);
    setEditedMessage(next);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleEditChange = (e) => {
    setIsEditing(true);
    setEditedMessage(e.target.value);
  };

  const handleResetEdit = () => {
    setIsEditing(false);
    setEditedMessage(generatedMessage);
  };

  const isModified = isEditing && editedMessage !== generatedMessage;

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm shadow-zinc-950/5 dark:shadow-none flex flex-col space-y-3 sm:space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm md:text-base font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
          <Flame size={13} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Commit Fuel</span>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-zinc-200/70 dark:bg-white/[0.04] p-1 rounded-lg sm:rounded-xl border border-zinc-200/60 dark:border-white/[0.06] overflow-x-auto max-w-[220px] sm:max-w-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm tracking-tight transition-all whitespace-nowrap flex-shrink-0 ${
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

      {/* Editable Message Box */}
      <div
        className={`relative group bg-zinc-50 dark:bg-black/20 border rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 transition-all ${
          isModified
            ? 'border-indigo-400/60 dark:border-indigo-500/40 ring-1 ring-indigo-400/30 dark:ring-indigo-500/20'
            : 'border-zinc-200/90 dark:border-white/[0.06]'
        }`}
      >
        <div className="flex items-start gap-2">
          {/* Textarea — directly editable */}
          <textarea
            ref={textareaRef}
            value={editedMessage}
            onChange={handleEditChange}
            rows={1}
            spellCheck={false}
            className={`flex-1 font-mono text-xs sm:text-sm md:text-base text-zinc-800 dark:text-zinc-200 select-text leading-relaxed bg-transparent border-none outline-none resize-none overflow-hidden transition-opacity placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ${
              isRolling ? 'opacity-30' : 'opacity-100'
            }`}
            placeholder="Your commit message…"
          />

          {/* Action buttons */}
          <div className="flex flex-col items-center space-y-1 shrink-0 mt-0.5">
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
              {copied
                ? <Check size={13} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                : <Copy size={13} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] sm:text-xs md:text-sm text-zinc-500 dark:text-zinc-400 px-0.5 tracking-tight min-h-[18px]">
        <div className="flex items-center space-x-2">
          <Pencil size={10} className="text-zinc-400 dark:text-zinc-500" />
          <span className={isModified ? 'text-indigo-600 dark:text-indigo-400 font-medium' : ''}>
            {isModified ? 'Edited — click copy to use' : 'Click to edit, roll to regenerate'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isModified && (
            <button
              onClick={handleResetEdit}
              title="Undo edits"
              className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
          {copied && (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Copied!</span>
          )}
        </div>
      </div>
    </div>
  );
}
