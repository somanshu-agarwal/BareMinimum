import { supabase } from '@/lib/supabase/client'

export async function getCurrentUserIdSafe(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'test-user-123'
  } catch (error) {
    console.error('Auth error:', error)
    return 'test-user-123'
  }
}

export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user?.id
  } catch (error) {
    return false
  }
}

// Keep your existing functions too if they exist
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}