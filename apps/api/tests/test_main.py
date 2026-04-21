import pytest

from app.main import should_auto_seed


@pytest.mark.parametrize(
    ("auto_seed", "vercel", "vercel_env", "expected"),
    [
        ("true", None, None, True),
        ("false", "1", "production", False),
        (None, "1", None, True),
        (None, None, "preview", True),
        (None, None, None, False),
    ],
)
def test_should_auto_seed(auto_seed, vercel, vercel_env, expected, monkeypatch):
    if auto_seed is None:
        monkeypatch.delenv("AUTO_SEED", raising=False)
    else:
        monkeypatch.setenv("AUTO_SEED", auto_seed)

    if vercel is None:
        monkeypatch.delenv("VERCEL", raising=False)
    else:
        monkeypatch.setenv("VERCEL", vercel)

    if vercel_env is None:
        monkeypatch.delenv("VERCEL_ENV", raising=False)
    else:
        monkeypatch.setenv("VERCEL_ENV", vercel_env)

    assert should_auto_seed() is expected
