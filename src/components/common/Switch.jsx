import React from 'react';

export function Switch({ value, onChange, labelTrue = 'Sí', labelFalse = 'No' }) {
  const toggle = () => onChange(!value);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative w-16 h-9 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 ${
        value ? 'bg-green-500/60 border-green-400' : 'bg-white/10 border-white/20'
      } border`}
    >
      <span
        className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
          value ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
      <span className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium text-white/80">
        <span className={`${value ? 'opacity-0' : 'opacity-100'}`}>{labelFalse}</span>
        <span className={`${value ? 'opacity-100' : 'opacity-0'}`}>{labelTrue}</span>
      </span>
    </button>
  );
}