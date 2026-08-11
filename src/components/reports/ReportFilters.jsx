import React from 'react';

export function ReportFilters({ filters, onFilterChange, showSeller = true }) {
  const currentYear = new Date().getFullYear();
  const years = ['todos', ...Array.from({ length: 5 }, (_, i) => currentYear - i)];
  const months = ['todos', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
      {showSeller && (
        <div className="flex items-center gap-2">
          <label htmlFor="sellerFilter" className="text-white/80 text-sm font-medium">
            Vendedor:
          </label>
          <select
            id="sellerFilter"
            name="seller"
            value={filters.seller || 'todos'}
            onChange={handleChange}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="todos">Todos</option>
            <option value="Dario">Dario</option>
            <option value="vendedor_patio">Vendedor de patio</option>
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="monthFilter" className="text-white/80 text-sm font-medium">
          Mes:
        </label>
        <select
          id="monthFilter"
          name="month"
          value={filters.month || 'todos'}
          onChange={handleChange}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {months.map(m => (
            <option key={m} value={m}>{m === 'todos' ? 'Todos' : m}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="yearFilter" className="text-white/80 text-sm font-medium">
          Año:
        </label>
        <select
          id="yearFilter"
          name="year"
          value={filters.year || 'todos'}
          onChange={handleChange}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          {years.map(y => (
            <option key={y} value={y}>{y === 'todos' ? 'Todos' : y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}