// src/services/reportService.js
import { supabase } from './supabaseClient';

// Función helper para formatear números a "k"
function formatPriceRange(price) {
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + 'k';
  }
  return price.toString();
}

// ============================================
// OBTENER DATOS PARA EL INFORME COMPLETO
// ============================================
export async function getOverviewData({ month, year }) {
  // Construir filtro de fecha si month y year no son 'todos'
  let dateFilter = {};
  if (month !== 'todos' && year !== 'todos') {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    dateFilter = { startDate, endDate };
  }

  // ===== 1. KPIs (existentes, sin cambios) =====
  // Total en inventario (disponible + no_disponible)
  const { count: inventoryCount } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'vendido');

  // Obtener ventas del período con información de vehículos
  const { data: salesWithPrice } = await supabase
    .from('sales')
    .select(`
      vehicle_id,
      price_sold,
      sale_date,
      vehicles (price, created_at, status, brand, model, year, type)
    `)
    .gte('sale_date', dateFilter.startDate || '1900-01-01')
    .lte('sale_date', dateFilter.endDate || '2100-12-31');

  // Filtrar solo los que tienen vehicles.status = 'vendido' para evitar inconsistencias
  const validSales = salesWithPrice?.filter(item => item.vehicles?.status === 'vendido') || [];
  const soldCount = validSales.length;

  // Calcular ingresos totales (usando price_sold o vehicles.price)
  const totalRevenue = validSales.reduce((sum, item) => {
    const price = item.price_sold ?? item.vehicles?.price ?? 0;
    return sum + price;
  }, 0);

  // Calcular tiempos en patio (máximo, mínimo, promedio)
  let maxDays = 0;
  let minDays = Infinity;
  let totalDays = 0;
  let validDaysCount = 0;
  validSales.forEach(item => {
    const created = item.vehicles?.created_at;
    if (created) {
      const diff = (new Date(item.sale_date) - new Date(created)) / (1000 * 60 * 60 * 24);
      if (diff > maxDays) maxDays = diff;
      if (diff < minDays) minDays = diff;
      totalDays += diff;
      validDaysCount++;
    }
  });
  if (minDays === Infinity) minDays = 0;
  const avgDays = validDaysCount > 0 ? Math.round(totalDays / validDaysCount) : 0;

  // ===== 2. SEMÁFOROS (NUEVO) =====
  const { data: nonSoldVehicles } = await supabase
    .from('vehicles')
    .select('publicado_marketplace, informacion_completa, fotografiado')
    .neq('status', 'vendido');

  const totalNonSold = nonSoldVehicles?.length || 0;
  const semaforos = {
    publicado: {
      count: nonSoldVehicles?.filter(v => v.publicado_marketplace === true).length || 0,
      total: totalNonSold,
    },
    informacion: {
      count: nonSoldVehicles?.filter(v => v.informacion_completa === true).length || 0,
      total: totalNonSold,
    },
    fotografiado: {
      count: nonSoldVehicles?.filter(v => v.fotografiado === true).length || 0,
      total: totalNonSold,
    },
  };

  // ===== 3. VENTAS POR FECHA (línea de tiempo, agrupación automática) (NUEVO) =====
  function groupSalesByDate(sales, startDate, endDate) {
    // Determinar granularidad: si rango <= 31 días -> día, si <= 90 días -> semana, sino mes
    const diffDays = (endDate && startDate) ? (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) : 365;
    let granularity = 'month';
    if (diffDays <= 31) granularity = 'day';
    else if (diffDays <= 90) granularity = 'week';

    const grouped = {};
    sales.forEach(sale => {
      const date = new Date(sale.sale_date);
      let key;
      if (granularity === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else { // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      grouped[key] = (grouped[key] || 0) + 1;
    });
    // Ordenar por fecha
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }

  const salesTimeline = groupSalesByDate(
    validSales,
    dateFilter.startDate,
    dateFilter.endDate
  );

  // ===== 4. TIEMPO EN INVENTARIO (por marca y tipo) (NUEVO) =====
  const timeByBrand = {};
  const timeByType = {};
  validSales.forEach(sale => {
    const created = sale.vehicles?.created_at;
    if (created) {
      const days = Math.round((new Date(sale.sale_date) - new Date(created)) / (1000 * 60 * 60 * 24));
      const brand = sale.vehicles?.brand || 'Sin marca';
      const type = sale.vehicles?.type || 'Sin tipo';
      if (!timeByBrand[brand]) timeByBrand[brand] = { total: 0, count: 0 };
      if (!timeByType[type]) timeByType[type] = { total: 0, count: 0 };
      timeByBrand[brand].total += days;
      timeByBrand[brand].count += 1;
      timeByType[type].total += days;
      timeByType[type].count += 1;
    }
  });

  const avgDaysByBrand = Object.entries(timeByBrand)
    .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count) }))
    .sort((a, b) => a.avg - b.avg);

  const avgDaysByType = Object.entries(timeByType)
    .map(([name, data]) => ({ name, avg: Math.round(data.total / data.count) }))
    .sort((a, b) => a.avg - b.avg);

  // ===== 5. MARCAS/TIPOS MÁS VENDIDOS (con filtro de fecha) (NUEVO) =====
  const soldBrandsCount = {};
  const soldTypesCount = {};
  validSales.forEach(sale => {
    const brand = sale.vehicles?.brand || 'Sin marca';
    const type = sale.vehicles?.type || 'Sin tipo';
    soldBrandsCount[brand] = (soldBrandsCount[brand] || 0) + 1;
    soldTypesCount[type] = (soldTypesCount[type] || 0) + 1;
  });

  const topSoldBrandsFiltered = Object.entries(soldBrandsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const topSoldTypes = Object.entries(soldTypesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // ===== 6. GRÁFICOS EXISTENTES (sin cambios) =====
  // Marcas disponibles (excluyendo vendidos)
  const { data: availableBrands } = await supabase
    .from('vehicles')
    .select('brand')
    .neq('status', 'vendido');
  const brandAvailable = {};
  availableBrands?.forEach(item => {
    const key = item.brand || 'Sin marca';
    brandAvailable[key] = (brandAvailable[key] || 0) + 1;
  });
  const topAvailableBrands = Object.entries(brandAvailable)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Marcas vendidas (solo vendidos) - consulta global (se mantiene)
  const { data: soldBrands } = await supabase
    .from('vehicles')
    .select('brand')
    .eq('status', 'vendido');
  const brandSold = {};
  soldBrands?.forEach(item => {
    const key = item.brand || 'Sin marca';
    brandSold[key] = (brandSold[key] || 0) + 1;
  });
  const topSoldBrands = Object.entries(brandSold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Modelos más vendidos (usando sales + vehicles)
  let topModels = [];
  if (validSales.length > 0) {
    const vehicleIds = validSales.map(item => item.vehicle_id);
    const { data: models } = await supabase
      .from('vehicles')
      .select('model')
      .in('id', vehicleIds);
    if (models) {
      const modelMap = {};
      models.forEach(v => {
        const key = v.model || 'Sin modelo';
        modelMap[key] = (modelMap[key] || 0) + 1;
      });
      topModels = Object.entries(modelMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));
    }
  }

  // Distribución de precios
  const { data: priceData } = await supabase
    .from('vehicles')
    .select('price')
    .neq('status', 'vendido');
  const prices = priceData?.map(item => item.price).filter(p => p !== null && p > 0) || [];

  const priceRanges = [
    { min: 0, max: 5000, label: '0 a 5k' },
    { min: 5001, max: 10000, label: '5k a 10k' },
    { min: 10001, max: 15000, label: '10k a 15k' },
    { min: 15001, max: 20000, label: '15k a 20k' },
    { min: 20001, max: 30000, label: '20k a 30k' },
    { min: 30001, max: 50000, label: '30k a 50k' },
    { min: 50001, max: 100000, label: '50k a 100k' },
    { min: 100001, max: Infinity, label: '100k+' },
  ];

  const priceHistogram = priceRanges.map(range => ({
    range: range.label,
    fullRange: `$${range.min.toLocaleString()} - ${range.max === Infinity ? 'más' : '$' + range.max.toLocaleString()}`,
    count: prices.filter(p => p > range.min && p <= range.max).length
  }));

  // Colores más frecuentes
  const { data: colorData } = await supabase
    .from('vehicles')
    .select('color')
    .neq('status', 'vendido');
  const colorCount = {};
  colorData?.forEach(item => {
    const key = item.color || 'No especificado';
    colorCount[key] = (colorCount[key] || 0) + 1;
  });
  const topColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // Combustible (se mantiene)
  const { data: fuelData } = await supabase.from('vehicles').select('fuel_type');
  const fuelCount = {};
  fuelData?.forEach(item => {
    const key = item.fuel_type || 'No especificado';
    fuelCount[key] = (fuelCount[key] || 0) + 1;
  });
  const fuelChart = Object.entries(fuelCount).map(([name, value]) => ({ name, value }));

  // Transmisiones (se mantiene)
  const { data: transData } = await supabase.from('vehicles').select('transmission');
  const transCount = {};
  transData?.forEach(item => {
    const key = item.transmission || 'No especificado';
    transCount[key] = (transCount[key] || 0) + 1;
  });
  const transmissionChart = Object.entries(transCount).map(([name, value]) => ({ name, value }));

  // ===== RETORNO (con todas las claves existentes + nuevas) =====
  return {
    kpis: {
      inventoryCount,
      soldCount,
      totalRevenue,
      maxDays: Math.round(maxDays),
      minDays: Math.round(minDays),
      avgDays,
    },
    semaforos,
    charts: {
      availableBrands: topAvailableBrands,
      soldBrands: topSoldBrands,
      topModels,
      priceHistogram,
      fuel: fuelChart,
      transmission: transmissionChart,
      topColors,
      salesTimeline,
      avgDaysByBrand,
      avgDaysByType,
      topSoldBrandsFiltered,
      topSoldTypes,
    },
  };
}

// ============================================
// OBTENER DATOS PARA EL INFORME DE VENTAS (MODIFICADO)
// ============================================
export async function getSalesData({ seller, month, year }) {
  let dateFilter = {};
  if (month !== 'todos' && year !== 'todos') {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    dateFilter = { startDate, endDate };
  }

  // ===== OBTENER COMISIÓN POR VEHÍCULO DESDE app_config =====
  const { data: config } = await supabase
    .from('app_config')
    .select('commission_per_vehicle')
    .eq('id', 1)
    .single();

  const commissionPerVehicle = config?.commission_per_vehicle ?? 80;

  // ===== VENTAS =====
  let query = supabase
    .from('sales')
    .select(`
      vehicle_id,
      sold_by,
      sale_date,
      price_sold,
      vehicles (brand, model, year, price, status, type)
    `)
    .gte('sale_date', dateFilter.startDate || '1900-01-01')
    .lte('sale_date', dateFilter.endDate || '2100-12-31');

  if (seller && seller !== 'todos') {
    query = query.eq('sold_by', seller);
  }

  const { data, error } = await query;
  if (error) throw error;

  const validSales = data.filter(item => item.vehicles?.status === 'vendido');

  const salesData = validSales.map(item => ({
    brand: item.vehicles?.brand || '',
    model: item.vehicles?.model || '',
    year: item.vehicles?.year || '',
    price: item.price_sold || item.vehicles?.price || 0,
    sold_by: item.sold_by || '',
    sale_date: item.sale_date,
    vehicle_id: item.vehicle_id,
  }));

  // ===== KPIs =====
  const soldCount = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.price, 0);
  const estimatedCommission = soldCount * commissionPerVehicle;

  // ===== VENTAS POR VENDEDOR =====
  const darioSales = salesData.filter(s => s.sold_by === 'Dario');
  const patioSales = salesData.filter(s => s.sold_by === 'vendedor_patio');
  const sellerStats = [
    { name: 'Dario', count: darioSales.length, revenue: darioSales.reduce((sum, s) => sum + s.price, 0) },
    { name: 'Vendedor de patio', count: patioSales.length, revenue: patioSales.reduce((sum, s) => sum + s.price, 0) },
  ];

  // ===== INGRESOS MENSUALES =====
  const revenueByMonth = {};
  salesData.forEach(s => {
    const date = new Date(s.sale_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + s.price;
  });
  const revenueTimeline = Object.entries(revenueByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, revenue]) => ({ month, revenue }));

  // ===== VENTAS MENSUALES (cantidad de vehículos) con formato de meses =====
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const salesCountByMonth = {};
  salesData.forEach(s => {
    const date = new Date(s.sale_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    salesCountByMonth[key] = (salesCountByMonth[key] || 0) + 1;
  });
  const salesTimelineCount = Object.entries(salesCountByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => {
      const [year, monthNum] = key.split('-');
      const monthName = monthNames[parseInt(monthNum) - 1];
      return { month: `${monthName} ${year}`, count };
    });

  // ===== MARCAS MÁS VENDIDAS (por cantidad) =====
  const brandCount = {};
  salesData.forEach(s => {
    const key = s.brand || 'Sin marca';
    brandCount[key] = (brandCount[key] || 0) + 1;
  });
  const topBrandsByCount = Object.entries(brandCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // ===== MODELOS MÁS VENDIDOS (por cantidad) =====
  const modelCount = {};
  salesData.forEach(s => {
    const key = s.model || 'Sin modelo';
    modelCount[key] = (modelCount[key] || 0) + 1;
  });
  const topModelsByCount = Object.entries(modelCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // ===== TIPOS MÁS VENDIDOS =====
  const typeCount = {};
  if (validSales.length > 0) {
    const vehicleIds = validSales.map(item => item.vehicle_id);
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, type')
      .in('id', vehicleIds);
    if (vehicles) {
      const typeMap = Object.fromEntries(vehicles.map(v => [v.id, v.type || 'No especificado']));
      salesData.forEach(s => {
        const type = typeMap[s.vehicle_id] || 'No especificado';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
    }
  }
  const topTypes = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    kpis: {
      soldCount,
      totalRevenue,
      // avgPrice ELIMINADO
      sellerStats,
      darioRevenue: sellerStats.find(s => s.name === 'Dario')?.revenue || 0,
      patioRevenue: sellerStats.find(s => s.name === 'Vendedor de patio')?.revenue || 0,
      estimatedCommission,
      topTypes,
    },
    charts: {
      sellerStats,
      revenueTimeline,
      topBrandsByCount,
      topModelsByCount,
      salesTimelineCount,
    },
    sales: salesData,
  };
}

// ============================================
// EXPORTAR CSV
// ============================================
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => row[h] || ''));
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}