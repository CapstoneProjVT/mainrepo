# InternAtlas API

```bash
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

By default, if `DATABASE_URL` is unset, the API uses sqlite (`internatlas.db`) for local preview mode.

OpenAPI docs at `/docs`.
