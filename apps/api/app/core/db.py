import ssl as _ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.settings import settings

_connect_args: dict = {}
_engine_kwargs = {
    "future": True,
    "pool_pre_ping": True,
}

if settings.database_url.startswith("postgresql"):
    _local_hosts = ("@db:", "@localhost:", "@127.0.0.1:")
    if any(host in settings.database_url for host in _local_hosts):
        _connect_args = {"statement_cache_size": 0}
    else:
        _ssl_ctx = _ssl.create_default_context()
        _ssl_ctx.check_hostname = False
        _ssl_ctx.verify_mode = _ssl.CERT_NONE
        _connect_args = {"ssl": _ssl_ctx, "statement_cache_size": 0}
    _engine_kwargs.update(pool_size=5, max_overflow=10)

_engine_kwargs["connect_args"] = _connect_args
engine = create_async_engine(settings.database_url, **_engine_kwargs)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with SessionLocal() as session:
        yield session
