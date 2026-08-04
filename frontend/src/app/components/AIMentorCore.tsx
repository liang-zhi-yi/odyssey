"use client";

import { useState, useRef } from "react";

interface AIMentorCoreProps {
  size?: number;
  compact?: boolean;
}

/**
 * AIMentorCore — AI 意识核心视频组件
 *
 * 从 /agent-mentor.mp4 加载视频，循环播放，无控制条。
 * 圆角玻璃容器 + 轻微光晕 + 低调动画。
 * 视频资源从 public 目录加载，不写死内容。
 */
export function AIMentorCore({ size = 200, compact = false }: AIMentorCoreProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const containerSize = compact ? 140 : size;
  const videoSize = containerSize * 0.72;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: containerSize, height: containerSize + 32 }}
    >
      {/* ── 装饰光环（在视频背后，低调光晕）── */}
      {/* 外层弥散光晕 */}
      <div
        className="absolute rounded-full pointer-events-none animate-glow-pulse"
        style={{
          width: containerSize * 1.1,
          height: containerSize * 1.1,
          top: -(containerSize * 0.05),
          background: "radial-gradient(circle, oklch(0.72 0.12 80 / 0.12) 0%, oklch(0.65 0.10 280 / 0.06) 40%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      {/* ── 装饰能量环（旋转虚线圈，参考图中虚线装饰）── */}
      <svg
        className="absolute pointer-events-none animate-[spin_80s_linear_infinite]"
        style={{ width: containerSize * 0.9, height: containerSize * 0.9, top: containerSize * 0.05 }}
        viewBox="0 0 140 140"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="70"
          cy="70"
          r="66"
          stroke="oklch(0.72 0.10 80)"
          strokeWidth="0.5"
          strokeDasharray="2 6"
          opacity="0.30"
        />
      </svg>
      <svg
        className="absolute pointer-events-none animate-[spin_120s_linear_infinite_reverse]"
        style={{ width: containerSize * 0.82, height: containerSize * 0.82, top: containerSize * 0.09 }}
        viewBox="0 0 140 140"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="70"
          cy="70"
          r="60"
          stroke="oklch(0.58 0.05 150)"
          strokeWidth="0.3"
          strokeDasharray="1 5"
          opacity="0.20"
        />
      </svg>

      {/* ── 视频容器：完全透明背景 ── */}
      <div
        className="absolute overflow-hidden"
        style={{
          width: videoSize,
          height: videoSize * 1.15,
          top: (containerSize - videoSize * 1.15) / 2,
          borderRadius: "12px",
          background: "transparent",
        }}
      >
        {/* 视频加载前的占位光核 */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full animate-glow-pulse"
              style={{
                width: videoSize * 0.3,
                height: videoSize * 0.3,
                background: "radial-gradient(circle, oklch(0.72 0.12 80 / 0.3), transparent 70%)",
              }}
            />
          </div>
        )}

        {/* 视频错误时的回退 */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🧭</span>
          </div>
        )}

        {/* AI 导师视频 — 循环播放，无控制条，静音 */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          style={{
            opacity: videoLoaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          <source src="/agent-mentor.mp4" type="video/mp4" />
          <source src="/agent-mentor.webm" type="video/webm" />
        </video>
      </div>

      {/* ── 底部铭文 ── */}
      <div className="absolute bottom-0 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[oklch(0.72 0.10 80)] font-mono">
          AI MENTOR
        </p>
        <p className="text-[9px] text-[oklch(0.5 0.02 60)] font-civ-serif italic mt-0.5">
          意识核心
        </p>
      </div>
    </div>
  );
}
