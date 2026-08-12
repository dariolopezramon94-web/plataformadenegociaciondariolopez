// src/components/reports/SalesCharts.jsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export function SalesCharts({ data, isPdf = false }) {
  if (!data) return <div className="text-white/60 text-center py-8">Cargando gráficos de ventas...</div>;

  const { topBrandsByCount, topModelsByCount, salesTimelineCount } = data.charts;

  // Colores según modo PDF o normal
  const axisColor = isPdf ? '#333333' : 'rgba(255,255,255,0.6)';
  const gridColor = isPdf ? '#cccccc' : 'rgba(255,255,255,0.1)';
  const labelColor = isPdf ? '#333333' : 'rgba(255,255,255,0.6)';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Ventas mensuales */}
      <div className="md:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: isPdf ? '#333' : 'rgba(255,255,255,0.7)' }}>
          Ventas mensuales
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salesTimelineCount}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: isPdf ? '#fff' : '#333', border: 'none' }} />
            <Bar dataKey="count" fill="#34D399" name="Cantidad de vehículos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Marcas vendidas */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: isPdf ? '#333' : 'rgba(255,255,255,0.7)' }}>
          Marcas de carros vendidos
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topBrandsByCount} layout="vertical">
            <XAxis type="number" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: isPdf ? '#fff' : '#333', border: 'none' }} />
            <Bar dataKey="count" fill="#60A5FA" name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Modelos vendidos */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: isPdf ? '#333' : 'rgba(255,255,255,0.7)' }}>
          Modelos de vehículos vendidos
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topModelsByCount} layout="vertical">
            <XAxis type="number" tick={{ fill: axisColor, fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: isPdf ? '#fff' : '#333', border: 'none' }} />
            <Bar dataKey="count" fill="#F472B6" name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}