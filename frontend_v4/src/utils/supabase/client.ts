import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

// Sign up with email and password
export async function signUp(email: string, password: string, name: string) {
  try {
    // Use server endpoint to create user with auto-confirmation
    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5bba34db/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('Signup error:', error);
    return { user: null, error: error as Error };
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, session: null, error: error as Error };
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Google login error:', error);
    return { error: error as Error };
  }
}

// Sign in with GitHub
export async function signInWithGitHub() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('GitHub login error:', error);
    return { error: error as Error };
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Signout error:', error);
    return { error: error as Error };
  }
}

// Get current session
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;

    return { session, error: null };
  } catch (error) {
    console.error('Session error:', error);
    return { session: null, error: error as Error };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;

    return { user, error: null };
  } catch (error) {
    console.error('Get user error:', error);
    return { user: null, error: error as Error };
  }
}

// Send password reset email
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: error as Error };
  }
}

// Update password (after reset)
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: error as Error };
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// Get access token for API calls to your backend
export async function getAccessToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    return session?.access_token || null;
  } catch (error) {
    console.error('Get access token error:', error);
    return null;
  }
}