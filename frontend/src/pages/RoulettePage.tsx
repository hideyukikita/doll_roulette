/**
 * ルーレットページ（円盤ルーレット・当選表示）
 */
import { useState, useEffect, useRef } from "react";
import { getDolls } from "../api/dolls.js";
import { spinRoulette } from "../api/roulette.js";
import { getHistories, type HistoryRecord } from "../api/histories.js";
import { resetAllSelected } from "../api/reset.js";
import type { Doll } from "../types/doll.js";
import { getDollColorStyle } from "../utils/colors.js";
import { apiUrl } from "../api/client.js";
import RouletteWheel from "../components/RouletteWheel.js";

const RESULT_DISPLAY_MS = 3000;

const SPINNING_MESSAGES = ["誰が出るかな？", "ゆちゅきと寝たいなぁ", "楽しみ！！", "マックのポテト、、、"];
const SPINNING_RARE_PROB = 0.05;

const RESULT_MESSAGES = ["おめでとう！", "今日はパーティー！", "お外連れてって！"];

function pickSpinningMessage(): string {
  return Math.random() < SPINNING_RARE_PROB
    ? SPINNING_MESSAGES[3]
    : SPINNING_MESSAGES[Math.floor(Math.random() * 3)];
}

function pickResultMessage(): string {
  return RESULT_MESSAGES[Math.floor(Math.random() * RESULT_MESSAGES.length)];
}

export default function RoulettePage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Doll | null>(null);
  const [luckySecond, setLuckySecond] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showingResult, setShowingResult] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [wheelDolls, setWheelDolls] = useState<Doll[]>([]);
  const [spinningMessage, setSpinningMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<Doll | null>(null);

  const remaining = dolls.filter((d) => !d.is_selected).length;
  const total = dolls.length;
  const unselectedDolls = dolls.filter((d) => !d.is_selected);
  const displayWheelDolls = wheelDolls.length > 0 ? wheelDolls : unselectedDolls;

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
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const handleSpin = async () => {
    if (spinning || total === 0) return;
    if (resultTimeoutRef.current) {
      clearTimeout(resultTimeoutRef.current);
      resultTimeoutRef.current = null;
    }
    setError(null);
    setResult(null);
    resultRef.current = null;
    setLuckySecond(false);
    setAllDone(false);
    setShowingResult(false);
    setWinnerId(null);
    setWheelDolls([]);
    setSpinningMessage(pickSpinningMessage());
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

      const winner = res.doll;
      const isLuckySecond = res.luckySecond === true;
      let currentWheelDolls = dolls.filter((d) => !d.is_selected);
      if (currentWheelDolls.length === 0) {
        currentWheelDolls = [winner];
      }
      setWheelDolls(currentWheelDolls);
      setWinnerId(winner.id);
      setLuckySecond(isLuckySecond);
      setResult(winner);
      resultRef.current = winner;
    } catch (e) {
      setError(e instanceof Error ? e.message : "ルーレットに失敗しました");
      setSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    setSpinning(false);
    setResultMessage(pickResultMessage());
    setShowingResult(true);
    Promise.all([getDolls(), getHistories(20)]).then(([list, hist]) => {
      setDolls(list);
      setHistories(hist);
    });
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    resultTimeoutRef.current = setTimeout(() => {
      resultTimeoutRef.current = null;
      resultRef.current = null;
      setShowingResult(false);
      setResult(null);
      setLuckySecond(false);
      setWinnerId(null);
      setWheelDolls([]);
    }, RESULT_DISPLAY_MS);
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
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
      setResult(null);
      resultRef.current = null;
      setLuckySecond(false);
      setAllDone(false);
      setShowingResult(false);
      setWinnerId(null);
      setWheelDolls([]);
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <p className="text-stone-500">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-stone-700 mb-6 text-center">かぞくたちルーレット</h1>

        <section className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-lg text-stone-600">
              残り <span className="font-bold text-violet-500">{remaining}</span> 人 / 全{" "}
              <span className="font-bold text-stone-700">{total}</span> 人
            </p>
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting || spinning || total === 0}
              className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2"
            >
              {resetting ? "リセット中…" : "リセット"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow-sm p-8 mb-6">
          {error && (
            <p className="mb-4 text-sm text-rose-500 text-center" role="alert">
              {error}
            </p>
          )}
          {total === 0 ? (
            <p className="text-center text-stone-500 py-8">かぞくを登録してね</p>
          ) : remaining === 0 && !showingResult ? (
            <p className="text-center text-stone-500 py-8">全員一周したよ！リセットしてね</p>
          ) : (
            <>
              {/* 円盤ルーレット or 結果表示 */}
              <div className="min-h-[320px] flex flex-col items-center justify-center mb-6">
                {(showingResult || (result && !spinning)) && (result || resultRef.current) ? (
                  <div className="text-center">
                    {(() => {
                      const displayResult = result || resultRef.current;
                      if (!displayResult) return null;
                      return luckySecond ? (
                        <div
                          className="inline-block px-6 py-4 rounded-2xl bg-amber-50 border-4 border-amber-300 animate-pulse"
                          style={{
                            animation: "luckyPulse 0.5s ease-in-out infinite alternate",
                            boxShadow: "0 0 20px rgba(253, 230, 138, 0.5)",
                          }}
                        >
                          <p className="text-2xl font-black text-amber-600 mb-1">二回目！</p>
                          <div className="flex items-center justify-center gap-3 flex-wrap">
                            {displayResult.image_url && (
                              <img
                                src={apiUrl(displayResult.image_url)}
                                alt={displayResult.name}
                                className="h-24 w-24 object-cover rounded"
                              />
                            )}
                            <p
                              className="text-xl font-bold inline-block px-3 py-1 rounded"
                              style={getDollColorStyle(displayResult.color)}
                            >
                              当選: {displayResult.name}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          {displayResult.image_url && (
                            <img
                              src={apiUrl(displayResult.image_url)}
                              alt={displayResult.name}
                              className="h-24 w-24 object-cover rounded"
                            />
                          )}
                          <p
                            className="text-2xl font-bold inline-block px-3 py-1 rounded"
                            style={getDollColorStyle(displayResult.color)}
                          >
                            当選: {displayResult.name}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : allDone ? (
                  <p className="text-2xl font-bold text-amber-600">全員一周したよ！</p>
                ) : (
                  <RouletteWheel
                    key={displayWheelDolls.map((d) => d.id).join(",")}
                    dolls={displayWheelDolls}
                    winnerId={spinning ? winnerId : null}
                    spinning={spinning}
                    onSpinComplete={handleSpinComplete}
                  />
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
                  disabled={spinning || showingResult}
                  className="w-full rounded-md bg-violet-500 px-4 py-3 text-lg font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                >
                  {spinning
                    ? spinningMessage || "誰が出るかな？"
                    : showingResult
                      ? resultMessage || "おめでとう！"
                      : "ルーレットを回す"}
                </button>
              )}
            </>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-stone-600 mb-4">当選履歴</h2>
          {histories.length === 0 ? (
            <p className="text-stone-500">まだ当選履歴はありません。</p>
          ) : (
            <ul className="space-y-2">
              {histories.map((h) => (
                <li key={h.id} className="flex justify-between items-center text-sm text-stone-600 gap-2">
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
                  <span className="text-stone-500 flex-shrink-0">{formatDate(h.selected_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
