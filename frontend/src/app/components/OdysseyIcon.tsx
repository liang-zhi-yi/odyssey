"use client";

/**
 * OdysseyIcon — 统一图标系统
 *
 * 风格：细线 / 古文明符号 / 未来科技纹理
 * 统一尺寸、线宽、颜色体系
 * 替代 emoji 和通用 SVG
 */

export type OdysseyIconName =
  | "knowledge" // 知识 — 晶体 + 数据纹路
  | "reasoning" // 推理 — 核心轨道
  | "application" // 应用 — 锚定符
  | "creation" // 创造 — 生成中的光核
  | "strength" // 优势 — 勋章纹章
  | "growing" // 成长中 — 萌芽环
  | "explore" // 待探索 — 星门
  | "codex" // 技能典籍
  | "flag" // 任务旗帜
  | "tower" // 文明塔
  | "spark" // 火花
  | "domain" // 能力域
  | "trajectory" // 轨迹
  | "world" // 世界
  | "mentor" // 导师
  | "growth" // 成长
  | "path" // 路径
  | "archive"; // 档案

interface OdysseyIconProps {
  name: OdysseyIconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/** 统一线宽与尺寸的图标组件 */
export function OdysseyIcon({
  name,
  size = 16,
  className = "",
  strokeWidth = 1.4,
}: OdysseyIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    // ── 知识：晶体 + 数据纹路 ──
    case "knowledge":
      return (
        <svg {...common}>
          <path d="M12 2 L20 8 L12 22 L4 8 Z" />
          <path d="M4 8 L20 8 M12 2 L12 22" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" opacity={0.5} />
        </svg>
      );

    // ── 推理：核心轨道 ──
    case "reasoning":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <ellipse cx="12" cy="12" rx="10" ry="4" opacity={0.7} />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" opacity={0.5} />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" opacity={0.3} />
        </svg>
      );

    // ── 应用：锚定符 ──
    case "application":
      return (
        <svg {...common}>
          <circle cx="12" cy="5" r="2" />
          <path d="M12 7 V20 M8 13 L12 20 L16 13" />
          <path d="M6 10 L9 12 M18 10 L15 12" opacity={0.6} />
        </svg>
      );

    // ── 创造：生成中的光核 ──
    case "creation":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" opacity={0.6} />
          <path d="M12 2 V6 M12 18 V22 M2 12 H6 M18 12 H22" />
          <path d="M5 5 L8 8 M19 5 L16 8 M5 19 L8 16 M19 19 L16 16" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    // ── 优势：勋章纹章 ──
    case "strength":
      return (
        <svg {...common}>
          <path d="M12 2 L15 5 L19 5 L19 9 L22 12 L19 15 L19 19 L15 19 L12 22 L9 19 L5 19 L5 15 L2 12 L5 9 L5 5 L9 5 Z" />
          <circle cx="12" cy="12" r="3" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    // ── 成长中：萌芽环 ──
    case "growing":
      return (
        <svg {...common}>
          <path d="M12 21 C12 21 4 17 4 11 C4 7 7 4 12 4 C17 4 20 7 20 11 C20 17 12 21 12 21 Z" opacity={0.4} />
          <path d="M12 18 V8 M12 10 C10 10 8 11 8 13 M12 10 C14 10 16 11 16 13" strokeWidth={strokeWidth - 0.2} />
        </svg>
      );

    // ── 待探索：星门 ──
    case "explore":
      return (
        <svg {...common}>
          <path d="M3 12 L9 6 L15 12 L9 18 Z" opacity={0.5} />
          <path d="M9 6 L21 12 L9 18" />
          <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" opacity={0.5} />
        </svg>
      );

    // ── 技能典籍 ──
    case "codex":
      return (
        <svg {...common}>
          <path d="M5 3 H17 A2 2 0 0 1 19 5 V21 L15 19 L11 21 L7 19 L5 21 Z" />
          <path d="M9 8 H15 M9 12 H15" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    // ── 任务旗帜 ──
    case "flag":
      return (
        <svg {...common}>
          <path d="M5 21 V4 M5 4 H17 L14 8 L17 12 H5" />
        </svg>
      );

    // ── 文明塔 ──
    case "tower":
      return (
        <svg {...common}>
          <path d="M7 21 V9 L12 4 L17 9 V21 M7 21 H17 M10 21 V17 H14 V21" />
          <path d="M10 12 H14" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    // ── 火花 ──
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2 V7 M12 17 V22 M2 12 H7 M17 12 H22" />
          <path d="M5 5 L8 8 M19 5 L16 8 M5 19 L8 16 M19 19 L16 16" strokeWidth={strokeWidth - 0.3} opacity={0.5} />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" opacity={0.6} />
        </svg>
      );

    // ── 能力域：六边形 ──
    case "domain":
      return (
        <svg {...common}>
          <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
          <path d="M12 2 L12 22 M3 7 L21 17 M21 7 L3 17" strokeWidth={strokeWidth - 0.4} opacity={0.4} />
        </svg>
      );

    // ── 轨迹 ──
    case "trajectory":
      return (
        <svg {...common}>
          <path d="M3 17 L9 11 L13 15 L21 7" />
          <path d="M21 7 L15 7 M21 7 L21 13" />
          <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
          <circle cx="13" cy="15" r="1" fill="currentColor" stroke="none" />
        </svg>
      );

    // ── 世界 ──
    case "world":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12 H21 M12 3 A14 14 0 0 1 12 21 A14 14 0 0 1 12 3" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    // ── 导师 ──
    case "mentor":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" opacity={0.5} />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 3 V6 M12 18 V21 M3 12 H6 M18 12 H21" strokeWidth={strokeWidth - 0.3} opacity={0.5} />
        </svg>
      );

    // ── 成长 ──
    case "growth":
      return (
        <svg {...common}>
          <path d="M12 22 V12 M12 12 C9 12 6 10 6 7 C9 7 12 9 12 12 M12 12 C15 12 18 10 18 7 C15 7 12 9 12 12" />
          <path d="M8 22 H16" strokeWidth={strokeWidth - 0.2} opacity={0.5} />
        </svg>
      );

    // ── 路径 ──
    case "path":
      return (
        <svg {...common}>
          <path d="M4 19 C4 13 8 10 12 10 C16 10 20 7 20 4" opacity={0.5} />
          <path d="M4 19 L8 15 M14 11 L20 5" />
          <circle cx="4" cy="19" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );

    // ── 档案 ──
    case "archive":
      return (
        <svg {...common}>
          <path d="M3 5 H21 V9 H3 Z M5 9 V20 H19 V9" />
          <path d="M10 13 H14" strokeWidth={strokeWidth - 0.2} opacity={0.6} />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
