import { supabase } from './supabaseClient';

export async function login(email, password) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;

  const user = authData.user;
  if (!user) throw new Error('No se obtuvo el usuario');

  // Obtener perfil con rol
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile) throw new Error('Perfil de usuario no encontrado');

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
  };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
  };
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}