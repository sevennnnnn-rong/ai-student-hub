from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    database_url: str = "sqlite:///./student_hub.db"
    app_name: str = "AI Student Hub"
    debug: bool = False

    # DeepSeek 配置
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"

    # Claude CLI 配置
    claude_cli_path: str = "claude"
    claude_model: str = "sonnet"

    # Codex CLI 配置
    codex_cli_path: str = "codex"
    codex_model: str = "codex-latest"

    # Doubao (豆包) 配置
    doubao_api_key: str = ""
    doubao_model: str = "doubao-1.5-pro-256k"
    doubao_endpoint: str = "https://ark.cn-beijing.volces.com/api/v3"

    class Config:
        env_file = ".env"


settings = Settings()
