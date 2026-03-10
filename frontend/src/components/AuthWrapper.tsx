/**
 * 認証チェックを行い、未認証ならパスワード画面を表示する
 */
import { useEffect, useState } from "react";
import { checkAuth } from "../api/client";
import PasswordGate from "./PasswordGate";
import App from "../App";

type Status = "checking" | "unauthenticated" | "authenticated";

export default function AuthWrapper() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    checkAuth().then((ok) => {
      if (!cancelled) setStatus(ok ? "authenticated" : "unauthenticated");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">読み込み中…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <PasswordGate
        onSuccess={() => {
          window.location.reload();
        }}
      />
    );
  }

  return <App />;
}
