"""Agent 注册表"""
from typing import Dict, List, Optional
from app.services.agents.base_agent import BaseAgent
from app.services.agents.cli_agent import CliAgent


class AgentRegistry:
    """Agent 注册表，管理所有可用的 Agent"""

    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}

    def register(self, agent: BaseAgent) -> None:
        """注册一个 Agent"""
        self._agents[agent.name] = agent

    def get(self, name: str) -> Optional[BaseAgent]:
        """根据名称获取 Agent"""
        return self._agents.get(name)

    def list_all(self) -> List[dict]:
        """列出所有可用 Agent"""
        return [agent.get_info() for agent in self._agents.values()]

    def list_names(self) -> List[str]:
        """列出所有 Agent 名称"""
        return list(self._agents.keys())


# 全局注册表实例
agent_registry = AgentRegistry()
