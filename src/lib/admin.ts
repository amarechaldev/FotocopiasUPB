import { SAVE_TIMEOUT_MS } from './entries'
import { supabase } from './supabase'

// The only file that uses Supabase Auth: staff use PINs, only the operator has a login.
// supabase-js keeps the session in localStorage, so a reload stays logged in.

export type Admin = {
  email: string
}

async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_admin')
    .abortSignal(AbortSignal.timeout(SAVE_TIMEOUT_MS))
  if (error) throw error
  return data === true
}

// Logs in, then checks the user is listed in admins (migration 0005); if not, logs out
// again and fails with 'not_admin' (see adminErrorMessage).
export async function signIn(email: string, password: string): Promise<Admin> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!(await checkIsAdmin())) {
    await supabase.auth.signOut()
    throw new Error('not_admin')
  }
  return { email: data.user.email ?? email }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// The admin already logged in on this browser, or null.
export async function currentAdmin(): Promise<Admin | null> {
  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null
  if (!(await checkIsAdmin())) {
    await supabase.auth.signOut()
    return null
  }
  return { email: user.email ?? '' }
}
