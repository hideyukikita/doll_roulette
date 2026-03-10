/**
 * 最初に表示するパスワード入力画面（APP_PASSWORD 設定時のみ表示）
 */
import { useState } from "react";
import { login } from "../api/client";

type Props = {
  onSuccess: () => void;
};

export default function PasswordGate({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(password);
      if (result.ok) {
        onSuccess();
        return;
      }
      setError(result.error ?? "ログインに失敗しました");
    } catch {
      setError("通信エラーです");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6 border border-stone-200">
        <h1 className="text-lg font-semibold text-stone-800 text-center mb-2">
          かぞくたちルーレット
        </h1>
        <p className="text-sm text-stone-500 text-center mb-6">
          パスワードを入力してください
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none"
            disabled={loading}
          />
          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
          >
            {loading ? "確認中…" : "入る"}
          </button>
        </form>
      </div>
    </div>
  );
}
