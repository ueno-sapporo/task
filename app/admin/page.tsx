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
  team: string | null;
  created_at: string;
};

type Template = {
  id: string;
  name: string;
  title: string;
  detail: string | null;
  relative_due_days: number;
  visibility: "personal" | "team";
  created_by: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "templates">("users");

  const [tmplName, setTmplName]         = useState("");
  const [tmplTitle, setTmplTitle]       = useState("");
  const [tmplDetail, setTmplDetail]     = useState("");
  const [tmplDays, setTmplDays]         = useState(1);
  const [tmplVisibility, setTmplVisibility] = useState<"personal" | "team">("team");
  const [tmplSaving, setTmplSaving]     = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }

      const { data: me } = await supabase
        .from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (!me?.is_admin) { router.replace("/"); return; }

      setCurrentUserId(session.user.id);

      const [{ data: profilesData }, { data: templatesData }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("templates").select("*").order("created_at", { ascending: true }),
      ]);

      setProfiles(profilesData ?? []);
      setTemplates(templatesData ?? []);
      setIsLoading(false);
    });
  }, [router]);

  // ===== ユーザー操作 =====
  async function handleApprove(id: string) {
    await supabase.from("profiles").update({ status: "approved" }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status: "approved" } : p));
  }

  async function handleReject(id: string) {
    await supabase.from("profiles").update({ status: "rejected" }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, status: "rejected" } : p));
  }

  async function handleTeamChange(id: string, team: string | null) {
    await supabase.from("profiles").update({ team }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, team } : p));
  }

  async function handleAdminToggle(id: string, makeAdmin: boolean) {
    await supabase.from("profiles").update({ is_admin: makeAdmin }).eq("id", id);
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, is_admin: makeAdmin } : p));
  }

  // ===== テンプレート操作 =====
  async function handleAddTemplate() {
    if (!tmplName.trim() || !tmplTitle.trim()) return;
    setTmplSaving(true);

    const { data, error } = await supabase.from("templates").insert({
      created_by: currentUserId,
      name: tmplName.trim(), title: tmplTitle.trim(), detail: tmplDetail.trim(),
      relative_due_days: tmplDays, visibility: tmplVisibility,
    }).select().single();

    if (!error && data) {
      setTemplates([...templates, data]);
      setTmplName(""); setTmplTitle(""); setTmplDetail(""); setTmplDays(1); setTmplVisibility("team");
    }
    setTmplSaving(false);
  }

  async function handleDeleteTemplate(id: string) {
    await supabase.from("templates").delete().eq("id", id);
    setTemplates(templates.filter((t) => t.id !== id));
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
        <h1 className="text-2xl font-bold text-gray-800">管理画面</h1>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("users")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "users" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
          👤 ユーザー管理 {pending.length > 0 && <span className="text-red-400">({pending.length})</span>}
        </button>
        <button onClick={() => setActiveTab("templates")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "templates" ? "bg-gray-800 text-white" : "bg-white border border-gray-200 text-gray-500"}`}>
          📄 テンプレート管理
        </button>
      </div>

      {/* ===== ユーザー管理 ===== */}
      {activeTab === "users" && (
        <>
          {/* 承認待ち */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              承認待ち {pending.length > 0 && <span className="text-red-500">({pending.length}件)</span>}
            </h2>
            {pending.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-gray-400 text-sm">承認待ちのユーザーはいません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-orange-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
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
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {p.email ?? "（メール未設定）"}
                        {p.is_admin && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">管理者</span>}
                      </p>
                      <p className="text-xs text-gray-400">{p.display_name ?? "表示名未設定"}</p>
                    </div>
                    <button onClick={() => handleReject(p.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                      取消
                    </button>
                  </div>

                  {/* チーム設定 */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">チーム</span>
                    <div className="flex gap-1">
                      {["A", "B", "C"].map((team) => (
                        <button key={team} onClick={() => handleTeamChange(p.id, p.team === team ? null : team)}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-colors ${p.team === team ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 text-gray-500 hover:bg-gray-50"}`}>
                          {team}
                        </button>
                      ))}
                      {p.team && (
                        <button onClick={() => handleTeamChange(p.id, null)}
                          className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 transition-colors">
                          解除
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 管理者権限 */}
                  {p.id !== currentUserId && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 w-16 flex-shrink-0">権限</span>
                      <button onClick={() => handleAdminToggle(p.id, !p.is_admin)}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold border transition-colors ${p.is_admin ? "bg-blue-100 text-blue-700 border-blue-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "border-gray-300 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"}`}>
                        {p.is_admin ? "管理者 → 一般に変更" : "一般 → 管理者に変更"}
                      </button>
                    </div>
                  )}
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
        </>
      )}

      {/* ===== テンプレート管理 ===== */}
      {activeTab === "templates" && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-4">新しいテンプレートを作成</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">テンプレート名</label>
                <input type="text" value={tmplName} onChange={(e) => setTmplName(e.target.value)}
                  placeholder="例：週次レポート"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">タスクのタイトル</label>
                <input type="text" value={tmplTitle} onChange={(e) => setTmplTitle(e.target.value)}
                  placeholder="例：週次レポート作成・提出"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">詳細・メモ（任意）</label>
                <textarea value={tmplDetail} onChange={(e) => setTmplDetail(e.target.value)}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">期日（起票日から何日後）</label>
                  <input type="number" min={0} max={365} value={tmplDays} onChange={(e) => setTmplDays(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">公開範囲</label>
                  <div className="flex gap-1 h-[38px]">
                    <button type="button" onClick={() => setTmplVisibility("team")}
                      className={`flex-1 rounded-lg text-xs font-semibold border transition-colors ${tmplVisibility === "team" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-500"}`}>
                      👥 チーム
                    </button>
                    <button type="button" onClick={() => setTmplVisibility("personal")}
                      className={`flex-1 rounded-lg text-xs font-semibold border transition-colors ${tmplVisibility === "personal" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 text-gray-500"}`}>
                      👤 個人
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={handleAddTemplate} disabled={tmplSaving || !tmplName.trim() || !tmplTitle.trim()}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-50">
                {tmplSaving ? "保存中..." : "＋ テンプレートを追加"}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">テンプレート一覧 ({templates.length}件)</h2>
            {templates.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-gray-400 text-sm">まだテンプレートがありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.visibility === "team" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {t.visibility === "team" ? "👥 チーム" : "👤 個人"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.relative_due_days}日後</p>
                    </div>
                    <button onClick={() => handleDeleteTemplate(t.id)}
                      className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
