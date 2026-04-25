"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  status: "pending" | "approved" | "rejected";
  is_admin: boolean;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const { data: me } = await supabase
        .from("profiles").select("is_admin").eq("id", session.user.id).single();

      if (!me?.is_admin) { router.replace("/"); return; }

      const { data } = await supabase
        .from("profiles").select("*").order("created_at", { ascending: false });

      setProfiles(data ?? []);
      setIsLoading(false);
    });
  }, [router]);

  async function handleApprove(id: string) {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));
  }

  async function handleReject(id: string) {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  const pending  = profiles.filter((p) => p.status === "pending");
  const approved = profiles.filter((p) => p.status === "approved");
  const rejected = profiles.filter((p) => p.status === "rejected");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 戻る</Link>
        <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
      </div>

      {/* 承認待ち */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-3">
          承認待ち
          {pending.length > 0 && (
            <span className="ml-2 text-red-500">({pending.length}件)</span>
          )}
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-400 text-sm">承認待ちのユーザーはいません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-orange-200 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.email ?? "（メール未設定）"}</p>
                  <p className="text-xs text-gray-400">{p.display_name ?? "表示名未設定"}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(p.id)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                    承認
                  </button>
                  <button onClick={() => handleReject(p.id)}
                    className="text-xs bg-red-400 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                    却下
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 承認済み */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-3">承認済み ({approved.length}件)</h2>
        <div className="space-y-2">
          {approved.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {p.email ?? "（メール未設定）"}
                  {p.is_admin && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">管理者</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{p.display_name ?? "表示名未設定"}</p>
              </div>
              <button onClick={() => handleReject(p.id)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                取消
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 却下済み */}
      {rejected.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">却下済み ({rejected.length}件)</h2>
          <div className="space-y-2">
            {rejected.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3 opacity-60">
                <p className="text-sm text-gray-600 truncate">{p.email ?? "（メール未設定）"}</p>
                <button onClick={() => handleApprove(p.id)}
                  className="text-xs text-gray-500 hover:text-green-600 transition-colors flex-shrink-0">
                  承認に変更
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
