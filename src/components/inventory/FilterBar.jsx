import React from 'react';

export function FilterBar({ filters, setFilters }) {
  const handleStatusChange = (e) => {
    setFilters({ ...filters, status: e.target.value });
  };

  const handleMonthChange = (e) => {
    setFilters({ ...filters, month: e.target.value });
  };

  const handlePublicadoChange = (e) => {
    setFilters({ ...filters, publicado: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ status: 'todos', month: '', publicado: 'todos' });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
      {/* Filtro por estado */}
      <div className="flex items-center gap-2">
        <label htmlFor="statusFilter" className="text-white/80 text-sm font-medium">
          Estado:
        </label>
        <select
          id="statusFilter"
          value={filters.status || 'todos'}
          onChange={handleStatusChange}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="disponible">Disponibles</option>
          <option value="no_disponible">No disponibles</option>
          <option value="vendido">Vendidos</option>
        </select>
      </div>

      {/* Filtro por mes (solo visible cuando estado = vendido) */}
      {filters.status === 'vendido' && (
        <div className="flex items-center gap-2">
          <label htmlFor="monthFilter" className="text-white/80 text-sm font-medium">
            Mes:
          </label>
          <input
            id="monthFilter"
            type="month"
            value={filters.month || ''}
            onChange={handleMonthChange}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      )}

      {/* NUEVO FILTRO: Publicado en Marketplace */}
      <div className="flex items-center gap-2">
        <label htmlFor="publicadoFilter" className="text-white/80 text-sm font-medium">
          Publicado:
        </label>
        <select
          id="publicadoFilter"
          value={filters.publicado || 'todos'}
          onChange={handlePublicadoChange}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="si">Publicados</option>
          <option value="no">No publicados</option>
        </select>
      </div>

      {/* Botón limpiar filtros */}
      <button
        onClick={clearFilters}
        className="px-4 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
      >
        Limpiar filtros
      </button>
    </div>
  );
}