import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabaseClient';
import { getVehicles } from '../services/vehicleService';
import { getAppConfig } from '../services/configService';
import {
  getConversationsByVehicle,
  getConversationById,
  createConversation,
  saveConversation,
  closeConversation,
  truncateMessages,
} from '../services/negotiationService';

console.log('useNegotiation - version con logs de depuracion');

export function useNegotiation() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState('');
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  const [notification, setNotification] = useState({ message: '', type: 'info' });

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 4000);
  };

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await getVehicles({ status: 'todos' });
        const available = data.filter(v => v.status !== 'vendido');
        setVehicles(available);
      } catch (err) {
        console.error('Error al cargar vehiculos:', err);
        setError('No se pudieron cargar los vehiculos');
      }
    };
    loadVehicles();
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const cfg = await getAppConfig();
        setConfig(cfg);
      } catch (err) {
        console.error('Error al cargar configuracion:', err);
        setError('No se pudo cargar la configuracion de IA');
      }
    };
    loadConfig();
  }, []);

  const selectVehicle = useCallback(async (vehicleId) => {
    console.log('selectVehicle llamado con vehicleId:', vehicleId);
    setLoading(true);
    setError(null);
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      console.log('Vehiculo encontrado:', vehicle ? `${vehicle.brand} ${vehicle.model}` : 'NO ENCONTRADO');
      if (!vehicle) throw new Error('Vehiculo no encontrado');
      setSelectedVehicle(vehicle);

      console.log('Obteniendo conversaciones para vehicleId:', vehicleId);
      let convs = await getConversationsByVehicle(vehicleId);
      console.log('Conversaciones obtenidas (antes de limpieza):', convs.length);

      const now = new Date();
      const toDelete = [];
      for (const conv of convs) {
        const updated = new Date(conv.updated_at);
        const diffHours = (now - updated) / (1000 * 60 * 60);
        if (diffHours > 24) {
          toDelete.push(conv.id);
        }
      }
      console.log('Conversaciones a eliminar por inactividad:', toDelete.length);
      for (const id of toDelete) {
        await closeConversation(id);
      }

      convs = await getConversationsByVehicle(vehicleId);
      console.log('Conversaciones despues de limpieza:', convs.length);
      setConversations(convs);

      if (convs.length > 0) {
        console.log('Hay conversaciones, seleccionando la primera');
        const first = convs[0];
        setSelectedConversation(first);
        setMessages(first.messages || []);
      } else {
        console.log('NO HAY CONVERSACIONES - NO se crea chat automaticamente');
        setSelectedConversation(null);
        setMessages([]);
      }
      setSuggestedResponse('');
    } catch (err) {
      console.error('Error en selectVehicle:', err);
      setError('No se pudo cargar la conversacion');
    } finally {
      setLoading(false);
      console.log('selectVehicle finalizado');
    }
  }, [vehicles]);

  const createNewConversation = useCallback(async (clientName = '') => {
    console.log('createNewConversation llamado');
    if (!selectedVehicle) {
      showNotification('Primero selecciona un vehiculo', 'error');
      return;
    }
    const name = typeof clientName === 'string' ? clientName : '';
    setLoading(true);
    try {
      const newConv = await createConversation(selectedVehicle.id, name);
      console.log('Nueva conversacion creada:', newConv.id);
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setMessages([]);
      setSuggestedResponse('');
      showNotification('Nuevo chat creado correctamente', 'success');
    } catch (err) {
      console.error('Error al crear conversacion:', err);
      showNotification('Error al crear conversacion: ' + err.message, 'error');
      setError('No se pudo crear la conversacion');
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  const selectConversation = useCallback(async (conversationId) => {
    console.log('selectConversation llamado para:', conversationId);
    setLoading(true);
    try {
      const conv = await getConversationById(conversationId);
      if (!conv) throw new Error('Conversacion no encontrada');
      setSelectedConversation(conv);
      setMessages(conv.messages || []);
      setSuggestedResponse('');
    } catch (err) {
      console.error('Error al cargar conversacion:', err);
      setError('No se pudo cargar la conversacion');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCurrentConversation = useCallback(async () => {
    console.log('deleteCurrentConversation llamado');
    if (!selectedConversation) {
      showNotification('No hay conversacion seleccionada', 'error');
      return;
    }
    if (!selectedVehicle) {
      showNotification('No hay vehiculo seleccionado', 'error');
      return;
    }
    setLoading(true);
    try {
      await closeConversation(selectedConversation.id);
      console.log('Conversacion eliminada');
      showNotification('Chat eliminado correctamente', 'success');

      const updatedConvs = await getConversationsByVehicle(selectedVehicle.id);
      setConversations(updatedConvs);

      if (updatedConvs.length > 0) {
        const first = updatedConvs[0];
        setSelectedConversation(first);
        setMessages(first.messages || []);
      } else {
        setSelectedConversation(null);
        setMessages([]);
      }
      setSuggestedResponse('');
    } catch (err) {
      console.error('Error al eliminar conversacion:', err);
      showNotification('Error al eliminar chat: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, selectedVehicle]);

  // ===== FUNCIÓN MODIFICADA: usa supabase.functions.invoke =====
  const invokeEdgeFunction = async (conversationId, clientMessage, vendorReply = null, mode = 'generate') => {
    const body = {
      conversationId,
      clientMessage,
      ...(vendorReply && { vendorReply }),
      ...(mode === 'correct' && { mode: 'correct' }),
    };

    console.log('Invoking Edge Function con body:', body);

    const { data, error } = await supabase.functions.invoke('ai-negotiate', {
      body: body,
    });

    if (error) {
      console.error('Error en invoke:', error);
      throw new Error(error.message || 'Error al comunicarse con la IA');
    }

    if (!data || !data.response) {
      console.error('Respuesta vacía:', data);
      throw new Error('Respuesta vacía del servidor de IA');
    }

    console.log('Respuesta de Edge Function:', data);
    return data.response;
  };

  const sendMessageToAI = useCallback(async (clientMessage) => {
    console.log('sendMessageToAI llamado');
    if (!selectedConversation) {
      setError('No hay conversacion seleccionada');
      return;
    }
    if (!clientMessage.trim()) {
      setError('Ingresa el mensaje del cliente');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestedResponse('');

    try {
      const newMessages = [...messages, { role: 'cliente', content: clientMessage.trim() }];
      const truncated = truncateMessages(newMessages, 12);

      const aiResponse = await invokeEdgeFunction(
        selectedConversation.id,
        clientMessage.trim()
      );

      const updatedMessages = [...truncated, { role: 'vendedor', content: aiResponse }];
      await saveConversation(selectedConversation.id, updatedMessages);
      setMessages(updatedMessages);
      setSuggestedResponse(aiResponse);

      const updatedConvs = await getConversationsByVehicle(selectedVehicle.id);
      setConversations(updatedConvs);
    } catch (err) {
      console.error('Error al enviar mensaje a IA:', err);
      setError(err.message || 'Error al obtener respuesta de IA');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, messages, selectedVehicle]);

  const correctReply = useCallback(async (clientMessage, vendorReply) => {
    console.log('correctReply llamado');
    if (!selectedConversation) {
      setError('No hay conversacion seleccionada');
      return;
    }
    if (!clientMessage.trim() || !vendorReply.trim()) {
      setError('Debes ingresar tanto el mensaje del cliente como tu respuesta propuesta.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestedResponse('');

    try {
      let updatedMessages = [...messages];
      const lastClientMsg = updatedMessages.filter(m => m.role === 'cliente').pop();
      if (!lastClientMsg || lastClientMsg.content !== clientMessage.trim()) {
        updatedMessages.push({ role: 'cliente', content: clientMessage.trim() });
      }
      const truncated = truncateMessages(updatedMessages, 12);

      const correctedResponse = await invokeEdgeFunction(
        selectedConversation.id,
        clientMessage.trim(),
        vendorReply.trim(),
        'correct'
      );

      const finalMessages = [...truncated, { role: 'vendedor', content: correctedResponse }];
      await saveConversation(selectedConversation.id, finalMessages);
      setMessages(finalMessages);
      setSuggestedResponse(correctedResponse);

      const updatedConvs = await getConversationsByVehicle(selectedVehicle.id);
      setConversations(updatedConvs);
    } catch (err) {
      console.error('Error al corregir respuesta:', err);
      setError(err.message || 'Error al corregir la respuesta');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, messages, selectedVehicle]);

  const saveClientMessage = useCallback(async (clientMessage) => {
    console.log('saveClientMessage llamado');
    if (!selectedConversation) {
      setError('No hay conversacion seleccionada');
      return;
    }
    if (!clientMessage.trim()) {
      setError('Ingresa el mensaje del cliente');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newMessages = [...messages, { role: 'cliente', content: clientMessage.trim() }];
      const truncated = truncateMessages(newMessages, 12);
      await saveConversation(selectedConversation.id, truncated);
      setMessages(truncated);

      const updatedConvs = await getConversationsByVehicle(selectedVehicle.id);
      setConversations(updatedConvs);
      showNotification('Mensaje del cliente guardado', 'success');
    } catch (err) {
      console.error('Error al guardar mensaje del cliente:', err);
      setError(err.message || 'Error al guardar el mensaje');
      showNotification('Error al guardar mensaje del cliente', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, messages, selectedVehicle]);

  const saveManualReply = useCallback(async (vendorReply) => {
    console.log('saveManualReply llamado');
    if (!selectedConversation) {
      setError('No hay conversacion seleccionada');
      return;
    }
    if (!vendorReply.trim()) {
      setError('Ingresa tu respuesta manual');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newMessages = [...messages, { role: 'vendedor', content: vendorReply.trim() }];
      const truncated = truncateMessages(newMessages, 12);
      await saveConversation(selectedConversation.id, truncated);
      setMessages(truncated);

      const updatedConvs = await getConversationsByVehicle(selectedVehicle.id);
      setConversations(updatedConvs);
      showNotification('Respuesta manual guardada', 'success');
    } catch (err) {
      console.error('Error al guardar respuesta manual:', err);
      setError(err.message || 'Error al guardar la respuesta');
      showNotification('Error al guardar respuesta manual', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, messages, selectedVehicle]);

  const copyResponse = useCallback((text) => {
    navigator.clipboard.writeText(text);
    showNotification('Respuesta copiada al portapapeles', 'success');
  }, []);

  return {
    vehicles,
    selectedVehicle,
    conversations,
    selectedConversation,
    messages,
    loading,
    error,
    suggestedResponse,
    config,
    notification,
    selectVehicle,
    createNewConversation,
    selectConversation,
    deleteCurrentConversation,
    sendMessageToAI,
    correctReply,
    saveClientMessage,
    saveManualReply,
    copyResponse,
  };
}