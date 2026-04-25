"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ===== 型定義 =====
type Task = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  due_date: string;
  remind_at: string;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  userId: string;
  userName: string;
  userColor: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  color: string;
  alert_email: string | null;
  status: "pending" | "approved" | "rejected";
  is_admin: boolean;
};

type Template = {
  id: string;
  name: string;
  title: string;
  detail: string;
  relativeDueDays: number;
  isPublic: boolean;
};

type ViewMode = "today" | "week" | "month";

// ===== アバターカラー（ユーザーIDから自動割り当て） =====
const AVATAR_COLORS = ["#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
function getColorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ===== テンプレートデータ =====
const defaultTemplates: Template[] = [
  { id: "t1", name: "週次レポート",     title: "週次レポート作成・提出",        detail: "先週の業務内容をまとめてレポートを提出する", relativeDueDays: 7, isPublic: true },
  { id: "t2", name: "新入社員受け入れ", title: "新入社員受け入れ準備",          detail: "・入館証手配\n・PC準備\n・座席確保\n・歓迎メール送信", relativeDueDays: 3, isPublic: true },
  { id: "t3", name: "定例会議準備",     title: "定例会議 アジェンダ作成・共有", detail: "アジェンダを作成して前日までに参加者へ共有する", relativeDueDays: 1, isPublic: false },
];

// ===== ヘルパー関数 =====
function isOverdue(due_date: string, completed: boolean) {
  if (!due_date) return false;
  return !completed && new Date(due_date) < new Date();
}

function formatDateTime(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getOverdueDays(due_date: string): number {
  return Math.floor((new Date().getTime() - new Date(due_date).getTime()) / (1000 * 60 * 60 * 24));
}

function filterByViewMode(tasks: Task[], mode: ViewMode): Task[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dow = today.getDay();
  const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return tasks.filter((t) => {
    if (!t.due_date) return false;
    const due = new Date(t.due_date);
    if (mode === "today") return due >= today && due < tomorrow;
    if (mode === "week")  return due >= startOfWeek && due < endOfWeek;
    if (mode === "month") return due >= startOfMonth && due < endOfMonth;
    return true;
  });
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T18:00`;
}

const recurrenceLabels: Record<string, string> = { none: "繰り返しなし", daily: "毎日", weekly: "毎週", monthly: "毎月" };

// ===== メインコンポーネント =====
export default function Home() {
  const router = useRouter();
  const [authUser, setAuthUser]   = useState<User | null>(null);
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [tasks, setTasks]       = useState<Task[]>([]);
  const [templates]             = useState<Template[]>(defaultTemplates);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle]           = useState("");
  const [detail, setDetail]         = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [remindAt, setRemindAt]     = useState("");
  const [recurrence, setRecurrence] = useState<Task["recurrence"]>("none");

  const [viewMode, setViewMode]           = useState<ViewMode>("week");
  const [isAllUsersView, setIsAllUsersView] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSummary, setShowSummary]     = useState(false);

  // ===== Supabaseからタスクを取得 =====
  const loadTasks = useCallback(async (showAll: boolean, userId: string) => {
    let query = supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (!showAll) query = query.eq("user_id", userId);

    const { data: tasksData } = await query;
    if (!tasksData) return;

    // タスクに関わるユーザーのプロフィールをまとめて取得
    const ids = Array.from(new Set(tasksData.map((t) => t.user_id)));
    const { data: profilesData } = await supabase
      .from("profiles").select("id, display_name, color").in("id", ids);

    const profilesMap: Record<string, { name: string; color: string }> = {};
    profilesData?.forEach((p) => {
      profilesMap[p.id] = {
        name:  p.display_name ?? "名前未設定",
        color: p.color ?? getColorForId(p.id),
      };
    });

    setTasks(
      tasksData.map((t) => ({
        id:         t.id,
        title:      t.title,
        detail:     t.detail ?? "",
        completed:  t.completed,
        due_date:   t.due_date ?? "",
        remind_at:  t.remind_at ?? "",
        recurrence: t.recurrence ?? "none",
        userId:     t.user_id,
        userName:   profilesMap[t.user_id]?.name  ?? "名前未設定",
        userColor:  profilesMap[t.user_id]?.color ?? getColorForId(t.user_id),
      }))
    );
  }, []);

  // ===== Supabaseからプロフィールを取得・作成 =====
  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (data) {
      if (!data.color || data.color === "#3b82f6") {
        const color = getColorForId(userId);
        await supabase.from("profiles").update({ color }).eq("id", userId);
        setProfile({ ...data, color });
      } else {
        setProfile(data);
      }
    } else {
      // トリガーが失敗した場合の保険
      const color = getColorForId(userId);
      await supabase.from("profiles").insert({ id: userId, color });
      setProfile({ id: userId, display_name: null, color, alert_email: null, status: "pending", is_admin: false });
    }
  }, []);

  // ===== 認証チェック =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth"); return; }
      setAuthUser(session.user);
      Promise.all([loadProfile(session.user.id), loadTasks(false, session.user.id)])
        .finally(() => setIsLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) router.replace("/auth");
    });
    return () => subscription.unsubscribe();
  }, [router, loadProfile, loadTasks]);

  // 全体/個人 切り替えでタスクを再取得
  useEffect(() => {
    if (!authUser) return;
    loadTasks(isAllUsersView, authUser.id);
  }, [isAllUsersView, authUser, loadTasks]);

  // ===== タスク操作（Supabase） =====
  async function addTask() {
    if (!title.trim() || !dueDate || !authUser) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id:    authUser.id,
        title:      title.trim(),
        detail:     detail.trim(),
        completed:  false,
        due_date:   dueDate || null,
        remind_at:  remindAt || null,
        recurrence,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([{
        id:         data.id,
        title:      data.title,
        detail:     data.detail ?? "",
        completed:  data.completed,
        due_date:   data.due_date ?? "",
        remind_at:  data.remind_at ?? "",
        recurrence: data.recurrence ?? "none",
        userId:     data.user_id,
        userName:   profile?.display_name ?? "自分",
        userColor:  profile?.color ?? getColorForId(authUser.id),
      }, ...tasks]);
    }

    setTitle(""); setDetail(""); setDueDate(""); setRemindAt(""); setRecurrence("none");
    setIsFormOpen(false);
  }

  async function toggleTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", id);
    if (!error) setTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) setTasks(tasks.filter((t) => t.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth");
  }

  function applyTemplate(template: Template) {
    setTitle(template.title);
    setDetail(template.detail);
    setDueDate(addDays(template.relativeDueDays));
    setShowTemplateModal(false);
  }

  // ===== ローディング =====
  if (isLoading || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  // ===== 承認待ち =====
  if (profile?.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">承認待ちです</h2>
          <p className="text-sm text-gray-500 mb-6">管理者があなたのアカウントを確認中です。<br />承認されるまでしばらくお待ちください。</p>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  // ===== 却下済み =====
  if (profile?.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">アクセスが承認されませんでした</h2>
          <p className="text-sm text-gray-500 mb-6">管理者にお問い合わせください。</p>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 underline">
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  // ===== 集計 =====
  const overdueTasks = tasks.filter((t) => isOverdue(t.due_date, t.completed));
  const filteredTasks = filterByViewMode(tasks, viewMode);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1);
  const myTodayTasks   = tasks.filter((t) => t.userId === authUser.id && !t.completed && t.due_date && new Date(t.due_date) >= todayStart && new Date(t.due_date) < todayEnd);
  const myOverdueTasks = tasks.filter((t) => t.userId === authUser.id && isOverdue(t.due_date, t.completed));

  const viewModeLabels: { mode: ViewMode; label: string }[] = [
    { mode: "today", label: "本日" },
    { mode: "week",  label: "今週" },
    { mode: "month", label: "今月" },
  ];

  const displayName = profile?.display_name ?? authUser.email ?? "ユーザー";
  const avatarColor  = profile?.color ?? getColorForId(authUser.id);

  const C = {
    btn:        "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white",
    btnOutline: "text-[var(--primary)] border-[var(--primary-border)] hover:bg-[var(--primary-light)]",
    link:       "text-[var(--primary)] hover:underline",
    tabActive:  "bg-[var(--primary)] text-white",
    tabInactive:"bg-white border border-gray-200 text-gray-500 hover:bg-gray-50",
    summaryBg:  "bg-[var(--primary-light)] border-[var(--primary-border)]",
    summaryTxt: "text-[var(--primary-text)]",
    summaryDim: "text-[var(--primary-text-muted)]",
    summaryNote:"text-[var(--primary-text-faint)]",
    focusRing:  "focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]",
    accent:     "accent-[var(--primary)]",
    badge:      "text-[var(--primary-text-muted)] bg-[var(--primary-light)] border-[var(--primary-border)]",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">タスク管理</h1>
        <div className="flex items-center gap-3">
          {profile?.is_admin && (
            <Link href="/admin" className="text-sm text-red-500 hover:underline">管理</Link>
          )}
          <Link href="/settings" className={`text-sm ${C.link}`}>設定</Link>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: avatarColor }}>
              {displayName[0]}
            </span>
            <span className="text-xs text-gray-600 hidden sm:block">{displayName}</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* 自分/全体 切り替え */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setIsAllUsersView(false)}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-semibold transition-colors ${!isAllUsersView ? C.tabActive : C.tabInactive}`}>
          👤 自分のタスク
        </button>
        <button onClick={() => setIsAllUsersView(true)}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-semibold transition-colors ${isAllUsersView ? C.tabActive : C.tabInactive}`}>
          👥 全体表示
        </button>
      </div>

      {/* デイリーサマリー */}
      <div className={`border rounded-xl mb-4 ${C.summaryBg}`}>
        <button onClick={() => setShowSummary(!showSummary)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold ${C.summaryTxt}`}>
          <span>📋 本日のサマリー（{now.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}）</span>
          <span>{showSummary ? "▲" : "▼"}</span>
        </button>
        {showSummary && (
          <div className="px-4 pb-4 text-sm space-y-2">
            {myTodayTasks.length === 0 && myOverdueTasks.length === 0 ? (
              <p className={C.summaryTxt}>本日のタスクはありません 🎉</p>
            ) : (
              <>
                {myTodayTasks.length > 0 && (
                  <div>
                    <p className={`font-semibold mb-1 ${C.summaryTxt}`}>本日期限（{myTodayTasks.length}件）</p>
                    {myTodayTasks.map((t) => (
                      <div key={t.id} className={`flex items-center gap-2 py-0.5 text-xs ${C.summaryTxt}`}>
                        <span>•</span><span className="flex-1 truncate">{t.title}</span>
                        <span className={`whitespace-nowrap ${C.summaryDim}`}>{formatDateTime(t.due_date)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {myOverdueTasks.length > 0 && (
                  <div>
                    <p className="text-red-600 font-semibold mb-1">期限切れ（{myOverdueTasks.length}件）</p>
                    {myOverdueTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-red-700 py-0.5 text-xs">
                        <span>•</span><span className="flex-1 truncate">{t.title}</span>
                        <span className="text-red-500 whitespace-nowrap font-semibold">{getOverdueDays(t.due_date)}日超過</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <p className={`text-xs pt-1 ${C.summaryNote}`}>※ 毎朝8:00にチームへ自動通知（PHASE4で設定）</p>
          </div>
        )}
      </div>

      {/* 期限切れアラート */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-300 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <p className="font-semibold mb-2">⚠️ 期限切れ {overdueTasks.length} 件</p>
          {overdueTasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs">
              <span className="truncate flex-1">{t.title}</span>
              <span className="ml-3 font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                {getOverdueDays(t.due_date)}日超過
              </span>
            </div>
          ))}
        </div>
      )}

      {/* タスク追加ボタン（折り畳み時） */}
      {!isFormOpen && (
        <button onClick={() => setIsFormOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 mb-4 border-2 border-dashed rounded-xl text-sm font-medium transition-colors border-[var(--primary-border)] text-[var(--primary-text-muted)] hover:bg-[var(--primary-light)]">
          ＋ 新しいタスクを追加
        </button>
      )}

      {/* タスク追加フォーム（展開時） */}
      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-600">新しいタスクを追加</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTemplateModal(true)}
                className={`text-xs border rounded-lg px-3 py-1 transition-colors ${C.btnOutline}`}>
                📄 テンプレート
              </button>
              <button onClick={() => setIsFormOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
                キャンセル
              </button>
            </div>
          </div>
          <input type="text" placeholder="タスクの内容を入力..." value={title}
            onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 ${C.focusRing}`} autoFocus />
          <textarea placeholder="詳細・メモ（任意）" value={detail} onChange={(e) => setDetail(e.target.value)}
            rows={2} className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 resize-none ${C.focusRing}`} />
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">期限日時</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${C.focusRing}`} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">リマインド日時</label>
              <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${C.focusRing}`} />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">🔄 繰り返し設定</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as Task["recurrence"])}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${C.focusRing}`}>
              <option value="none">繰り返しなし</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
          </div>
          <button onClick={addTask} className={`w-full text-sm font-semibold py-2 rounded-lg transition-colors ${C.btn}`}>
            ＋ 追加する
          </button>
        </div>
      )}

      {/* 表示切り替えタブ */}
      <div className="flex gap-2 mb-4">
        {viewModeLabels.map(({ mode, label }) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === mode ? C.tabActive : C.tabInactive}`}>
            {label}
          </button>
        ))}
      </div>

      {/* タスク一覧 */}
      <div className="space-y-3">
        {filteredTasks.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            {isAllUsersView ? "全体の" : ""}{viewMode === "today" ? "本日" : viewMode === "week" ? "今週" : "今月"}のタスクはありません
          </p>
        )}
        {filteredTasks.map((task) => {
          const overdue = isOverdue(task.due_date, task.completed);
          return (
            <div key={task.id}
              className={`bg-white rounded-xl shadow-sm border px-4 py-3 flex items-start gap-3 ${overdue ? "border-red-300 bg-red-50" : "border-gray-200"} ${task.completed ? "opacity-50" : ""}`}>
              <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)}
                className={`mt-1 w-4 h-4 cursor-pointer ${C.accent}`} />
              <div className="flex-1 min-w-0">
                {isAllUsersView && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: task.userColor }}>
                      {task.userName[0]}
                    </span>
                    <span className="text-xs text-gray-500">{task.userName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium text-gray-800 ${task.completed ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  {task.recurrence !== "none" && (
                    <span className={`text-xs border rounded-full px-2 py-0.5 whitespace-nowrap ${C.badge}`}>
                      🔄 {recurrenceLabels[task.recurrence]}
                    </span>
                  )}
                </div>
                {task.detail && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.detail}</p>}
                <div className="flex gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  <span className={overdue ? "text-red-600 font-semibold" : ""}>
                    期限：{formatDateTime(task.due_date)}
                    {overdue && (
                      <span className="ml-1 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                        {getOverdueDays(task.due_date)}日超過
                      </span>
                    )}
                  </span>
                  {task.remind_at && <span>リマインド：{formatDateTime(task.remind_at)}</span>}
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors">×</button>
            </div>
          );
        })}
      </div>

      {/* テンプレートモーダル */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">テンプレートから作成</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2">
              {templates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)}
                  className="w-full text-left border rounded-xl px-4 py-3 transition-colors hover:bg-[var(--primary-light)] hover:border-[var(--primary-border)] border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isPublic ? "チーム共有" : "個人用"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{t.title}</p>
                  <p className={`text-xs mt-0.5 ${C.summaryDim}`}>期日：起票日から {t.relativeDueDays} 日後</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
