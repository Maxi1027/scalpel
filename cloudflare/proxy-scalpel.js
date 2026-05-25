// Cloudflare Worker — Proxy /scalpel/* to SCALPEL Vercel deployment
// Deploy on fengqin.asia's Cloudflare Workers
//
// This lets https://fengqin.asia/scalpel serve SCALPEL
// while keeping https://www.scalpelonline.com working independently

const SCALPEL_ORIGIN = "https://www.scalpelonline.com";
const BASE_PATH = "/scalpel";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only intercept /scalpel paths, everything else passes through to the Astro site
    if (!url.pathname.startsWith(BASE_PATH)) {
      return fetch(request);
    }

    // Strip /scalpel prefix and build the origin URL
    const targetPath = url.pathname.slice(BASE_PATH.length) || "/";
    const targetUrl = `${SCALPEL_ORIGIN}${targetPath}${url.search}`;

    // Forward the request to SCALPEL
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.body,
      redirect: "manual",
    });

    // Clean up headers that would confuse the origin
    proxyRequest.headers.set("Host", new URL(SCALPEL_ORIGIN).host);
    proxyRequest.headers.set("X-Forwarded-Host", url.host);
    proxyRequest.headers.set("X-Forwarded-Path", BASE_PATH);

    let response = await fetch(proxyRequest);

    // Rewrite HTML responses to fix asset paths
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const html = await response.text();

      // Prefix all absolute paths with /scalpel
      const rewritten = html
        .replace(/href="\//g, `href="${BASE_PATH}/`)
        .replace(/src="\//g, `src="${BASE_PATH}/`)
        .replace(/action="\//g, `action="${BASE_PATH}/`)
        // Fix inline scripts referencing /_next
        .replace(/\/_next\//g, `${BASE_PATH}/_next/`)
        // Fix relative URLs in CSS modules and other assets
        .replace(/url\(\//g, `url(${BASE_PATH}/`);

      response = new Response(rewritten, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }

    // Pass through cookies (needed for review session)
    // Cloudflare Worker handles Set-Cookie automatically

    return response;
  },
};
