import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Layout } from '../components/common/Layout';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { AddVehiclePage } from '../pages/AddVehiclePage';
import { EditVehiclePage } from '../pages/EditVehiclePage';
import { NegotiationPage } from '../pages/NegotiationPage';
import { ConfigPage } from '../pages/ConfigPage';
import { FinancingPage } from '../pages/FinancingPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/inventario" replace />} />

        {/* Inventario - accesible para todos los autenticados */}
        <Route
          path="/inventario"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Agregar vehículo - solo admin */}
        <Route
          path="/agregar-vehiculo"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AddVehiclePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Editar vehículo - solo admin */}
        <Route
          path="/editar-vehiculo/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <EditVehiclePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Negociación con IA - solo admin */}
        <Route
          path="/negociacion"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <NegotiationPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Configuración - solo admin */}
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <ConfigPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Financiamiento - solo admin */}
        <Route
          path="/financiamiento"
          element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <FinancingPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 */}
        <Route path="*" element={<div className="text-white text-center mt-10">Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}