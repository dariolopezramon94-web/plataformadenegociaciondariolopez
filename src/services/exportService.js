import { supabase } from './supabaseClient';
import JSZip from 'jszip';

// Tablas a exportar con sus nombres amigables
const TABLES = [
  { name: 'vehicles', label: 'vehiculos' },
  { name: 'sales', label: 'ventas' },
  { name: 'conversations', label: 'conversaciones' },
  { name: 'profiles', label: 'perfiles' },
  { name: 'app_config', label: 'configuracion' },
  { name: 'message_stats', label: 'estadisticas_copias' },
  { name: 'vehicle_custom_values', label: 'valores_personalizados' },
  { name: 'custom_field_definitions', label: 'campos_personalizados' },
];

// Descargar todas las tablas como CSV en un ZIP
export async function exportAllTables() {
  const zip = new JSZip();

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*');

      if (error) {
        console.error(`Error al exportar ${table.name}:`, error);
        continue;
      }

      if (data && data.length > 0) {
        const csv = convertToCSV(data);
        zip.file(`${table.label}.csv`, csv);
      } else {
        // Crear archivo vacío con encabezados
        const headers = getHeaders(data);
        zip.file(`${table.label}.csv`, headers.join(',') + '\n');
      }
    } catch (err) {
      console.error(`Error al procesar ${table.name}:`, err);
    }
  }

  // Generar y descargar el archivo ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `backup_base_datos_${new Date().toISOString().slice(0,10)}.zip`;
  link.click();
}

// Convertir array de objetos a CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(header => formatValue(row[header])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// Obtener encabezados si no hay datos
function getHeaders(data) {
  if (data && data.length > 0) {
    return Object.keys(data[0]);
  }
  return ['No hay datos disponibles'];
}

// Formatear valores para CSV (manejar comillas, null, objetos, arrays, booleanos)
function formatValue(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'string') {
    // Reemplazar comillas dobles internas y envolver en comillas
    return `"${value.replace(/"/g, '""')}"`;
  }
  if (typeof value === 'object') {
    // Convertir objetos/arrays a JSON string
    return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}