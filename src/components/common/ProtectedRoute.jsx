import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-200 to-pink-300">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/30">
          <p className="text-white text-xl font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Si es revisor y trata de acceder a una ruta de admin, redirige a inventario
    if (user.role === 'revisor') {
      return <Navigate to="/inventario" replace />;
    }
    // Si es admin y requiere revisor (no deberia ocurrir), redirige a inventario
    return <Navigate to="/inventario" replace />;
  }

  return children;
}