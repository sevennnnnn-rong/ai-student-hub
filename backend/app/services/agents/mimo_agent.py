"""MiMo Agent - 基于小米 MiMo API"""
import httpx
import json
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import HTTPException
from app.services.agents.base_agent import BaseAgent
from app.config import settings


class MiMoAgent(BaseAgent):
    """MiMo Agent，使用小米 MiMo API"""

    name = "mimo"
    display_name = "MiMo"
    description = "小米 AI，中文理解能力强"
    icon = "Cpu"

    def __init__(self):
        self.api_key = settings.mimo_api_key
        self.base_url = settings.mimo_base_url
        self.model = settings.mimo_model

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """发送对话请求"""
        if not self.api_key:
            raise HTTPException(status_code=503, detail="请先配置 MiMo API Key")

        messages = [
            {"role": "system", "content": "你是一个大学生效率助手，可以帮助用户管理任务、课程、笔记。请用中文回复。"}
        ]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                raise HTTPException(status_code=502, detail=f"MiMo API 错误: {response.status_code}")

    async def chat_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """流式输出"""
        if not self.api_key:
            raise HTTPException(status_code=503, detail="请先配置 MiMo API Key")

        messages = [
            {"role": "system", "content": "你是一个大学生效率助手，可以帮助用户管理任务、课程、笔记。请用中文回复。"}
        ]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                    "stream": True
                },
                timeout=30.0
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield content
                        except Exception:
                            continue
