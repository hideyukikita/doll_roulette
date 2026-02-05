/**
 * ルーレットページ（文字ルーレット・当選表示）
 */
import { useState, useEffect, useRef } from "react";
import { getDolls } from "../api/dolls.js";
import { spinRoulette } from "../api/roulette.js";
import { getHistories, type HistoryRecord } from "../api/histories.js";
import { resetAllSelected } from "../api/reset.js";
import type { Doll } from "../types/doll.js";
import { getDollColorStyle } from "../utils/colors.js";
import { apiUrl } from "../api/client.js";

const SPIN_DURATION_MS = 2500;
const CYCLE_INTERVAL_MS = 80;

export default function RoulettePage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [result, setResult] = useState<Doll | null>(null);
  const [luckySecond, setLuckySecond] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showingLastResult, setShowingLastResult] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (lastResultTimeoutRef.current) clearTimeout(lastResultTimeoutRef.current);
    };
  }, []);

  const handleSpin = async () => {
    if (spinning || total === 0) return;
    setError(null);
    setResult(null);
    setLuckySecond(false);
    setAllDone(false);
    setShowingLastResult(false);
    setSpinning(true);
    setDisplayName("");

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

      const winner = res.doll;
      const isLuckySecond = res.luckySecond === true;
      const names = dolls.map((d) => d.name);
      if (names.length === 0) names.push(winner.name);

      let cycleIndex = 0;
      const stopAt = Date.now() + SPIN_DURATION_MS;

      intervalRef.current = setInterval(() => {
        setDisplayName(names[cycleIndex % names.length] ?? "?");
        cycleIndex++;
        if (Date.now() >= stopAt) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setDisplayName(winner.name);
          setResult(winner);
          setLuckySecond(isLuckySecond);
          Promise.all([getDolls(), getHistories(20)]).then(([list, hist]) => {
            setDolls(list);
            setHistories(hist);
            const newRemaining = list.filter((d) => !d.is_selected).length;
            if (newRemaining === 0) {
              setShowingLastResult(true);
              if (lastResultTimeoutRef.current) clearTimeout(lastResultTimeoutRef.current);
              lastResultTimeoutRef.current = setTimeout(() => {
                lastResultTimeoutRef.current = null;
                setShowingLastResult(false);
                setResult(null);
                setLuckySecond(false);
              }, 3000);
            }
          });
          setSpinning(false);
        }
      }, CYCLE_INTERVAL_MS);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ルーレットに失敗しました");
      setSpinning(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    if (!window.confirm("全員の選択状態と当選履歴をリセットしますか？\n（全員がまた選ばれるようになります）")) {
      return;
    }
    setResetting(true);
    setError(null);
    setHistories([]);
    try {
      await resetAllSelected();
      if (lastResultTimeoutRef.current) {
        clearTimeout(lastResultTimeoutRef.current);
        lastResultTimeoutRef.current = null;
      }
      setResult(null);
      setLuckySecond(false);
      setAllDone(false);
      setShowingLastResult(false);
      setDisplayName("");
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

        <section className="bg-white rounded-lg shadow p-8 mb-6">
          {error && (
            <p className="mb-4 text-sm text-red-600 text-center" role="alert">
              {error}
            </p>
          )}
          {total === 0 ? (
            <p className="text-center text-gray-500 py-8">かぞくを登録してね</p>
          ) : remaining === 0 && !showingLastResult ? (
            <p className="text-center text-gray-500 py-8">全員一周したよ！リセットしてね</p>
          ) : (
            <>
              {/* 文字ルーレット表示エリア */}
              <div className="min-h-[120px] flex flex-col items-center justify-center mb-6">
                {spinning ? (
                  <p
                    className="text-3xl font-bold animate-pulse inline-block px-3 py-1 rounded"
                    style={getDollColorStyle(dolls.find((d) => d.name === displayName)?.color ?? "")}
                    aria-live="polite"
                  >
                    {displayName || "…"}
                  </p>
                ) : allDone ? (
                  <p className="text-2xl font-bold text-amber-600">全員一周したよ！</p>
                ) : result ? (
                  <div className="text-center">
                    {luckySecond ? (
                      <div
                        className="inline-block px-6 py-4 rounded-2xl bg-amber-100 border-4 border-amber-400 animate-pulse"
                        style={{
                          animation: "luckyPulse 0.5s ease-in-out infinite alternate",
                          boxShadow: "0 0 20px rgba(245, 158, 11, 0.6)",
                        }}
                      >
                        <p className="text-2xl font-black text-amber-600 mb-1">二回目！</p>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          {result.image_url && (
                            <img
                              src={apiUrl(result.image_url)}
                              alt={result.name}
                              className="h-24 w-24 object-cover rounded"
                            />
                          )}
                          <p
                            className="text-xl font-bold inline-block px-3 py-1 rounded"
                            style={getDollColorStyle(result.color)}
                          >
                            当選: {result.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        {result.image_url && (
                          <img
                            src={apiUrl(result.image_url)}
                            alt={result.name}
                            className="h-24 w-24 object-cover rounded"
                          />
                        )}
                        <p
                          className="text-2xl font-bold inline-block px-3 py-1 rounded"
                          style={getDollColorStyle(result.color)}
                        >
                          当選: {result.name}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl text-gray-400">回すと選ばれるよ</p>
                )}
              </div>

              <style>{`
                @keyframes luckyPulse {
                  from { transform: scale(1); opacity: 1; }
                  to { transform: scale(1.05); opacity: 0.95; }
                }
              `}</style>

              {remaining > 0 && (
                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={spinning}
                  className="w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {spinning ? "まわしてる…" : "ルーレットを回す"}
                </button>
              )}
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
                <li key={h.id} className="flex justify-between items-center text-sm text-gray-700 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {h.doll_image_url && (
                      <img
                        src={apiUrl(h.doll_image_url)}
                        alt={h.doll_name}
                        className="h-8 w-8 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <span
                      className="font-medium inline-block px-2 py-0.5 rounded"
                      style={getDollColorStyle(h.doll_color ?? "")}
                    >
                      {h.doll_name}
                    </span>
                  </div>
                  <span className="text-gray-500 flex-shrink-0">{formatDate(h.selected_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
