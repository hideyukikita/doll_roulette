#!/bin/bash
# リファクタ前のコードを pre/ にコピーする。
# おおもとのディレクトリ（ルート）はリファクタ後のコードを格納する前提。
# 用法: プロジェクトルートで bash scripts/backup-to-pre.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRE="$ROOT/pre"

echo "pre/ にリファクタ前のコードをコピーします（ルート: $ROOT）"
mkdir -p "$PRE"

# frontend（node_modules, dist を除く）。rsync 必須（WSL/Ubuntu では通常同梱）
mkdir -p "$PRE/frontend"
rsync -a --exclude='node_modules' --exclude='dist' --exclude='.env' --exclude='.env.local' \
  "$ROOT/frontend/" "$PRE/frontend/"

# backend（node_modules, dist, uploads を除く）
mkdir -p "$PRE/backend"
rsync -a --exclude='node_modules' --exclude='dist' --exclude='uploads' --exclude='.env' --exclude='.env.local' \
  "$ROOT/backend/" "$PRE/backend/"

# db
cp -r "$ROOT/db" "$PRE/"

# ルートの設定・ドキュメント類
for f in docker-compose.yml .env.example .dockerignore .cursorrules README.md 概要メモ.md; do
  [ -e "$ROOT/$f" ] && cp "$ROOT/$f" "$PRE/"
done

# scripts（本スクリプトも含む）
mkdir -p "$PRE/scripts"
cp -r "$ROOT/scripts/"* "$PRE/scripts/" 2>/dev/null || true

# docs
mkdir -p "$PRE/docs"
cp -r "$ROOT/docs/"* "$PRE/docs/" 2>/dev/null || true

echo "完了: pre/ にリファクタ前のコードをコピーしました。"
echo "  - リファクタ後のコードはルート（frontend/ backend/ db/）で編集してください。"
echo "  - pre/ で旧版を動かす場合は pre/frontend と pre/backend で npm install を実行してください。"
