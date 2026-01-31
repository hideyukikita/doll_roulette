# かぞくたちルーレット バックエンド（Node.js + Express + TypeScript）
# ビルドコンテキスト: プロジェクトルート（docker-compose で context: . を指定）
FROM node:22-alpine

WORKDIR /app

# 依存関係のみ先にコピー（レイヤーキャッシュ活用）
COPY backend/package.json backend/package-lock.json* ./
RUN npm install

COPY backend/ .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
