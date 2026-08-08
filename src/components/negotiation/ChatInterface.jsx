import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';

export function ChatInterface({
  conversations,
  selectedConversation,
  selectedVehicle,
  onSelectConversation,
  onCreateNew,
  onDelete,
  messages,
  onSendMessage,
  onCorrectReply,
  onSaveClientMessage,
  onSaveManualReply,
  loading,
  suggestedResponse,
  onCopyResponse,
  error,
  notification,
}) {
  const [clientMessage, setClientMessage] = useState('');
  const [vendorReply, setVendorReply] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendToAI = (e) => {
    e.preventDefault();
    if (!clientMessage.trim()) return;
    onSendMessage(clientMessage);
    setClientMessage('');
  };

  const handleCorrectReply = (e) => {
    e.preventDefault();
    if (!clientMessage.trim() || !vendorReply.trim()) {
      return;
    }
    onCorrectReply(clientMessage, vendorReply);
  };

  const handleSaveClientMessage = (e) => {
    e.preventDefault();
    if (!clientMessage.trim()) return;
    onSaveClientMessage(clientMessage);
    setClientMessage('');
  };

  const handleSaveManualReply = (e) => {
    e.preventDefault();
    if (!vendorReply.trim()) return;
    onSaveManualReply(vendorReply);
    setVendorReply('');
  };

  const handleSelectConversation = (e) => {
    const id = e.target.value;
    if (id) {
      onSelectConversation(id);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const vehicleLabel = selectedVehicle
    ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}`
    : 'Vehículo';

  // Determinar si hay conversaciones
  const hasConversations = conversations.length > 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4">
      {/* Notificación interna */}
      {notification && notification.message && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${
          notification.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' :
          notification.type === 'error' ? 'bg-red-500/20 border border-red-500/30 text-red-300' :
          'bg-blue-500/20 border border-blue-500/30 text-blue-300'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-white font-semibold text-lg">Conversación</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCreateNew}
            disabled={loading}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition disabled:opacity-50"
          >
            + Nuevo chat
          </button>
          {selectedConversation && (
            <button
              onClick={onDelete}
              disabled={loading}
              className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-300 text-sm rounded-lg border border-red-500/30 transition disabled:opacity-50"
            >
              Eliminar chat
            </button>
          )}
        </div>
      </div>

      {/* Selector de conversaciones */}
      {hasConversations && (
        <div className="mb-3">
          <select
            value={selectedConversation?.id || ''}
            onChange={handleSelectConversation}
            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
          >
            <option value="">Selecciona un chat</option>
            {conversations.map((conv) => (
              <option key={conv.id} value={conv.id}>
                {vehicleLabel} - {formatDateTime(conv.created_at)}
                {conv.client_name ? ` (${conv.client_name})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mensaje cuando no hay conversaciones */}
      {!hasConversations && (
        <div className="text-center py-8 border border-white/10 rounded-xl bg-white/5 mb-4">
          <p className="text-white/60 text-lg">No hay conversaciones</p>
          <p className="text-white/40 text-sm mt-2">Haz clic en "Nuevo chat" para empezar a negociar.</p>
        </div>
      )}

      {/* Mensaje cuando hay conversaciones pero ninguna seleccionada */}
      {hasConversations && !selectedConversation && (
        <div className="text-white/60 text-center py-4 mb-4">
          <p>Selecciona un chat de la lista para ver los mensajes.</p>
        </div>
      )}

      {/* Área de mensajes */}
      {selectedConversation && (
        <>
          <div className="max-h-96 overflow-y-auto mb-4 space-y-1">
            {messages.length === 0 && (
              <p className="text-white/40 text-sm text-center py-4">
                No hay mensajes. Escribe el mensaje del cliente para comenzar.
              </p>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            <div ref={chatEndRef} />
          </div>

          <form className="flex flex-col gap-3">
            <div className="flex gap-2">
              <textarea
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Pega aquí el mensaje enviado por el cliente..."
                rows={3}
                className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                disabled={loading || !selectedConversation}
              />
              <button
                onClick={handleSaveClientMessage}
                disabled={loading || !selectedConversation}
                className="px-3 py-1 bg-blue-500/20 backdrop-blur-sm hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition self-start text-sm"
              >
                Guardar
              </button>
            </div>

            <div className="flex gap-2">
              <textarea
                value={vendorReply}
                onChange={(e) => setVendorReply(e.target.value)}
                placeholder="Escribe aquí tu respuesta propuesta..."
                rows={2}
                className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                disabled={loading || !selectedConversation}
              />
              <button
                onClick={handleSaveManualReply}
                disabled={loading || !selectedConversation}
                className="px-3 py-1 bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 text-green-300 rounded-lg border border-green-500/30 transition self-start text-sm"
              >
                Guardar
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSendToAI}
                disabled={loading || !selectedConversation}
                className="flex-1 min-w-[120px] py-2 px-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Consultando IA...' : 'Generar respuesta desde cero'}
              </button>
              <button
                type="button"
                onClick={handleCorrectReply}
                disabled={loading || !selectedConversation}
                className="flex-1 min-w-[120px] py-2 px-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold rounded-xl border border-white/30 shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Corrigiendo...' : 'Corregir mi respuesta'}
              </button>
            </div>
          </form>
        </>
      )}

      {error && (
        <div className="mt-3 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      )}

      {suggestedResponse && (
        <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <p className="text-white/70 text-xs font-medium mb-1">Respuesta sugerida por IA:</p>
          <p className="text-white text-sm whitespace-pre-wrap">{suggestedResponse}</p>
          <button
            onClick={() => onCopyResponse(suggestedResponse)}
            className="mt-2 px-3 py-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-xs rounded-lg border border-white/20 transition"
          >
            Copiar respuesta
          </button>
        </div>
      )}
    </div>
  );
}