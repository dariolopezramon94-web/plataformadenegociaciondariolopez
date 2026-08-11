import { supabase } from './supabaseClient';

// Función helper para formatear números a "k"
function formatPriceRange(price) {
  if (price >= 1000) {
    return (price / 1000).toFixed(0) + 'k';
  }
  return price.toString();
}

// Obtener datos para el informe completo
export async function getOverviewData({ month, year }) {
  // Construir filtro de fecha si month y year no son 'todos'
  let dateFilter = {};
  if (month !== 'todos' && year !== 'todos') {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    dateFilter = { startDate, endDate };
  }

  // 1. KPIs
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
      vehicles (price, created_at, status)
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

  // Calcular tiempos en patio (máximo y mínimo)
  let maxDays = 0;
  let minDays = Infinity;
  validSales.forEach(item => {
    const created = item.vehicles?.created_at;
    if (created) {
      const diff = (new Date(item.sale_date) - new Date(created)) / (1000 * 60 * 60 * 24);
      if (diff > maxDays) maxDays = diff;
      if (diff < minDays) minDays = diff;
    }
  });
  if (minDays === Infinity) minDays = 0;

  // 2. Gráficos
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

  // Marcas vendidas (solo vendidos)
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

  // Distribución de precios (histograma) - CON RANGOS FORMATEADOS
  const { data: priceData } = await supabase
    .from('vehicles')
    .select('price')
    .neq('status', 'vendido');
  const prices = priceData?.map(item => item.price).filter(p => p !== null && p > 0) || [];

  const priceBins = [5000, 10000, 15000, 20000, 30000, 50000, 100000];
  const priceHistogram = [];

  // Rango inicial: 0 a 5k
  priceHistogram.push({
    range: '0 a 5k',
    fullRange: '$0 a $5000',
    count: prices.filter(p => p > 0 && p <= 5000).length
  });

  // Rangos intermedios
  for (let i = 0; i < priceBins.length - 1; i++) {
    const min = priceBins[i] + 1;
    const max = priceBins[i + 1];
    const count = prices.filter(p => p >= min && p <= max).length;
    const minFormatted = formatPriceRange(priceBins[i]);
    const maxFormatted = formatPriceRange(max);
    priceHistogram.push({
      range: `${minFormatted} a ${maxFormatted}`,
      fullRange: `$${min.toLocaleString()} a $${max.toLocaleString()}`,
      count
    });
  }

  // Último rango: 100k+
  priceHistogram.push({
    range: '100k+',
    fullRange: '$100001+',
    count: prices.filter(p => p > 100000).length
  });

  // Combustible
  const { data: fuelData } = await supabase.from('vehicles').select('fuel_type');
  const fuelCount = {};
  fuelData?.forEach(item => {
    const key = item.fuel_type || 'No especificado';
    fuelCount[key] = (fuelCount[key] || 0) + 1;
  });
  const fuelChart = Object.entries(fuelCount).map(([name, value]) => ({ name, value }));

  // Transmisiones
  const { data: transData } = await supabase.from('vehicles').select('transmission');
  const transCount = {};
  transData?.forEach(item => {
    const key = item.transmission || 'No especificado';
    transCount[key] = (transCount[key] || 0) + 1;
  });
  const transmissionChart = Object.entries(transCount).map(([name, value]) => ({ name, value }));

  return {
    kpis: {
      inventoryCount,
      soldCount,
      totalRevenue,
      maxDays: Math.round(maxDays),
      minDays: Math.round(minDays),
    },
    charts: {
      availableBrands: topAvailableBrands,
      soldBrands: topSoldBrands,
      topModels,
      priceHistogram,
      fuel: fuelChart,
      transmission: transmissionChart,
    },
  };
}

// Obtener datos para el informe de ventas
export async function getSalesData({ seller, month, year }) {
  let dateFilter = {};
  if (month !== 'todos' && year !== 'todos') {
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;
    dateFilter = { startDate, endDate };
  }

  let query = supabase
    .from('sales')
    .select(`
      vehicle_id,
      sold_by,
      sale_date,
      price_sold,
      vehicles (brand, model, year, price, status)
    `)
    .gte('sale_date', dateFilter.startDate || '1900-01-01')
    .lte('sale_date', dateFilter.endDate || '2100-12-31');

  if (seller && seller !== 'todos') {
    query = query.eq('sold_by', seller);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Filtrar solo los que tienen status='vendido' (para evitar inconsistencias)
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

  const soldCount = salesData.length;
  const totalRevenue = salesData.reduce((sum, s) => sum + s.price, 0);
  const avgPrice = soldCount > 0 ? totalRevenue / soldCount : 0;

  const darioSales = salesData.filter(s => s.sold_by === 'Dario');
  const patioSales = salesData.filter(s => s.sold_by === 'vendedor_patio');
  const sellerStats = [
    { name: 'Dario', count: darioSales.length, revenue: darioSales.reduce((sum, s) => sum + s.price, 0) },
    { name: 'Vendedor de patio', count: patioSales.length, revenue: patioSales.reduce((sum, s) => sum + s.price, 0) },
  ];

  const revenueByMonth = {};
  salesData.forEach(s => {
    const date = new Date(s.sale_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + s.price;
  });
  const revenueTimeline = Object.entries(revenueByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, revenue]) => ({ month, revenue }));

  const brandRevenue = {};
  salesData.forEach(s => {
    const key = s.brand || 'Sin marca';
    brandRevenue[key] = (brandRevenue[key] || 0) + s.price;
  });
  const topBrands = Object.entries(brandRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue }));

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

  const darioRevenue = sellerStats.find(s => s.name === 'Dario')?.revenue || 0;
  const commissionRate = 0.05;
  const estimatedCommission = darioRevenue * commissionRate;

  return {
    kpis: {
      soldCount,
      totalRevenue,
      avgPrice,
      sellerStats,
      darioRevenue,
      patioRevenue: sellerStats.find(s => s.name === 'Vendedor de patio')?.revenue || 0,
      estimatedCommission,
      topTypes,
    },
    charts: {
      sellerStats,
      revenueTimeline,
      topBrands,
    },
    sales: salesData,
  };
}

// Exportar CSV
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