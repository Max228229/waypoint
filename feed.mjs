import { page } from "../lib/tg.mjs";
export default async () => {
  try {
    let msgs = await page("waypoint_ua");
    if (msgs.length) msgs = (await page("waypoint_ua", Math.min(...msgs.map((m) => m.id))).catch(() => [])).concat(msgs);
    const seen = new Set();
    msgs = msgs.filter((m) => !seen.has(m.id) && seen.add(m.id)).sort((a, b) => a.id - b.id);
    return Response.json(msgs, { headers: { "Cache-Control": "public, max-age=0, must-revalidate", "Netlify-CDN-Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } });
  } catch { return Response.json({ error: "feed unavailable" }, { status: 502 }); }
};
export const config = { path: "/api/feed" };
