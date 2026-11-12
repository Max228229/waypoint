import { getStore } from "@netlify/blobs";
export default async () => {
  const st = await getStore("kyiv-stats").get("state", { type: "json" });
  return Response.json({ add: st?.add || {}, since: st?.since || null, updated: st?.updated || null },
    { headers: { "Netlify-CDN-Cache-Control": "public, s-maxage=300" } });
};
export const config = { path: "/api/stats" };
