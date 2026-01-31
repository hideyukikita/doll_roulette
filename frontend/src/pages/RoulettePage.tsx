/**
 * ルーレットページ（Step 4: 演出・当選・残り/全カウント・当選履歴）
 */
import { useState, useEffect } from "react";
import { getDolls } from "../api/dolls.js";
import { spinRoulette, type SpinResponse } from "../api/roulette.js";
import { getHistories, type HistoryRecord } from "../api/histories.js";
import type { Doll } from "../types/doll.js";

const SPIN_DURATION_MS = 2500;
const CYCLE_INTERVAL_MS = 120;

export default function RoulettePage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [histories, setHistories] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string>("?");
  const [result, setResult] = useState<Doll | null>(null);
  const [allDone, setAllDone] = useState(false);

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
    const names = dolls.map((d) => d.name);
    if (names.length === 0) names.push("?");
    let cycleIndex = 0;
    const cycle = setInterval(() => {
      setDisplayName(names[cycleIndex % names.length] ?? "?");
      cycleIndex++;
    }, CYCLE_INTERVAL_MS);
    const stopAt = Date.now() + SPIN_DURATION_MS;
    const wait = () => {
      if (Date.now() < stopAt) {
        setTimeout(wait, 50);
        return;
      }
      clearInterval(cycle);
      spinRoulette()
        .then((res: SpinResponse) => {
          if ("allDone" in res && res.allDone) {
            setAllDone(true);
            setDisplayName("全員一周したよ！");
          } else if ("doll" in res) {
            setResult(res.doll);
            setDisplayName(res.doll.name);
          }
          return Promise.all([getDolls(), getHistories(20)]);
        })
        .then(([list, hist]) => {
          setDolls(list);
          setHistories(hist);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "ルーレットに失敗しました");
          setDisplayName("?");
        })
        .finally(() => {
          setSpinning(false);
        });
    };
    setTimeout(wait, 50);
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">かぞくたちルーレット</h1>

        {/* 残り / 全 */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-center text-lg text-gray-700">
            残り <span className="font-bold text-indigo-600">{remaining}</span> 人 / 全{" "}
            <span className="font-bold text-gray-800">{total}</span> 人
          </p>
        </section>

        {/* ルーレット演出・結果 */}
        <section className="bg-white rounded-lg shadow p-8 mb-6 text-center">
          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div
            className="min-h-[80px] flex items-center justify-center text-2xl font-bold text-gray-800"
            aria-live="polite"
          >
            {spinning ? (
              <span className="animate-pulse">{displayName}</span>
            ) : allDone ? (
              <span className="text-amber-600">全員一周したよ！</span>
            ) : result ? (
              <span className="text-indigo-600">{displayName}</span>
            ) : (
              <span className="text-gray-400">回すと選ばれるよ</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || total === 0}
            className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-3 text-lg font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {spinning ? "まわしてる…" : total === 0 ? "かぞくを登録してね" : "ルーレットを回す"}
          </button>
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
