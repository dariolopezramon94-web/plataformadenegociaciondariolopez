import React from 'react';

export function KPICard({ title, value, prefix = '', suffix = '', color = 'blue' }) {
  const colors = {
    blue: 'border-blue-500/30 text-blue-300',
    green: 'border-green-500/30 text-green-300',
    yellow: 'border-yellow-500/30 text-yellow-300',
    red: 'border-red-500/30 text-red-300',
    purple: 'border-purple-500/30 text-purple-300',
    indigo: 'border-indigo-500/30 text-indigo-300',
  };

  // Formatear el valor si es número (para separadores de miles)
  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-ES') : value;

  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-xl border ${colors[color] || colors.blue} p-4`}>
      <div className="text-white/50 text-xs font-medium uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-bold text-white mt-1">
        {prefix && <span className="text-base font-normal text-white/50 mr-1">{prefix}</span>}
        {formattedValue}
        {suffix && <span className="text-base font-normal text-white/50 ml-1">{suffix}</span>}
      </div>
    </div>
  );
}