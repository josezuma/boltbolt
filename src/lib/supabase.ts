import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Make TypeScript happy by ensuring supabase is never null
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current values:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey ? '[PRESENT]' : '[MISSING]' });
}

// Enhanced error handling for network issues
const handleNetworkError = (error: any, operation: string) => {
  console.error(`Network error during ${operation}:`, error);
  
  if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
    throw new Error(`Unable to connect to the database. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.`);
  }
  
  if (error.message?.includes('CORS')) {
    throw new Error(`Cross-origin request blocked. Please check your Supabase project configuration.`);
  }
  
  if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
    throw new Error(`Authentication failed. Please check your API keys.`);
  }
  
  throw error;
};

// Create Supabase client with enhanced configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }).catch(error => {
        handleNetworkError(error, `fetch to ${url}`);
      });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Enhanced test connection function with retry logic
export const testSupabaseConnection = async () => {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Testing Supabase connection (attempt ${attempt}/${maxRetries})...`);
      const { data, error } = await supabase.from('products').select('count').limit(1);
      if (error) throw error;
      console.log('Supabase connection test successful');
      return true;
    } catch (error) {
      lastError = error;
      console.error(`Connection test attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  try {
    handleNetworkError(lastError, 'connection test');
  } catch (error) {
    console.error('All connection test attempts failed:', error);
    throw error;
  }
};

// Helper function to execute Supabase queries with error handling
export const executeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  operation: string
): Promise<T> => {
  try {
    const { data, error } = await queryFn();
    if (error) throw error;
    return data as T;
  } catch (error) {
    handleNetworkError(error, operation);
    throw error; // This line won't be reached due to handleNetworkError throwing
  }
};

export type { Database };