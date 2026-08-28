'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface HourInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onEnter?: () => void;
  total?: number;
  disabled?: boolean;
  max?: number;
  min?: number;
}

function fmtTotal(h: number): string {
  if (h === 0) return '';
  return `${h.toString()}h`;
}

export default function HourInput({ value, onChange, placeholder, onEnter, total, disabled, max, min }: HourInputProps) {
  const totalLabel = total && total !== 0 ? fmtTotal(total) : '';

  const numVal = parseFloat(value) || 0;

  const handleDecrement = () => {
    if (disabled) return;
    const nextVal = numVal - 0.25;
    if (min !== undefined && nextVal < min) return;
    onChange(nextVal.toString());
  };

  const handleIncrement = () => {
    if (disabled) return;
    const nextVal = numVal + 0.25;
    if (max !== undefined && nextVal > max) return;
    onChange(nextVal.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      if (max !== undefined && parsed > max) return onChange(max.toString());
      if (min !== undefined && parsed < min) return onChange(min.toString());
    }
    onChange(val);
  };

  return (
    <div className="flex items-center gap-0.5">
      <div className={`flex items-center bg-white border border-slate-200 rounded-lg shadow-sm focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-200 transition-all overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled}
          className="flex items-center justify-center w-6 h-[30px] bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border-r border-slate-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={-1}
          title="Decrease time by 15m"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          step="0.25"
          placeholder={totalLabel || placeholder || '0'}
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.(); }}
          className="w-12 bg-transparent px-1 py-1.5 text-center text-[11px] font-medium text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && numVal >= max)}
          className="flex items-center justify-center w-6 h-[30px] bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border-l border-slate-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          tabIndex={-1}
          title="Increase time by 15m"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

