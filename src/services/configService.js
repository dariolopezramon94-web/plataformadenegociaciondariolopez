import { supabase } from './supabaseClient';

export async function getAppConfig() {
  let { data, error } = await supabase
    .from('app_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (!data) {
    const defaultConfig = {
      id: 1,
      ai_provider: 'claude',
      claude_api_key: '',
      deepseek_api_key: '',
      seller_name: 'Dario',
      business_location: '',
      system_prompt_generate: '',
      system_prompt_correct: '',
    };
    const { data: newData, error: insertError } = await supabase
      .from('app_config')
      .insert([defaultConfig])
      .select()
      .single();
    if (insertError) throw insertError;
    return newData;
  }

  if (error) throw error;
  return data;
}

export async function updateAppConfig(config) {
  const { error } = await supabase
    .from('app_config')
    .update(config)
    .eq('id', 1);

  if (error) throw error;
}

export async function testConnection(provider, apiKey) {
  if (provider === 'claude') {
    return testClaudeConnection(apiKey);
  } else if (provider === 'deepseek') {
    return testDeepseekConnection(apiKey);
  } else {
    throw new Error('Proveedor no soportado');
  }
}

async function testClaudeConnection(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hola' }],
      }),
    });
    if (response.ok) {
      return { success: true, message: 'Conexión exitosa' };
    } else {
      const error = await response.text();
      return { success: false, message: `Error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `Error de red: ${err.message}` };
  }
}

async function testDeepseekConnection(apiKey) {
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hola' }],
        max_tokens: 5,
      }),
    });
    if (response.ok) {
      return { success: true, message: 'Conexión exitosa' };
    } else {
      const error = await response.text();
      return { success: false, message: `Error: ${error}` };
    }
  } catch (err) {
    return { success: false, message: `Error de red: ${err.message}` };
  }
}