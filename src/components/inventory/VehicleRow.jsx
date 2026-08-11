import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { generateCustomMessage, generatePriceMessage, generateMarketplaceTitle, generateDescription } from '../../services/vehicleService';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMileage = (mileage) => {
  if (!mileage) return '0 km';
  if (mileage < 1000) {
    return `${mileage} km`;
  }
  const miles = Math.round(mileage / 1000);
  return `${miles} mil km`;
};

export function VehicleRow({
  vehicle,
  onStatusChange,
  onEdit,
  onDelete,
  onTogglePublicado,
  onToggleInformacionCompleta,
  onToggleFotografiado,
  onNotification,
}) {
  const { isAdmin, isRevisor } = useAuth();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [soldBy, setSoldBy] = useState('');

  const copyFullMessage = async () => {
    const message = await generateCustomMessage(vehicle);
    if (!message) {
      onNotification('La plantilla para mensaje de disponibilidad no está configurada', 'error');
      return;
    }
    navigator.clipboard.writeText(message);
  };

  const copyPriceMessage = async () => {
    const message = await generatePriceMessage(vehicle);
    if (!message) {
      onNotification('La plantilla para mensaje de precio no está configurada', 'error');
      return;
    }
    navigator.clipboard.writeText(message);
  };

  const copyTitle = async () => {
    const title = await generateMarketplaceTitle(vehicle);
    navigator.clipboard.writeText(title);
  };

  const copyDescription = async () => {
    const description = await generateDescription(vehicle);
    navigator.clipboard.writeText(description);
  };

  const togglePublicado = () => {
    if (!isAdmin) return;
    onTogglePublicado(vehicle.id, vehicle.publicado_marketplace);
  };

  const toggleInformacionCompleta = () => {
    if (!isAdmin) return;
    onToggleInformacionCompleta(vehicle.id, vehicle.informacion_completa);
  };

  const toggleFotografiado = () => {
    if (!isAdmin) return;
    onToggleFotografiado(vehicle.id, vehicle.fotografiado);
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'vendido') {
      setShowStatusMenu(true);
    } else {
      onStatusChange(vehicle.id, newStatus);
    }
  };

  const confirmSale = () => {
    if (!soldBy) {
      alert('Selecciona quién vendió el vehículo');
      return;
    }
    onStatusChange(vehicle.id, 'vendido', soldBy);
    setShowStatusMenu(false);
    setSoldBy('');
  };

  const cancelSale = () => {
    setShowStatusMenu(false);
    setSoldBy('');
  };

  const handleDelete = () => {
    onDelete(vehicle.id);
  };

  const customFields = vehicle.custom_fields || [];

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-3 sm:p-4 shadow-lg hover:bg-white/15 transition-all duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            {vehicle.brand} {vehicle.model}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm
              ${vehicle.status === 'disponible' ? 'bg-green-500/20 border-green-500/30 text-green-300' :
                vehicle.status === 'no_disponible' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300' :
                'bg-red-500/20 border-red-500/30 text-red-300'}`}>
              {vehicle.status === 'disponible' ? 'Disponible' :
               vehicle.status === 'no_disponible' ? 'No disponible' :
               'Vendido'}
            </span>

            <span
              onClick={togglePublicado}
              className={`px-2 py-0.5 rounded-full text-xs border backdrop-blur-sm cursor-pointer select-none ${
                vehicle.publicado_marketplace
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              } ${isAdmin ? 'hover:opacity-80' : 'cursor-default'}`}
              title={isAdmin ? (vehicle.publicado_marketplace ? 'Marcar como no publicado' : 'Marcar como publicado') : ''}
            >
              {vehicle.publicado_marketplace ? 'Publicado' : 'No publicado'}
            </span>

            <span
              onClick={toggleInformacionCompleta}
              className={`px-2 py-0.5 rounded-full text-xs border backdrop-blur-sm cursor-pointer select-none ${
                vehicle.informacion_completa
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              } ${isAdmin ? 'hover:opacity-80' : 'cursor-default'}`}
              title={isAdmin ? (vehicle.informacion_completa ? 'Marcar como incompleta' : 'Marcar como completa') : ''}
            >
              {vehicle.informacion_completa ? 'Información completa' : 'Información incompleta'}
            </span>

            <span
              onClick={toggleFotografiado}
              className={`px-2 py-0.5 rounded-full text-xs border backdrop-blur-sm cursor-pointer select-none ${
                vehicle.fotografiado
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              } ${isAdmin ? 'hover:opacity-80' : 'cursor-default'}`}
              title={isAdmin ? (vehicle.fotografiado ? 'Marcar como no fotografiado' : 'Marcar como fotografiado') : ''}
            >
              {vehicle.fotografiado ? 'Fotografiado' : 'No fotografiado'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-white/80 text-base sm:text-lg font-semibold">
            ${vehicle.price.toLocaleString()}
          </span>
          <span className="text-white/60 text-sm">
            {vehicle.year}
          </span>
          <span className="text-white/50 text-xs">
            Ingreso: {formatDate(vehicle.created_at)}
          </span>
          {vehicle.status === 'vendido' && vehicle.sale_info && (
            <span className="text-white/50 text-xs">
              Vendido el {formatDate(vehicle.sale_info.sale_date)} por {vehicle.sale_info.sold_by}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {/* Mostrar "Marcar vendido" para admin y revisor */}
        {(isAdmin || isRevisor) && vehicle.status !== 'vendido' && (
          <button
            onClick={() => handleStatusChange('vendido')}
            className="px-2 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xs rounded-lg border border-white/20 transition"
          >
            Marcar vendido
          </button>
        )}
        <button
          onClick={copyFullMessage}
          className="px-2 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xs rounded-lg border border-white/20 transition"
        >
          Copiar disponible
        </button>
        <button
          onClick={copyPriceMessage}
          className="px-2 py-1 bg-blue-500/20 backdrop-blur-sm hover:bg-blue-500/30 text-blue-300 text-xs rounded-lg border border-blue-500/30 transition"
        >
          Copiar precio
        </button>
        <button
          onClick={copyTitle}
          className="px-2 py-1 bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 text-green-300 text-xs rounded-lg border border-green-500/30 transition"
        >
          Copiar título
        </button>
        <button
          onClick={copyDescription}
          className="px-2 py-1 bg-purple-500/20 backdrop-blur-sm hover:bg-purple-500/30 text-purple-300 text-xs rounded-lg border border-purple-500/30 transition"
        >
          Copiar descripción
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => onEdit(vehicle.id)}
              className="px-2 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xs rounded-lg border border-white/20 transition"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-2 py-1 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-300 text-xs rounded-lg border border-red-500/30 transition"
            >
              Eliminar
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mt-3 text-white/50 text-xs">
        <span>Kilometraje: {formatMileage(vehicle.mileage)}</span>
        <span>Motor: {vehicle.engine || 'N/A'}</span>
        <span>Combustible: {vehicle.fuel_type}</span>
        <span>Aire: {vehicle.has_ac ? 'Sí' : 'No'}</span>
        <span>Transmisión: {vehicle.transmission}</span>
        <span>Placa: {vehicle.plate}</span>
        <span>Color: {vehicle.color || 'N/A'}</span>
        <span>Vidrios eléctricos: {vehicle.vidrios_electricos ? 'Sí' : 'No'}</span>
        <span>Retrovisores eléctricos: {vehicle.retrovisores_electricos ? 'Sí' : 'No'}</span>
        <span>4x4: {vehicle.cuatro_por_cuatro ? 'Sí' : 'No'}</span>
        <span>Negociable: {vehicle.negociable ? 'Sí' : 'No'}</span>
        <span>Cabina: {vehicle.tipo_cabina || 'N/A'}</span>
      </div>

      {customFields.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex flex-wrap gap-2 text-white/40 text-xs">
            {customFields.map((field, idx) => (
              <span key={idx} className="bg-white/5 px-1.5 py-0.5 rounded">
                <strong className="text-white/60">{field.field_name}:</strong>{' '}
                {field.field_type === 'boolean' ? (field.value === 'true' ? 'Sí' : 'No') : field.value || '-'}
              </span>
            ))}
          </div>
        </div>
      )}

      {showStatusMenu && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-white font-semibold text-lg mb-4">Confirmar venta</h4>
            <p className="text-white/70 text-sm mb-4">
              ¿Quién vendió este vehículo?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSoldBy('Dario')}
                className={`px-4 py-2 rounded-lg border transition text-white/80 text-sm
                  ${soldBy === 'Dario' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
              >
                Dario
              </button>
              <button
                onClick={() => setSoldBy('vendedor_patio')}
                className={`px-4 py-2 rounded-lg border transition text-white/80 text-sm
                  ${soldBy === 'vendedor_patio' ? 'bg-white/20 border-white/40' : 'bg-white/5 border-white/10 hover:bg-white/15'}`}
              >
                Vendedor de patio
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmSale}
                className="flex-1 px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg border border-white/30 transition"
              >
                Confirmar
              </button>
              <button
                onClick={cancelSale}
                className="flex-1 px-4 py-2 bg-transparent hover:bg-white/10 text-white/60 rounded-lg border border-white/10 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}