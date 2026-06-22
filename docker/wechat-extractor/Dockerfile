FROM python:3.11-slim-bookworm AS python-deps

ARG WECHAT_TOOL_REPOSITORY=https://github.com/Panniantong/wechat-article-for-ai.git
ARG WECHAT_TOOL_COMMIT=c52b2aa2aa6f0f0e3689c978db8f183038d2f00c

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    WECHAT_ARTICLE_PYTHON=/usr/local/bin/python \
    WECHAT_ARTICLE_TOOL_DIR=/opt/wechat-article-for-ai

RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get -o Acquire::Retries=3 -o Acquire::https::Timeout=30 update \
    && apt-get -o Acquire::Retries=3 -o Acquire::https::Timeout=30 install -y --no-install-recommends \
      ca-certificates \
      fonts-noto-cjk \
      git \
      libasound2 \
      libatk1.0-0 \
      libcairo-gobject2 \
      libcups2 \
      libdbus-1-3 \
      libdbus-glib-1-2 \
      libfontconfig1 \
      libgbm1 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnss3 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libx11-6 \
      libx11-xcb1 \
      libxcb-shm0 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxt6 \
    && rm -rf /var/lib/apt/lists/*

COPY docker/wechat-extractor/requirements.txt /tmp/requirements.txt

ARG PIP_INDEX_URL=https://pypi.org/simple

RUN python -m pip install --no-cache-dir --timeout 180 --retries 5 \
      --index-url "$PIP_INDEX_URL" -r /tmp/requirements.txt

FROM python-deps AS runtime

RUN python -m camoufox fetch

RUN git clone "$WECHAT_TOOL_REPOSITORY" "$WECHAT_ARTICLE_TOOL_DIR" \
    && git -C "$WECHAT_ARTICLE_TOOL_DIR" checkout "$WECHAT_TOOL_COMMIT" \
    && rm -rf "$WECHAT_ARTICLE_TOOL_DIR/.git" /root/.cache/pip

COPY docker/wechat-extractor/smoke_test.py /opt/atlora/smoke_test.py
COPY worker /opt/atlora/worker

WORKDIR /opt/atlora/worker

ENV PORT=8080 PYTHONPATH=/opt/atlora/worker

CMD ["sh", "-c", "exec gunicorn --bind :${PORT} --workers 1 --threads 1 --timeout 300 atlora_worker.app:app"]
