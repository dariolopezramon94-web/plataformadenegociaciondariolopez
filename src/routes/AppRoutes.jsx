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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/inventario" replace />} />

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

        {/* Calculadora accesible para todos los autenticados (admin y revisor) */}
        <Route
          path="/financiamiento"
          element={
            <ProtectedRoute>
              <Layout>
                <FinancingPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div className="text-white text-center mt-10">Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}