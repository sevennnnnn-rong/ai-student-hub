"""Claude Agent - 基于 Claude Code CLI"""
import asyncio
import json
from typing import Optional, List, Dict, AsyncGenerator
from fastapi import HTTPException
from app.services.agents.base_agent import BaseAgent
from app.config import settings


class ClaudeAgent(BaseAgent):
    """Claude 指挥官 — 战略规划、复杂推理、多步任务编排"""

    name = "claude"
    display_name = "Claude"
    description = "指挥官 — 战略规划、复杂推理、多步任务编排"
    icon = "Brain"

    def __init__(self):
        self.cli_path = settings.claude_cli_path
        self.model = settings.claude_model

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
                raise HTTPException(status_code=502, detail=f"Claude CLI 错误: {stderr.decode().strip()}")
            result = json.loads(stdout.decode().strip())
            return result.get("result", "无响应")
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="Claude CLI 调用超时（120秒）")
        except FileNotFoundError:
            raise HTTPException(status_code=503, detail="未找到 Claude CLI，请确保已安装: npm install -g @anthropic-ai/claude-code")
        except json.JSONDecodeError:
            raise HTTPException(status_code=502, detail="Claude CLI 返回格式错误")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Claude CLI 调用失败: {str(e)}")

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
            raise HTTPException(status_code=504, detail="Claude CLI 流式调用超时")
        except FileNotFoundError:
            raise HTTPException(status_code=503, detail="未找到 Claude CLI，请确保已安装")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Claude CLI 调用失败: {str(e)}")
