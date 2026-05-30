"""Doubao Agent - 基于火山引擎豆包 API"""
import json
import httpx
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import HTTPException
from app.services.agents.base_agent import BaseAgent
from app.config import settings


class DoubaoAgent(BaseAgent):
    """Doubao 苦力工 — 批量处理、数据整理、重复性任务"""

    name = "doubao"
    display_name = "Doubao"
    description = "苦力工 — 批量处理、数据整理、重复性任务"
    icon = "Zap"

    def __init__(self):
        self.api_key = settings.doubao_api_key
        self.model = settings.doubao_model
        self.endpoint = settings.doubao_endpoint

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        if not self.api_key:
            raise HTTPException(status_code=503, detail="请先配置 Doubao API Key")

        messages = []
        if history:
            for h in history:
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.endpoint}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                    },
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Doubao API 调用超时")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Doubao API 错误: {e.response.status_code}")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Doubao API 调用失败: {str(e)}")

    async def chat_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise HTTPException(status_code=503, detail="请先配置 Doubao API Key")

        messages = []
        if history:
            for h in history:
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": message})

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.endpoint}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": True,
                    },
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Doubao API 流式调用超时")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Doubao API 错误: {e.response.status_code}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Doubao API 流式调用失败: {str(e)}")
