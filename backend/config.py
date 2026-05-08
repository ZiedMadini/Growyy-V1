from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    firebase_credentials_path: str = "./serviceAccountKey.json"
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:3b"
    disease_model_path: str = "./models/efficientnet_plantvillage.pth"
    simulation_interval_seconds: int = 600


settings = Settings()
