// supabase/functions/ai-negotiate/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const decoded = await jose.decodeJwt(token);
    return decoded.sub || null;
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

// Función para reemplazar placeholders en el prompt con datos reales
function replacePlaceholders(prompt: string, vehicle: any, sellerName: string, businessLocation: string): string {
  const replacements: Record<string, string> = {
    '{tipo}': vehicle.type || '',
    '{marca}': vehicle.brand || '',
    '{modelo}': vehicle.model || '',
    '{año}': String(vehicle.year || ''),
    '{precio}': String(vehicle.price || ''),
    '{kilometraje}': String(vehicle.mileage || ''),
    '{motor}': vehicle.engine || 'No especificado',
    '{combustible}': vehicle.fuel_type || '',
    '{transmision}': vehicle.transmission || '',
    '{color}': vehicle.color || '',
    '{aire_acondicionado}': vehicle.has_ac ? 'Sí' : 'No',
    '{vidrios_electricos}': vehicle.vidrios_electricos ? 'Sí' : 'No',
    '{retrovisores_electricos}': vehicle.retrovisores_electricos ? 'Sí' : 'No',
    '{cuatro_por_cuatro}': vehicle.cuatro_por_cuatro ? 'Sí' : 'No',
    '{negociable}': vehicle.negociable ? 'Sí' : 'No',
    '{tipo_cabina}': vehicle.tipo_cabina || '',
    '{placa}': vehicle.plate || '',
    '{status}': vehicle.status || '',
    '{sellerName}': sellerName,
    '{businessLocation}': businessLocation,
    '{JSON_vehiculo}': JSON.stringify(vehicle, null, 2),
  };

  let result = prompt;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let token = null;
    const authHeader = req.headers.get('Authorization');
    const apikeyHeader = req.headers.get('apikey');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (apikeyHeader) {
      token = apikeyHeader;
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { conversationId, clientMessage, vendorReply, mode } = body;

    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*, vehicles(*)')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vehicle = conversation.vehicles;
    if (!vehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found for conversation' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: config, error: configError } = await supabase
      .from('app_config')
      .select('ai_provider, claude_api_key, deepseek_api_key, seller_name, business_location, system_prompt_generate, system_prompt_correct')
      .eq('id', 1)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'App configuration not found' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const provider = config.ai_provider || 'claude';
    const apiKey = provider === 'claude' ? config.claude_api_key : config.deepseek_api_key;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: `API key for ${provider} is not configured` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sellerName = config.seller_name || 'Dario';
    const businessLocation = config.business_location || 'Av. Espana 16-70';
    const messages = conversation.messages || [];

    let systemPrompt: string;
    let userMessages: any[];

    if (mode === 'correct' && vendorReply) {
      const lastClientMsg = messages.filter((m: any) => m.role === 'cliente').pop();
      const clientContent = lastClientMsg?.content || 'No hay mensaje del cliente.';

      if (!config.system_prompt_correct) {
        return new Response(JSON.stringify({ error: 'El prompt de corrección no está configurado' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reemplazar placeholders en el prompt de corrección
      systemPrompt = replacePlaceholders(config.system_prompt_correct, vehicle, sellerName, businessLocation);

      userMessages = [
        { role: 'user', content: `Mensaje del cliente: ${clientContent}` },
        { role: 'assistant', content: `Respuesta propuesta por el vendedor: ${vendorReply}` },
        { role: 'user', content: 'Por favor, corrige y mejora la respuesta del vendedor siguiendo las instrucciones.' },
      ];

    } else {
      const updatedMessages = [
        ...messages,
        { role: 'cliente', content: clientMessage },
      ];
      const truncated = updatedMessages.slice(-12);

      if (!config.system_prompt_generate) {
        return new Response(JSON.stringify({ error: 'El prompt de generación no está configurado' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reemplazar placeholders en el prompt de generación
      systemPrompt = replacePlaceholders(config.system_prompt_generate, vehicle, sellerName, businessLocation);

      userMessages = truncated.map((m: any) => ({
        role: m.role === 'cliente' ? 'user' : 'assistant',
        content: m.content,
      }));
    }

    let aiResponse: string;
    if (provider === 'claude') {
      aiResponse = await callClaude(apiKey, systemPrompt, userMessages);
    } else if (provider === 'deepseek') {
      aiResponse = await callDeepseek(apiKey, systemPrompt, userMessages);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function callClaude(apiKey: string, systemPrompt: string, messages: any[]) {
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
      system: systemPrompt,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callDeepseek(apiKey: string, systemPrompt: string, messages: any[]) {
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: fullMessages,
      temperature: 0.8,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepseek API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}