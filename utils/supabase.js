import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SUPABASE_URL = 'https://tdqfccnhoqgavomgibik.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcWZjY25ob3FnYXZvbWdpYmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MjQ5NjcsImV4cCI6MjA2MDMwMDk2N30.cvmIDcI4ac-BSed8s497u9CaOF3dnNcol2I4IN-u9VY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });