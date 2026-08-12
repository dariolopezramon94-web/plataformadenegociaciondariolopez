// src/components/inventory/VehicleTable.jsx
import React from 'react';
import { VehicleRow } from './VehicleRow';

export function VehicleTable({
  vehicles,
  onStatusChange,
  onEdit,
  onDelete,
  onTogglePublicado,
  onToggleInformacionCompleta,
  onToggleFotografiado,
  loading,
  onNotification,
  onCopySuccess,        // <-- NUEVO PROP
}) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Cargando vehículos...</p>
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <p className="text-white/60 text-lg">No hay vehículos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <VehicleRow
          key={vehicle.id}
          vehicle={vehicle}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePublicado={onTogglePublicado}
          onToggleInformacionCompleta={onToggleInformacionCompleta}
          onToggleFotografiado={onToggleFotografiado}
          onNotification={onNotification}
          onCopySuccess={onCopySuccess}   // <-- NUEVO PROP
        />
      ))}
    </div>
  );
}