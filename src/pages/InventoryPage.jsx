import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { FilterBar } from '../components/inventory/FilterBar';
import { VehicleTable } from '../components/inventory/VehicleTable';
import { Pagination } from '../components/inventory/Pagination';

const ITEMS_PER_PAGE = 15;

export function InventoryPage() {
  const navigate = useNavigate();
  const {
    vehicles,
    loading,
    error,
    filters,
    setFilters,
    updateStatus,
    removeVehicle,
    togglePublicado,
  } = useVehicles();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState({ message: '', type: 'info' });

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  const handleEdit = (id) => {
    navigate(`/editar-vehiculo/${id}`);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 4000);
  };

  const handleDelete = async (id) => {
    try {
      await removeVehicle(id);
      showNotification('Vehículo eliminado correctamente', 'success');
    } catch (err) {
      showNotification('Error al eliminar el vehículo: ' + err.message, 'error');
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      vehicle.type?.toLowerCase().includes(term) ||
      vehicle.brand?.toLowerCase().includes(term) ||
      vehicle.color?.toLowerCase().includes(term)
    );
  });

  const totalItems = filteredVehicles.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-white px-6 py-4 rounded-xl text-center">
        <p className="font-semibold">Error al cargar los vehículos</p>
        <p className="text-sm text-white/70 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {notification.message && (
        <div className={`p-3 rounded-xl text-sm ${
          notification.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' :
          notification.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' :
          'bg-blue-500/20 border border-blue-500/30 text-blue-300'
        }`}>
          {notification.message}
        </div>
      )}

      <h1 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg">
        Inventario de Vehículos
      </h1>
      <p className="text-white/60 text-sm">
        {totalItems} vehículos encontrados {totalPages > 1 && `(página ${currentPage} de ${totalPages})`}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por tipo, marca o color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <FilterBar filters={filters} setFilters={setFilters} />
      </div>

      <VehicleTable
        vehicles={currentVehicles}
        onStatusChange={updateStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTogglePublicado={togglePublicado}
        loading={loading}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}