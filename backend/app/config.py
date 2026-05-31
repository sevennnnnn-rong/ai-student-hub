from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    database_url: str = "sqlite:///./student_hub.db"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    app_name: str = "AI Student Hub"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
