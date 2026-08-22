# NetShare DMG download Worker

The **marketing site** (`/download-macos/`) is the download page. This Worker is **file-or-captcha only**: it streams the private R2 DMG, or returns Turnstile HTML when that IP has used its free allowance. Do not add a marketing landing on workers.dev.

**3** file downloads per client IP per hour, then a **visible** Turnstile checkbox. After a successful `siteverify`, the Worker grants **2** more slots in the same window (`FREE_LIMIT`, `WINDOW_SECONDS`, `PASS_DOWNLOADS`) and returns **200 HTML** with a **Download .dmg** button. The file is not 302'd and is not auto-downloaded. One Durable Object per IP (`CF-Connecting-IP`; IPv6 keyed as `/64`). No landing page, no `?download=1`, no cookies.

| | |
|---|---|
| Under quota | `200` `application/octet-stream`, `Content-Disposition: attachment` |
| Over quota | `403` Turnstile HTML (visible Managed widget) |
| After captcha | `200` HTML “Verified” + Download .dmg (same file URL). Next GET streams the file. |
| Invalid token POST | `403` challenge HTML again |
| HEAD | object headers only; does not count |

Paths: `/releases/macos/NetShare.dmg`, `/NetShare.dmg`.

## Turnstile widget (dashboard)

Site key: `0x4AAAAAAEXHFNG6YiblybzT`.

The Cloudflare Turnstile **widget type must be Managed**, not Invisible.

- Invisible widgets have no checkbox, even with `appearance: always`. They auto-pass in the background — that used to auto-submit the form and 302 the DMG.
- Managed + this Worker’s `appearance: "always"`, `size: "normal"`, `execution: "render"` shows a visible checkbox. The page never auto-submits or auto-downloads.

In the dashboard: Turnstile → this widget → Widget Type → **Managed**.

## Deploy

```bash
cd cloudflare/download-worker
npm install
npx wrangler secret put TURNSTILE_SECRET_KEY   # first time only
npx wrangler deploy
```

Paste the Worker file URL into [`assets/downloads/macos-dmg.url`](../../assets/downloads/macos-dmg.url). Keep the R2 bucket private.

## Test

```bash
URL="https://netshare-macos-dmg.netshareoss.workers.dev/releases/macos/NetShare.dmg"

curl -sS -D - -o /tmp/ns.bin -H 'Accept: text/html' "$URL" | head
# Expect: 200 application/octet-stream (or 403 captcha HTML if quota is spent)
# Not a marketing page with a Download button.

for i in 1 2 3 4; do
  curl -sS -o /dev/null -w "req $i: %{http_code} %{content_type}\n" "$URL"
done
# Expect: 200, 200, 200, 403 (Turnstile HTML)

# Over-quota GET must be 403 HTML containing the Turnstile script/container:
curl -sS -D - -o /tmp/ns-challenge.html "$URL"
# Look for: HTTP/2 403, text/html, turnstile, id="cf-turnstile"

# Invalid token stays on the challenge (no 302, no DMG):
curl -sS -D - -o /tmp/ns-post.html -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'cf-turnstile-response=not-a-real-token' \
  "$URL"
# Expect: 403 text/html, still the challenge page
```
