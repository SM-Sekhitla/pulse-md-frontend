FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      echo "Using npm ci"; \
      npm ci; \
    else \
      echo "No package-lock.json found, using npm install"; \
      npm install; \
    fi

COPY . .

ARG VITE_API_URL=/api/v1
ARG VITE_API_TARGET=http://localhost:5000
ARG VITE_FRONTEND_BASE_URL=
ARG VITE_GIT_VERSION=dev

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_TARGET=$VITE_API_TARGET
ENV VITE_FRONTEND_BASE_URL=$VITE_FRONTEND_BASE_URL
ENV VITE_GIT_VERSION=$VITE_GIT_VERSION

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine

ARG VITE_API_TARGET=http://localhost:5000
ENV VITE_API_TARGET=$VITE_API_TARGET

#COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
