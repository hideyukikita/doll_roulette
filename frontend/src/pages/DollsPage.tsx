/**
 * ぬいぐるみ管理ページ（登録・一覧・削除）Step 3
 */
import { useState, useEffect, useCallback } from "react";
import { getDolls, createDoll, updateDoll, deleteDoll, uploadDollImage, uploadDollImages, deleteDollImage } from "../api/dolls.js";
import { apiUrl } from "../api/client.js";
import type { Doll } from "../types/doll.js";

/** 色の選択肢（design: 色を選択して登録） */
const COLOR_OPTIONS = [
  { value: "茶色", label: "茶色" },
  { value: "白", label: "白" },
  { value: "ピンク", label: "ピンク" },
  { value: "グレー", label: "グレー" },
  { value: "青", label: "青" },
  { value: "緑", label: "緑" },
  { value: "黄", label: "黄" },
  { value: "黒", label: "黒" },
  { value: "オレンジ", label: "オレンジ" },
  { value: "えんじ", label: "えんじ" },
  { value: "水色", label: "水色" },
  { value: "ミント", label: "ミント" },
  { value: "紫", label: "紫" },
  { value: "赤", label: "赤" },
  { value: "その他", label: "その他" },
];

export default function DollsPage() {
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0].value);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImageInputKey, setEditImageInputKey] = useState(0);

  const [listVersion, setListVersion] = useState(0);
  /** 詳細オーバーレイで表示する子のID（null なら非表示） */
  const [detailId, setDetailId] = useState<string | null>(null);
  /** 詳細内で画像タップ時に全体表示するURL（お出かけ日記と同様） */
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const fetchDolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getDolls();
      setDolls(list);
      setListVersion((v) => v + 1);
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
      const doll = await createDoll({ name: trimmedName, color });
      if (imageFile) {
        await uploadDollImage(doll.id, imageFile);
      }
      setName("");
      setColor(COLOR_OPTIONS[0].value);
      setImageFile(null);
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
    setEditImageFile(null);
    setEditImageFiles([]);
    setEditImageInputKey((k) => k + 1);
    setError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName("");
    setEditColor(COLOR_OPTIONS[0].value);
    setEditImageFile(null);
    setEditImageFiles([]);
  };

  const handleEditSave = async (id: string) => {
    const trimmedName = editName.trim();
    if (!trimmedName) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDoll(id, { name: trimmedName, color: editColor });
      if (editImageFile) {
        await uploadDollImage(id, editImageFile);
      }
      if (editImageFiles.length > 0) {
        await uploadDollImages(id, editImageFiles);
      }
      setEditingId(null);
      setEditName("");
      setEditColor(COLOR_OPTIONS[0].value);
      setEditImageFile(null);
      setEditImageFiles([]);
      await fetchDolls();
      // 詳細表示中ならそのまま（一覧は更新済み）
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDollImage = async (dollId: string, imageUrl: string) => {
    if (!window.confirm("この画像を削除しますか？")) return;
    setError(null);
    try {
      await deleteDollImage(dollId, imageUrl);
      await fetchDolls();
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像の削除に失敗しました");
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
    <div className="min-h-screen bg-stone-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 登録フォーム */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-600 mb-4">新しい子を追加</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-600 mb-1">
                名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: くまさん"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-800 placeholder-stone-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
                maxLength={255}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-stone-600 mb-1">
                色
              </label>
              <select
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
                disabled={submitting}
              >
                {COLOR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-stone-600 mb-1">
                画像（任意）
              </label>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-600 hover:file:bg-violet-100"
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full rounded-md bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
            >
              {submitting ? "登録中…" : "追加する"}
            </button>
          </form>
        </section>

        {/* 一覧 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-stone-600 mb-4">登録済みのかぞくたち</h2>
          {error && (
            <p className="mb-4 text-sm text-rose-500" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <p className="text-stone-500">読み込み中…</p>
          ) : dolls.length === 0 ? (
            <p className="text-stone-500">まだ登録されていません。上のフォームから追加してください。</p>
          ) : (
            <ul className="space-y-3">
              {dolls.map((doll) => (
                <li
                  key={doll.id}
                  className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => setDetailId(doll.id)}
                    className="w-full flex items-center gap-3 min-w-0 text-left hover:bg-stone-100 rounded transition-colors"
                  >
                    {(doll.image_url ?? doll.image_urls?.[0]) && (
                      <img
                        src={`${apiUrl(doll.image_url ?? doll.image_urls?.[0]!)}?v=${listVersion}`}
                        alt={doll.name}
                        className="h-10 w-10 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <span className="font-medium text-stone-700">
                      {doll.name}
                      <span className="ml-2 text-sm font-normal text-stone-500">（{doll.color}）</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 詳細オーバーレイ（手前に表示） */}
        {detailId && (() => {
          const doll = dolls.find((d) => d.id === detailId);
          if (!doll) return null;
          const representativeUrl = doll.image_url ?? doll.image_urls?.[0];
          // サブ画像は doll_images 由来のみ表示（代表のみのとき image_urls に代表が含まれるため除外）
          const subUrls = doll.image_url
            ? (doll.image_urls ?? []).filter((u) => u !== doll.image_url)
            : (doll.image_urls?.slice(1) ?? []);

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-title"
              onClick={(e) => e.target === e.currentTarget && setDetailId(null)}
            >
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h2 id="detail-title" className="sr-only">
                  {doll.name}の詳細
                </h2>
                {editingId === detailId ? (
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-stone-700">編集</span>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        disabled={submitting}
                        className="text-stone-400 hover:text-stone-600"
                        aria-label="キャンセル"
                      >
                        ×
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">名前</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
                        maxLength={255}
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">色</label>
                      <select
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-stone-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
                        disabled={submitting}
                      >
                        {COLOR_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-500 mb-1">代表画像（1枚・一覧のサムネイル）</label>
                      {(doll.image_url ?? doll.image_urls?.[0]) && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          <div className="relative group">
                            <img
                              src={apiUrl(doll.image_url ?? doll.image_urls?.[0]!)}
                              alt="代表"
                              className="h-16 w-16 object-cover rounded border border-stone-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteDollImage(doll.id, doll.image_url ?? doll.image_urls?.[0]!)}
                              disabled={submitting}
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs leading-none flex items-center justify-center hover:bg-rose-600 disabled:opacity-50"
                              aria-label="代表画像を削除"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                      <input
                        key={`edit-image-${doll.id}-${editImageInputKey}`}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-600 mb-4"
                        disabled={submitting}
                      />
                      <label className="block text-xs font-medium text-stone-500 mb-1">サブ画像（複数・ルーレット用）</label>
                      {(doll.image_url ? (doll.image_urls ?? []).filter((u) => u !== doll.image_url) : (doll.image_urls?.slice(1) ?? [])).length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {(doll.image_url ? (doll.image_urls ?? []).filter((u) => u !== doll.image_url) : (doll.image_urls?.slice(1) ?? [])).map((url) => (
                            <div key={url} className="relative group">
                              <img
                                src={apiUrl(url)}
                                alt=""
                                className="h-16 w-16 object-cover rounded border border-stone-200"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteDollImage(doll.id, url)}
                                disabled={submitting}
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-xs leading-none flex items-center justify-center hover:bg-rose-600 disabled:opacity-50"
                                aria-label="このサブ画像を削除"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-stone-500 mb-1">サブ画像を追加（複数可・一覧の画像は変わりません）</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        multiple
                        onChange={(e) => setEditImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-600 file:mr-4 file:rounded file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-600"
                        disabled={submitting}
                      />
                      {editImageFiles.length > 0 && (
                        <p className="mt-1 text-xs text-stone-500">{editImageFiles.length}枚追加予定</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditSave(doll.id)}
                        disabled={submitting || !editName.trim()}
                        className="rounded-md bg-violet-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                      >
                        {submitting ? "保存中…" : "保存"}
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        disabled={submitting}
                        className="rounded-md bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xl font-semibold text-stone-800">{doll.name}</p>
                          <p className="text-stone-500">{doll.color}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetailId(null)}
                          className="text-stone-400 hover:text-stone-600 p-1"
                          aria-label="閉じる"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-2">代表画像</p>
                          {representativeUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedImageUrl(representativeUrl)}
                              className="block w-full rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                            >
                              <img
                                src={apiUrl(representativeUrl)}
                                alt={`${doll.name}の代表画像`}
                                className="w-full max-h-48 object-contain rounded-lg"
                              />
                            </button>
                          ) : (
                            <div className="w-full h-32 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-stone-400 text-sm">
                              画像なし
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-2">サブ画像</p>
                          {subUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subUrls.map((url) => (
                                <button
                                  key={url}
                                  type="button"
                                  onClick={() => setSelectedImageUrl(url)}
                                  className="rounded border border-stone-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                                >
                                  <img
                                    src={apiUrl(url)}
                                    alt=""
                                    className="h-20 w-20 object-cover rounded"
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-stone-400">サブ画像はありません</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 p-6 pt-0 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleEditStart(doll)}
                        className="flex-1 rounded-md bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleDelete(doll.id);
                          setDetailId(null);
                        }}
                        disabled={deletingId === doll.id}
                        className="rounded-md bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
                      >
                        {deletingId === doll.id ? "削除中…" : "削除"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailId(null)}
                        className="rounded-md bg-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                      >
                        閉じる
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {selectedImageUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="画像を拡大表示"
            onClick={() => setSelectedImageUrl(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-white/90 p-2 text-stone-600 hover:bg-white"
              aria-label="閉じる"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={apiUrl(selectedImageUrl)}
              alt="拡大表示"
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

      </div>
    </div>
  );
}
