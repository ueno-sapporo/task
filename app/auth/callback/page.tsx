"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code       = searchParams.get("code");
    const tokenHash  = searchParams.get("token_hash");
    const type       = searchParams.get("type");

    if (code) {
      // Google OAuth のコード交換など (PKCE)
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.replace(error ? "/auth" : "/");
      });
    } else if (tokenHash && type) {
      // サーバーサイドAuth設定時のメールリンク
      supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "recovery" | "invite" | "signup" })
        .then(({ error }) => {
          router.replace(error ? "/auth" : "/");
        });
    } else if (typeof window !== "undefined" && window.location.hash) {
      // Implicitフロー（ハッシュフラグメント）によるマジックリンク対応
      // Supabaseクライアントが自動でセッションを確立するのを待つ
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" || session) {
          router.replace("/");
          subscription.unsubscribe();
        }
      });

      // すでにセッションが確立されているかのチェック
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/");
          subscription.unsubscribe();
        }
      });

      // フォールバック（一定時間経ってもセッションが取れなければ戻す）
      setTimeout(() => {
        subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) router.replace("/auth");
        });
      }, 3000);
    } else {
      router.replace("/auth");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-1">ログイン処理中...</p>
        <p className="text-gray-400 text-xs">しばらくお待ちください</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500 text-sm">ログイン処理中...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
