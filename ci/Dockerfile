FROM node:24.19.0-trixie-slim@sha256:ab3eebe934147fee049b5eb83c570f68c849a13c930bdfa482de99fcdfa3b3de
COPY install-chromium.sh chromium.sha256 /opt/kurio-ci/
RUN --mount=type=secret,id=kurio_ca_bundle apt-get update \
 && apt-get install -y --no-install-recommends fonts-liberation fonts-dejavu-core fonts-noto-color-emoji ca-certificates curl \
 && bash /opt/kurio-ci/install-chromium.sh \
 && rm -rf /var/lib/apt/lists/*
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium CHROME_PATH=/usr/bin/chromium
ENV XDG_CONFIG_HOME=/tmp/kurio-config XDG_CACHE_HOME=/tmp/kurio-cache
WORKDIR /app
