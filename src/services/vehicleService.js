import { supabase } from './supabaseClient';

// ==============================
// FUNCIÓN AUXILIAR PARA FORMATEAR KILOMETRAJE
// ==============================
function formatMileage(mileage) {
  if (!mileage) return '0 km';
  if (mileage < 1000) {
    return `${mileage} km`;
  }
  const miles = Math.round(mileage / 1000);
  return `${miles} mil km`;
}

// ==============================
// OBTENER VEHÍCULOS (CON FILTROS COMPLETOS)
// ==============================
export async function getVehicles(filters = {}) {
  let query = supabase
    .from('vehicles')
    .select('*')
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status);
  } else {
    query = query.neq('status', 'vendido');
  }

  if (filters.month && filters.status === 'vendido') {
    const startDate = `${filters.month}-01`;
    const endDate = `${filters.month}-31`;
    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);
  }

  if (filters.publicado && filters.publicado !== 'todos') {
    const isPublished = filters.publicado === 'si';
    query = query.eq('publicado_marketplace', isPublished);
  }

  if (filters.informacion && filters.informacion !== 'todos') {
    const isComplete = filters.informacion === 'completa';
    query = query.eq('informacion_completa', isComplete);
  }

  if (filters.fotografiado && filters.fotografiado !== 'todos') {
    const isPhotographed = filters.fotografiado === 'si';
    query = query.eq('fotografiado', isPhotographed);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ==============================
// CREAR VEHÍCULO (con campos personalizados)
// ==============================
export async function createVehicle(vehicleData, customValues = {}) {
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .insert([vehicleData])
    .select()
    .single();

  if (vehicleError) throw vehicleError;

  if (Object.keys(customValues).length > 0) {
    const customInserts = Object.entries(customValues).map(([fieldId, value]) => ({
      vehicle_id: vehicle.id,
      field_id: fieldId,
      value: String(value),
    }));

    const { error: customError } = await supabase
      .from('vehicle_custom_values')
      .insert(customInserts);

    if (customError) throw customError;
  }

  return vehicle;
}

// ==============================
// OBTENER CAMPOS PERSONALIZADOS (definiciones)
// ==============================
export async function getCustomFields() {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// ==============================
// CREAR CAMPO PERSONALIZADO
// ==============================
export async function createCustomField(fieldData) {
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .insert([fieldData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==============================
// ELIMINAR CAMPO PERSONALIZADO (y sus valores en cascada)
// ==============================
export async function deleteCustomField(fieldId) {
  const { error } = await supabase
    .from('custom_field_definitions')
    .delete()
    .eq('id', fieldId);

  if (error) throw error;
}

// ==============================
// OBTENER COLORES ÚNICOS (para sugerencias)
// ==============================
export async function getDistinctColors() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('color')
    .not('color', 'is', null)
    .neq('color', '');

  if (error) throw error;

  const colors = [...new Set(data.map(item => item.color).filter(c => c && c.trim() !== ''))];
  return colors;
}

// ==============================
// OBTENER TIPOS ÚNICOS (para sugerencias)
// ==============================
export async function getDistinctTypes() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('type')
    .not('type', 'is', null)
    .neq('type', '');
  if (error) throw error;
  return [...new Set(data.map(item => item.type).filter(Boolean))];
}

// ==============================
// OBTENER COMBUSTIBLES ÚNICOS (para sugerencias)
// ==============================
export async function getDistinctFuelTypes() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('fuel_type')
    .not('fuel_type', 'is', null)
    .neq('fuel_type', '');
  if (error) throw error;
  return [...new Set(data.map(item => item.fuel_type).filter(Boolean))];
}

// ==============================
// OBTENER TRANSMISIONES ÚNICAS (para sugerencias)
// ==============================
export async function getDistinctTransmissions() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('transmission')
    .not('transmission', 'is', null)
    .neq('transmission', '');
  if (error) throw error;
  return [...new Set(data.map(item => item.transmission).filter(Boolean))];
}

// ==============================
// OBTENER TIPOS DE CABINA ÚNICOS (para sugerencias)
// ==============================
export async function getDistinctCabins() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('tipo_cabina')
    .not('tipo_cabina', 'is', null)
    .neq('tipo_cabina', '');
  if (error) throw error;
  return [...new Set(data.map(item => item.tipo_cabina).filter(Boolean))];
}

// ==============================
// ACTUALIZAR VEHÍCULO
// ==============================
export async function updateVehicle(id, data) {
  const { error } = await supabase
    .from('vehicles')
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

// ==============================
// CAMBIAR ESTADO
// ==============================
export async function changeVehicleStatus(id, status, soldBy = null) {
  const { error: updateError } = await supabase
    .from('vehicles')
    .update({ status })
    .eq('id', id);
  if (updateError) throw updateError;

  if (status === 'vendido' && soldBy) {
    const { error: saleError } = await supabase
      .from('sales')
      .insert([{ vehicle_id: id, sold_by: soldBy }]);
    if (saleError) throw saleError;
  }

  if (status !== 'vendido') {
    await supabase
      .from('sales')
      .delete()
      .eq('vehicle_id', id);
  }
}

// ==============================
// ELIMINAR VEHÍCULO
// ==============================
export async function deleteVehicle(id) {
  const { error: saleError } = await supabase
    .from('sales')
    .delete()
    .eq('vehicle_id', id);
  if (saleError) {
    console.warn('No se pudo eliminar de sales (puede que no exista):', saleError);
  }

  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==============================
// FUNCIONES DE MENSAJES CON FORMATO DE PRECIO Y KILOMETRAJE
// ==============================

function getArticle(type) {
  if (!type) return 'el';
  const lower = type.toLowerCase();
  const femeninos = ['camioneta', 'suv', 'furgoneta'];
  if (femeninos.includes(lower)) return 'la';
  if (lower.endsWith('a')) return 'la';
  return 'el';
}

export async function generateCustomMessage(vehicle) {
  const { data: config, error } = await supabase
    .from('app_config')
    .select('template_disponible')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error al obtener plantilla de disponibilidad:', error);
    return null;
  }

  const template = config?.template_disponible;
  if (!template || template.trim() === '') {
    return null;
  }

  const article = getArticle(vehicle.type);
  const typeName = vehicle.type || 'vehículo';
  const priceFormatted = `$${vehicle.price.toLocaleString('es-ES')}`;
  const kmFormatted = formatMileage(vehicle.mileage);
  const engine = vehicle.engine || 'No especificado';
  const hasACText = vehicle.has_ac ? ' y cuenta con aire acondicionado' : '';
  const plateFormatted = `${vehicle.plate?.charAt(0) || '?'}*${vehicle.plate?.slice(-2) || '??'}*`;
  const negociableText = vehicle.negociable
    ? 'Si la compra es de contado, el precio es negociable; si desea financiarlo, también podemos conversar el precio, dependiendo del valor de la entrada.'
    : 'El precio es fijo.';
  const features = [];
  if (vehicle.cuatro_por_cuatro) features.push('es 4x4');
  if (vehicle.vidrios_electricos) features.push('tiene vidrios eléctricos');
  if (vehicle.retrovisores_electricos) features.push('tiene retrovisores eléctricos');
  const featuresText = features.length > 0 ? `Además, ${features.join(', ')}.` : '';

  return template
    .replace(/{article}/g, article)
    .replace(/{type}/g, typeName)
    .replace(/{brand}/g, vehicle.brand)
    .replace(/{model}/g, vehicle.model)
    .replace(/{year}/g, vehicle.year)
    .replace(/{price}/g, priceFormatted)
    .replace(/{mileage}/g, kmFormatted)
    .replace(/{engine}/g, engine)
    .replace(/{has_ac_text}/g, hasACText)
    .replace(/{plate_formatted}/g, plateFormatted)
    .replace(/{negociable_text}/g, negociableText)
    .replace(/{features_text}/g, featuresText);
}

export async function generatePriceMessage(vehicle) {
  const { data: config, error } = await supabase
    .from('app_config')
    .select('template_precio')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error al obtener plantilla de precio:', error);
    return null;
  }

  const template = config?.template_precio;
  if (!template || template.trim() === '') {
    return null;
  }

  const article = getArticle(vehicle.type);
  const typeName = vehicle.type || 'vehículo';
  const priceFormatted = `$${vehicle.price.toLocaleString('es-ES')}`;
  const kmFormatted = formatMileage(vehicle.mileage);
  const engine = vehicle.engine || 'No especificado';
  const hasACText = vehicle.has_ac ? ' y cuenta con aire acondicionado' : '';
  const negociable = vehicle.negociable ? 'negociable' : 'no negociable';

  return template
    .replace(/{article}/g, article)
    .replace(/{type}/g, typeName)
    .replace(/{brand}/g, vehicle.brand)
    .replace(/{model}/g, vehicle.model)
    .replace(/{year}/g, vehicle.year)
    .replace(/{price}/g, priceFormatted)
    .replace(/{mileage}/g, kmFormatted)
    .replace(/{engine}/g, engine)
    .replace(/{transmission}/g, vehicle.transmission)
    .replace(/{has_ac_text}/g, hasACText)
    .replace(/{negociable}/g, negociable);
}

// ==============================
// GENERAR TÍTULO (USANDO PLANTILLA DE CONFIGURACIÓN)
// ==============================
export async function generateMarketplaceTitle(vehicle) {
  const { data: config, error } = await supabase
    .from('app_config')
    .select('template_titulo')
    .eq('id', 1)
    .single();

  let template = config?.template_titulo;
  if (!template || template.trim() === '') {
    template = '{brand} {model} {year} {tipo_cabina} {cuatro_por_cuatro} {transmission}';
  }

  const replacements = {
    '{brand}': vehicle.brand || '',
    '{model}': vehicle.model || '',
    '{year}': vehicle.year || '',
    '{type}': vehicle.type || '',
    '{tipo_cabina}': (vehicle.type && vehicle.type.toLowerCase() === 'camioneta' && vehicle.tipo_cabina) ? vehicle.tipo_cabina : '',
    '{cuatro_por_cuatro}': vehicle.cuatro_por_cuatro ? '4x4' : '',
    '{transmission}': vehicle.transmission || '',
    '{has_ac_text}': vehicle.has_ac ? 'A/C' : '',
    '{vidrios_electricos}': vehicle.vidrios_electricos ? 'Vidrios eléctricos' : '',
    '{retrovisores_electricos}': vehicle.retrovisores_electricos ? 'Retrovisores eléctricos' : '',
    '{engine}': vehicle.engine || '',
    '{mileage}': vehicle.mileage ? formatMileage(vehicle.mileage) : '',
    '{price}': `$${vehicle.price.toLocaleString('es-ES')}`,
    '{article}': getArticle(vehicle.type),
    '{plate_formatted}': `${vehicle.plate?.charAt(0) || '?'}*${vehicle.plate?.slice(-2) || '??'}*`,
    '{negociable}': vehicle.negociable ? 'negociable' : 'no negociable',
  };

  let title = template;
  Object.entries(replacements).forEach(([key, value]) => {
    title = title.replaceAll(key, value);
  });

  title = title.replace(/\s+/g, ' ').trim();
  return title;
}

// ==============================
// GENERAR DESCRIPCIÓN (USANDO PLANTILLA DE CONFIGURACIÓN)
// ==============================
export async function generateDescription(vehicle) {
  const { data: config, error } = await supabase
    .from('app_config')
    .select('template_descripcion')
    .eq('id', 1)
    .single();

  let template = config?.template_descripcion;
  if (!template || template.trim() === '') {
    template = `{brand} {model} {year}

Motor {engine}
{mileage}
Transmisión {transmission}
{has_ac_text}
{vidrios_electricos}
{retrovisores_electricos}`;
  }

  const replacements = {
    '{brand}': vehicle.brand || '',
    '{model}': vehicle.model || '',
    '{year}': vehicle.year || '',
    '{type}': vehicle.type || '',
    '{tipo_cabina}': vehicle.tipo_cabina || '',
    '{cuatro_por_cuatro}': vehicle.cuatro_por_cuatro ? '4x4' : '',
    '{transmission}': vehicle.transmission || '',
    '{has_ac_text}': vehicle.has_ac ? 'Aire acondicionado' : '',
    '{vidrios_electricos}': vehicle.vidrios_electricos ? 'Vidrios eléctricos' : '',
    '{retrovisores_electricos}': vehicle.retrovisores_electricos ? 'Retrovisores eléctricos' : '',
    '{engine}': vehicle.engine || '',
    '{mileage}': vehicle.mileage ? formatMileage(vehicle.mileage) : '',
    '{price}': `$${vehicle.price.toLocaleString('es-ES')}`,
    '{article}': getArticle(vehicle.type),
    '{plate_formatted}': `${vehicle.plate?.charAt(0) || '?'}*${vehicle.plate?.slice(-2) || '??'}*`,
    '{negociable}': vehicle.negociable ? 'negociable' : 'no negociable',
  };

  let description = template;
  Object.entries(replacements).forEach(([key, value]) => {
    description = description.replaceAll(key, value);
  });

  return description;
}

// ==============================
// OBTENER VALORES PERSONALIZADOS POR VEHÍCULO
// ==============================
export async function getCustomValuesForVehicles(vehicleIds) {
  if (!vehicleIds || vehicleIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from('vehicle_custom_values')
    .select(`
      vehicle_id,
      value,
      custom_field_definitions (
        id,
        name,
        field_type
      )
    `)
    .in('vehicle_id', vehicleIds);
  if (error) throw error;
  return data;
}

// ==============================
// OBTENER VENTAS POR VEHÍCULO
// ==============================
export async function getSalesForVehicles(vehicleIds) {
  if (!vehicleIds || vehicleIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from('sales')
    .select('vehicle_id, sale_date, sold_by')
    .in('vehicle_id', vehicleIds);
  if (error) throw error;
  return data;
}

// ==============================
// OBTENER VEHÍCULO POR ID (con campos personalizados y venta)
// ==============================
export async function getVehicleById(id) {
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();
  if (vehicleError) throw vehicleError;

  const { data: customValues, error: customError } = await supabase
    .from('vehicle_custom_values')
    .select(`
      value,
      custom_field_definitions (
        id,
        name,
        field_type
      )
    `)
    .eq('vehicle_id', id);
  if (customError) throw customError;

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('sale_date, sold_by')
    .eq('vehicle_id', id)
    .maybeSingle();
  if (saleError) throw saleError;

  return {
    ...vehicle,
    custom_fields: customValues.map(cv => ({
      field_id: cv.custom_field_definitions.id,
      field_name: cv.custom_field_definitions.name,
      field_type: cv.custom_field_definitions.field_type,
      value: cv.value,
    })),
    sale_info: sale || null,
  };
}