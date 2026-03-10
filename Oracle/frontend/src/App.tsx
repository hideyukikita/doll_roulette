/**
 * かぞくたちルーレット フロントエンド（Step 3: 登録・一覧 / Step 4: ルーレット）
 */
import { useState } from "react";
import DollsPage from "./pages/DollsPage";
import RoulettePage from "./pages/RoulettePage";
import OutingsPage from "./pages/OutingsPage";

type Page = "list" | "roulette" | "outings";

function App() {
  const [page, setPage] = useState<Page>("roulette");

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 py-3">
            <button
              type="button"
              onClick={() => setPage("roulette")}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 ${
                page === "roulette"
                  ? "bg-violet-50 text-violet-600"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              ルーレット
            </button>
            <button
              type="button"
              onClick={() => setPage("list")}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 ${
                page === "list"
                  ? "bg-violet-50 text-violet-600"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              かぞく一覧
            </button>
            <button
              type="button"
              onClick={() => setPage("outings")}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 ${
                page === "outings"
                  ? "bg-violet-50 text-violet-600"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              お出かけ日記
            </button>
          </div>
        </div>
      </nav>
      <main>
        {page === "roulette" && <RoulettePage />}
        {page === "list" && <DollsPage />}
        {page === "outings" && <OutingsPage />}
      </main>
    </div>
  );
}

export default App;
