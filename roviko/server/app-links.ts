// 1.51: the files that let roviko.app links open the iOS app (apple-app-site-association) and the Android app
// (assetlinks.json). Served by the worker from deploy variables; see worker/index.ts and scripts/deploy-cloudflare.sh.
/** Paths that stay in the browser: Google sign-in (its own browser flow) and the owner's pages. */
const WEB_ONLY = ["/api/auth/google*", "/admin*"];
export function appLinks(path: string, env: { APPLE_TEAM_ID?: string; ANDROID_CERT_SHA256?: string }): Response {
  const headers = { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" };
  if (path.endsWith("apple-app-site-association")) {
    const team = (env.APPLE_TEAM_ID ?? "").trim();
    if (!/^[A-Z0-9]{10}$/.test(team)) return new Response("Not found", { status: 404 });
    return new Response(JSON.stringify({ applinks: { details: [{ appIDs: [team + ".com.roviko.app"], components: [...WEB_ONLY.map(p => ({ "/": p, exclude: true })), { "/": "*" }] }] } }), { headers });
  }
  // One or more fingerprints, comma separated, with or without colons (the deploy strips them).
  const prints = (env.ANDROID_CERT_SHA256 ?? "").split(",").map(v => v.replace(/[^0-9a-f]/gi, "").toUpperCase()).filter(v => v.length === 64).map(v => v.match(/../g)!.join(":"));
  if (!prints.length) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify([{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: "com.roviko.app", sha256_cert_fingerprints: prints } }]), { headers });
}

