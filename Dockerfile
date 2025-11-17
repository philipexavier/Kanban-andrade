# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production

# Copia os arquivos buildados
COPY --from=build /app/build /usr/share/nginx/html

# Copia a configuração do nginx
COPY dockerizer/nginx.conf /etc/nginx/conf.d/default.conf

# Cria script de inicialização customizado
RUN cat > /docker-entrypoint.sh <<'EOF'
#!/bin/sh
set -e

echo "=== Iniciando container ==="

# Gera arquivo de variáveis de ambiente
echo "Gerando arquivo de variáveis de ambiente: /usr/share/nginx/html/.env.js"
cat > /usr/share/nginx/html/.env.js <<ENVEOF
window._env_ = {
  REACT_APP_CHATWOOT_URL: "${REACT_APP_CHATWOOT_URL}",
  REACT_APP_CHATWOOT_TOKEN: "${REACT_APP_CHATWOOT_TOKEN}",
  REACT_APP_CHATWOOT_ACCOUNT_ID: "${REACT_APP_CHATWOOT_ACCOUNT_ID}",
  REACT_APP_DEBUG: "${REACT_APP_DEBUG}"
};
ENVEOF

echo "Arquivo .env.js gerado com sucesso!"
echo ""
echo "Conteúdo do .env.js:"
cat /usr/share/nginx/html/.env.js
echo ""

# Lista arquivos para debug
echo "Arquivos em /usr/share/nginx/html:"
ls -lah /usr/share/nginx/html/ | head -20
echo ""

# Testa configuração do nginx
echo "Testando configuração do Nginx..."
nginx -t
echo ""

# Inicia o nginx em foreground
echo "Iniciando Nginx..."
exec nginx -g 'daemon off;'
EOF

# Torna o script executável
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

# Usa o script customizado
ENTRYPOINT ["/docker-entrypoint.sh"]
