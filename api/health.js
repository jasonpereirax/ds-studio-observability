import { cors } from "./_supabase.js";
export default async function handler(req, res) {
  cors(res);
  return res.status(200).json({ ok: true, module: "ds-studio-observability", timestamp: new Date().toISOString() });
}
