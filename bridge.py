"""
TikTok CANLI -> Derbi overlay köprüsü
=====================================
TikTok canlı yayınındaki katılım, yorum, beğeni ve hediye olaylarını dinler,
tiktok_canli.html sayfasına WebSocket (ws://localhost:8765) üzerinden iletir.

Kurulum (bir kez):
    pip install TikTokLive websockets

Çalıştırma (yayın açıkken):
    python bridge.py @kullaniciadi

Sonra tiktok_canli.html sayfasını tarayıcıda ya da OBS "Tarayıcı" kaynağında aç;
paneldeki nokta yeşile dönünce bağlantı kurulmuştur.

Not: TikTokLive kütüphanesi resmi olmayan bir kütüphanedir, TikTok tarafındaki
değişikliklerle alan adları değişebilir. Bu dosya yayın açılmadan test edilmemiştir;
bir alan adı hata verirse altta getattr ile korunan satırlara bakın.
"""
import asyncio
import base64
import json
import sys
import urllib.request

import websockets
from TikTokLive import TikTokLiveClient
from TikTokLive.events import (CommentEvent, ConnectEvent, DisconnectEvent,
                               GiftEvent, JoinEvent, LikeEvent)

PORT = 8765
clients = set()


async def broadcast(msg: dict):
    if not clients:
        return
    data = json.dumps(msg, ensure_ascii=False)
    dead = set()
    for ws in list(clients):
        try:
            await ws.send(data)
        except Exception:
            dead.add(ws)
    clients.difference_update(dead)


_avatar_cache: dict = {}


def avatar_data_url(url: str):
    """Profil fotoğrafını indirip data: URL'e çevirir.
    Tarayıcıdaki 3B sahne, başka alan adından gelen resmi WebGL dokusu olarak
    kullanamaz (CORS); data: URL bu sorunu ortadan kaldırır."""
    if not url:
        return None
    if url in _avatar_cache:
        return _avatar_cache[url]
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            ctype = r.headers.get("Content-Type", "image/jpeg").split(";")[0]
            data = base64.b64encode(r.read()).decode("ascii")
        out = f"data:{ctype};base64,{data}"
    except Exception:
        out = None
    if len(_avatar_cache) > 2000:
        _avatar_cache.clear()
    _avatar_cache[url] = out
    return out


def user_of(u) -> dict:
    """TikTok kullanıcı nesnesini overlay'in beklediği sade biçime çevirir."""
    avatar = None
    try:
        avatar = u.avatar_thumb.m_urls[0]
    except Exception:
        try:
            avatar = u.profile_picture.urls[0]
        except Exception:
            pass
    uid = getattr(u, "unique_id", None) or str(getattr(u, "id", ""))
    name = getattr(u, "nickname", None) or uid or "Seyirci"
    return {"id": uid, "name": name, "avatar": avatar_data_url(avatar)}


async def ws_handler(ws):
    clients.add(ws)
    print("Overlay bağlandı.")
    try:
        async for _ in ws:
            pass
    finally:
        clients.discard(ws)
        print("Overlay ayrıldı.")


async def main(unique_id: str):
    client = TikTokLiveClient(unique_id=unique_id)

    @client.on(ConnectEvent)
    async def on_connect(e):
        print(f"TikTok yayınına bağlanıldı: {unique_id}")

    @client.on(DisconnectEvent)
    async def on_disconnect(e):
        print("TikTok bağlantısı koptu.")

    @client.on(JoinEvent)
    async def on_join(e):
        await broadcast({"type": "join", "user": user_of(e.user)})

    @client.on(CommentEvent)
    async def on_comment(e):
        await broadcast({"type": "comment", "user": user_of(e.user), "text": e.comment})

    @client.on(LikeEvent)
    async def on_like(e):
        await broadcast({"type": "like", "user": user_of(e.user), "count": getattr(e, "count", 1)})

    @client.on(GiftEvent)
    async def on_gift(e):
        gift = e.gift
        # Seri (streak) hediyelerde her tıkta olay gelir; yalnızca seri bitince say.
        if getattr(gift, "streakable", False) and getattr(e, "streaking", False):
            return
        coins = int(getattr(gift, "diamond_count", 0) or 0) * max(1, int(getattr(e, "repeat_count", 1) or 1))
        if coins <= 0:
            return
        await broadcast({"type": "gift", "user": user_of(e.user), "coins": coins,
                         "gift": getattr(gift, "name", "")})
        print(f"HEDİYE {coins} jeton <- {user_of(e.user)['name']}")

    async with websockets.serve(ws_handler, "localhost", PORT):
        print(f"WebSocket hazır: ws://localhost:{PORT}  (overlay sayfasını şimdi aç)")
        await client.connect()


if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else None
    if not uid:
        print("Kullanım: python bridge.py @kullaniciadi")
        sys.exit(1)
    try:
        asyncio.run(main(uid))
    except KeyboardInterrupt:
        pass
