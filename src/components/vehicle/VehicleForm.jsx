import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCustomFields,
  createCustomField,
  deleteCustomField,
  getDistinctColors,
  getDistinctTypes,
  getDistinctFuelTypes,
  getDistinctTransmissions,
} from '../../services/vehicleService';
import { CustomFieldInput } from './CustomFieldInput';
import { Switch } from '../common/Switch';

const STATUS_OPTIONS = ['disponible', 'no_disponible', 'vendido'];
const CABIN_TYPES = ['Cabina sencilla', 'Doble cabina', 'Otro'];

export function VehicleForm({ onSubmit, initialData = null, isEdit = false, onDelete = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [showCustomFieldAdder, setShowCustomFieldAdder] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState('');
  const [newCustomFieldType, setNewCustomFieldType] = useState('text');
  const [newCustomFieldOptions, setNewCustomFieldOptions] = useState('');
  const [colorSuggestions, setColorSuggestions] = useState([]);
  const [typeSuggestions, setTypeSuggestions] = useState([]);
  const [fuelSuggestions, setFuelSuggestions] = useState([]);
  const [transmissionSuggestions, setTransmissionSuggestions] = useState([]);

  const [isOtherCabin, setIsOtherCabin] = useState(false);

  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    color: '',
    year: '',
    mileage: '',
    price: '',
    engine: '',
    fuel_type: '',
    transmission: '',
    plate: '',
    status: 'disponible',
    has_ac: false,
    vidrios_electricos: false,
    retrovisores_electricos: false,
    cuatro_por_cuatro: false,
    negociable: false,
    tipo_cabina: '',
    publicado_marketplace: false,
  });

  const [customValues, setCustomValues] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fields, colors, types, fuels, transmissions] = await Promise.all([
          getCustomFields(),
          getDistinctColors(),
          getDistinctTypes(),
          getDistinctFuelTypes(),
          getDistinctTransmissions(),
        ]);
        setCustomFieldDefinitions(fields);
        setColorSuggestions(colors);
        setTypeSuggestions(types);
        setFuelSuggestions(fuels);
        setTransmissionSuggestions(transmissions);
        const initial = {};
        fields.forEach(f => { initial[f.id] = ''; });
        setCustomValues(initial);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setErrorMessage('No se pudieron cargar los datos del formulario');
      } finally {
        setFieldsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (initialData) {
      const formattedMileage = initialData.mileage ? formatNumber(initialData.mileage) : '';
      setFormData({
        type: initialData.type || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        color: initialData.color || '',
        year: initialData.year || '',
        mileage: formattedMileage,
        price: initialData.price || '',
        engine: initialData.engine || '',
        fuel_type: initialData.fuel_type || '',
        transmission: initialData.transmission || '',
        plate: initialData.plate || '',
        status: initialData.status || 'disponible',
        has_ac: initialData.has_ac || false,
        vidrios_electricos: initialData.vidrios_electricos || false,
        retrovisores_electricos: initialData.retrovisores_electricos || false,
        cuatro_por_cuatro: initialData.cuatro_por_cuatro || false,
        negociable: initialData.negociable || false,
        tipo_cabina: initialData.tipo_cabina || '',
        publicado_marketplace: initialData.publicado_marketplace || false,
      });

      if (initialData.tipo_cabina && !CABIN_TYPES.includes(initialData.tipo_cabina)) {
        setIsOtherCabin(true);
        setFormData(prev => ({ ...prev, tipo_cabina: initialData.tipo_cabina }));
      }

      if (initialData.custom_fields && initialData.custom_fields.length > 0) {
        const custom = {};
        initialData.custom_fields.forEach(f => {
          custom[f.field_id] = f.value || '';
        });
        setCustomValues(prev => ({ ...prev, ...custom }));
      }
    }
  }, [initialData]);

  const formatNumber = (value) => {
    if (!value) return '';
    const num = value.toString().replace(/,/g, '');
    if (isNaN(num) || num === '') return '';
    return parseInt(num, 10).toLocaleString('es-ES');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mileage') {
      setFormData(prev => ({ ...prev, mileage: value }));
      return;
    }

    if (name === 'tipo_cabina') {
      if (value === 'Otro') {
        setIsOtherCabin(true);
        setFormData(prev => ({ ...prev, tipo_cabina: '' }));
      } else {
        setIsOtherCabin(false);
        setFormData(prev => ({ ...prev, tipo_cabina: value }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMileageBlur = () => {
    if (formData.mileage) {
      const raw = formData.mileage.replace(/,/g, '');
      if (!isNaN(raw) && raw !== '') {
        setFormData(prev => ({ ...prev, mileage: formatNumber(raw) }));
      }
    }
  };

  const handleOtherCabinChange = (e) => {
    setFormData(prev => ({ ...prev, tipo_cabina: e.target.value }));
  };

  const handleSwitchChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomChange = (fieldId, value) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const validate = () => {
    const required = ['type', 'brand', 'model', 'year', 'mileage', 'price', 'fuel_type', 'transmission', 'plate'];
    for (const field of required) {
      if (!formData[field]) {
        setErrorMessage(`El campo ${field} es obligatorio`);
        return false;
      }
    }
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      setErrorMessage('Año inválido');
      return false;
    }
    const mileageRaw = parseFloat(formData.mileage.replace(/,/g, ''));
    if (mileageRaw < 0) {
      setErrorMessage('El kilometraje no puede ser negativo');
      return false;
    }
    if (formData.price < 0) {
      setErrorMessage('El precio no puede ser negativo');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      const vehiclePayload = {
        ...formData,
        year: parseInt(formData.year),
        mileage: parseInt(formData.mileage.replace(/,/g, '')),
        price: parseFloat(formData.price),
        has_ac: formData.has_ac,
        vidrios_electricos: formData.vidrios_electricos,
        retrovisores_electricos: formData.retrovisores_electricos,
        cuatro_por_cuatro: formData.cuatro_por_cuatro,
        negociable: formData.negociable,
        tipo_cabina: formData.tipo_cabina,
        publicado_marketplace: formData.publicado_marketplace,
      };

      const customPayload = {};
      Object.entries(customValues).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          customPayload[key] = val;
        }
      });

      await onSubmit(vehiclePayload, customPayload);

      if (formData.color && !colorSuggestions.includes(formData.color)) {
        setColorSuggestions(prev => [...prev, formData.color]);
      }
      if (formData.type && !typeSuggestions.includes(formData.type)) {
        setTypeSuggestions(prev => [...prev, formData.type]);
      }
      if (formData.fuel_type && !fuelSuggestions.includes(formData.fuel_type)) {
        setFuelSuggestions(prev => [...prev, formData.fuel_type]);
      }
      if (formData.transmission && !transmissionSuggestions.includes(formData.transmission)) {
        setTransmissionSuggestions(prev => [...prev, formData.transmission]);
      }

      if (isEdit) {
        setSuccessMessage('Vehículo actualizado correctamente');
        setTimeout(() => navigate('/inventario'), 1500);
      } else {
        setFormData({
          type: '',
          brand: '',
          model: '',
          color: '',
          year: '',
          mileage: '',
          price: '',
          engine: '',
          fuel_type: '',
          transmission: '',
          plate: '',
          status: 'disponible',
          has_ac: false,
          vidrios_electricos: false,
          retrovisores_electricos: false,
          cuatro_por_cuatro: false,
          negociable: false,
          tipo_cabina: '',
          publicado_marketplace: false,
        });
        setIsOtherCabin(false);
        const resetCustom = {};
        customFieldDefinitions.forEach(f => { resetCustom[f.id] = ''; });
        setCustomValues(resetCustom);
        setSuccessMessage('Vehículo registrado correctamente. Puede agregar otro.');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      setErrorMessage(err.message || 'Error al guardar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomField = async () => {
    if (!newCustomFieldName.trim()) {
      setErrorMessage('Ingrese un nombre para la característica');
      return;
    }
    try {
      const fieldData = {
        name: newCustomFieldName.trim(),
        field_type: newCustomFieldType,
        options: newCustomFieldType === 'select' ? newCustomFieldOptions.split(',').map(s => s.trim()) : null,
      };
      const newField = await createCustomField(fieldData);
      setCustomFieldDefinitions(prev => [...prev, newField]);
      setCustomValues(prev => ({ ...prev, [newField.id]: '' }));
      setNewCustomFieldName('');
      setNewCustomFieldType('text');
      setNewCustomFieldOptions('');
      setShowCustomFieldAdder(false);
      setSuccessMessage('Característica agregada correctamente');
    } catch (err) {
      console.error('Error al agregar campo personalizado:', err);
      setErrorMessage('Error al agregar la característica');
    }
  };

  const handleDeleteCustomField = async (fieldId) => {
    if (!window.confirm('¿Eliminar esta característica y todos sus valores?')) return;
    try {
      await deleteCustomField(fieldId);
      setCustomFieldDefinitions(prev => prev.filter(f => f.id !== fieldId));
      setCustomValues(prev => {
        const newVal = { ...prev };
        delete newVal[fieldId];
        return newVal;
      });
      setSuccessMessage('Característica eliminada correctamente');
    } catch (err) {
      console.error('Error al eliminar campo personalizado:', err);
      setErrorMessage('Error al eliminar la característica');
    }
  };

  if (fieldsLoading) {
    return <div className="text-white/60 text-center py-12">Cargando formulario...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 shadow-2xl">
      <h2 className="text-2xl font-bold text-white">
        {isEdit ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
      </h2>

      {successMessage && (
        <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-300 px-4 py-3 rounded-xl text-sm">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COLUMNA IZQUIERDA */}
        <div className="space-y-4">
          {/* Tipo de vehículo */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Tipo de vehículo *</label>
            <input
              type="text"
              name="type"
              list="type-suggestions"
              value={formData.type}
              onChange={handleInputChange}
              placeholder="Ej. Camioneta, Sedán, Auto..."
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <datalist id="type-suggestions">
              {typeSuggestions.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Color */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Color *</label>
            <input
              type="text"
              name="color"
              list="color-suggestions"
              value={formData.color}
              onChange={handleInputChange}
              placeholder="Ej. Rojo, Azul, Blanco..."
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <datalist id="color-suggestions">
              {colorSuggestions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Año */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Año *</label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              placeholder="2020"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Precio ($) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="18500"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Combustible */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Tipo de combustible *</label>
            <input
              type="text"
              name="fuel_type"
              list="fuel-suggestions"
              value={formData.fuel_type}
              onChange={handleInputChange}
              placeholder="Ej. Gasolina, Diésel, Eléctrico..."
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <datalist id="fuel-suggestions">
              {fuelSuggestions.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Placa */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Placa *</label>
            <input
              type="text"
              name="plate"
              value={formData.plate}
              onChange={handleInputChange}
              placeholder="ABC123"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Tipo de cabina */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Tipo de cabina</label>
            <select
              name="tipo_cabina"
              value={isOtherCabin ? 'Otro' : formData.tipo_cabina}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="">Seleccione...</option>
              {CABIN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {isOtherCabin && (
              <input
                type="text"
                placeholder="Especificar tipo de cabina"
                value={formData.tipo_cabina}
                onChange={handleOtherCabinChange}
                className="mt-1 w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            )}
          </div>

          {/* SWITCHES */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Aire acondicionado</span>
              <Switch
                value={formData.has_ac}
                onChange={(val) => handleSwitchChange('has_ac', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Vidrios eléctricos</span>
              <Switch
                value={formData.vidrios_electricos}
                onChange={(val) => handleSwitchChange('vidrios_electricos', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Retrovisores eléctricos</span>
              <Switch
                value={formData.retrovisores_electricos}
                onChange={(val) => handleSwitchChange('retrovisores_electricos', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">4x4</span>
              <Switch
                value={formData.cuatro_por_cuatro}
                onChange={(val) => handleSwitchChange('cuatro_por_cuatro', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Negociable</span>
              <Switch
                value={formData.negociable}
                onChange={(val) => handleSwitchChange('negociable', val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Publicado en Marketplace</span>
              <Switch
                value={formData.publicado_marketplace}
                onChange={(val) => handleSwitchChange('publicado_marketplace', val)}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-4">
          {/* Marca */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Marca *</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              placeholder="Ej. Toyota"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Modelo *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              placeholder="Ej. Corolla"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Kilometraje */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Kilometraje (km) *</label>
            <input
              type="text"
              name="mileage"
              value={formData.mileage}
              onChange={handleInputChange}
              onBlur={handleMileageBlur}
              placeholder="Ej. 356250"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
          </div>

          {/* Motor */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Motor (opcional)</label>
            <input
              type="text"
              name="engine"
              value={formData.engine}
              onChange={handleInputChange}
              placeholder="2.8L Diésel"
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Transmisión */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Transmisión *</label>
            <input
              type="text"
              name="transmission"
              list="transmission-suggestions"
              value={formData.transmission}
              onChange={handleInputChange}
              placeholder="Ej. Manual, Automática, CVT..."
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              required
            />
            <datalist id="transmission-suggestions">
              {transmissionSuggestions.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1">Estado *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {STATUS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Campos personalizados existentes */}
      {customFieldDefinitions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h3 className="text-white/80 font-semibold mb-4">Características adicionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customFieldDefinitions.map(field => (
              <div key={field.id} className="relative flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-white/70 text-sm font-medium mb-1">
                    {field.name}
                  </label>
                  <CustomFieldInput
                    field={field}
                    value={customValues[field.id] || ''}
                    onChange={handleCustomChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCustomField(field.id)}
                  className="mb-1 px-2 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition"
                  title="Eliminar característica"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agregar característica personalizada */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowCustomFieldAdder(!showCustomFieldAdder)}
          className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2"
        >
          <span className="text-xl font-bold">+</span> Agregar característica personalizada
        </button>

        {showCustomFieldAdder && (
          <div className="mt-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 space-y-3">
            <h4 className="text-white/80 text-sm font-medium">Nueva característica</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nombre (ej. Color interior)"
                value={newCustomFieldName}
                onChange={(e) => setNewCustomFieldName(e.target.value)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <select
                value={newCustomFieldType}
                onChange={(e) => setNewCustomFieldType(e.target.value)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="boolean">Sí/No</option>
                <option value="date">Fecha</option>
                <option value="select">Lista desplegable</option>
              </select>
              {newCustomFieldType === 'select' && (
                <input
                  type="text"
                  placeholder="Opciones separadas por coma"
                  value={newCustomFieldOptions}
                  onChange={(e) => setNewCustomFieldOptions(e.target.value)}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleAddCustomField}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-lg border border-white/30 transition"
            >
              Agregar característica
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-w-[120px] py-3 px-6 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 shadow-lg transition disabled:opacity-50"
        >
          {loading ? 'Guardando...' : (isEdit ? 'Actualizar vehículo' : 'Guardar vehículo')}
        </button>
        <button
          type="button"
          onClick={() => navigate('/inventario')}
          className="py-3 px-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 rounded-xl border border-white/20 transition"
        >
          Cancelar
        </button>
        {isEdit && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="py-3 px-6 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-300 rounded-xl border border-red-500/30 transition"
          >
            Eliminar
          </button>
        )}
      </div>
    </form>
  );
}