import httpx
from app.config import settings


class AIService:
    """AI服务封装"""

    def __init__(self):
        self.api_key = settings.deepseek_api_key
        self.base_url = settings.deepseek_base_url

    async def chat(self, message: str, history: list = None) -> str:
        """发送对话请求"""
        if not self.api_key:
            return "请先配置 DeepSeek API Key"

        messages = history or []
        messages.append({"role": "user", "content": message})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": "你是一个大学生效率助手，可以帮助用户管理任务、课程、笔记。请用中文回复。"},
                        *messages
                    ],
                    "temperature": 0.7
                },
                timeout=30.0
            )

            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"AI服务错误: {response.status_code}"

    async def parse_task(self, text: str) -> dict:
        """解析自然语言为任务"""
        prompt = f"""请从以下文本中提取任务信息，返回JSON格式：

文本: {text}

返回格式:
{{
  "tasks": [
    {{
      "title": "任务标题",
      "due_date": "截止日期(ISO格式，如果没有则为null)",
      "category": "分类(作业/考试/项目/其他)",
      "priority": 优先级(0=普通, 1=重要, 2=紧急)
    }}
  ]
}}

只返回JSON，不要其他文字。"""

        response = await self.chat(prompt)

        import json
        try:
            json_str = response
            if "```" in response:
                json_str = response.split("```")[1]
                if json_str.startswith("json"):
                    json_str = json_str[4:]

            return json.loads(json_str.strip())
        except Exception:
            return {"tasks": [{"title": text, "due_date": None, "category": "其他", "priority": 0}]}


ai_service = AIService()
