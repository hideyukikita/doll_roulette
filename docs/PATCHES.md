# コピペ用 修正パッチ

以下の内容を該当ファイルにコピペしてください。

---

## 1. backend/src/services/rouletteService.ts

### 変更1: SELECTED_WEIGHT と luckySecond を追加

**7行目付近** `const SELECTED_WEIGHT = 0.01;` を以下に変更:
```typescript
/** 一度選ばれた子の重み（100〜200回に1回程度） */
const SELECTED_WEIGHT = 0.008;
```

**12〜14行目** `export interface SpinResult` を以下に変更:
```typescript
export interface SpinResult {
  doll: Doll;
  /** 一度選ばれた子が再当選した場合 true */
  luckySecond?: boolean;
}
```

**54〜57行目** `const selected = dolls[index];` の直後に1行追加:
```typescript
    const selected = dolls[index];
    if (!selected) throw new Error("抽選に失敗しました");
    const wasAlreadySelected = selected.is_selected;

    await client.query("BEGIN");
```

**79行目** `return { doll };` を以下に変更:
```typescript
    return { doll, luckySecond: wasAlreadySelected };
```

---

## 2. backend/src/services/resetService.ts

**7〜9行目** の UPDATE 文を以下に変更:
```typescript
  const result = await pool.query(`UPDATE dolls SET is_selected = false`);
```

---

## 3. frontend/src/api/roulette.ts

**7〜9行目** `export interface SpinResult` を以下に変更:
```typescript
export interface SpinResult {
  doll: Doll;
  /** 一度選ばれた子が再当選した場合 true */
  luckySecond?: boolean;
}
```

---

## 4. frontend/src/components/RouletteWheel.tsx

**64〜125行目** の `return` 部分を以下に**丸ごと**置き換え:

```tsx
  return (
    <div className="relative flex items-center justify-center w-full">
      {/* ルーレット盤（回転） */}
      <svg width="400" height="450" viewBox="0 0 400 450" className="max-w-full block">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: "transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {segments.map((seg) => {
            const path = createSegmentPath(seg.startAngle, seg.endAngle);
            const textPos = getTextPosition(seg.startAngle, seg.endAngle);
            return (
              <g key={seg.doll.id}>
                <path d={path} fill={seg.color} stroke="#fff" strokeWidth="2" />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize="14"
                  fontWeight="bold"
                  style={{ userSelect: "none" }}
                  transform={`rotate(${textPos.angle}, ${textPos.x}, ${textPos.y})`}
                >
                  {seg.doll.name}
                </text>
              </g>
            );
          })}
          <circle cx={centerX} cy={centerY} r="30" fill="#fff" stroke="#d1d5db" strokeWidth="2" />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#374151"
            fontSize="12"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            SPIN
          </text>
        </g>
      </svg>

      {/* 針（HTML レイヤーで前面に表示） */}
      <div
        className="absolute pointer-events-none z-20"
        style={{
          top: "8%",
          left: "50%",
          transform: "translate(-50%, 0)",
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: "130px solid #ef4444",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      />
      <div
        className="absolute rounded-full bg-red-500 border-2 border-red-800 pointer-events-none z-20"
        style={{
          top: "7.5%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 22,
          height: 22,
        }}
      />
    </div>
  );
```

---

## 5. frontend/src/pages/RoulettePage.tsx

**全文を以下に置き換え**（長いのでファイルごと上書き）:

```tsx
/**
 * ルーレットページ（Step 4: 円形ルーレット演出・当選・残り/全カウント・当選履歴）
 */
import { useState, useEffect } from "react";
import { getDolls } from "../api/dolls.js";
import { spinRoulette, type SpinResponse } from "../api/roulette.js";
import { getHistories, type HistoryRecord } from "../api/histories.js";
import { resetAllSelected } from "../api/reset.js";
import type { Doll } from "../types/doll.js";
import RouletteWheel from "../components/RouletteWheel.js";

export default function RoulettePage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Doll | null>(null);
  const [luckySecond, setLuckySecond] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [resetting, setResetting] = useState(false);

  const remaining = dolls.filter((d) => !d.is_selected).length;
  const wheelDolls = dolls.filter((d) => !d.is_selected);
  const total = dolls.length;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getDolls(), getHistories(20)])
      .then(([list, hist]) => {
        if (!cancelled) {
          setDolls(list);
          setHistories(hist);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSpin = async () => {
    if (spinning || total === 0) return;
    setError(null);
    setResult(null);
    setAllDone(false);
    setSpinning(true);

    try {
      const res = await spinRoulette();

      if ("allDone" in res && res.allDone) {
        setAllDone(true);
        setSpinning(false);
        const [list, hist] = await Promise.all([getDolls(), getHistories(20)]);
        setDolls(list);
        setHistories(hist);
        return;
      }

      if (!("doll" in res)) {
        throw new Error("不正な結果");
      }

      const isLuckySecond = res.luckySecond === true;

      if (isLuckySecond) {
        const extraRotations = 3 + Math.random() * 2;
        const randomAngle = Math.random() * 360;
        const finalAngle = rotation + randomAngle + 360 * extraRotations;
        setRotation(finalAngle);
      } else {
        const winnerIndex = wheelDolls.findIndex((d) => d.id === res.doll.id);
        if (winnerIndex === -1) {
          throw new Error("当選者が見つかりません");
        }
        const anglePerSegment = 360 / wheelDolls.length;
        const winnerCenterAngle = winnerIndex * anglePerSegment + anglePerSegment / 2;
        const extraRotations = 3 + Math.random() * 2;
        const targetRemainder = winnerCenterAngle % 360;
        const currentRemainder = ((rotation % 360) + 360) % 360;
        const delta = ((targetRemainder - currentRemainder + 360) % 360) + 360 * extraRotations;
        const finalAngle = rotation + delta;
        setRotation(finalAngle);
      }

      setTimeout(async () => {
        setResult(res.doll);
        setLuckySecond(res.luckySecond === true);
        const [list, hist] = await Promise.all([getDolls(), getHistories(20)]);
        setDolls(list);
        setHistories(hist);
        setSpinning(false);
      }, 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ルーレットに失敗しました");
      setSpinning(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    if (!window.confirm("全員の選択状態をリセットしますか？\n（全員がまた選ばれるようになります）")) {
      return;
    }
    setResetting(true);
    setError(null);
    try {
      await resetAllSelected();
      setResult(null);
      setLuckySecond(false);
      setAllDone(false);
      const [list, hist] = await Promise.all([getDolls(), getHistories(20)]);
      setDolls(list);
      setHistories(hist);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "リセットに失敗しました";
      setError(msg);
      console.error("Reset error:", e);
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p className="text-gray-500">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">かぞくたちルーレット</h1>

        <section className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-lg text-gray-700">
              残り <span className="font-bold text-indigo-600">{remaining}</span> 人 / 全{" "}
              <span className="font-bold text-gray-800">{total}</span> 人
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || spinning || total === 0}
              className="rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              {resetting ? "リセット中…" : "リセット"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 mb-6">
          {error && (
            <p className="mb-4 text-sm text-red-600 text-center" role="alert">
              {error}
            </p>
          )}
          {total === 0 ? (
            <p className="text-center text-gray-500 py-8">かぞくを登録してね</p>
          ) : remaining === 0 ? (
            <p className="text-center text-gray-500 py-8">全員一周したよ！リセットしてね</p>
          ) : (
            <>
              <RouletteWheel
                key={wheelDolls.map((d) => d.id).join(",")}
                dolls={wheelDolls}
                rotation={rotation}
              />
              <div className="mt-4 text-center">
                {allDone ? (
                  <p className="text-xl font-bold text-amber-600 mb-4">全員一周したよ！</p>
                ) : result ? (
                  <div className="mb-4">
                    {luckySecond ? (
                      <>
                        <p className="text-lg font-bold text-amber-600">ラッキー！二度目だね！</p>
                        <p className="text-xl font-bold text-indigo-600 mt-1">当選: {result.name}</p>
                      </>
                    ) : (
                      <p className="text-xl font-bold text-indigo-600">当選: {result.name}</p>
                    )}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {spinning ? "まわしてる…" : "ルーレットを回す"}
                </button>
              </div>
            </>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">当選履歴</h2>
          {histories.length === 0 ? (
            <p className="text-gray-500">まだ当選履歴はありません。</p>
          ) : (
            <ul className="space-y-2">
              {histories.map((h) => (
                <li key={h.id} className="flex justify-between text-sm text-gray-700">
                  <span className="font-medium">{h.doll_name}</span>
                  <span className="text-gray-500">{formatDate(h.selected_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
```

---

## 修正内容まとめ

| ファイル | 内容 |
|----------|------|
| rouletteService.ts | 二度当選（luckySecond）、wasAlreadySelected 追加、SELECTED_WEIGHT=0.008 |
| resetService.ts | UPDATE を全件対象に変更（リセット失敗対策） |
| api/roulette.ts | SpinResult に luckySecond 追加 |
| RouletteWheel.tsx | 針を SVG から HTML オーバーレイに変更、円盤を先に描画 |
| RoulettePage.tsx | 先に API で結果取得→角度計算、wheelDolls（未選択のみ）、二度当選表示、key で再描画、リセット時の luckySecond クリア |

適用後は `docker compose up --build -d` で再ビルドしてください。
