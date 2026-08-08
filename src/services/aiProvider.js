export async function callAI(provider, apiKey, messages, vehicleContext) {
  const systemPrompt = `
Eres un asistente experto en ventas de autos. Ayudas al vendedor a negociar con clientes.
Contexto del vehículo:
${JSON.stringify(vehicleContext, null, 2)}

Reglas:
- Responde con un tono profesional y amable.
- Ofrece respuestas claras y persuasivas.
- Si el cliente pregunta por descuentos, sugiere argumentos basados en el estado del vehículo, kilometraje, etc.
- No inventes información que no esté en el contexto.
- La respuesta debe ser en español.
`;

  const userMessages = messages.map(m => ({
    role: m.role === 'cliente' ? 'user' : 'assistant',
    content: m.content,
  }));

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...userMessages,
  ];

  if (provider === 'claude') {
    return callClaude(apiKey, fullMessages);
  } else if (provider === 'deepseek') {
    return callDeepseek(apiKey, fullMessages);
  } else {
    throw new Error('Proveedor de IA no soportado');
  }
}

async function callClaude(apiKey, messages) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callDeepseek(apiKey, messages) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepseek API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}