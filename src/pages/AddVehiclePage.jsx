import React from 'react';
import { useVehicles } from '../hooks/useVehicles';
import { VehicleForm } from '../components/vehicle/VehicleForm';

export function AddVehiclePage() {
  const { addVehicle } = useVehicles();

  const handleSubmit = async (vehicleData, customValues) => {
    await addVehicle(vehicleData, customValues);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <VehicleForm onSubmit={handleSubmit} />
    </div>
  );
}