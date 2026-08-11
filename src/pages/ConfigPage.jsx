import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getAppConfig, updateAppConfig, testConnection } from '../services/configService';

const STORAGE_KEY = 'config_sections_open';

const SECTIONS = [
  { id: 'provider', title: 'Proveedor de IA' },
  { id: 'api-keys', title: 'Claves API' },
  { id: 'business', title: 'Datos del negocio' },
  { id: 'prompts', title: 'Prompts personalizados para la IA' },
  { id: 'templates', title: 'Plantillas de mensajes para clientes' },
  { id: 'seo', title: 'Plantillas SEO (título y descripción)' },
];

const PLACEHOLDERS = [
  { label: 'Artículo', value: '{article}' },
  { label: 'Tipo de vehículo', value: '{type}' },
  { label: 'Marca', value: '{brand}' },
  { label: 'Modelo', value: '{model}' },
  { label: 'Año', value: '{year}' },
  { label: 'Precio', value: '{price}' },
  { label: 'Kilometraje', value: '{mileage}' },
  { label: 'Motor', value: '{engine}' },
  { label: 'Transmisión', value: '{transmission}' },
  { label: 'Texto de Aire Acondicionado', value: '{has_ac_text}' },
  { label: 'Placa formateada', value: '{plate_formatted}' },
  { label: 'Texto de Negociable (completo)', value: '{negociable_text}' },
  { label: 'Negociable (sí/no)', value: '{negociable}' },
  { label: 'Características adicionales', value: '{features_text}' },
  { label: 'Tipo de cabina', value: '{tipo_cabina}' },
  { label: '4x4 (sí/no)', value: '{cuatro_por_cuatro}' },
  { label: 'Vidrios eléctricos (sí/no)', value: '{vidrios_electricos}' },
  { label: 'Retrovisores eléctricos (sí/no)', value: '{retrovisores_electricos}' },
];

function TemplateTextarea({ name, value, onChange, placeholder, rows }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState('');
  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursor);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1);
      if (textAfterSlash.includes(' ')) {
        setShowSuggestions(false);
      } else {
        setFilter(textAfterSlash);
        const filtered = PLACEHOLDERS.filter(p =>
          p.label.toLowerCase().includes(textAfterSlash.toLowerCase()) ||
          p.value.toLowerCase().includes(textAfterSlash.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
    }
    onChange(e);
  };

  const handleSuggestionClick = (suggestion) => {
    const text = textareaRef.current.value;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursor);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    const beforeSlash = text.substring(0, lastSlashIndex);
    const afterCursor = text.substring(cursor);
    const newText = beforeSlash + suggestion.value + afterCursor;
    const newCursorPos = beforeSlash.length + suggestion.value.length;

    const syntheticEvent = {
      target: {
        name: name,
        value: newText,
      },
    };
    onChange(syntheticEvent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);

    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleTextChange}
        rows={rows}
        className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
        placeholder={placeholder}
      />
      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-black/80 backdrop-blur-xl rounded-lg border border-white/20 shadow-2xl">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition-colors text-sm flex justify-between items-center"
            >
              <span>{s.value}</span>
              <span className="text-white/40 text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="text-[10px] text-white/30 mt-1">
        Escribe <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/50">/</kbd> para ver los placeholders disponibles.
      </div>
    </div>
  );
}

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

  const [openSections, setOpenSections] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      provider: true,
      'api-keys': true,
      business: true,
      prompts: true,
      templates: true,
      seo: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openSections));
    } catch (e) {}
  }, [openSections]);

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  const renderSectionContent = (sectionId) => {
    switch (sectionId) {
      case 'provider':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-1">
                  Seleccionar proveedor
                </label>
                <select
                  name="ai_provider"
                  value={config?.ai_provider || 'claude'}
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
        );

      case 'api-keys':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Claude API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showClaudeKey ? 'text' : 'password'}
                  name="claude_api_key"
                  value={config?.claude_api_key || ''}
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
                  value={config?.deepseek_api_key || ''}
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
        );

      case 'business':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Nombre del vendedor
              </label>
              <input
                type="text"
                name="seller_name"
                value={config?.seller_name || ''}
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
                value={config?.business_location || ''}
                onChange={handleChange}
                placeholder="Ej. Av. Principal 123"
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        );

      case 'prompts':
        return (
          <div className="space-y-4">
            <p className="text-white/50 text-xs">
              Configura los prompts que la IA usará. Si dejas un campo vacío, la función devolverá un error indicando que falta configurarlo.
            </p>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Prompt para generación (respuesta desde cero)
              </label>
              <textarea
                name="system_prompt_generate"
                value={config?.system_prompt_generate || ''}
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
                value={config?.system_prompt_correct || ''}
                onChange={handleChange}
                rows={8}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-y font-mono text-sm"
                placeholder="Escribe el prompt para corregir respuestas del vendedor..."
              />
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-4">
            <p className="text-white/50 text-xs">
              Edita las plantillas que se usan al copiar mensajes desde el catálogo. Usa los placeholders entre llaves para incluir datos del vehículo.
              Escribe <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/50">/</kbd> para ver los placeholders disponibles.
            </p>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para mensaje de disponibilidad
              </label>
              <TemplateTextarea
                name="template_disponible"
                value={config?.template_disponible || ''}
                onChange={handleChange}
                placeholder="Escribe la plantilla para el mensaje de disponibilidad..."
                rows={10}
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para mensaje de precio
              </label>
              <TemplateTextarea
                name="template_precio"
                value={config?.template_precio || ''}
                onChange={handleChange}
                placeholder="Escribe la plantilla para el mensaje de precio..."
                rows={10}
              />
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <p className="text-white/50 text-xs">
              Personaliza el formato del título y la descripción que se generan al copiar desde el catálogo.
              Usa los placeholders para incluir datos del vehículo.
              Escribe <kbd className="px-1 py-0.5 bg-white/10 rounded text-white/50">/</kbd> para ver los placeholders disponibles.
            </p>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para título
              </label>
              <TemplateTextarea
                name="template_titulo"
                value={config?.template_titulo || ''}
                onChange={handleChange}
                placeholder="Ej. {brand} {model} {year} - {type} - {transmission}"
                rows={4}
              />
              <p className="text-[10px] text-white/30 mt-1">
                El título se usa para Facebook Marketplace y SEO. Recomendación: usar hasta 60 caracteres.
              </p>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1">
                Plantilla para descripción
              </label>
              <TemplateTextarea
                name="template_descripcion"
                value={config?.template_descripcion || ''}
                onChange={handleChange}
                placeholder="Escribe la plantilla para la descripción del vehículo..."
                rows={10}
              />
            </div>
          </div>
        );

      default:
        return null;
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
        Haz clic en cada sección para expandirla o contraerla.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
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

        {SECTIONS.map((section) => (
          <div
            key={section.id}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg overflow-hidden transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-medium hover:bg-white/5 transition-colors duration-200"
            >
              <span className="text-lg">{section.title}</span>
              <span className={`transform transition-transform duration-200 ${openSections[section.id] ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
            {openSections[section.id] && (
              <div className="px-5 pb-5 pt-2">
                {renderSectionContent(section.id)}
              </div>
            )}
          </div>
        ))}

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