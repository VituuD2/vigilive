import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isUrlValid = (url?: string) => url && (url.startsWith('http://') || url.startsWith('https://'));

  if (!isUrlValid(supabaseUrl) || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase credentials missing or invalid URL. Mocking client to prevent crash.')
    }
    // Return a dummy client that implements the necessary interface to avoid runtime errors
    return {
      auth: {
        signInWithPassword: async () => ({ 
          data: { user: null, session: null }, 
          error: { message: 'Supabase configuration missing or invalid. Set URL and Key in environment variables.' } 
        }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          order: () => ({
            limit: () => ({ data: [], error: null }),
            eq: () => ({ data: [], error: null }),
            single: () => ({ data: null, error: null }),
          }),
          eq: () => ({ data: [], error: null }),
        }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}
