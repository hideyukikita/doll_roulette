# ぬいぐるみルーレット フロントエンド（Vite + React + TypeScript）
# ビルドコンテキスト: プロジェクトルート（docker-compose で context: . を指定）
FROM node:22-alpine

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .

EXPOSE 5173

CMD ["npm", "run", "dev"]
