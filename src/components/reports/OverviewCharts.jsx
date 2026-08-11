import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = ['#34D399', '#FBBF24', '#F87171', '#60A5FA', '#A78BFA', '#F472B6'];

// Formateador para mostrar solo números enteros en los ejes
const integerTickFormatter = (tick) => {
  if (Number.isInteger(tick)) {
    return tick.toString();
  }
  return '';
};

// Formateador para mostrar el rango completo con "k" (ej. "0 a 5k", "5k a 10k")
const priceRangeFormatter = (label) => {
  if (!label) return '';
  // Si el label contiene '+', lo manejamos mostrando "100k+" u otro formato
  if (label.includes('+')) {
    const parts = label.split('+');
    const max = parseInt(parts[0].split('-')[1]);
    if (!isNaN(max) && max >= 1000) {
      return `${max/1000}k+`;
    }
    return label;
  }
  const parts = label.split('-');
  if (parts.length === 2) {
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    if (!isNaN(min) && !isNaN(max)) {
      if (max >= 1000) {
        return `${min} a ${max/1000}k`;
      }
      return `${min} a ${max}`;
    }
    return label;
  }
  return label;
};

export function OverviewCharts({ data }) {
  if (!data) return <div className="text-white/60 text-center py-8">Cargando gráficos...</div>;

  const { soldBrands, topModels, priceHistogram, fuel, transmission } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* 1. Modelos más vendidos */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Modelos más vendidos</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart layout="vertical" data={topModels}>
            <XAxis
              type="number"
              tickFormatter={integerTickFormatter}
              domain={[0, 'dataMax + 1']}
            />
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

      {/* 2. Marcas más vendidas */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Marcas más vendidas</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart layout="vertical" data={soldBrands}>
            <XAxis
              type="number"
              tickFormatter={integerTickFormatter}
              domain={[0, 'dataMax + 1']}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#F472B6" barSize={20} name="Vehículos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Distribución de precios (con formato de rango y "k") */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Distribución de precios</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={priceHistogram}>
            <XAxis
              dataKey="range"
              tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
              tickFormatter={priceRangeFormatter}
            />
            <YAxis
              tickFormatter={integerTickFormatter}
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip
              formatter={(value, name, props) => {
                const range = props.payload.range || '';
                // Mostrar rango con símbolo $ en el tooltip
                if (range.includes('+')) {
                  const parts = range.split('+');
                  const max = parts[0].split('-')[1];
                  return [`${value} vehículos`, `Precio mayor a $${max}`];
                }
                const parts = range.split('-');
                if (parts.length === 2) {
                  return [`${value} vehículos`, `$${parts[0]} - $${parts[1]}`];
                }
                return [`${value} vehículos`, range];
              }}
            />
            <Bar dataKey="count" fill="#A78BFA" name="Vehículos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Transmisiones disponibles */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-white/70 text-sm font-medium mb-3">Transmisiones disponibles</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={transmission}>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
            <YAxis
              tickFormatter={integerTickFormatter}
              domain={[0, 'dataMax + 1']}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#F472B6" barSize={20} name="Vehículos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 5. Tipo de combustible (donut) */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 md:col-span-2">
        <h3 className="text-white/70 text-sm font-medium mb-3">Tipo de combustible</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={fuel}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {fuel.map((_, index) => (
                <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}