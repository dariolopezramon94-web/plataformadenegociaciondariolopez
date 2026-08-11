import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-white font-bold text-lg sm:text-xl drop-shadow-lg">
                GVDL
              </span>
            </div>

            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-white focus:outline-none p-2"
                aria-label="Menú"
              >
                <div className={`menu-icon ${menuOpen ? 'active' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </button>
            </div>

            {/* Menú escritorio */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/inventario" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                Catálogo
              </Link>
              <Link to="/financiamiento" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                Calculadora
              </Link>
              {isAdmin && (
                <>
                  <Link to="/dashboard" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                    Dashboard
                  </Link>
                  <Link to="/agregar-vehiculo" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                    Registrar vehículo
                  </Link>
                  <Link to="/negociacion" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                    Asistente de negociación
                  </Link>
                  <Link to="/configuracion" className="text-white/70 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-200 hover:bg-white/10">
                    Configuración
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg border border-white/20 shadow-md transition duration-200 text-sm"
              >
                Cerrar sesión
              </button>
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/20 text-xs"
              >
                Salir
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-white/10">
              <Link to="/inventario" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                Catálogo
              </Link>
              <Link to="/financiamiento" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                Calculadora
              </Link>
              {isAdmin && (
                <>
                  <Link to="/dashboard" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                    Dashboard
                  </Link>
                  <Link to="/agregar-vehiculo" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                    Registrar vehículo
                  </Link>
                  <Link to="/negociacion" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                    Asistente de negociación
                  </Link>
                  <Link to="/configuracion" onClick={closeMenu} className="block text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10">
                    Configuración
                  </Link>
                </>
              )}
              <button
                onClick={() => { handleLogout(); closeMenu(); }}
                className="block w-full text-left text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}