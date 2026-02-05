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
  const [allDone, setAllDone] = useState(false);
  const [resetting, setResetting] = useState(false);

  const remaining = dolls.filter((d) => !d.is_selected).length;
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

    // 回転（3〜5回転 + ランダムな最終角度）
    const extraRotations = 3 + Math.random() * 2;
    const finalAngle = rotation + 360 * extraRotations + Math.random() * 360;
    setRotation(finalAngle);

    // 3秒後に結果を取得
    setTimeout(() => {
      spinRoulette()
        .then((res: SpinResponse) => {
          if ("allDone" in res && res.allDone) {
            setAllDone(true);
          } else if ("doll" in res) {
            setResult(res.doll);
          }
          return Promise.all([getDolls(), getHistories(20)]);
        })
        .then(([list, hist]) => {
          setDolls(list);
          setHistories(hist);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "ルーレットに失敗しました");
        })
        .finally(() => {
          setSpinning(false);
        });
    }, 3000);
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
      setAllDone(false);
      const [list, hist] = await Promise.all([getDolls(), getHistories(20)]);
      setDolls(list);
      setHistories(hist);
    } catch (e) {
      setError(e instanceof Error ? e.message : "リセットに失敗しました");
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

        {/* 残り / 全 + リセットボタン */}
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

        {/* ルーレット演出 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          {error && (
            <p className="mb-4 text-sm text-red-600 text-center" role="alert">
              {error}
            </p>
          )}
          {total === 0 ? (
            <p className="text-center text-gray-500 py-8">かぞくを登録してね</p>
          ) : (
            <>
              <RouletteWheel dolls={dolls} rotation={rotation} />
              <div className="mt-4 text-center">
                {allDone ? (
                  <p className="text-xl font-bold text-amber-600 mb-4">全員一周したよ！</p>
                ) : result ? (
                  <p className="text-xl font-bold text-indigo-600 mb-4">
                    当選: {result.name}
                  </p>
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

        {/* 当選履歴 */}
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
