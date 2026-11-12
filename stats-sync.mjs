// Щогодини читає канал КМВА і додає до лічильників ракети/дрони, випущені по Києву.
import { getStore } from "@netlify/blobs";
import Anthropic from "@anthropic-ai/sdk";
import { page } from "../lib/tg.mjs";

const KEYS = ["bal", "cru", "kinj", "uav"];
const PROMPT = `Ти аналізуєш повідомлення Київської міської військової адміністрації.
Якщо це ПІДСУМКОВЕ повідомлення про атаку саме на місто Київ, де названо кількість засобів ураження, поверни їх кількість.
Якщо це не підсумок (попередження, тривога, наслідки без чисел, проміжне оновлення) — final=false.
Відповідай лише JSON: {"final":bool,"bal":int,"cru":int,"kinj":int,"uav":int}
bal — балістичні (Іскандер-М, KN-23, С-300, С-400), cru — крилаті (Х-101, Калібр, Іскандер-К, Х-59/69), kinj — Кинджал, uav — ударні дрони.`;

export default async () => {
  const store = getStore("kyiv-stats");
  const st = (await store.get("state", { type: "json" })) || { lastId: 0, add: {}, since: null, seen: [] };
  const msgs = await page("VA_Kyiv");
  if (!msgs.length) return;
  const ai = new Anthropic();
  const fresh = msgs.filter((m) => m.id > st.lastId && /ракет|балістичн|Кинджал|БпЛА|дрон|С-400/i.test(m.text));
  for (const m of fresh) {
    try {
      const r = await ai.messages.create({ model: "claude-haiku-5-5", max_tokens: 120, system: PROMPT, messages: [{ role: "user", content: m.text.slice(0, 3000) }] });
      const j = JSON.parse(r.content[0].text.match(/\{[\s\S]*\}/)[0]);
      if (j.final) for (const k of KEYS) st.add[k] = (st.add[k] || 0) + Math.max(0, Math.min(1000, j[k] | 0));
    } catch (e) { console.log("skip", m.id, e.message); }
  }
  st.lastId = Math.max(st.lastId, ...msgs.map((m) => m.id));
  st.since ||= msgs[0].time;
  st.updated = new Date().toISOString();
  await store.setJSON("state", st);
};
export const config = { schedule: "@hourly" };
