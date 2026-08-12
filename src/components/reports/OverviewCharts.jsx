import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';

// Formateador para ticks enteros (sin decimales)
const integerTickFormatter = (tick) => {
  if (Number.isInteger(tick)) {
    return tick.toString();
  }
  return '';
};

// Formateador de fechas para el eje X de la línea de tiempo
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function OverviewCharts({ data }) {
  if (!data) return <div className="text-white/60 text-center py-8">Cargando gráficos...</div>;

  // Extraer semáforos y charts del objeto data
  const { semaforos, charts } = data;
  const {
    salesTimeline,
    avgDaysByBrand,
    avgDaysByType,
    topSoldBrandsFiltered,
    topSoldTypes,
    // Gráficos existentes que se mantienen
    topModels,
    availableBrands,
  } = charts || {};

  // Estados para toggles
  const [timeView, setTimeView] = useState('brand'); // 'brand' o 'type'
  const [soldView, setSoldView] = useState('brand'); // 'brand' o 'type'

  // Datos según toggle de tiempo en inventario
  const timeData = timeView === 'brand' ? avgDaysByBrand : avgDaysByType;
  const timeLabel = timeView === 'brand' ? 'Marca' : 'Tipo';

  // Datos según toggle de más vendidos
  const soldData = soldView === 'brand' ? topSoldBrandsFiltered : topSoldTypes;
  const soldLabel = soldView === 'brand' ? 'Marca' : 'Tipo';

  // Función para calcular porcentaje y color del semáforo
  const getSemaforo = (item) => {
    if (!item) return { pct: 0, color: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
    const { count, total } = item;
    const pct = total > 0 ? (count / total) * 100 : 0;
    let color = 'bg-red-500/20 text-red-300 border-red-500/30';
    if (pct >= 80) color = 'bg-green-500/20 text-green-300 border-green-500/30';
    else if (pct >= 50) color = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return { pct, color };
  };

  // Etiquetas para los semáforos
  const semaforoLabels = {
    publicado: 'Publicado en Marketplace',
    informacion: 'Información completa',
    fotografiado: 'Fotografiado',
  };

  return (
    <div className="space-y-6 mt-6">
      {/* ===== SEMÁFOROS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {semaforos && (
          <>
            {['publicado', 'informacion', 'fotografiado'].map((key) => {
              const item = semaforos[key];
              if (!item) return null;
              const { pct, color } = getSemaforo(item);
              return (
                <div key={key} className={`bg-white/5 backdrop-blur-sm rounded-xl border p-4 ${color}`}>
                  <div className="text-sm font-medium">{semaforoLabels[key]}</div>
                  <div className="text-2xl font-bold">{item.count} / {item.total}</div>
                  <div className="text-sm opacity-80">{pct.toFixed(0)}%</div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ===== NUEVOS GRÁFICOS (2 columnas) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Línea de tiempo de ventas (ocupa 2 columnas) */}
        <div className="md:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Ventas por fecha</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesTimeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Tiempo en inventario (con toggle) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white/70 text-sm font-medium">Tiempo en inventario (promedio días)</h3>
            <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setTimeView('brand')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  timeView === 'brand' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Marca
              </button>
              <button
                onClick={() => setTimeView('type')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  timeView === 'type' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Tipo
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={timeData || []}>
              <XAxis type="number" tickFormatter={integerTickFormatter} domain={[0, 'dataMax + 1']} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="avg" fill="#F59E0B" barSize={20} name="Días promedio" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Marcas/Tipos más vendidos (con toggle) */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white/70 text-sm font-medium">Más vendidos por {soldLabel}</h3>
            <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setSoldView('brand')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  soldView === 'brand' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Marca
              </button>
              <button
                onClick={() => setSoldView('type')}
                className={`px-2 py-0.5 text-xs rounded transition ${
                  soldView === 'type' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Tipo
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={soldData || []}>
              <XAxis type="number" tickFormatter={integerTickFormatter} domain={[0, 'dataMax + 1']} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#34D399" barSize={20} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== GRÁFICOS EXISTENTES (se mantienen: modelos más vendidos y disponibles por marca) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modelos más vendidos */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Modelos más vendidos</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={topModels || []}>
              <XAxis type="number" tickFormatter={integerTickFormatter} domain={[0, 'dataMax + 1']} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#A78BFA" barSize={20} name="Vehículos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Carros disponibles por marca */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white/70 text-sm font-medium mb-3">Carros disponibles por marca</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={availableBrands || []}>
              <XAxis type="number" tickFormatter={integerTickFormatter} domain={[0, 'dataMax + 1']} />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="value" fill="#60A5FA" barSize={20} name="Disponibles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}