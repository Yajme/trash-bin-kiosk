import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();
//Get the connection string from the environment variables


const supabase_url = process.env.SUPABASE_URL;
const supabase_anon_key = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabase_url, supabase_anon_key);



  const initSupabase=(realtime)=>{
// Subscribe to changes in a specific table
supabase
  .channel('realtime:qrcode')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'qrcode' },
    (payload) => {
      const indexed_payload = payload.new;
      realtime(indexed_payload);
      console.log('Real-time change:', indexed_payload);
    }
  )
  .subscribe();
  }

  export {
    initSupabase
  }