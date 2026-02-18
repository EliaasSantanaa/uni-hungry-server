#!/bin/sh
# O comando 'set -e' faz o script parar imediatamente se qualquer comando falhar.
# Isso é crucial: se a migração falhar, o container NÃO deve iniciar (para não corromper dados).
set -e

echo "Verificando banco de dados..."

echo "Rodando Prisma Migrate Deploy..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Banco de dados atualizado com sucesso!"

# O "$@" pega o comando que está no CMD do Dockerfile e executa ele
echo "Iniciando a aplicação..."
exec "$@"