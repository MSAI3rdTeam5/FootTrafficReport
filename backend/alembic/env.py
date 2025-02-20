import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Alembic Config 객체
config = context.config

# logging.ini 설정 불러오기
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# app.database의 Base import
from app.database import Base
from app import models
target_metadata = Base.metadata

# alembic.ini에 설정된 sqlalchemy.url
ini_url = config.get_main_option("sqlalchemy.url")
# 환경변수 대체(없다면 기존 설정 사용)
env_url = os.environ.get("DATABASE_URL", ini_url)

def run_migrations_offline():
    
    """Offline mode (DB)"""

    context.configure(
        url=env_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():

    """Online mode (DB)"""

    # ENV 우선 적용
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        url=env_url,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
