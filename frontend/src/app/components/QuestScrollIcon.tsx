"use client";

/**
 * QuestScrollIcon — Unified linear SVG icon system for the Quest Scroll UI.
 *
 * Design: 1.5px stroke, rounded caps, Lucide-adjacent style with
 * ancient-civilization emblem feel. No emoji. All self-contained SVG.
 */

export type ScrollIconName =
  | "knowledge"
  | "reasoning"
  | "application"
  | "creation"
  | "building"
  | "building-emblem"
  | "civilization"
  | "world-core"
  | "quest"
  | "mission"
  | "checklist"
  | "scroll"
  | "shield"
  | "arrow-left"
  | "arrow-right"
  | "star"
  | "star-outline"
  | "lock"
  | "sparkle"
  | "seal";

interface IconProps {
  name: ScrollIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function QuestScrollIcon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.5,
}: IconProps) {
  const icons: Record<ScrollIconName, JSX.Element> = {
    // 知识 — 古卷书稿 (open book with illuminated page lines)
    knowledge: (
      <>
        <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3H10v15.5H4.5A1.5 1.5 0 0 0 3 20V4.5z" />
        <path d="M21 4.5A1.5 1.5 0 0 0 19.5 3H14v15.5h5.5a1.5 1.5 0 0 1 1.5 1.5V4.5z" />
        <path d="M6.5 7.5H8.5M6.5 10.5H8.5M6.5 13.5H8.5" strokeWidth="1" opacity="0.55" />
        <path d="M15.5 7.5H17.5M15.5 10.5H17.5M15.5 13.5H17.5" strokeWidth="1" opacity="0.55" />
      </>
    ),
    // 推理 — 神经核心 (neural core with branching nodes)
    reasoning: (
      <>
        <circle cx="12" cy="12" r="2.2" />
        <circle cx="5" cy="5" r="1.3" strokeWidth="1.2" />
        <circle cx="19" cy="5" r="1.3" strokeWidth="1.2" />
        <circle cx="5" cy="19" r="1.3" strokeWidth="1.2" />
        <circle cx="19" cy="19" r="1.3" strokeWidth="1.2" />
        <path d="M10.3 10.3L6 6M13.7 10.3L18 6M10.3 13.7L6 18M13.7 13.7L18 18" strokeWidth="1.1" opacity="0.85" />
      </>
    ),
    // 应用 — 机械结构 (gear + mechanism)
    application: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" strokeWidth="1.3" />
        <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      </>
    ),
    // 创造 — 星芒 (radiant star-burst)
    creation: (
      <>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="1.3" opacity="0.7" />
        <path d="M12 4.5l1.7 5.8 5.8 1.7-5.8 1.7L12 19.5l-1.7-5.8L4.5 12l5.8-1.7L12 4.5z" />
        <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" opacity="0.55" />
      </>
    ),
    // 建筑 — 建筑轮廓 (columned structure)
    building: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V8l7-4 7 4v13" />
        <path d="M9 21v-5h6v5" />
        <path d="M8 11v.01M12 11v.01M16 11v.01" strokeWidth="1" />
      </>
    ),
    // 建筑纹章 — 升级版徽章 (for building EXP)
    "building-emblem": (
      <>
        <path d="M12 2L3 6v2h18V6L12 2z" />
        <path d="M5 8v11M9 8v11M15 8v11M19 8v11" strokeWidth="1.2" opacity="0.75" />
        <path d="M3 19h18" />
        <path d="M2 21h20" strokeWidth="1.2" />
        <circle cx="12" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
      </>
    ),
    // 文明 — 全球纹理 (civ layer)
    civilization: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19" strokeWidth="1.2" />
        <path d="M12 2.5c2.8 3 4.2 6.2 4.2 9.5S14.8 18.5 12 21.5C9.2 18.5 7.8 15.3 7.8 12S9.2 5.5 12 2.5z" strokeWidth="1.2" />
      </>
    ),
    // 世界核心 — 文明贡献徽章 (concentric core)
    "world-core": (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4.5" strokeWidth="1.3" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeWidth="1.2" opacity="0.7" />
      </>
    ),
    quest: (
      <>
        <path d="M4 4v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.342a2 2 0 0 0-.602-1.43l-4.336-4.342A2 2 0 0 0 13.668 2H6a2 2 0 0 0-2 2z" />
        <path d="M9 13l2 2 4-4" strokeWidth="1.8" />
      </>
    ),
    mission: (
      <>
        <path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4z" />
        <circle cx="12" cy="11" r="2.5" />
      </>
    ),
    checklist: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    scroll: (
      <>
        <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
        <path d="M19 17V5a2 2 0 0 0-2-2H4" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>
    ),
    "arrow-left": (
      <>
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </>
    ),
    "arrow-right": (
      <>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </>
    ),
    star: (
      <>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" stroke="none" />
      </>
    ),
    "star-outline": (
      <>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
        <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z" strokeWidth="1" opacity="0.7" />
      </>
    ),
    // 古卷轴印章 — 用于任务印记
    seal: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d="M8 9h8M8 12h8M8 15h5" strokeWidth="1" opacity="0.6" />
        <path d="M4 4L20 20M20 4L4 20" strokeWidth="0.8" opacity="0.3" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
