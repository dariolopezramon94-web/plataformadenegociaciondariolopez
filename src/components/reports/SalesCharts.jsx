import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';

const CHART_COLORS = ['#60A5FA', '#F472B6'];

export function SalesCharts({ data }) {
  if (!data) return <div className="text-white/60 text-center py-8">Cargando gráficos de ventas...</div>;

  const { sellerStats, revenueTimeline, topBrands } = data.charts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Ventas por vendedor</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sellerStats}>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill={CHART_COLORS[0]} name="Cantidad" />
            <Bar dataKey="revenue" fill={CHART_COLORS[1]} name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Ingresos mensuales</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={revenueTimeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={2} name="Ingresos" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:col-span-2">
        <h3 className="text-white/70 text-sm font-medium mb-3">Marcas más vendidas (por ingresos)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={topBrands} layout="vertical">
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#60A5FA" name="Ingresos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}