import { supabase } from './supabase'

export async function signUp({ email, password, nome, cognome }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome, cognome } },
  })
  return { data, error }
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function isAdmin(userId) {
  const { data } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .single()
  return !!data
}
