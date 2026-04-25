"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(`登録に失敗しました: ${error.message}`);
      } else {
        setDone(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError("メールアドレスまたはパスワードが違います");
      } else {
        window.location.href = "/";
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-800">タスク管理アプリ</h1>
          <p className="text-sm text-gray-500 mt-1">仕事の対応漏れをゼロに</p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <p className="text-sm font-bold text-gray-800 mb-2">確認メールを送信しました</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">{email}</span> に<br />
              確認リンクを送りました。<br />
              メールを開いてリンクをクリックすると<br />
              ログインできます。
            </p>
            <button
              onClick={() => { setDone(false); setIsSignUp(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 mt-5 underline"
            >
              ← ログイン画面に戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "処理中..." : isSignUp ? "アカウントを作成する" : "ログイン"}
            </button>

            <p className="text-xs text-gray-400 text-center pt-1">
              {isSignUp ? "すでにアカウントをお持ちの方は" : "アカウントをお持ちでない方は"}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                className="text-gray-600 underline ml-1"
              >
                {isSignUp ? "ログイン" : "新規登録"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
