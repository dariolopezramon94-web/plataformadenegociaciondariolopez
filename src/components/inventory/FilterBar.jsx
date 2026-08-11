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

  const handleInformacionChange = (e) => {
    setFilters({ ...filters, informacion: e.target.value });
  };

  const handleFotografiadoChange = (e) => {
    setFilters({ ...filters, fotografiado: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      status: 'todos',
      month: '',
      publicado: 'todos',
      informacion: 'todos',
      fotografiado: 'todos',
    });
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label htmlFor="statusFilter" className="text-white/80 text-sm font-medium">
          Estado:
        </label>
        <select
          id="statusFilter"
          value={filters.status || 'todos'}
          onChange={handleStatusChange}
          className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="disponible">Disponibles</option>
          <option value="no_disponible">No disponibles</option>
          <option value="vendido">Vendidos</option>
        </select>
      </div>

      {filters.status === 'vendido' && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <label htmlFor="monthFilter" className="text-white/80 text-sm font-medium">
            Mes:
          </label>
          <input
            id="monthFilter"
            type="month"
            value={filters.month || ''}
            onChange={handleMonthChange}
            className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label htmlFor="publicadoFilter" className="text-white/80 text-sm font-medium">
          Publicado:
        </label>
        <select
          id="publicadoFilter"
          value={filters.publicado || 'todos'}
          onChange={handlePublicadoChange}
          className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="si">Publicados</option>
          <option value="no">No publicados</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label htmlFor="informacionFilter" className="text-white/80 text-sm font-medium">
          Información:
        </label>
        <select
          id="informacionFilter"
          value={filters.informacion || 'todos'}
          onChange={handleInformacionChange}
          className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="completa">Completa</option>
          <option value="incompleta">Incompleta</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <label htmlFor="fotografiadoFilter" className="text-white/80 text-sm font-medium">
          Fotografiado:
        </label>
        <select
          id="fotografiadoFilter"
          value={filters.fotografiado || 'todos'}
          onChange={handleFotografiadoChange}
          className="flex-1 sm:flex-none bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="todos">Todos</option>
          <option value="si">Fotografiado</option>
          <option value="no">No fotografiado</option>
        </select>
      </div>

      <button
        onClick={clearFilters}
        className="w-full sm:w-auto px-4 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
      >
        Limpiar filtros
      </button>
    </div>
  );
}