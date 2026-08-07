"use client";

import type { ReactNode } from "react";
import { getCivIconPath, type CivIconType } from "@/lib/civIcons";

interface CivIconProps {
  /** building=建筑 | era=时代 | type=文明类型 */
  type: CivIconType;
  /** 建筑中文名 / 时代 key / 类型 key */
  name?: string | null;
  size?: number;
  className?: string;
  alt?: string;
  /** 找不到对应 PNG 时渲染的回退内容（默认不渲染） */
  fallback?: ReactNode;
}

/**
 * CivIcon — 渲染文明建筑 / 时代 / 类型对应的透明背景 PNG 图标资产。
 * 找不到映射时回退到 fallback（可传原有 SVG 图标）。
 */
export function CivIcon({
  type,
  name,
  size = 24,
  className = "",
  alt = "",
  fallback,
}: CivIconProps) {
  const src = getCivIconPath(type, name);
  if (!src) return <>{fallback ?? null}</>;
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      loading="lazy"
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}