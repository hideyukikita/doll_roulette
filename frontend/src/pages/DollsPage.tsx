/**
 * ぬいぐるみ管理ページ（登録・一覧・削除）Step 3
 */
import { useState, useEffect, useCallback } from "react";
import { getDolls, createDoll, updateDoll, deleteDoll } from "../api/dolls.js";
import type { Doll } from "../types/doll.js";

/** 色の選択肢（design: 色を選択して登録） */
const COLOR_OPTIONS = [
  { value: "茶色", label: "茶色" },
  { value: "白", label: "白" },
  { value: "ピンク", label: "ピンク" },
  { value: "グレー", label: "グレー" },
  { value: "青", label: "青" },
  { value: "黄", label: "黄" },
  { value: "黒", label: "黒" },
  { value: "その他", label: "その他" },
];

export default function DollsPage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].value);

  const fetchDolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDolls();
      setDolls(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDolls();
  }, [fetchDolls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSubmitting(true);
    setError(null);
    try {
      await createDoll({ name: trimmedName, color });
      setName("");
      setColor(COLOR_OPTIONS[0].value);
      await fetchDolls();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (doll: Doll) => {
    setEditingId(doll.id);
    setEditName(doll.name);
    setEditColor(doll.color);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditColor(COLOR_OPTIONS[0].value);
  };

  const handleEditSave = async (id: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDoll(id, { name: trimmedName, color: editColor });
      setEditingId(null);
      setEditName("");
      setEditColor(COLOR_OPTIONS[0].value);
      await fetchDolls();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("この子を削除しますか？")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteDoll(id);
      await fetchDolls();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 登録フォーム */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">新しい子を追加</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: くまさん"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={255}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                色
              </label>
              <select
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                disabled={submitting}
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {submitting ? "登録中…" : "追加する"}
            </button>
          </form>
        </section>

        {/* 一覧 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">登録済みのかぞくたち</h2>
          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-gray-500">読み込み中…</p>
          ) : dolls.length === 0 ? (
            <p className="text-gray-500">まだ登録されていません。上のフォームから追加してください。</p>
          ) : (
            <ul className="space-y-3">
              {dolls.map((doll) => (
                <li
                  key={doll.id}
                  className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  {editingId === doll.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">名前</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          maxLength={255}
                          disabled={submitting}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">色</label>
                        <select
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={submitting}
                        >
                          {COLOR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditSave(doll.id)}
                          disabled={submitting || !editName.trim()}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          {submitting ? "保存中…" : "保存"}
                        </button>
                        <button
                          type="button"
                          onClick={handleEditCancel}
                          disabled={submitting}
                          className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {doll.name}
                        <span className="ml-2 text-sm font-normal text-gray-500">（{doll.color}）</span>
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditStart(doll)}
                          disabled={editingId !== null}
                          className="rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doll.id)}
                          disabled={deletingId === doll.id || editingId !== null}
                          className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          {deletingId === doll.id ? "削除中…" : "削除"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
