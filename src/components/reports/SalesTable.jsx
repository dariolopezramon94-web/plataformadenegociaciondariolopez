import React, { useState } from 'react';

export function SalesTable({ data, isPdf = false }) {
  const [sortConfig, setSortConfig] = useState({ key: 'sale_date', direction: 'desc' });
  const [filterText, setFilterText] = useState('');

  if (!data || data.length === 0) {
    return (
      <div style={{ color: isPdf ? '#555' : 'rgba(255,255,255,0.6)' }} className="text-center py-8">
        No hay ventas en el período seleccionado.
      </div>
    );
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

  // Estilos condicionales para PDF
  const containerStyle = isPdf
    ? { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', overflowX: 'auto' }
    : { backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', overflowX: 'auto' };

  const titleStyle = isPdf
    ? { color: '#333', fontSize: '0.875rem', fontWeight: '500' }
    : { color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: '500' };

  const inputStyle = isPdf
    ? { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', color: '#333', backgroundColor: '#fff' }
    : { padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#fff', fontSize: '0.875rem' };

  const tableTextStyle = isPdf ? 'text-gray-700' : 'text-white/70';
  const hoverTextStyle = isPdf ? 'hover:text-gray-900' : 'hover:text-white';
  const borderStyle = isPdf ? 'border-gray-200' : 'border-white/10';
  const rowHoverStyle = isPdf ? 'hover:bg-gray-100' : 'hover:bg-white/5';
  const emptyMsgStyle = isPdf ? 'text-gray-400' : 'text-white/40';

  return (
    <div style={containerStyle}>
      <div className="mb-4 flex justify-between items-center">
        <h3 style={titleStyle}>Detalle de transacciones</h3>
        <input
          type="text"
          placeholder="Filtrar..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={inputStyle}
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${borderStyle}`}>
            {headers.map(h => (
              <th
                key={h}
                className={`text-left py-2 px-3 cursor-pointer ${tableTextStyle} ${hoverTextStyle} transition-colors`}
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
            <tr key={idx} className={`border-b ${borderStyle} ${rowHoverStyle} transition-colors`}>
              <td className={`py-2 px-3 ${tableTextStyle}`}>{row.brand}</td>
              <td className={`py-2 px-3 ${tableTextStyle}`}>{row.model}</td>
              <td className={`py-2 px-3 ${tableTextStyle}`}>{row.year}</td>
              <td className={`py-2 px-3 ${tableTextStyle}`}>${row.price.toLocaleString('es-ES')}</td>
              <td className={`py-2 px-3 ${tableTextStyle}`}>{row.sold_by}</td>
              <td className={`py-2 px-3 ${tableTextStyle}`}>{new Date(row.sale_date).toLocaleDateString('es-ES')}</td>
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={6} className={`text-center py-4 ${emptyMsgStyle}`}>No hay resultados para el filtro.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}