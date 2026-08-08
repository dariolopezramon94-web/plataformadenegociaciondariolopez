import React from 'react';

export function VehicleSelector({ vehicles, selectedVehicle, onSelect, disabled }) {
  const handleChange = (e) => {
    const id = e.target.value;
    if (id) {
      onSelect(id);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
      <label className="block text-white/70 text-sm font-medium mb-2">
        Selecciona el vehículo para la negociación
      </label>
      <select
        value={selectedVehicle?.id || ''}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-50"
      >
        <option value="">-- Selecciona un vehículo --</option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.brand} {vehicle.model} ({vehicle.year}) - {vehicle.plate}
          </option>
        ))}
      </select>
    </div>
  );
}