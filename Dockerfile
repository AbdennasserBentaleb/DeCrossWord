# Stage 1: Build the Vite application
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx (unprivileged)
FROM nginxinc/nginx-unprivileged:1.25-alpine

# Set user to non-root UID 65532 for KCNA compliance
USER 65532

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy bundled static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose non-privileged port (8080)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
