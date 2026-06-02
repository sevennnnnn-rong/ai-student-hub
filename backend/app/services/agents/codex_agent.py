"""Codex Agent - 基于 Codex CLI"""
from app.services.agents.cli_agent import CliAgent
from app.config import settings


class CodexAgent(CliAgent):
    """Codex 引擎 — 代码生成、技术实现、工程执行"""

    def __init__(self):
        super().__init__(
            cli_path=settings.codex_cli_path,
            model=settings.codex_model,
            name="codex",
            display_name="Codex",
            description="引擎 — 代码生成、技术实现、工程执行",
            icon="Code",
        )
