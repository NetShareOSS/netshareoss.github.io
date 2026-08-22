/**
 * File-or-captcha download gate. The marketing site owns UX; this Worker
 * streams the R2 DMG or returns Turnstile HTML when the IP is over quota.
 * One Durable Object per client IP (IPv6 keyed as /64).
 */

import { DurableObject } from "cloudflare:workers";

const OBJECT_ALIASES = new Set([
  "/releases/macos/NetShare.dmg",
  "/NetShare.dmg",
]);

const NO_STORE = {
  "cache-control": "no-store",
};

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  ...NO_STORE,
};

function intEnv(env, key, fallback) {
  const n = Number.parseInt(env[key] ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "0.0.0.0";
}

/** IPv6 privacy addresses rotate the interface id — key on /64 only. IPv4 is used as-is. */
function quotaKey(ip) {
  if (!ip || !ip.includes(":")) return ip || "0.0.0.0";

  const bare = ip.split("%")[0].replace(/^\[|\]$/g, "");
  const halves = bare.split("::");
  const head = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const tail = halves.length > 1 && halves[1] ? halves[1].split(":").filter(Boolean) : [];
  const missing = Math.max(0, 8 - head.length - tail.length);
  const full = [...head, ...Array(missing).fill("0"), ...tail].slice(0, 8);
  return `${full.slice(0, 4).map((h) => h.toLowerCase()).join(":")}/64`;
}

function gateStub(env, ip) {
  return env.DOWNLOAD_GATE.get(env.DOWNLOAD_GATE.idFromName(`v2:ip:${quotaKey(ip)}`));
}

function quotaHeader(count, limit, allowed) {
  return `${count}/${limit}; allowed=${allowed ? 1 : 0}`;
}

function withQuota(response, count, limit, allowed) {
  const headers = new Headers(response.headers);
  headers.set("X-NS-Quota", quotaHeader(count, limit, allowed));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PAGE_CSS = `
    :root { --bg: #0f2744; --fg: #f6f7f9; --muted: rgba(246,247,249,0.72); }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: "SF Pro Text", "Segoe UI", system-ui, sans-serif;
      background: var(--bg); color: var(--fg); padding: 1.5rem;
    }
    main { width: min(100%, 22rem); text-align: center; }
    h1 { font-size: 1.25rem; font-weight: 650; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
    p { margin: 0 0 1.25rem; color: var(--muted); font-size: 0.95rem; line-height: 1.45; }
    .err { color: #ff8a8a; margin-bottom: 1rem; }
    .widget { display: flex; justify-content: center; min-height: 65px; margin-bottom: 1rem; }
    button, .dl {
      display: inline-block; margin-top: 0.25rem; padding: 0.7rem 1.15rem;
      border: 0; border-radius: 0.5rem; background: #3d8bfd; color: #fff;
      font: inherit; font-weight: 600; text-decoration: none; cursor: pointer;
    }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
`;

function challengeHtml(siteKey, path, errorMessage) {
  const err = errorMessage
    ? `<p class="err">${escapeHtml(errorMessage)}</p>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verify download</title>
  <style>${PAGE_CSS}</style>
  <script>
    window.onTurnstileLoad = function () {
      var box = document.getElementById("cf-turnstile");
      var tokenInput = document.getElementById("cf-token");
      var continueBtn = document.getElementById("continue");
      var errEl = document.getElementById("widget-err");
      function showError(msg) {
        if (errEl) errEl.textContent = msg;
        if (continueBtn) continueBtn.disabled = true;
        if (tokenInput) tokenInput.value = "";
      }
      if (!window.turnstile || typeof window.turnstile.render !== "function") {
        showError("Verification widget failed to load. Refresh and try again.");
        return;
      }
      try {
        window.turnstile.render(box, {
          sitekey: ${JSON.stringify(siteKey)},
          theme: "dark",
          size: "normal",
          appearance: "always",
          execution: "render",
          callback: function (token) {
            if (!token) {
              showError("Verification widget failed to load. Refresh and try again.");
              return;
            }
            tokenInput.value = token;
            continueBtn.disabled = false;
            if (errEl) errEl.textContent = "";
          },
          "error-callback": function () {
            showError("Verification widget failed to load. Refresh and try again.");
          },
          "timeout-callback": function () {
            showError("Verification timed out. Refresh and try again.");
          },
          "unsupported-callback": function () {
            showError("This browser cannot complete the check.");
          }
        });
      } catch (e) {
        showError("Verification widget failed to load. Refresh and try again.");
      }
    };
    window.setTimeout(function () {
      var box = document.getElementById("cf-turnstile");
      if (box && !box.querySelector("iframe")) {
        var errEl = document.getElementById("widget-err");
        if (errEl && !errEl.textContent) {
          errEl.textContent = "Verification widget failed to load. Refresh and try again.";
        }
      }
    }, 12000);
  </script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad" async defer></script>
</head>
<body>
  <main>
    <h1>Confirm you are human</h1>
    <p>Too many downloads from this network. Complete the check to continue.</p>
    ${err}
    <p id="widget-err" class="err" role="alert"></p>
    <form method="POST" action="${escapeHtml(path)}" onsubmit="return !!document.getElementById('cf-token').value">
      <div class="widget">
        <div id="cf-turnstile"></div>
      </div>
      <input type="hidden" name="cf-turnstile-response" id="cf-token" value="" />
      <button type="submit" id="continue" disabled>Continue</button>
      <noscript><p class="err">JavaScript is required to verify.</p></noscript>
    </form>
  </main>
</body>
</html>`;
}

function verifiedHtml(path) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verified</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <main>
    <h1>Verified</h1>
    <p>You can download the installer now.</p>
    <a class="dl" href="${escapeHtml(path)}">Download .dmg</a>
  </main>
</body>
</html>`;
}

async function verifyTurnstile(secret, token, ip) {
  if (!secret || !token) return false;
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  body.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.success);
}

export class DownloadGate extends DurableObject {
  async load() {
    return (await this.ctx.storage.get("q")) || { windowStart: 0, count: 0 };
  }

  async save(state) {
    await this.ctx.storage.put("q", state);
  }

  async admit(opts) {
    const now = Number(opts.now) || Date.now();
    const freeLimit = Number(opts.freeLimit) || 3;
    const windowMs = Number(opts.windowMs) || 3600_000;

    const state = await this.load();
    if (!state.windowStart || now - state.windowStart >= windowMs) {
      state.count = 0;
      state.windowStart = now;
    }

    if (state.count < freeLimit) {
      state.count += 1;
      await this.save(state);
      return { allowed: true, count: state.count };
    }

    return { allowed: false, count: state.count };
  }

  /** After Turnstile: leave PASS_DOWNLOADS slots in this window. */
  async grant(opts) {
    const now = Number(opts.now) || Date.now();
    const freeLimit = Number(opts.freeLimit) || 3;
    const windowMs = Number(opts.windowMs) || 3600_000;
    const passDownloads = Number(opts.passDownloads) || 2;

    const state = await this.load();
    if (!state.windowStart || now - state.windowStart >= windowMs) {
      state.windowStart = now;
    }
    state.count = Math.max(0, freeLimit - passDownloads);
    await this.save(state);
    return { count: state.count };
  }
}

function objectHeaders(object) {
  const headers = new Headers(NO_STORE);
  headers.set("content-type", "application/octet-stream");
  headers.set("content-disposition", 'attachment; filename="NetShare.dmg"');
  if (object.size != null) headers.set("content-length", String(object.size));
  return headers;
}

async function handlePost(request, env, path, ip, freeLimit, windowMs) {
  const contentType = request.headers.get("content-type") || "";
  let token = "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    token = String(form.get("cf-turnstile-response") || "");
  } else if (contentType.includes("application/json")) {
    const data = await request.json().catch(() => ({}));
    token = String(data["cf-turnstile-response"] || data.token || "");
  }

  const siteKey = env.TURNSTILE_SITE_KEY || "";
  const ok = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, ip);
  if (!ok) {
    return withQuota(
      new Response(challengeHtml(siteKey, path, "Verification failed. Please try again."), {
        status: 403,
        headers: HTML_HEADERS,
      }),
      freeLimit,
      freeLimit,
      false
    );
  }

  const granted = await gateStub(env, ip).grant({
    now: Date.now(),
    freeLimit,
    windowMs,
    passDownloads: intEnv(env, "PASS_DOWNLOADS", 2),
  });

  return withQuota(
    new Response(verifiedHtml(path), {
      status: 200,
      headers: HTML_HEADERS,
    }),
    granted.count,
    freeLimit,
    true
  );
}

async function headObject(env) {
  const objectKey = env.OBJECT_KEY || "releases/macos/NetShare.dmg";
  const object = await env.BUCKET.head(objectKey);
  if (!object) {
    return new Response(null, { status: 404, headers: { ...NO_STORE } });
  }
  return new Response(null, { status: 200, headers: objectHeaders(object) });
}

async function streamObject(env) {
  const objectKey = env.OBJECT_KEY || "releases/macos/NetShare.dmg";
  const object = await env.BUCKET.get(objectKey);
  if (!object) {
    return new Response("Not found", { status: 404, headers: { ...NO_STORE } });
  }
  return new Response(object.body, { status: 200, headers: objectHeaders(object) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (!OBJECT_ALIASES.has(path)) {
      return new Response("Not found", { status: 404 });
    }

    const ip = clientIp(request);
    const freeLimit = intEnv(env, "FREE_LIMIT", 3);
    const windowMs = intEnv(env, "WINDOW_SECONDS", 3600) * 1000;

    if (request.method === "POST") {
      return handlePost(request, env, path, ip, freeLimit, windowMs);
    }

    if (request.method === "HEAD") {
      return headObject(env);
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { allow: "GET, HEAD, POST", ...NO_STORE },
      });
    }

    const decision = await gateStub(env, ip).admit({
      now: Date.now(),
      freeLimit,
      windowMs,
    });

    if (!decision.allowed) {
      return withQuota(
        new Response(challengeHtml(env.TURNSTILE_SITE_KEY || "", path), {
          status: 403,
          headers: HTML_HEADERS,
        }),
        decision.count,
        freeLimit,
        false
      );
    }

    return withQuota(await streamObject(env), decision.count, freeLimit, true);
  },
};
