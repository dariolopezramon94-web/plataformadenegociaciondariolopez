import React from 'react';
import { useNegotiation } from '../hooks/useNegotiation';
import { VehicleSelector } from '../components/negotiation/VehicleSelector';
import { ChatInterface } from '../components/negotiation/ChatInterface';

export function NegotiationPage() {
  const {
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
  } = useNegotiation();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
        Negociación con IA
      </h1>
      <p className="text-white/60 text-sm">
        Selecciona un vehículo. Puedes tener múltiples conversaciones para diferentes clientes.
      </p>

      {config && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-white/50 text-xs flex flex-wrap gap-4">
          <span>Proveedor: <span className="text-white/70">{config.ai_provider}</span></span>
          <span>Vendedor: <span className="text-white/70">{config.seller_name}</span></span>
          <span>Ubicación: <span className="text-white/70">{config.business_location || 'No configurada'}</span></span>
        </div>
      )}

      <VehicleSelector
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelect={selectVehicle}
        disabled={loading}
      />

      {selectedVehicle && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-white/70 text-sm">
          <p><strong>Vehículo seleccionado:</strong> {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year}) - {selectedVehicle.plate}</p>
          <p className="text-xs text-white/50">Precio: ${selectedVehicle.price.toLocaleString()} | Kilometraje: {selectedVehicle.mileage} km</p>
          <p className="text-xs text-white/40 mt-1">Conversaciones activas: {conversations.length}</p>
        </div>
      )}

      <ChatInterface
        conversations={conversations}
        selectedConversation={selectedConversation}
        selectedVehicle={selectedVehicle}
        onSelectConversation={selectConversation}
        onCreateNew={createNewConversation}
        onDelete={deleteCurrentConversation}
        messages={messages}
        onSendMessage={sendMessageToAI}
        onCorrectReply={correctReply}
        onSaveClientMessage={saveClientMessage}
        onSaveManualReply={saveManualReply}
        loading={loading}
        suggestedResponse={suggestedResponse}
        onCopyResponse={copyResponse}
        error={error}
        notification={notification}
      />
    </div>
  );
}