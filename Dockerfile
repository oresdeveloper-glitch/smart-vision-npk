FROM node:24-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html ./
COPY public ./public
COPY src ./src
RUN npm ci --no-audit --no-fund
RUN npx vite build

FROM python:3.10-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    FRONTEND_DIST=/app/dist

COPY ml/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY ml /app/ml
COPY --from=frontend-build /app/dist /app/dist

EXPOSE 7860
WORKDIR /app/ml
CMD ["python", "-u", "server.py"]
