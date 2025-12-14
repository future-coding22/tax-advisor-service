FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Install Python, pip, and required build tools for Python SDKs
# Includes 'cargo' (Rust compiler) for dependencies like 'cryptography'.
RUN apk add --no-cache bash git procps docker-cli curl github-cli \
        python3 py3-pip \
        # Packages required for compiling native extensions
        build-base \
        python3-dev \
        libffi-dev \
        openssl-dev \
        cargo \
    && pip install --no-cache-dir --break-system-packages google-genai openai anthropic \
    && npm install -g @google/gemini-cli @anthropic-ai/claude-code \
    # Remove build dependencies to keep the final image size small
    && apk del build-base python3-dev libffi-dev openssl-dev cargo

ENV SHELL=/bin/sh

COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
