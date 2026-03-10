import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Robust check: Ensure variables exist AND the URL is valid
  const isUrlValid = (url?: string) => url && (url.startsWith('http://') || url.startsWith('https://'));

  if (!isUrlValid(supabaseUrl) || !supabaseAnonKey) {
    // Return a minimal mock interface to prevent immediate crashes in server components
    return {
      auth: { 
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase URL not configured.' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({ 
        select: () => ({ 
          order: () => ({ 
            limit: () => ({ data: [], error: null }) 
          }), 
          eq: () => ({ data: [], error: null }),
          single: () => ({ data: null, error: null })
        }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }),
    } as any
  }

  return createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie setting might fail in certain server environments, usually handled by middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Cookie removal might fail in certain server environments
          }
        },
      },
    }
  )
}
