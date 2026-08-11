import React, { useState } from 'react';

export function SalesTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'sale_date', direction: 'desc' });
  const [filterText, setFilterText] = useState('');

  if (!data || data.length === 0) {
    return <div className="text-white/60 text-center py-8">No hay ventas en el período seleccionado.</div>;
  }

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredData = sortedData.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const headers = ['Marca', 'Modelo', 'Año', 'Precio', 'Vendedor', 'Fecha'];

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 overflow-x-auto">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-white/70 text-sm font-medium">Detalle de transacciones</h3>
        <input
          type="text"
          placeholder="Filtrar..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <table className="w-full text-sm text-white/70">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map(h => (
              <th
                key={h}
                className="text-left py-2 px-3 cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort(h.toLowerCase())}
              >
                {h}
                {sortConfig.key === h.toLowerCase() && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, idx) => (
            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-2 px-3">{row.brand}</td>
              <td className="py-2 px-3">{row.model}</td>
              <td className="py-2 px-3">{row.year}</td>
              <td className="py-2 px-3">${row.price.toLocaleString('es-ES')}</td>
              <td className="py-2 px-3">{row.sold_by}</td>
              <td className="py-2 px-3">{new Date(row.sale_date).toLocaleDateString('es-ES')}</td>
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-white/40">No hay resultados para el filtro.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}