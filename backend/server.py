"""Pin on Map — share/landing service (Etap 6A).

Serves public share pages for Pins, boards, routes, events and profiles:
  GET /api/share/{kind}/{id}
The page carries Open Graph tags (rich previews in WhatsApp / Messenger / Facebook / X ...),
tries to open the content in the mobile app (pinonmap://{kind}/{id}) and falls back to the
web version of the app or a map link when the app is not installed.
Data is read from Supabase with the public anon key, so Row Level Security still applies
(private boards/routes are never exposed).
"""
import html
import os
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
PUBLIC_APP_URL = os.environ["PUBLIC_APP_URL"].rstrip("/")
APP_SCHEME = os.environ.get("APP_SCHEME", "pinonmap")
APP_STORE_URL = os.environ.get("APP_STORE_URL", "")
PLAY_STORE_URL = os.environ.get("PLAY_STORE_URL", "")

app = FastAPI(title="Pin on Map share service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

# kind -> (table, select, mapper)
KINDS = {
    "place": ("places", "id,title,description,city,country,latitude,longitude,cover_url"),
    "board": ("boards", "id,name,description,cover_url,visibility"),
    "route": ("routes", "id,name,start_point,end_point,stops,distance_m"),
    "event": ("events", "id,title,description,address,latitude,longitude,starts_at,ends_at,cover_url"),
    "user": ("profiles", "id,display_name,bio,avatar_url"),
}


async def fetch_one(table: str, select: str, id_: str):
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/{table}",
            params={"select": select, "id": f"eq.{id_}", "limit": 1},
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"},
        )
    if r.status_code != 200:
        return None
    rows = r.json()
    return rows[0] if rows else None


async def board_cover(board_id: str):
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/board_pins",
            params={"select": "places(cover_url)", "board_id": f"eq.{board_id}", "limit": 1},
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {SUPABASE_ANON_KEY}"},
        )
    try:
        return (r.json()[0].get("places") or {}).get("cover_url")
    except Exception:
        return None


def describe(kind: str, row: dict):
    """Return (title, description, image, lat, lng)."""
    if kind == "place":
        loc = ", ".join(x for x in [row.get("city"), row.get("country")] if x)
        return row["title"], row.get("description") or loc, row.get("cover_url"), row.get("latitude"), row.get("longitude")
    if kind == "board":
        return row["name"], row.get("description") or "Board on Pin on Map", row.get("cover_url"), None, None
    if kind == "route":
        s, e = row.get("start_point") or {}, row.get("end_point") or {}
        km = f" · {round((row.get('distance_m') or 0) / 1000)} km" if row.get("distance_m") else ""
        stops = len(row.get("stops") or [])
        return row["name"], f"{s.get('title', 'A')} → {e.get('title', 'B')}{km} · {stops} stops", None, s.get("lat"), s.get("lng")
    if kind == "event":
        when = (row.get("starts_at") or "")[:16].replace("T", " ")
        return row["title"], f"{when} · {row.get('address') or ''}".strip(" ·"), row.get("cover_url"), row.get("latitude"), row.get("longitude")
    return row.get("display_name") or "Traveler", row.get("bio") or "Traveler on Pin on Map", row.get("avatar_url"), None, None


def render(kind: str, id_: str, title: str, desc: str, image, lat, lng) -> str:
    e = html.escape
    deep = f"{APP_SCHEME}://{kind}/{id_}"
    web = f"{PUBLIC_APP_URL}/?open={kind}/{id_}"
    map_link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}" if lat is not None and lng is not None else ""
    img_tag = f'<meta property="og:image" content="{e(image)}"/><meta name="twitter:image" content="{e(image)}"/>' if image else ""
    hero = f'<img class="hero" src="{e(image)}" alt=""/>' if image else '<div class="hero ph">📍</div>'
    stores = "".join(
        f'<a class="btn ghost" href="{e(u)}">{label}</a>' for u, label in [(APP_STORE_URL, "App Store"), (PLAY_STORE_URL, "Google Play")] if u
    )
    map_btn = f'<a class="btn ghost" href="{e(map_link)}" target="_blank" rel="noopener">Open location in Maps</a>' if map_link else ""
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{e(title)} · Pin on Map</title>
<meta name="description" content="{e(desc)}"/>
<meta property="og:type" content="website"/><meta property="og:site_name" content="Pin on Map"/>
<meta property="og:title" content="{e(title)}"/><meta property="og:description" content="{e(desc)}"/>
{img_tag}<meta name="twitter:card" content="summary_large_image"/>
<meta name="apple-itunes-app" content="app-argument={e(deep)}"/>
<style>
body{{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F8FAFC;color:#1F2937}}
.wrap{{max-width:520px;margin:0 auto;padding:20px}}
.card{{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,.08)}}
.hero{{width:100%;height:260px;object-fit:cover;display:block}}.ph{{display:flex;align-items:center;justify-content:center;font-size:56px;background:#EFF6FF}}
.body{{padding:20px}}h1{{margin:0 0 6px;font-size:24px}}p{{margin:0 0 16px;color:#6B7280;line-height:1.45}}
.kind{{display:inline-block;background:#EFF6FF;color:#2D7FF9;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px;margin-bottom:10px;text-transform:uppercase}}
.btn{{display:block;text-align:center;text-decoration:none;font-weight:700;padding:14px;border-radius:14px;margin-top:10px;background:#2D7FF9;color:#fff}}
.ghost{{background:#fff;color:#2D7FF9;border:1px solid #E5E7EB}}.brand{{text-align:center;margin:18px 0 0;color:#9CA3AF;font-size:13px}}
</style></head><body><div class="wrap"><div class="card">{hero}<div class="body">
<span class="kind">{e(kind)}</span><h1>{e(title)}</h1><p>{e(desc)}</p>
<a class="btn" id="open-app" href="{e(deep)}">Open in Pin on Map</a>
<a class="btn ghost" href="{e(web)}">Open in browser</a>{map_btn}{stores}
</div></div><p class="brand">Pin on Map — discover, save &amp; share places</p></div>
<script>
// Mobile: try the app first; if it isn't installed the page stays and the fallback buttons remain.
if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {{ setTimeout(function(){{ window.location.href = "{deep}"; }}, 300); }}
</script></body></html>"""


@app.get("/api/health")
async def health():
    return {"ok": True}


@app.get("/api/share/{kind}/{id_}", response_class=HTMLResponse)
async def share_page(kind: str, id_: str):
    if kind not in KINDS:
        raise HTTPException(404, "Unknown content type")
    table, select = KINDS[kind]
    row = await fetch_one(table, select, id_)
    if not row:
        return HTMLResponse(render(kind, id_, "Pin on Map", "This content is private or no longer available.", None, None, None), status_code=404)
    title, desc, image, lat, lng = describe(kind, row)
    if kind == "board" and not image:
        image = await board_cover(id_)
    return HTMLResponse(render(kind, id_, title, desc, image, lat, lng))
