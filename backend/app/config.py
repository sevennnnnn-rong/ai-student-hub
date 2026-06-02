from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    database_url: str = "sqlite:///./student_hub.db"
    app_name: str = "气象台Hub"
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

    # MiMo 配置
    mimo_api_key: str = ""
    mimo_base_url: str = "https://api.mimo.ai/v1"
    mimo_model: str = "mimo-7b"

    # Trae 配置
    trae_ws_url: str = "wss://api.trae.ai/ws"
    trae_token: str = ""
    trae_region: str = "cn"

    cors_origins: str = "http://localhost:3000,http://localhost:3001"

    model_config = {"env_file": ".env"}


settings = Settings()
