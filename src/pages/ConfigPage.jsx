import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAppConfig, updateAppConfig, testConnection } from '../services/configService';

export function ConfigPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const data = await getAppConfig();
        setConfig(data);
      } catch (err) {
        console.error('Error al cargar configuración:', err);
        setError('No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateAppConfig(config);
      setSuccess('Configuración guardada correctamente');
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config) return;
    const provider = config.ai_provider;
    const apiKey = provider === 'claude' ? config.claude_api_key : config.deepseek_api_key;
    if (!apiKey) {
      setTestResult({ success: false, message: 'La clave API está vacía' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(provider, apiKey);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-white/60 text-center py-12">Cargando configuración...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-red-300 text-center py-12">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }

  if (!config) {
    return <div className="text-white/60 text-center py-12">No se pudo cargar la configuración</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
        Configuración
      </h1>
      <p className="text-white/60 text-sm">
        Configura los proveedores de IA, claves API, prompts personalizados y plantillas de mensajes.
      </p>

      <form onSubmit={handleSave} className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-300 px-4 py-3 rounded-xl text-sm">
            {success}
          </div>
        )}

        {/* Sección: Proveedor de IA */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-white font-semibold text-lg mb-3">Proveedor de IA</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Seleccionar proveedor
              </label>
              <select
                name="ai_provider"
                value={config.ai_provider || 'claude'}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="claude">Claude</option>
                <option value="deepseek">Deepseek</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition disabled:opacity-50"
              >
                {testing ? 'Probando...' : 'Probar conexión'}
              </button>
            </div>
          </div>
          {testResult && (
            <div className={`mt-3 px-4 py-2 rounded-xl text-sm ${
              testResult.success
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Sección: Claves API */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-white font-semibold text-lg mb-3">Claves API</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Claude API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  name="claude_api_key"
                  value={config.claude_api_key || ''}
                  onChange={handleChange}
                  placeholder="sk-ant-api... (clave de Claude)"
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="px-3 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition"
                >
                  {showClaudeKey ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Deepseek API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showDeepseekKey ? 'text' : 'password'}
                  name="deepseek_api_key"
                  value={config.deepseek_api_key || ''}
                  onChange={handleChange}
                  placeholder="sk-... (clave de Deepseek)"
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                  className="px-3 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition"
                >
                  {showDeepseekKey ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Datos del negocio */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-white font-semibold text-lg mb-3">Datos del negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Nombre del vendedor
              </label>
              <input
                type="text"
                name="seller_name"
                value={config.seller_name || ''}
                onChange={handleChange}
                placeholder="Ej. Dario"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Ubicación del local
              </label>
              <input
                type="text"
                name="business_location"
                value={config.business_location || ''}
                onChange={handleChange}
                placeholder="Ej. Av. Principal 123"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        {/* Sección: Prompts personalizados */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-white font-semibold text-lg mb-3">Prompts personalizados para la IA</h2>
          <p className="text-white/50 text-xs mb-4">
            Configura los prompts que la IA usará. Si dejas un campo vacío, la función devolverá un error indicando que falta configurarlo.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Prompt para generación (respuesta desde cero)
              </label>
              <textarea
                name="system_prompt_generate"
                value={config.system_prompt_generate || ''}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
                placeholder="Escribe el prompt para generar respuestas desde cero..."
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Prompt para corrección (mejorar respuesta del vendedor)
              </label>
              <textarea
                name="system_prompt_correct"
                value={config.system_prompt_correct || ''}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
                placeholder="Escribe el prompt para corregir respuestas del vendedor..."
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN NUEVA: Plantillas de mensajes */}
        <div className="border-b border-white/10 pb-4">
          <h2 className="text-white font-semibold text-lg mb-3">Plantillas de mensajes para clientes</h2>
          <p className="text-white/50 text-xs mb-4">
            Edita las plantillas que se usan al copiar mensajes desde el catálogo. Usa los placeholders entre llaves para incluir datos del vehículo.
            <br />
            <span className="text-white/30 text-[10px]">
              Placeholders disponibles: {'{article}'}, {'{type}'}, {'{brand}'}, {'{model}'}, {'{year}'}, {'{price}'}, {'{mileage}'}, {'{engine}'}, {'{transmission}'}, {'{has_ac_text}'}, {'{plate_formatted}'}, {'{negociable_text}'}, {'{negociable}'}, {'{features_text}'}
            </span>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para mensaje de disponibilidad
              </label>
              <textarea
                name="template_disponible"
                value={config.template_disponible || ''}
                onChange={handleChange}
                rows={10}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
                placeholder="Escribe la plantilla para el mensaje de disponibilidad..."
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para mensaje de precio
              </label>
              <textarea
                name="template_precio"
                value={config.template_precio || ''}
                onChange={handleChange}
                rows={10}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
                placeholder="Escribe la plantilla para el mensaje de precio..."
              />
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 px-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 shadow-lg transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="py-3 px-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 rounded-xl border border-white/20 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}