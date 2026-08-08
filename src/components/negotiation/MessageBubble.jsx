import React from 'react';

export function MessageBubble({ message }) {
  const isClient = message.role === 'cliente';
  const isVendor = message.role === 'vendedor';

  return (
    <div className={`flex ${isClient ? 'justify-start' : 'justify-end'} mb-2`}>
      <div
        className={`max-w-[80%] p-3 rounded-xl border backdrop-blur-sm ${
          isClient
            ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
            : 'bg-white/10 border-white/20 text-white'
        }`}
      >
        <div className="text-xs opacity-70 mb-1">
          {isClient ? 'Cliente' : 'Vendedor'}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    </div>
  );
}