import { createClient } from "@supabase/supabase-js";

let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _client;
}

// Proxy — client зөвхөн API дуудах үед үүснэ, build-д биш
const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  },
});

export default supabase;
