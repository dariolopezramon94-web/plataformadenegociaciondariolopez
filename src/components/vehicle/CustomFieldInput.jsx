import React from 'react';

export function CustomFieldInput({ field, value, onChange }) {
  const handleChange = (e) => {
    const val = e.target.value;
    onChange(field.id, val);
  };

  const handleCheckboxChange = (e) => {
    onChange(field.id, e.target.checked);
  };

  switch (field.field_type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={handleChange}
          placeholder={`Ingrese ${field.name}`}
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={handleChange}
          placeholder={`Ingrese ${field.name}`}
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      );

    case 'boolean':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={!!value}
            onChange={handleCheckboxChange}
            className="w-5 h-5 bg-white/10 border border-white/20 rounded focus:ring-2 focus:ring-white/30"
          />
          <span className="text-white/70 text-sm">{value ? 'Sí' : 'No'}</span>
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      );

    case 'select':
      const options = field.options || [];
      return (
        <select
          value={value || ''}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="">Seleccione...</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      );

    default:
      return null;
  }
}