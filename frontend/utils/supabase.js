console.log(import.meta.env);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

export const supabase = createClient(supabaseUrl, supabaseKey);