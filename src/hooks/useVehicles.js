import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  changeVehicleStatus,
  deleteVehicle,
  getCustomValuesForVehicles,
  getSalesForVehicles,
} from '../services/vehicleService';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'todos',
    month: '',
    publicado: 'todos',
    informacion: 'todos',
    fotografiado: 'todos',
    sortBy: 'brand',
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVehicles(filters);

      if (data.length > 0) {
        const vehicleIds = data.map(v => v.id);

        // Obtener valores personalizados, ventas y estadísticas de copias
        const [customValues, sales, copyStats] = await Promise.all([
          getCustomValuesForVehicles(vehicleIds),
          getSalesForVehicles(vehicleIds),
          supabase
            .from('message_stats')
            .select('vehicle_id, type, count')
            .in('vehicle_id', vehicleIds),
        ]);

        const customMap = {};
        customValues.forEach(item => {
          const vid = item.vehicle_id;
          if (!customMap[vid]) customMap[vid] = [];
          customMap[vid].push({
            field_id: item.custom_field_definitions.id,
            field_name: item.custom_field_definitions.name,
            field_type: item.custom_field_definitions.field_type,
            value: item.value,
          });
        });

        const salesMap = {};
        sales.forEach(sale => {
          salesMap[sale.vehicle_id] = {
            sale_date: sale.sale_date,
            sold_by: sale.sold_by,
          };
        });

        // Construir mapa de estadísticas de copias
        const copyMap = {};
        if (!copyStats.error && copyStats.data) {
          copyStats.data.forEach(stat => {
            if (!copyMap[stat.vehicle_id]) copyMap[stat.vehicle_id] = {};
            copyMap[stat.vehicle_id][stat.type] = stat.count || 0;
          });
        }

        let enriched = data.map(vehicle => ({
          ...vehicle,
          custom_fields: customMap[vehicle.id] || [],
          sale_info: salesMap[vehicle.id] || null,
          copy_stats: {
            disponible: copyMap[vehicle.id]?.disponible || 0,
            precio: copyMap[vehicle.id]?.precio || 0,
          },
          // Total de copias (disponible + precio)
          total_copias: (copyMap[vehicle.id]?.disponible || 0) + (copyMap[vehicle.id]?.precio || 0),
        }));

        // Aplicar ordenamiento según sortBy
        const sortBy = filters.sortBy || 'brand';
        switch (sortBy) {
          case 'price-asc':
            enriched.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            enriched.sort((a, b) => b.price - a.price);
            break;
          case 'most-copied':
            enriched.sort((a, b) => b.total_copias - a.total_copias);
            break;
          default: // 'brand'
            enriched.sort((a, b) => a.brand.localeCompare(b.brand));
            break;
        }

        setVehicles(enriched);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error('Error al obtener vehículos:', err);
      setError(err.message || 'Error al cargar los vehículos');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = useCallback(async (vehicleData, customValues) => {
    try {
      const newVehicle = await createVehicle(vehicleData, customValues);
      await fetchVehicles();
      return newVehicle;
    } catch (err) {
      console.error('Error al crear vehículo:', err);
      throw err;
    }
  }, [fetchVehicles]);

  const updateStatus = useCallback(async (id, status, soldBy = null) => {
    try {
      await changeVehicleStatus(id, status, soldBy);
      await fetchVehicles();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  const editVehicle = useCallback(async (id, data) => {
    try {
      await updateVehicle(id, data);
      await fetchVehicles();
    } catch (err) {
      console.error('Error al editar vehículo:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  const togglePublicado = useCallback(async (id, currentValue) => {
    try {
      await updateVehicle(id, { publicado_marketplace: !currentValue });
      await fetchVehicles();
    } catch (err) {
      console.error('Error al cambiar estado de publicación:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  const toggleInformacionCompleta = useCallback(async (id, currentValue) => {
    try {
      await updateVehicle(id, { informacion_completa: !currentValue });
      await fetchVehicles();
    } catch (err) {
      console.error('Error al cambiar estado de información completa:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  const toggleFotografiado = useCallback(async (id, currentValue) => {
    try {
      await updateVehicle(id, { fotografiado: !currentValue });
      await fetchVehicles();
    } catch (err) {
      console.error('Error al cambiar estado de fotografiado:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  const removeVehicle = useCallback(async (id) => {
    try {
      await deleteVehicle(id);
      await fetchVehicles();
    } catch (err) {
      console.error('Error al eliminar vehículo:', err);
      setError(err.message);
    }
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    filters,
    setFilters,
    fetchVehicles,
    addVehicle,
    updateStatus,
    editVehicle,
    togglePublicado,
    toggleInformacionCompleta,
    toggleFotografiado,
    removeVehicle,
  };
}