import { supabase } from './supabaseClient';

// ==============================
// OBTENER VEHÍCULOS (con filtro por publicación)
// ==============================
export async function getVehicles(filters = {}) {
  let query = supabase
    .from('vehicles')
    .select('*')
    .order('brand', { ascending: true })
    .order('model', { ascending: true });

  // Filtro por estado
  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status);
  } else {
    query = query.neq('status', 'vendido');
  }

  // Filtro por mes (solo para vendidos)
  if (filters.month && filters.status === 'vendido') {
    const startDate = `${filters.month}-01`;
    const endDate = `${filters.month}-31`;
    query = query
      .gte('created_at', startDate)
      .lte('created_at', endDate);
  }

  // NUEVO FILTRO: Publicado en Marketplace
  if (filters.publicado !== undefined && filters.publicado !== 'todos') {
    const isPublished = filters.publicado === 'si';
    query = query.eq('publicado_marketplace', isPublished);
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
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ==============================
// GENERAR MENSAJE PERSONALIZADO (completo - "disponible")
// ==============================
export function generateCustomMessage(vehicle) {
  const getArticle = (type) => {
    if (!type) return 'el';
    const lower = type.toLowerCase();
    const femeninos = ['camioneta', 'suv', 'furgoneta'];
    if (femeninos.includes(lower)) return 'la';
    if (lower.endsWith('a')) return 'la';
    return 'el';
  };

  const article = getArticle(vehicle.type);
  const typeName = vehicle.type || 'vehículo';
  const priceFormatted = vehicle.price.toLocaleString('es-ES');
  const kmFormatted = vehicle.mileage.toLocaleString('es-ES');

  let message = `Sí, ${article} ${typeName} ${vehicle.brand} ${vehicle.model} ${vehicle.year} sigue disponible.\n\n`;

  message += `El precio es de $${priceFormatted}. `;

  if (vehicle.negociable) {
    message += `Si la compra es de contado, el precio es negociable; si desea financiarlo, también podemos conversar el precio, dependiendo del valor de la entrada. `;
  } else {
    message += `El precio es fijo. `;
  }

  const engine = vehicle.engine || 'No especificado';
  const hasAC = vehicle.has_ac ? ' y cuenta con aire acondicionado' : '';
  message += `El vehículo tiene ${kmFormatted} km, es motor ${engine}${hasAC}. `;

  const plate = vehicle.plate || '';
  const firstChar = plate.charAt(0) || '?';
  const lastTwo = plate.length >= 2 ? plate.slice(-2) : (plate || '??');
  message += `La placa es ${firstChar}*${lastTwo}*. `;

  const features = [];
  if (vehicle.cuatro_por_cuatro) features.push('es 4x4');
  if (vehicle.vidrios_electricos) features.push('tiene vidrios eléctricos');
  if (vehicle.retrovisores_electricos) features.push('tiene retrovisores eléctricos');

  if (features.length > 0) {
    message += `Además, ${features.join(', ')}. `;
  }

  message += '\n\n';

  message += `Si desea conocerlo y revisar todos los detalles, puede ver el vehículo directamente en Automotores Jara, ubicado en la Av. España 16-70. `;
  message += `Al llegar, por favor indique que vio la publicación de Darío López en redes sociales. Como somos varios compañeros, esto nos ayudará a identificar su consulta y a brindarle una mejor atención.\n\n`;

  message += `Si gusta, también puede escribirme y le ayudo con cualquier duda antes de que se acerque al patio.`;

  return message;
}

// ==============================
// GENERAR MENSAJE PARA "SOLO PRECIO"
// ==============================
export function generatePriceMessage(vehicle) {
  const getArticle = (type) => {
    if (!type) return 'el';
    const lower = type.toLowerCase();
    const femeninos = ['camioneta', 'suv', 'furgoneta'];
    if (femeninos.includes(lower)) return 'la';
    if (lower.endsWith('a')) return 'la';
    return 'el';
  };

  const article = getArticle(vehicle.type);
  const typeName = vehicle.type || 'vehículo';
  const priceFormatted = vehicle.price.toLocaleString('es-ES');
  const kmFormatted = vehicle.mileage.toLocaleString('es-ES');
  const engine = vehicle.engine || 'No especificado';
  const hasAC = vehicle.has_ac ? ' y cuenta con aire acondicionado' : '';
  const negociable = vehicle.negociable ? 'negociable' : 'no negociable';

  let message = `El precio de ${article} ${typeName} ${vehicle.brand} ${vehicle.model} ${vehicle.year} es de $${priceFormatted} ${negociable}.\n\n`;

  message += `Tiene ${kmFormatted} km, motor ${engine}, transmisión ${vehicle.transmission}${hasAC}.\n\n`;

  message += `Puede venir a verlo y revisarlo personalmente en Automotores Jara, ubicado en la Av. España 16-70.\n\n`;

  message += `Al llegar al patio, por favor indique que vio la publicación del vehículo en redes sociales de Darío López, ya que somos varios compañeros y esto permitirá que le puedan brindar una mejor atención.`;

  return message;
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