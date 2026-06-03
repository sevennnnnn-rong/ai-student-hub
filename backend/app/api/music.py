"""
网易云音乐 API 代理端点
音乐相关请求代理到本地 NeteaseCloudMusicApi (localhost:3002)
QR 登录相关端点直接调用网易云 API (https://music.163.com)
登录 cookie 存储在 SQLite 数据库中
"""
import logging
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.music import UserMusicSettings
from app.schemas.response import success_response

logger = logging.getLogger(__name__)

router = APIRouter()

# NeteaseCloudMusicApi 本地服务地址
NETEASE_API_BASE = "http://127.0.0.1:3002"
DEFAULT_USER_ID = "default"


# ---------- Request / Response Schemas ----------

class PhoneLoginRequest(BaseModel):
    phone: str
    password: Optional[str] = None
    countrycode: str = "86"


class PlaylistResponse(BaseModel):
    id: int
    name: str
    coverImgUrl: str
    playCount: int
    trackCount: Optional[int] = None
    description: Optional[str] = None
    creator: Optional[dict] = None


# ---------- Helpers ----------

def get_user_settings(db: Session, user_id: str = DEFAULT_USER_ID) -> Optional[UserMusicSettings]:
    return db.query(UserMusicSettings).filter(UserMusicSettings.user_id == user_id).first()


def get_or_create_user_settings(db: Session, user_id: str = DEFAULT_USER_ID) -> UserMusicSettings:
    settings = get_user_settings(db, user_id)
    if not settings:
        settings = UserMusicSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def build_cookie_header(db: Session, user_id: str = DEFAULT_USER_ID) -> dict:
    """从数据库读取 cookie，构建请求头"""
    settings = get_user_settings(db, user_id)
    if settings and settings.netease_cookie:
        return {"Cookie": settings.netease_cookie}
    return {}


def parse_cookies_from_response(resp_headers: dict) -> str:
    """从响应头中提取 Set-Cookie，合并为 cookie 字符串"""
    set_cookies = resp_headers.get_list("set-cookie") or resp_headers.get_all("set-cookie")
    if not set_cookies:
        return ""

    cookie_parts = []
    for sc in set_cookies:
        # 只取 key=value 部分，丢弃 Path/Expires/HttpOnly 等属性
        part = sc.split(";")[0].strip()
        if part:
            cookie_parts.append(part)
    return "; ".join(cookie_parts)


async def proxy_get(
    path: str,
    params: dict,
    db: Session,
    user_id: str = DEFAULT_USER_ID,
    timeout: float = 15.0,
) -> dict:
    """代理 GET 请求到 NeteaseCloudMusicApi，附带用户 cookie"""
    headers = build_cookie_header(db, user_id)
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(f"{NETEASE_API_BASE}{path}", params=params, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def proxy_post(
    path: str,
    data: dict,
    db: Session,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    """代理 POST 请求到 NeteaseCloudMusicApi，附带用户 cookie"""
    headers = build_cookie_header(db, user_id)
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(f"{NETEASE_API_BASE}{path}", data=data, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def proxy_request_with_cookie_capture(
    method: str,
    path: str,
    params: dict,
    db: Session,
    user_id: str = DEFAULT_USER_ID,
) -> dict:
    """代理请求并在响应中捕获登录 cookie，用于登录流程"""
    headers = build_cookie_header(db, user_id)
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.request(method, f"{NETEASE_API_BASE}{path}", params=params, headers=headers)
        resp.raise_for_status()
        result = resp.json()

        # 捕获 cookie
        cookie_str = parse_cookies_from_response(resp.headers)
        if cookie_str:
            # 检查是否有 MUSIC_U cookie（登录成功的标志）
            has_music_u = "MUSIC_U=" in cookie_str
            if has_music_u:
                settings = get_or_create_user_settings(db, user_id)
                # 合并已有 cookie（保留其他 cookie，更新 MUSIC_U）
                existing = settings.netease_cookie or ""
                existing_parts = {}
                for part in existing.split("; "):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        existing_parts[k.strip()] = v.strip()
                new_parts = {}
                for part in cookie_str.split("; "):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        new_parts[k.strip()] = v.strip()
                existing_parts.update(new_parts)
                merged = "; ".join(f"{k}={v}" for k, v in existing_parts.items())
                settings.netease_cookie = merged
                settings.login_at = datetime.now()
                db.commit()

        return result


# ---------- Endpoints ----------

@router.get("/login/status")
async def login_status(db: Session = Depends(get_db)):
    """检查当前登录状态"""
    settings = get_user_settings(db)
    if not settings or not settings.netease_cookie:
        logger.info("[LoginStatus] No cookie stored, returning not logged in")
        return success_response({"isLogin": False})

    logger.info(f"[LoginStatus] Cookie found, len={len(settings.netease_cookie)}, verifying with API...")

    # 通过 NeteaseCloudMusicApi 验证 cookie 是否有效
    try:
        data = await proxy_get("/login/status", {}, db)
        profile = data.get("data", {}).get("profile")
        logger.info(f"[LoginStatus] API response profile: {profile.get('nickname') if profile else 'None'}")
        if profile:
            settings.netease_nickname = profile.get("nickname")
            settings.netease_avatar = profile.get("avatarUrl")
            settings.netease_uid = profile.get("userId")
            db.commit()
            return success_response({
                "isLogin": True,
                "profile": {
                    "userId": profile.get("userId"),
                    "nickname": profile.get("nickname"),
                    "avatarUrl": profile.get("avatarUrl"),
                }
            })
        else:
            return success_response({"isLogin": False})
    except Exception as e:
        logger.warning(f"Login status check failed: {e}")
        return success_response({"isLogin": False})


@router.get("/login/qr/key")
async def get_qr_key():
    """获取二维码登录的 key（代理到本地 NeteaseCloudMusicApi）"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{NETEASE_API_BASE}/login/qr/key", params={"type": "1"})
            resp.raise_for_status()
            data = resp.json()
            unikey = data.get("data", {}).get("unikey")
            if not unikey:
                raise ValueError("API did not return unikey")
            return success_response({"unikey": unikey})
    except Exception as e:
        logger.error(f"获取二维码 key 失败: {e}")
        raise HTTPException(status_code=502, detail=f"获取二维码 key 失败: {e}")


@router.get("/login/qr/create")
async def create_qr(key: str = Query(...), qrimg: bool = Query(True)):
    """创建二维码（代理到本地 NeteaseCloudMusicApi）"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{NETEASE_API_BASE}/login/qr/create", params={"key": key, "qrimg": "true"})
            resp.raise_for_status()
            data = resp.json()
            return success_response(data.get("data", data))
    except Exception as e:
        logger.error(f"创建二维码失败: {e}")
        raise HTTPException(status_code=502, detail=f"创建二维码失败: {e}")


@router.get("/login/qr/check")
async def check_qr(key: str = Query(...), db: Session = Depends(get_db)):
    """轮询二维码扫码状态（代理到本地 NeteaseCloudMusicApi）"""
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(f"{NETEASE_API_BASE}/login/qr/check", params={"key": key})
            resp.raise_for_status()
            data = resp.json()
            code = data.get("code")
            message = data.get("message", "")
            logger.info(f"[QR] code={code}, message={message}, has_cookie={'cookie' in data}")

            # code=800: 二维码过期, 801: 等待扫码, 802: 已扫码等待确认, 803: 登录成功
            if code == 803:
                # 登录成功，从 NeteaseCloudMusicApi 获取 cookie 并保存
                cookie_from_response = data.get("cookie", "")
                has_music_u = "MUSIC_U=" in cookie_from_response
                logger.info(f"[QR] Login success! cookie_len={len(cookie_from_response)}, has_music_u={has_music_u}")
                logger.info(f"[QR] cookie_preview: {cookie_from_response[:200]}")

                if cookie_from_response:
                    settings = get_or_create_user_settings(db)
                    # 合并已有 cookie
                    existing = settings.netease_cookie or ""
                    existing_parts = {}
                    for part in existing.split("; "):
                        if "=" in part:
                            k, v = part.split("=", 1)
                            existing_parts[k.strip()] = v.strip()
                    for part in cookie_from_response.split(";"):
                        part = part.strip()
                        if "=" in part:
                            k, v = part.split("=", 1)
                            existing_parts[k.strip()] = v.strip()
                    settings.netease_cookie = "; ".join(f"{k}={v}" for k, v in existing_parts.items())
                    settings.login_at = datetime.now()
                    db.commit()
                    logger.info(f"[QR] Cookie saved to DB, cookie_len={len(settings.netease_cookie)}")

                # 尝试获取用户信息
                try:
                    status_data = await proxy_get("/login/status", {}, db)
                    profile = status_data.get("data", {}).get("profile")
                    logger.info(f"[QR] Profile after login: {profile.get('nickname') if profile else 'None'}")
                    if profile:
                        settings = get_or_create_user_settings(db)
                        settings.netease_nickname = profile.get("nickname")
                        settings.netease_avatar = profile.get("avatarUrl")
                        settings.netease_uid = profile.get("userId")
                        db.commit()
                except Exception as e:
                    logger.warning(f"登录后获取用户信息失败: {e}")

            return success_response({"code": code, "message": message})
    except Exception as e:
        logger.error(f"检查二维码状态失败: {e}")
        raise HTTPException(status_code=502, detail=f"检查二维码状态失败: {e}")


@router.post("/login/phone")
async def phone_login(req: PhoneLoginRequest, db: Session = Depends(get_db)):
    """手机号密码登录（代理到本地 NeteaseCloudMusicApi）"""
    params = {"phone": req.phone, "countrycode": req.countrycode}
    if req.password:
        params["password"] = req.password

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(f"{NETEASE_API_BASE}/login/cellphone", params=params)
            resp.raise_for_status()
            data = resp.json()
            code = data.get("code")
            if code == 200:
                profile = data.get("profile", {})
                settings = get_or_create_user_settings(db)
                settings.netease_nickname = profile.get("nickname")
                settings.netease_avatar = profile.get("avatarUrl")
                settings.netease_uid = profile.get("userId")
                # 捕获 cookie
                set_cookies = resp.headers.get_list("set-cookie") or resp.headers.get_all("set-cookie")
                if set_cookies:
                    cookie_parts = []
                    for sc in set_cookies:
                        part = sc.split(";")[0].strip()
                        if part:
                            cookie_parts.append(part)
                    cookie_str = "; ".join(cookie_parts)
                    if cookie_str:
                        existing = settings.netease_cookie or ""
                        existing_parts = {}
                        for part in existing.split("; "):
                            if "=" in part:
                                k, v = part.split("=", 1)
                                existing_parts[k.strip()] = v.strip()
                        new_parts = {}
                        for part in cookie_str.split("; "):
                            if "=" in part:
                                k, v = part.split("=", 1)
                                new_parts[k.strip()] = v.strip()
                        existing_parts.update(new_parts)
                        settings.netease_cookie = "; ".join(f"{k}={v}" for k, v in existing_parts.items())
                settings.login_at = datetime.now()
                db.commit()
                return success_response({
                    "isLogin": True,
                    "profile": {
                        "userId": profile.get("userId"),
                        "nickname": profile.get("nickname"),
                        "avatarUrl": profile.get("avatarUrl"),
                    }
                })
            else:
                return success_response({"isLogin": False, "message": data.get("message", "登录失败")})
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"登录请求失败: {e}")


@router.post("/logout")
async def logout(db: Session = Depends(get_db)):
    """登出 - 清除本地存储的 cookie"""
    settings = get_user_settings(db)
    if settings:
        settings.netease_cookie = None
        settings.netease_uid = None
        settings.netease_nickname = None
        settings.netease_avatar = None
        settings.login_at = None
        db.commit()
    return success_response({"message": "已登出"})


@router.get("/user/playlists")
async def get_user_playlists(
    uid: Optional[int] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """获取用户歌单"""
    # 如果没有指定 uid，使用当前登录用户的 uid
    if uid is None:
        settings = get_user_settings(db)
        if not settings or not settings.netease_uid:
            return success_response({"list": [], "count": 0})
        uid = settings.netease_uid

    try:
        data = await proxy_get("/user/playlist", {"uid": uid, "limit": limit, "offset": offset}, db)
        playlists = data.get("playlist", [])
        result = []
        for pl in playlists:
            result.append({
                "id": pl.get("id"),
                "name": pl.get("name"),
                "coverImgUrl": pl.get("coverImgUrl") or pl.get("picUrl"),
                "playCount": pl.get("playCount", 0),
                "trackCount": pl.get("trackCount", 0),
                "description": pl.get("description", ""),
                "creator": {
                    "nickname": pl.get("creator", {}).get("nickname", ""),
                    "avatarUrl": pl.get("creator", {}).get("avatarUrl", ""),
                } if pl.get("creator") else None,
            })
        return success_response({"list": result, "count": len(result)})
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取用户歌单失败: {e}")


@router.get("/user/playlist/{playlist_id}")
async def get_playlist_detail(playlist_id: int, db: Session = Depends(get_db)):
    """获取歌单详情（包含歌曲列表）"""
    try:
        data = await proxy_get("/playlist/detail", {"id": playlist_id}, db, timeout=30.0)
        pl = data.get("playlist", data)
        tracks = []
        for t in (pl.get("tracks") or []):
            artists = []
            for ar in (t.get("ar") or t.get("artists") or []):
                artists.append({"id": ar.get("id"), "name": ar.get("name", "未知歌手")})
            album = t.get("al") or t.get("album") or {}
            tracks.append({
                "id": t.get("id"),
                "name": t.get("name", "未知歌曲"),
                "artists": artists,
                "album": {
                    "id": album.get("id", 0),
                    "name": album.get("name", "未知专辑"),
                    "picUrl": album.get("picUrl", ""),
                },
                "duration": t.get("dt", 0),
            })
        return success_response({
            "id": pl.get("id"),
            "name": pl.get("name"),
            "coverImgUrl": pl.get("coverImgUrl") or pl.get("picUrl"),
            "playCount": pl.get("playCount", 0),
            "trackCount": pl.get("trackCount", 0),
            "description": pl.get("description", ""),
            "creator": {
                "nickname": pl.get("creator", {}).get("nickname", ""),
                "avatarUrl": pl.get("creator", {}).get("avatarUrl", ""),
            } if pl.get("creator") else None,
            "tracks": tracks,
        })
    except httpx.HTTPError as e:
        logger.error(f"获取歌单详情失败: {e}")
        raise HTTPException(status_code=502, detail=f"获取歌单详情失败: {e}")


@router.get("/user/likes")
async def get_user_likes(db: Session = Depends(get_db)):
    """获取用户喜欢的歌曲"""
    settings = get_user_settings(db)
    if not settings or not settings.netease_uid:
        return success_response({"songs": [], "count": 0})

    try:
        # 获取喜欢的音乐歌单ID
        data = await proxy_get("/user/playlist", {"uid": settings.netease_uid, "limit": 1}, db)
        playlists = data.get("playlist", [])
        # 第一个歌单通常是"我喜欢的音乐"
        liked_playlist = None
        for pl in playlists:
            if pl.get("specialType") == 1 or "喜欢" in pl.get("name", ""):
                liked_playlist = pl
                break
        if not liked_playlist and playlists:
            liked_playlist = playlists[0]

        if not liked_playlist:
            return success_response({"songs": [], "count": 0})

        # 获取该歌单详情
        detail_data = await proxy_get("/playlist/detail", {"id": liked_playlist["id"]}, db)
        pl = detail_data.get("playlist", {})
        tracks = []
        for t in (pl.get("tracks") or []):
            artists = []
            for ar in (t.get("ar") or t.get("artists") or []):
                artists.append({"id": ar.get("id"), "name": ar.get("name", "未知歌手")})
            album = t.get("al") or t.get("album") or {}
            tracks.append({
                "id": t.get("id"),
                "name": t.get("name", "未知歌曲"),
                "artists": artists,
                "album": {
                    "id": album.get("id", 0),
                    "name": album.get("name", "未知专辑"),
                    "picUrl": album.get("picUrl", ""),
                },
                "duration": t.get("dt", 0),
            })
        return success_response({"songs": tracks, "count": len(tracks)})
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取喜欢的歌曲失败: {e}")


@router.get("/song/url")
async def get_song_url(
    id: str = Query(..., description="歌曲ID，多个用逗号分隔"),
    br: int = Query(999000, description="比特率"),
    db: Session = Depends(get_db),
):
    """获取歌曲播放URL"""
    try:
        data = await proxy_get("/song/url", {"id": id, "br": br}, db)
        return success_response(data.get("data", []))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取歌曲URL失败: {e}")


@router.get("/song/detail")
async def get_song_detail(
    ids: str = Query(..., description="歌曲ID，多个用逗号分隔"),
    db: Session = Depends(get_db),
):
    """获取歌曲详情"""
    try:
        data = await proxy_get("/song/detail", {"ids": ids}, db)
        return success_response(data)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取歌曲详情失败: {e}")


@router.get("/lyric")
async def get_lyric(
    id: int = Query(..., description="歌曲ID"),
    db: Session = Depends(get_db),
):
    """获取歌词"""
    try:
        data = await proxy_get("/lyric", {"id": id}, db)
        return success_response(data)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取歌词失败: {e}")


@router.post("/like")
async def toggle_like(
    id: int = Query(..., description="歌曲ID"),
    like: bool = Query(True, description="true=喜欢, false=取消喜欢"),
    db: Session = Depends(get_db),
):
    """收藏/取消收藏歌曲"""
    try:
        data = await proxy_get("/like", {"id": id, "like": like}, db)
        return success_response(data)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"操作失败: {e}")


@router.get("/search")
async def search(
    keywords: str = Query(..., description="搜索关键词"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    type: int = Query(1, description="搜索类型: 1=单曲, 10=专辑, 100=歌手, 1000=歌单, 1002=用户"),
    db: Session = Depends(get_db),
):
    """搜索"""
    try:
        data = await proxy_get("/search", {"keywords": keywords, "limit": limit, "offset": offset, "type": type}, db)
        result = data.get("result", data)
        # 转换歌曲数据格式
        if "songs" in result:
            songs = []
            for s in result["songs"]:
                artists = []
                for ar in (s.get("artists") or []):
                    artists.append({"id": ar.get("id"), "name": ar.get("name", "未知歌手")})
                album = s.get("album") or {}
                songs.append({
                    "id": s.get("id"),
                    "name": s.get("name", "未知歌曲"),
                    "artists": artists,
                    "album": {
                        "id": album.get("id", 0),
                        "name": album.get("name", "未知专辑"),
                        "picUrl": album.get("picUrl", ""),
                    },
                    "duration": s.get("duration", 0),
                })
            result["songs"] = songs
        return success_response(result)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"搜索失败: {e}")


@router.get("/personalized")
async def get_personalized(
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """获取推荐歌单（无需登录）"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{NETEASE_API_BASE}/personalized", params={"limit": limit})
            resp.raise_for_status()
            data = resp.json()
            return success_response(data.get("result", data))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取推荐歌单失败: {e}")


@router.get("/recommend/songs")
async def get_recommend_songs(db: Session = Depends(get_db)):
    """获取每日推荐歌曲（需登录）"""
    try:
        data = await proxy_get("/recommend/songs", {}, db)
        return success_response(data.get("data", data))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取每日推荐失败: {e}")


@router.get("/user/cloud")
async def get_user_cloud(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """获取用户云盘音乐"""
    try:
        data = await proxy_get("/user/cloud", {"limit": limit, "offset": offset}, db)
        return success_response(data.get("data", data))
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"获取云盘音乐失败: {e}")
