FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/apps \
    PIP_DEFAULT_TIMEOUT=180

WORKDIR /apps/AI

COPY requirements.txt .

# BuildKit 캐시 사용 (DOCKER_BUILDKIT=1 필요)
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m pip install --upgrade pip && \
    pip install --timeout 180 --retries 5 --prefer-binary -r requirements.txt

# 컨텍스트가 apps/AI 이므로 이 한 줄이면 /apps/AI 아래에 api/, main.py 등이 복사됨
COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
