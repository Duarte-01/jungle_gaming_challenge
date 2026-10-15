FROM node:24.19.0-trixie-slim@sha256:ab3eebe934147fee049b5eb83c570f68c849a13c930bdfa482de99fcdfa3b3de
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium=155.0.8059.39-1~deb13u1 chromium-common=155.0.8059.39-1~deb13u1 fonts-liberation fonts-dejavu-core fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium CHROME_PATH=/usr/bin/chromium
ENV XDG_CONFIG_HOME=/tmp/kurio-config XDG_CACHE_HOME=/tmp/kurio-cache
WORKDIR /app
