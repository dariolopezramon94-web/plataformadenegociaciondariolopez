import React, { useState, useRef } from 'react';
import { useReports } from '../hooks/useReports';
import { KPICard } from '../components/reports/KPICard';
import { ReportFilters } from '../components/reports/ReportFilters';
import { OverviewCharts } from '../components/reports/OverviewCharts';
import { SalesCharts } from '../components/reports/SalesCharts';
import { SalesTable } from '../components/reports/SalesTable';
import { exportToCSV } from '../services/reportService';
import ExportPDFButton from '../components/reports/ExportPDFButton';

export function ReportsPage() {
  const { overviewData, salesData, loading, error, filters, updateFilters } = useReports();
  const [activeTab, setActiveTab] = useState('overview');
  const salesReportRef = useRef(null);

  // Función para obtener el texto del período
  const getPeriodText = () => {
    const { month, year } = filters;
    if (month === 'todos' && year === 'todos') return 'Todos los períodos';
    if (month !== 'todos' && year !== 'todos') {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthName = monthNames[parseInt(month) - 1];
      return `${monthName} ${year}`;
    }
    if (year !== 'todos') return `Año ${year}`;
    return 'Período seleccionado';
  };

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
            <KPICard title="Tiempo promedio en patio" value={overviewData.kpis.avgDays} suffix=" días" color="indigo" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExportOverview}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
            >
              Exportar CSV
            </button>
          </div>

          <OverviewCharts data={overviewData} />
        </>
      )}

      {activeTab === 'sales' && salesData && (
        <>
          {/* Botones de exportación */}
          <div className="flex justify-end gap-3">
            <ExportPDFButton filters={filters} containerRef={salesReportRef} />
            <button
              onClick={handleExportSales}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition"
            >
              Exportar CSV
            </button>
          </div>

          {/* Contenido del informe de ventas (para PDF) */}
          <div ref={salesReportRef} className="bg-white p-6 rounded-xl" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            {/* Encabezado del reporte */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#000000' }}>Reporte de ventas</h2>
              <p className="text-lg" style={{ color: '#333333' }}>Darío López</p>
              <p className="text-md" style={{ color: '#555555' }}>Período: {getPeriodText()}</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Ventas totales</p>
                <p className="text-2xl font-bold">{salesData.kpis.soldCount}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Ingresos estimados</p>
                <p className="text-2xl font-bold">${salesData.kpis.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Comisión estimada</p>
                <p className="text-2xl font-bold">${salesData.kpis.estimatedCommission.toLocaleString()}</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="mb-6">
              <SalesCharts data={salesData} isPdf={true} />
            </div>

            {/* Tabla */}
            <div>
              <SalesTable data={salesData.sales} isPdf={true} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}