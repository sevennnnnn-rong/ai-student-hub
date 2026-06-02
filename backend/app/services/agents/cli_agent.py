"""CLI Agent - CLI-based agent base class"""
import asyncio
import json
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import HTTPException
from app.services.agents.base_agent import BaseAgent


class CliAgent(BaseAgent):
    """Base class for agents that spawn CLI subprocesses"""

    def __init__(self, cli_path: str, model: str, name: str, display_name: str, description: str, icon: str):
        self.cli_path = cli_path
        self.model = model
        self.name = name
        self.display_name = display_name
        self.description = description
        self.icon = icon

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        try:
            cmd = [
                self.cli_path,
                "-p", message,
                "--output-format", "json",
                "--model", self.model,
                "--no-session-persistence"
            ]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(), timeout=120.0
            )
            if process.returncode != 0:
                raise HTTPException(status_code=502, detail=f"{self.display_name} CLI 错误: {stderr.decode().strip()}")
            result = json.loads(stdout.decode().strip())
            return result.get("result", "无响应")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"{self.display_name} CLI 调用超时（120秒）")
        except FileNotFoundError:
            raise HTTPException(status_code=503, detail=f"未找到 {self.display_name} CLI，请确保已安装")
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail=f"{self.display_name} CLI 返回格式错误")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"{self.display_name} CLI 调用失败: {str(e)}")

    async def chat_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        try:
            cmd = [
                self.cli_path,
                "-p", message,
                "--output-format", "stream-json",
                "--verbose",
                "--model", self.model,
                "--no-session-persistence"
            ]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            async for line in process.stdout:
                line_str = line.decode().strip()
                if not line_str:
                    continue
                try:
                    obj = json.loads(line_str)
                    obj_type = obj.get("type")
                    if obj_type == "assistant":
                        message_obj = obj.get("message", {})
                        content = message_obj.get("content", [])
                        for block in content:
                            if block.get("type") == "text":
                                yield block.get("text", "")
                    elif obj_type == "result":
                        result = obj.get("result", "")
                        if result:
                            yield result
                except json.JSONDecodeError:
                    continue
            await process.wait()
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail=f"{self.display_name} CLI 流式调用超时")
        except FileNotFoundError:
            raise HTTPException(status_code=503, detail=f"未找到 {self.display_name} CLI，请确保已安装")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"{self.display_name} CLI 调用失败: {str(e)}")
