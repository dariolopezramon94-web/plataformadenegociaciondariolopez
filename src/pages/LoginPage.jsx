import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/inventario" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inventario');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .bg-gradient-dark {
          background: linear-gradient(135deg, #0a0a0a, #1a1a1a, #0d0d0d);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .glass-card-dark {
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8);
          padding: 2rem 1.5rem;
          width: 100%;
          max-width: 28rem;
          transition: all 0.3s ease;
        }
        .glass-card-dark:hover {
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.9);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .glass-input-dark {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          width: 100%;
          color: #e0e0e0;
          font-size: 1rem;
          transition: all 0.2s ease;
          height: 48px;
        }
        .glass-input-dark:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
          background: rgba(255, 255, 255, 0.08);
        }
        .glass-input-dark::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .glass-button-dark {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.75rem;
          padding: 0.75rem 1.5rem;
          width: 100%;
          color: #f0f0f0;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.2s ease;
          cursor: pointer;
          height: 48px;
        }
        .glass-button-dark:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.02);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .glass-button-dark:active:not(:disabled) {
          transform: scale(0.98);
        }
        .glass-button-dark:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .error-box-dark {
          background: rgba(200, 50, 50, 0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(200, 50, 50, 0.2);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: #ffb3b3;
          text-align: center;
          font-size: 0.875rem;
        }
        .text-white-dark { color: #ffffff; }
        .text-gray-light { color: rgba(255, 255, 255, 0.7); }
        .text-gray-lighter { color: rgba(255, 255, 255, 0.4); }
        .drop-shadow-dark { text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5); }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-6 { margin-top: 1.5rem; }
        .text-center { text-align: center; }
        .text-sm { font-size: 0.875rem; }
        .text-xs { font-size: 0.75rem; }
        .font-bold { font-weight: 700; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .block { display: block; }
        .space-y-6 > * + * { margin-top: 1.5rem; }
        .w-full { width: 100%; }
        .max-w-md { max-width: 28rem; }
        .transition-all { transition: all 0.3s ease; }
        .duration-200 { transition-duration: 200ms; }
        @media (max-width: 640px) {
          .glass-card-dark { padding: 1.5rem 1rem; }
        }
      `}</style>

      <div className="bg-gradient-dark">
        <div className="glass-card-dark">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white-dark drop-shadow-dark">Bienvenido</h1>
            <p className="text-gray-light mt-2 text-sm">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-light mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-input-dark"
                placeholder="admin@negociacion.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-light mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-input-dark"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="error-box-dark">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="glass-button-dark"
            >
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>
          <div className="mt-6 text-center text-gray-lighter text-xs">
            Sistema de gestión de autos
          </div>
        </div>
      </div>
    </>
  );
}