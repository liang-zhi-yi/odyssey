"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Phase = "loading" | "playing" | "fading" | "error";

export default function IntroVideoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, markIntroVideoSeen, isDevMode } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const markedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ── 权限保护：未登录跳转登录页 ──
  useEffect(() => {
    if (isLoading) return;
    if (isDevMode) {
      router.replace("/dashboard");
      return;
    }
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    // 已观看过的用户直接跳首页（防止用户手动访问 URL）
    if (user && user.has_seen_intro_video) {
      router.replace("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, isDevMode, user, router]);

  // ── 视频元数据加载完成后立即播放（带声音）──
  // 利用用户点击登录按钮的用户激活状态（同 tab 客户端路由跳转保留激活）
  const handleLoadedData = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    // 不静音 — 保留原始背景音乐
    v.muted = false;
    v.volume = 0.9;
    const playPromise = v.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setPhase("playing");
        })
        .catch(() => {
          // 浏览器自动播放策略阻止带声音播放 — 回退到静音播放
          v.muted = true;
          v.play()
            .then(() => setPhase("playing"))
            .catch(() => {
              setErrorMsg("无法播放视频，请刷新页面重试");
              setPhase("error");
            });
        });
    }
  }, []);

  // ── 视频播放结束 ──
  const handleEnded = useCallback(async () => {
    if (markedRef.current) return;
    markedRef.current = true;

    // 淡出阶段 (700ms)
    setPhase("fading");

    // 标记后端状态
    await markIntroVideoSeen();

    // 700ms 淡出后跳转首页
    setTimeout(() => {
      router.replace("/dashboard");
    }, 700);
  }, [markIntroVideoSeen, router]);

  // ── 视频加载失败 ──
  const handleError = useCallback(() => {
    setPhase("error");
    setErrorMsg("视频加载失败，请检查网络后重试");
  }, []);

  // ── 手动重试 ──
  const handleRetry = useCallback(() => {
    markedRef.current = false;
    setErrorMsg("");
    setPhase("loading");
    const v = videoRef.current;
    if (v) {
      v.load();
    }
  }, []);

  // ── 跳过视频（点击右上角按钮）──
  const handleSkip = useCallback(async () => {
    if (markedRef.current) return;
    markedRef.current = true;
    // 跳过也记录已观看，避免重复
    await markIntroVideoSeen();
    router.replace("/dashboard");
  }, [markIntroVideoSeen, router]);

  // 权限检查中 — 显示空（避免闪烁）
  if (isLoading || (!isAuthenticated && !isDevMode) || isDevMode || (user && user.has_seen_intro_video)) {
    return null;
  }

  return (
    <>
      {/* ── 视频层 — 全屏覆盖，唯一视觉层，无额外背景 ── */}
      <video
        ref={videoRef}
        className={`fixed top-0 left-0 w-screen h-screen object-cover transition-opacity duration-700 ${
          phase === "fading" ? "opacity-0" : "opacity-100"
        }`}
        style={{
          zIndex: 9999,
          margin: 0,
          padding: 0,
          border: "none",
          background: "transparent",
          display: phase === "error" ? "none" : "block",
        }}
        autoPlay={false}
        playsInline
        controls={false}
        preload="auto"
        onLoadedData={handleLoadedData}
        onEnded={handleEnded}
        onError={handleError}
      >
        <source src="/intro-video.mp4" type="video/mp4" />
      </video>

      {/* ── 加载状态（视频加载中显示）── */}
      {phase === "loading" && (
        <div
          className="fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center"
          style={{ zIndex: 10000, background: "#000" }}
        >
          <div className="flex flex-col items-center gap-4">
            <svg
              className="animate-spin"
              style={{ animationDuration: "3s" }}
              width="72"
              height="72"
              viewBox="0 0 48 48"
              fill="none"
            >
              <circle cx="24" cy="24" r="22" stroke="oklch(0.72 0.12 80)" strokeWidth="1.2" opacity="0.4" />
              <circle cx="24" cy="24" r="16" stroke="oklch(0.78 0.14 75)" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />
              <path d="M24 6 L27 24 L24 42 L21 24 Z" fill="oklch(0.72 0.12 80)" opacity="0.85" />
              <path d="M6 24 L24 21 L42 24 L24 27 Z" fill="oklch(0.78 0.14 75)" opacity="0.6" />
              <circle cx="24" cy="24" r="3.5" fill="oklch(0.72 0.12 80)" />
            </svg>
            <p className="font-civ-serif text-2xl tracking-[0.4em] text-[oklch(0.85_0.08_80)] uppercase">
              Odyssey
            </p>
            <p className="text-xs text-white/40 tracking-wider">正在准备开场...</p>
          </div>
        </div>
      )}

      {/* ── 右上角跳过按钮（播放中显示）── */}
      {phase === "playing" && (
        <button
          onClick={handleSkip}
          className="fixed top-6 right-6 px-5 py-2.5 text-sm font-civ-serif tracking-wider text-white/60 hover:text-white border border-white/25 hover:border-white/50 transition-all duration-300 backdrop-blur-[2px] bg-black/20"
          style={{ zIndex: 10001, borderRadius: 0 }}
        >
          跳过开场 →
        </button>
      )}

      {/* ── 错误屏幕 ── */}
      {phase === "error" && (
        <div
          className="fixed top-0 left-0 w-screen h-screen flex flex-col items-center justify-center gap-6"
          style={{ zIndex: 10000, background: "#000" }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.15 25)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-white/70 max-w-xs text-center px-6">{errorMsg}</p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 text-sm font-civ-serif tracking-wider text-white bg-[oklch(0.65_0.1_75)] hover:bg-[oklch(0.7_0.12_78)] transition-colors"
              style={{ borderRadius: 0 }}
            >
              重新加载
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-2.5 text-sm font-civ-serif tracking-wider text-white/70 border border-white/30 hover:border-white/60 transition-colors"
              style={{ borderRadius: 0 }}
            >
              跳过
            </button>
          </div>
        </div>
      )}
    </>
  );
}
