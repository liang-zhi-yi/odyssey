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
  | "arrow-up"
  | "star"
  | "star-outline"
  | "lock"
  | "unlock"
  | "sparkle"
  | "seal"
  | "compass"
  | "map"
  | "chart"
  | "chart-up"
  | "population"
  | "location"
  | "rocket"
  | "crane"
  | "idea"
  | "dragon"
  | "tree"
  | "tent"
  | "wheat"
  | "monitor"
  | "robot"
  | "path"
  | "hourglass"
  | "search"
  | "business"
  | "language"
  | "science"
  | "health"
  | "finance";

/**
 * Map descriptive icon names (from types/world.ts constants) and legacy
 * emoji strings to ScrollIconName. Falls back to "scroll" for unknown
 * strings so callers always get a valid civilization glyph.
 *
 * Shared by VintageShieldIcon and any component that needs to render a
 * world/era/tier/event/building icon coming from the backend or constants.
 */
const ICON_NAME_MAP: Record<string, ScrollIconName> = {
  // Descriptive names from world.ts constants
  tent: "tent",
  building: "building",
  civilization: "civilization",
  wheat: "wheat",
  knowledge: "knowledge",
  application: "application",
  monitor: "monitor",
  robot: "robot",
  reasoning: "reasoning",
  rocket: "rocket",
  "arrow-up": "arrow-up",
  unlock: "unlock",
  star: "star",
  mission: "mission",
  path: "path",
  hourglass: "hourglass",
  search: "search",
  "chart-up": "chart-up",
  business: "business",
  creation: "creation",
  language: "language",
  science: "science",
  health: "health",
  finance: "finance",
  // Legacy emoji → icon name mapping (for backend-provided icon strings)
  "🏛️": "building",
  "🏗️": "crane",
  "🗺️": "map",
  "🧭": "compass",
  "📊": "chart",
  "📈": "chart-up",
  "⭐": "star",
  "🌟": "sparkle",
  "📚": "knowledge",
  "⚡": "application",
  "👥": "population",
  "🌍": "civilization",
  "💡": "idea",
  "🎯": "mission",
  "🚀": "rocket",
  "⚙️": "application",
  "📍": "location",
  "📋": "checklist",
  "🐉": "dragon",
  "🌳": "tree",
};

/** Resolve any icon string (descriptive name or emoji) to a ScrollIconName. */
export function resolveScrollIconName(icon: string): ScrollIconName {
  return ICON_NAME_MAP[icon] ?? "scroll";
}

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
    // 罗盘 — 四方位星 (compass rose)
    compass: (
      <>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 2.5l2.5 9.5 9.5 2.5-9.5 2.5L12 26.5l-2.5-9.5L0 12l9.5-2.5L12 2.5z" transform="scale(0.6) translate(8 8)" strokeWidth="1.2" opacity="0.85" />
        <path d="M12 4l1.8 6.2L20 12l-6.2 1.8L12 20l-1.8-6.2L4 12l6.2-1.8L12 4z" strokeWidth="1.1" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    // 地图 — 折叠古卷地图 (folded map)
    map: (
      <>
        <path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" />
        <path d="M9 3v15M15 6v15" strokeWidth="1" opacity="0.55" />
        <path d="M6 9h1.5M6 12h1.5M17 9h1.5M17 12h1.5" strokeWidth="0.9" opacity="0.5" />
      </>
    ),
    // 图表 — 柱状统计 (bar chart)
    chart: (
      <>
        <path d="M3 3v18h18" />
        <rect x="6" y="13" width="3" height="5" />
        <rect x="11" y="9" width="3" height="9" />
        <rect x="16" y="6" width="3" height="12" />
      </>
    ),
    // 上升曲线 — 文明指数增长 (chart trending up)
    "chart-up": (
      <>
        <path d="M3 3v18h18" />
        <path d="M6 15l4-4 3 3 6-7" strokeWidth="1.8" />
        <path d="M13 7h4v4" strokeWidth="1.3" opacity="0.7" />
      </>
    ),
    // 人口 — 双人图腾 (population pair)
    population: (
      <>
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="16" cy="8" r="2.5" strokeWidth="1.2" opacity="0.75" />
        <path d="M3 20c0-3 2.5-5 5-5s5 2 5 5" />
        <path d="M11 20c0-3 2.5-5 5-5s5 2 5 5" strokeWidth="1.2" opacity="0.75" />
      </>
    ),
    // 标记 — 锚点定位 (location pin)
    location: (
      <>
        <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
    // 火箭 — 文明跃迁 (rocket launch)
    rocket: (
      <>
        <path d="M12 2c3 2 5 6 5 11l-2 3H9l-2-3c0-5 2-9 5-11z" />
        <circle cx="12" cy="9" r="1.8" />
        <path d="M9 16l-3 3 1-4M15 16l3 3-1-4" strokeWidth="1.2" opacity="0.8" />
        <path d="M10 21l1 2M14 21l-1 2" strokeWidth="1.3" opacity="0.7" />
      </>
    ),
    // 工程塔吊 — 建设中的文明 (construction crane)
    crane: (
      <>
        <path d="M4 21V7l8-4 8 4" />
        <path d="M4 7h16" />
        <path d="M12 3v18" strokeWidth="1.2" opacity="0.6" />
        <path d="M8 21h8" />
        <path d="M7 11l-2 3h4z" strokeWidth="1.2" opacity="0.8" />
        <path d="M5 14v3M9 14v3" strokeWidth="1.1" />
      </>
    ),
    // 灵感 — 智慧之灯 (idea bulb)
    idea: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />
        <path d="M9 8c0-1.5 1.5-3 3-3" strokeWidth="1" opacity="0.6" />
      </>
    ),
    // 巨龙 — 未知疆域守护者 (dragon serpent)
    dragon: (
      <>
        <path d="M3 12c3-3 6-3 9 0s6 3 9 0" />
        <path d="M3 8c3-3 6-3 9 0s6 3 9 0" strokeWidth="1.1" opacity="0.6" />
        <path d="M3 16c3-3 6-3 9 0s6 3 9 0" strokeWidth="1.1" opacity="0.6" />
        <circle cx="19" cy="8" r="0.9" fill="currentColor" stroke="none" />
        <path d="M21 8l1.5-1" strokeWidth="1.2" />
      </>
    ),
    // 古树 — 技艺分枝 (tech tree)
    tree: (
      <>
        <path d="M12 22V12" />
        <path d="M12 12c-3 0-5-2-5-5 2 0 4 1 5 3 1-2 3-3 5-3 0 3-2 5-5 5z" />
        <path d="M12 16c-2 0-3.5-1.5-3.5-3.5 1.5 0 2.5 1 3.5 2 1-1 2-2 3.5-2 0 2-1.5 3.5-3.5 3.5z" strokeWidth="1.1" opacity="0.75" />
      </>
    ),
    // 帐篷 — 定居者栖所 (tent)
    tent: (
      <>
        <path d="M3 21l9-16 9 16" />
        <path d="M3 21h18" />
        <path d="M12 5v16" strokeWidth="1.1" opacity="0.6" />
        <path d="M9 21l3-5 3 5" strokeWidth="1.2" opacity="0.8" />
      </>
    ),
    // 麦穗 — 农耕时代 (wheat stalk)
    wheat: (
      <>
        <path d="M12 22V8" />
        <path d="M12 8c-2-1-3-3-3-5 2 0 3 2 3 4M12 8c2-1 3-3 3-5-2 0-3 2-3 4" strokeWidth="1.1" />
        <path d="M12 12c-2-1-3-3-3-5 2 0 3 2 3 4M12 12c2-1 3-3 3-5-2 0-3 2-3 4" strokeWidth="1.1" opacity="0.85" />
        <path d="M12 16c-2-1-3-3-3-5 2 0 3 2 3 4M12 16c2-1 3-3 3-5-2 0-3 2-3 4" strokeWidth="1.1" opacity="0.7" />
      </>
    ),
    // 显屏 — 信息时代 (monitor screen)
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="1.5" />
        <path d="M8 21h8M12 17v4" strokeWidth="1.2" />
        <path d="M7 8h6M7 11h4" strokeWidth="1" opacity="0.6" />
      </>
    ),
    // 智械 — AI 时代 (robot head)
    robot: (
      <>
        <rect x="5" y="7" width="14" height="11" rx="2" />
        <path d="M12 3v4" strokeWidth="1.2" />
        <circle cx="12" cy="3" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="9.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <path d="M9 16h6" strokeWidth="1.2" opacity="0.7" />
      </>
    ),
    // 道路 — 学习路径 (winding path)
    path: (
      <>
        <path d="M3 21c4 0 4-4 8-4s4 4 8 4" />
        <path d="M3 14c4 0 4-4 8-4s4 4 8 4" strokeWidth="1.1" opacity="0.7" />
        <path d="M3 7c4 0 4-4 8-4s4 4 8 4" strokeWidth="1.1" opacity="0.5" />
      </>
    ),
    // 沙漏 — 时代流转 (hourglass)
    hourglass: (
      <>
        <path d="M6 3h12M6 21h12" />
        <path d="M6 3c0 5 4 6 6 9 2-3 6-4 6-9M6 21c0-5 4-6 6-9 2 3 6 4 6 9" strokeWidth="1.2" />
        <path d="M12 12v3" strokeWidth="1" opacity="0.6" />
      </>
    ),
    // 探索 — 放大镜 (search lens)
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5L21 21" />
        <path d="M8 10.5h5" strokeWidth="1.1" opacity="0.6" />
      </>
    ),
    // 商业 — 钱币 (business coins)
    business: (
      <>
        <circle cx="9" cy="9" r="6" />
        <circle cx="15" cy="15" r="6" strokeWidth="1.2" opacity="0.85" />
        <path d="M9 6v6M7 9h4" strokeWidth="1.1" opacity="0.6" />
      </>
    ),
    // 语言 — 文字符 (language character)
    language: (
      <>
        <path d="M3 5h18M12 5v15" />
        <path d="M6 9c1.5 4 3 6 6 8 3-2 4.5-4 6-8" strokeWidth="1.2" />
      </>
    ),
    // 科学 — 原子结构 (atom)
    science: (
      <>
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="9" ry="4" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)" strokeWidth="1.2" opacity="0.85" />
        <ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)" strokeWidth="1.2" opacity="0.85" />
      </>
    ),
    // 健康 — 十字徽 (health cross)
    health: (
      <>
        <path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 6.5-7 11-7 11z" strokeWidth="1.2" opacity="0.4" />
        <path d="M12 8v8M8 12h8" strokeWidth="2" />
      </>
    ),
    // 金融 — 钱币堆叠 (finance stack)
    finance: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="2.5" />
        <path d="M5 6v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" strokeWidth="1.2" />
        <path d="M5 11v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5" strokeWidth="1.2" opacity="0.85" />
      </>
    ),
    // 上箭头 — 升级标记
    "arrow-up": (
      <>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </>
    ),
    // 解锁 — 开启状态
    unlock: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 7.5-2" />
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
