# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Remove configuração padrão
RUN rm -rf /etc/nginx/conf.d/*

# Copia os arquivos buildados
COPY --from=build /app/build /usr/share/nginx/html

# Copia a configuração do nginx
COPY dockerizer/nginx.conf /etc/nginx/conf.d/default.conf

# Cria script que gera .env.js e mantém nginx rodando
RUN cat > /usr/local/bin/start.sh <<'EOF'
#!/bin/sh
echo "=== Gerando .env.js ==="
cat > /usr/share/nginx/html/.env.js <<ENVJS
window._env_ = {
  REACT_APP_CHATWOOT_URL: "${REACT_APP_CHATWOOT_URL}",
  REACT_APP_CHATWOOT_TOKEN: "${REACT_APP_CHATWOOT_TOKEN}",
  REACT_APP_CHATWOOT_ACCOUNT_ID: "${REACT_APP_CHATWOOT_ACCOUNT_ID}",
  REACT_APP_DEBUG: "${REACT_APP_DEBUG}"
};
ENVJS

echo "✓ Arquivo .env.js criado!"
echo ""
echo "=== Testando Nginx ==="
nginx -t
echo ""
echo "=== Iniciando Nginx ==="

# Inicia nginx e mantém container vivo
nginx -g 'daemon off;'
EOF

RUN chmod +x /usr/local/bin/start.sh

EXPOSE 3001

CMD ["/usr/local/bin/start.sh"]
