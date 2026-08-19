import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { DateRange } from '../../types/dashboard';

interface DateRangeSelectorProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
}

const DATE_OPTIONS: DateRange[] = [
  'Today',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This year',
  'Custom range',
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value = 'Last 30 days',
  onChange,
}) => {
  const [selectedRange, setSelectedRange] = useState<DateRange>(value);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (range: DateRange) => {
    setSelectedRange(range);
    if (onChange) onChange(range);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 transition-all text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer focus:outline-none"
        aria-expanded={isOpen}
      >
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-medium">{selectedRange}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-xl shadow-slate-900/10 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="py-1 space-y-0.5">
            {DATE_OPTIONS.map((opt) => {
              const isSelected = opt === selectedRange;
              return (
                <button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  className={`w-full px-3 py-1.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
