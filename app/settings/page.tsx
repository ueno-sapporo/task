"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const COLOR_THEMES = [
  { id: "blue",   label: "ブルー",   color: "#2563eb" },
  { id: "green",  label: "グリーン", color: "#16a34a" },
  { id: "purple", label: "パープル", color: "#9333ea" },
  { id: "orange", label: "オレンジ", color: "#ea580c" },
  { id: "pink",   label: "ピンク",   color: "#db2777" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setAuthUser(session.user);

      supabase.from("profiles").select("*").eq("id", session.user.id).single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name ?? "");
            setAlertEmail(data.alert_email ?? "");
          }
          setIsLoading(false);
        });
    });

    const saved = localStorage.getItem("app-theme") ?? "blue";
    setSelectedTheme(saved);
  }, [router]);

  function handleThemeChange(themeId: string) {
    setSelectedTheme(themeId);
    localStorage.setItem("app-theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;

    await supabase.from("profiles").upsert({
      id:           authUser.id,
      display_name: displayName,
      alert_email:  alertEmail,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (isLoading || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  const C = {
    btn:       "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white",
    focusRing: "focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* ログイン中のアカウント */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">ログイン中のアカウント</h2>
          <div className="flex items-center gap-3">
            {authUser.user_metadata?.avatar_url ? (
              <img src={authUser.user_metadata.avatar_url} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                {(displayName || authUser.email || "?")[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">{displayName || "（表示名未設定）"}</p>
              <p className="text-xs text-gray-400">{authUser.email}</p>
            </div>
          </div>
        </div>

        {/* 表示名 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-1">表示名</h2>
          <p className="text-xs text-gray-500 mb-4">
            全体表示のとき、タスクに表示される名前です。チームメンバーが担当者を識別するために使われます。
          </p>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例：田中 花子"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${C.focusRing}`} />
        </div>

        {/* イメージカラー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-1">イメージカラー</h2>
          <p className="text-xs text-gray-500 mb-4">アプリ全体のメインカラーを変更できます。すぐに反映されます。</p>
          <div className="flex gap-3 flex-wrap">
            {COLOR_THEMES.map((theme) => (
              <button key={theme.id} type="button" onClick={() => handleThemeChange(theme.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all ${
                  selectedTheme === theme.id ? "border-gray-800 scale-105 shadow-md" : "border-gray-200 hover:border-gray-400"
                }`}>
                <span className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: theme.color }} />
                <span className="text-xs text-gray-600 font-medium">{theme.label}</span>
                {selectedTheme === theme.id && (
                  <span className="text-xs font-bold" style={{ color: theme.color }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 漏れ通知メール */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-1">漏れ通知メールアドレス</h2>
          <p className="text-xs text-gray-500 mb-4">
            期限切れのタスクがある場合、このアドレスに自動でアラートメールが届きます。
          </p>
          <input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="alert@example.com"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${C.focusRing}`} />
          <p className="text-xs text-gray-400 mt-2">※ メール送信機能はPHASE4で実装します</p>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-300 text-green-700 rounded-lg px-4 py-2 text-sm">
            ✅ 保存しました
          </div>
        )}

        <button type="submit" className={`w-full font-semibold py-2 rounded-lg text-sm transition-colors ${C.btn}`}>
          保存する
        </button>
      </form>
    </div>
  );
}
