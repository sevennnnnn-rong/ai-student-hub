"""Agent 抽象基类"""
from abc import ABC, abstractmethod
from typing import Optional, AsyncGenerator, List, Dict


class BaseAgent(ABC):
    """所有 Agent 的基类"""

    name: str              # 唯一标识符，如 "deepseek"
    display_name: str      # 前端显示名，如 "DeepSeek"
    description: str       # 功能描述
    icon: str              # 图标名称

    @abstractmethod
    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """发送消息并获取回复"""
        pass

    async def chat_stream(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[str, None]:
        """流式输出（子类可覆盖）"""
        # 默认实现：非流式，一次性返回
        response = await self.chat(message, history)
        yield response

    def get_info(self) -> dict:
        """获取 Agent 信息"""
        return {
            "name": self.name,
            "display_name": self.display_name,
            "description": self.description,
            "icon": self.icon,
        }
