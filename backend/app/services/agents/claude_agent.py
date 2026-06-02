"""Claude Agent - 基于 Claude Code CLI"""
from app.services.agents.cli_agent import CliAgent
from app.config import settings


class ClaudeAgent(CliAgent):
    """Claude 指挥官 — 战略规划、复杂推理、多步任务编排"""

    def __init__(self):
        super().__init__(
            cli_path=settings.claude_cli_path,
            model=settings.claude_model,
            name="claude",
            display_name="Claude",
            description="指挥官 — 战略规划、复杂推理、多步任务编排",
            icon="Brain",
        )
