import { supabase } from './supabaseClient';

export async function getConversationsByVehicle(vehicleId) {
  console.log('getConversationsByVehicle llamado para vehicleId:', vehicleId);
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error en getConversationsByVehicle:', error);
    throw error;
  }
  console.log('Conversaciones obtenidas:', data);
  return data;
}

export async function getConversationById(conversationId) {
  console.log('getConversationById llamado para conversationId:', conversationId);
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error en getConversationById:', error);
    throw error;
  }
  return data;
}

export async function createConversation(vehicleId, clientName = '') {
  console.log('createConversation llamado para vehicleId:', vehicleId);
  const insertData = {
    vehicle_id: vehicleId,
    messages: [],
    client_name: typeof clientName === 'string' ? clientName : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  console.log('Datos a insertar:', insertData);
  const { data, error } = await supabase
    .from('conversations')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('Error en createConversation:', error);
    throw error;
  }
  console.log('Conversación creada:', data);
  return data;
}

export async function saveConversation(conversationId, messages) {
  console.log('saveConversation llamado para conversationId:', conversationId, 'mensajes:', messages.length);
  // Asegurar que messages sea un array plano
  const safeMessages = Array.isArray(messages) ? messages : [];
  const { data, error } = await supabase
    .from('conversations')
    .update({
      messages: safeMessages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    console.error('Error en saveConversation:', error);
    throw error;
  }
  return data;
}

export async function closeConversation(conversationId) {
  console.log('closeConversation llamado para conversationId:', conversationId);
  const { error, count } = await supabase
    .from('conversations')
    .delete({ count: 'exact' })
    .eq('id', conversationId);

  if (error) {
    console.error('Error en closeConversation:', error);
    throw error;
  }
  console.log(`Filas eliminadas: ${count}`);
  if (count === 0) {
    throw new Error('No se eliminó ninguna fila (posiblemente la conversación ya no existe)');
  }
  console.log('Conversación eliminada correctamente');
  return true;
}

export function truncateMessages(messages, maxMessages = 12) {
  if (!Array.isArray(messages)) return [];
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
}