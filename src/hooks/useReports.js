import { useState, useEffect, useCallback } from 'react';
import { getOverviewData, getSalesData } from '../services/reportService';

export function useReports() {
  const [overviewData, setOverviewData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    month: 'todos',
    year: 'todos',
    seller: 'todos',
  });

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOverviewData({ month: filters.month, year: filters.year });
      setOverviewData(data);
    } catch (err) {
      console.error('Error al cargar informe completo:', err);
      setError('Error al cargar los datos del informe completo');
    } finally {
      setLoading(false);
    }
  }, [filters.month, filters.year]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalesData({
        seller: filters.seller,
        month: filters.month,
        year: filters.year,
      });
      setSalesData(data);
    } catch (err) {
      console.error('Error al cargar informe de ventas:', err);
      setError('Error al cargar los datos del informe de ventas');
    } finally {
      setLoading(false);
    }
  }, [filters.seller, filters.month, filters.year]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    overviewData,
    salesData,
    loading,
    error,
    filters,
    updateFilters,
    refetchOverview: fetchOverview,
    refetchSales: fetchSales,
  };
}