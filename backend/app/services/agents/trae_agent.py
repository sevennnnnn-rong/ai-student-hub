"""Trae Agent - 基于 Trae WebSocket API"""
import json
import asyncio
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import HTTPException
from app.services.agents.base_agent import BaseAgent
from app.config import settings

# 尝试导入 websockets，如果未安装则使用模拟模式
try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False


class TraeAgent(BaseAgent):
    """Trae Agent，通过 WebSocket 连接 Trae 云服务"""

    name = "trae"
    display_name = "Trae"
    description = "字节跳动 AI，代码能力强"
    icon = "Code"

    def __init__(self):
        self.ws_url = settings.trae_ws_url
        self.token = settings.trae_token
        self.region = settings.trae_region

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """通过 WebSocket 发送对话请求"""
        if not HAS_WEBSOCKETS:
            raise HTTPException(status_code=503, detail="请先安装 websockets: pip install websockets")

        if not self.token:
            raise HTTPException(status_code=503, detail="请先配置 Trae Token（从 Trae IDE 获取）")

        try:
            async with websockets.connect(
                self.ws_url,
                additional_headers={
                    "Authorization": f"Bearer {self.token}",
                    "User-Agent": "AI-Student-Hub/1.0"
                }
            ) as ws:
                # 构造请求消息（需要根据 Trae 实际协议调整）
                request_msg = {
                    "type": "chat",
                    "content": message,
                    "history": history or [],
                    "model": "deepseek-V3",  # Trae 默认模型
                }

                await ws.send(json.dumps(request_msg))

                # 等待响应
                response = await asyncio.wait_for(ws.recv(), timeout=30.0)
                data = json.loads(response)

                if data.get("type") == "chat_response":
                    return data.get("content", "无响应")
                else:
                    return f"Trae 响应格式错误: {data.get('type')}"

        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="Trae WebSocket 连接超时")
        except ConnectionRefusedError:
            raise HTTPException(status_code=502, detail="无法连接到 Trae 服务，请检查网络或 Token")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Trae 调用失败: {str(e)}")

    async def chat_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """流式输出"""
        if not HAS_WEBSOCKETS:
            raise HTTPException(status_code=503, detail="请先安装 websockets: pip install websockets")

        if not self.token:
            raise HTTPException(status_code=503, detail="请先配置 Trae Token")

        try:
            async with websockets.connect(
                self.ws_url,
                additional_headers={
                    "Authorization": f"Bearer {self.token}",
                    "User-Agent": "AI-Student-Hub/1.0"
                }
            ) as ws:
                # 发送流式请求
                request_msg = {
                    "type": "chat_stream",
                    "content": message,
                    "history": history or [],
                    "model": "deepseek-V3",
                }

                await ws.send(json.dumps(request_msg))

                # 持续接收流式响应
                while True:
                    try:
                        response = await asyncio.wait_for(ws.recv(), timeout=30.0)
                        data = json.loads(response)

                        if data.get("type") == "stream_chunk":
                            content = data.get("content", "")
                            if content:
                                yield content
                        elif data.get("type") == "stream_end":
                            break
                        elif data.get("type") == "error":
                            yield f"错误: {data.get('message', '未知错误')}"
                            break
                    except asyncio.TimeoutError:
                        break

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Trae 流式调用失败: {str(e)}")
