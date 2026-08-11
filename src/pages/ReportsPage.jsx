import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { KPICard } from '../components/reports/KPICard';
import { ReportFilters } from '../components/reports/ReportFilters';
import { OverviewCharts } from '../components/reports/OverviewCharts';
import { SalesCharts } from '../components/reports/SalesCharts';
import { SalesTable } from '../components/reports/SalesTable';
import { exportToCSV } from '../services/reportService';

export function ReportsPage() {
  const { overviewData, salesData, loading, error, filters, updateFilters } = useReports();
  const [activeTab, setActiveTab] = useState('overview');

  const handleExportOverview = () => {
    if (!overviewData) return;
    const csvData = [
      ...overviewData.charts.availableBrands.map(b => ({ Marca: b.name, Cantidad: b.value })),
      ...overviewData.charts.soldBrands.map(b => ({ Marca: b.name, Cantidad: b.value })),
    ];
    exportToCSV(csvData, 'informe_completo');
  };

  const handleExportSales = () => {
    if (!salesData) return;
    const csvData = salesData.sales.map(s => ({
      Marca: s.brand,
      Modelo: s.model,
      Año: s.year,
      Precio: s.price,
      Vendedor: s.sold_by,
      Fecha: new Date(s.sale_date).toLocaleDateString('es-ES'),
    }));
    exportToCSV(csvData, 'informe_ventas');
  };

  if (loading) {
    return <div className="text-white/60 text-center py-12">Cargando datos...</div>;
  }

  if (error) {
    return <div className="text-red-300 text-center py-12">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Dashboard</h1>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          Informe completo
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          Informe de ventas
        </button>
      </div>

      <ReportFilters
        filters={filters}
        onFilterChange={updateFilters}
        showSeller={activeTab === 'sales'}
      />

      {activeTab === 'overview' && overviewData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Vehículos Disponibles" value={overviewData.kpis.inventoryCount} color="blue" />
            <KPICard title="Vehículos Vendidos" value={overviewData.kpis.soldCount} color="green" />
            <KPICard title="Ingresos estimados" value={overviewData.kpis.totalRevenue} prefix="$" color="yellow" />
            <KPICard title="Tiempo máximo en patio" value={overviewData.kpis.maxDays} suffix=" días" color="red" />
            <KPICard title="Tiempo mínimo en patio" value={overviewData.kpis.minDays} suffix=" días" color="purple" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExportOverview}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
            >
              Exportar CSV
            </button>
          </div>

          <OverviewCharts data={overviewData.charts} />
        </>
      )}

      {activeTab === 'sales' && salesData && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Ventas totales" value={salesData.kpis.soldCount} color="blue" />
            <KPICard title="Ingresos" value={salesData.kpis.totalRevenue} prefix="$" color="green" />
            <KPICard title="Precio promedio" value={salesData.kpis.avgPrice} prefix="$" color="yellow" />
            <KPICard title="Comisión estimada" value={salesData.kpis.estimatedCommission} prefix="$" color="red" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExportSales}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
            >
              Exportar CSV
            </button>
          </div>

          <SalesCharts data={salesData} />
          <SalesTable data={salesData.sales} />
        </>
      )}
    </div>
  );
}