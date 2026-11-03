FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY --from=ghcr.io/astral-sh/uv:0.11.8 /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY app ./app

FROM base AS tests
RUN uv sync --frozen
COPY tests ./tests
USER 10001
CMD ["/app/.venv/bin/pytest", "-p", "no:cacheprovider", "-s", "-v"]

FROM base AS runtime
USER 10001
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--no-access-log"]
