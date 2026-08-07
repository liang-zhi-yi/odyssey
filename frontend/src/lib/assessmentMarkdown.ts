/**
 * AI 评估反馈解析层 (v2 — 富文本版)
 * ───────────────────────────────────────────────────────────
 *
 *  目标：将 AI 返回的 Markdown 文本转换为两种格式：
 *  1) 结构化 JSON (advantages / improvements / suggestions) — 供三段式反馈卡使用
 *  2) 安全的 HTML 富文本 — 供「展开完整分析」和维度说明使用，
 *     支持 标题 / 列表 / 粗体 / 斜体 / 引用 / 代码块 / 换行 / 水平分隔线，
 *     但不允许 <script>、onclick、href=javascript: 等危险内容 (XSS防护)。
 *
 *  流程：
 *    AI 原始 Markdown
 *        ↓ cleanMarkdown()  — 移除代码围栏、<details>、HTML标签、表格、链接图片
 *        ↓
 *    纯 Markdown（允许的子集：# / - / ** / * / > / ``` / --- / 换行）
 *        ↓
 *    ├─ segmentByText() → 结构化 JSON 三段式（供反馈卡）
 *    └─ markdownToSafeHtml() → 安全 HTML 字符串（供 React dangerouslySetInnerHTML）
 *
 *  仅前端转换，不修改后端接口和数据结构。
 */

/* ──────────────────────────────────────────────────────── */
/*  1. 结构化三段式反馈类型                                 */
/* ──────────────────────────────────────────────────────── */

export interface ParsedFeedback {
  /** 你的优势 — 列表项（纯文本，无 Markdown 标记） */
  advantages: string[];
  /** 需要提升 — 列表项 */
  improvements: string[];
  /** 下一阶段建议 — 列表项 */
  suggestions: string[];
  /** 摘要（纯文本，默认展示，避免文字墙） */
  summary: string;
  /** 清洗后的完整纯文本（备用展示） */
  fullText: string;
  /** 安全 HTML — 可直接用于 React dangerouslySetInnerHTML={{ __html: safeHtml }} */
  safeHtml: string;
  /** 是否存在可展开的详细内容 */
  hasDetails: boolean;
}

/* ──────────────────────────────────────────────────────── */
/*  2. 分组识别关键词                                       */
/* ──────────────────────────────────────────────────────── */

const SECTION_KEYWORDS: Array<{
  type: keyof Pick<ParsedFeedback, "advantages" | "improvements" | "suggestions">;
  patterns: RegExp;
}> = [
  {
    type: "advantages",
    patterns:
      /(优势|优点|长处|亮点|做得好|强项|出色|最大亮点|talents?|strengths?|advantages?|pros\b|good\s*points?)/i,
  },
  {
    type: "improvements",
    patterns:
      /(需要提升|提升空间|改进|不足|弱点|缺点|欠缺|待加强|待提升|成长空间|挑战|weakness(es)?|improvements?|cons\b|areas\s*for\s*improvement|shortcomings?|growth\s*areas?|challenges?)/i,
  },
  {
    type: "suggestions",
    patterns:
      /(下一阶段|下一步|后续|建议|改进建议|发展方向|学习路径|探索方向|优先行动|next\s*steps?|suggestions?|recommendations?|advice|future\s*direction|recommend|priority\s*action)/i,
  },
];

/* ──────────────────────────────────────────────────────── */
/*  3. 清洗阶段 — 剥离危险/不需要的格式，保留允许的子集     */
/* ──────────────────────────────────────────────────────── */

/**
 * 清洗 Markdown — 过滤被禁用的格式，保留允许的元素。
 *
 * 保留：`#` 标题、`-`/`*`/`1.` 列表、`**粗体**`、`*斜体*`、
 *       `> 引用`、```` ```代码块 ````、`---` 分隔线、普通文本 + 换行
 *
 * 移除：代码围栏内容块、HTML标签 `<...>`（含 <details> 整块）、
 *       Markdown 表格、链接、图片、HTML 实体污染。
 */
export function cleanMarkdown(raw: string): string {
  if (!raw) return "";

  let text = raw;

  // 1. 整块移除 <details>...</details>（折叠块，内文不参与鉴定展示）
  text = text.replace(/<details[\s\S]*?<\/details>/gi, "");

  // 2. 移除围栏代码块 ```...```（含语言标识）—— 保留内文稍后处理
  const codeBlocks: string[] = [];
  text = text.replace(/```([\s\S]*?)```/g, (_, inner) => {
    codeBlocks.push(inner);
    return `\u0000CB${codeBlocks.length - 1}\u0000`;
  });

  // 3. 移除其余 HTML 标签（含 <summary> 残留等），保留内部文字
  text = text.replace(/<[^>]+>/g, "");

  // 4. 移除 HTML 实体的常见残留
  text = text
    .replace(/&lt;\/?[^&gt;]+&gt;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 5. 移除 Markdown 表格
  text = text.replace(/^\s*\|.*\|\s*$/gm, "");

  // 6. 移除 Markdown 链接，保留链接文本 [text](url) → text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 7. 移除图片 ![alt](url)
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, "");

  // 8. 恢复代码块标记（以 ``` 包裹，后序渲染器处理）
  text = text.replace(/\u0000CB(\d+)\u0000/g, (_, i) => {
    return "```\n" + codeBlocks[parseInt(i, 10)] + "\n```";
  });

  // 9. 移除行尾多余空格 + 合并 3+ 空行为 2 空
  text = text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/* ──────────────────────────────────────────────────────── */
/*  4. 纯文本化 — 剥离所有行内标记用于列表项 / 摘要         */
/* ──────────────────────────────────────────────────────── */

/**
 * 去除行内 Markdown 强调标记，保留文字内容。
 * 用于 结构化 JSON 的列表项（避免 **粗体** 符号出现在卡片正文中）。
 */
export function stripInlineMarkdown(text: string): string {
  if (!text) return "";
  let out = text;
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/__([^_]+)__/g, "$1");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  out = out.replace(/(?<!_)_([^_]+)_(?!_)/g, "$1");
  // 移除行内代码 `...`，保留文字
  out = out.replace(/`([^`]+)`/g, "$1");
  // 最终清理：移除未配对的残留强调标记
  out = out.replace(/\*\*/g, "");
  out = out.replace(/\*/g, "");
  out = out.replace(/__/g, "");
  return out.trim();
}

/**
 * 将清洗后的文本完全转为面向用户展示的纯文本：
 * - `# 标题` → 标题文本（去 #）
 * - `- 列表项` → `• 列表项`
 * - 其余行保留
 *
 * 用于生成 fullText / summary 纯文本备用字段。
 */
export function toDisplayText(cleaned: string): string {
  if (!cleaned) return "";
  return cleaned
    .split("\n")
    .map((line) => {
      const h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (h) return stripInlineMarkdown(h[2]);
      const ul = line.match(/^\s*[-*+]\s+(.+?)\s*$/);
      if (ul) return "• " + stripInlineMarkdown(ul[1]);
      const ol = line.match(/^\s*\d+[.)\u3001]\s+(.+?)\s*$/);
      if (ol) return "• " + stripInlineMarkdown(ol[1]);
      return stripInlineMarkdown(line);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ──────────────────────────────────────────────────────── */
/*  5. Markdown → 安全 HTML (核心)                          */
/* ──────────────────────────────────────────────────────── */

/**
 * 极简、安全的 Markdown 子集 → HTML 转换器。
 *
 * 支持的语法：
 *   # H1 ~ ###### H6
 *   -  / * / + 无序列表
 *   1. / 1) 有序列表
 *   **粗体** / *斜体* / `行内代码`
 *   > 引用块
 *   ``` 代码块 ``` → <pre><code>
 *   --- 水平分隔线
 *   普通段落 + 换行 → <p> / <br>
 *
 * 安全策略：
 *   - 任何未列入白名单的标签一律转义。
 *   - 输出中不保留 <script> / <iframe> / onclick / 事件处理属性。
 *   - 所有字符串内容通过 escapeHtml() 转义后再写入。
 *   - 不解析链接（<a>），避免 javascript: 协议跳转。
 */
export function markdownToSafeHtml(cleaned: string): string {
  if (!cleaned) return "";

  const lines = cleaned.split("\n");
  const out: string[] = [];
  let i = 0;

  // 列表栈：支持简单嵌套，栈中元素 = 当前列表类型 "ul" | "ol"
  const listStack: ("ul" | "ol")[] = [];

  const closeAllLists = () => {
    while (listStack.length) {
      out.push(`</li></${listStack.pop()}>`);
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // (A) 代码块 ```...```
    const fence = line.match(/^\s*```\s*(.*)$/);
    if (fence) {
      closeAllLists();
      const lang = fence[1] || "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const codeHtml = escapeHtml(codeLines.join("\n"));
      out.push(
        `<pre class="assessment-codeblock" data-lang="${escapeHtml(lang)}"><code>${codeHtml}</code></pre>`
      );
      continue;
    }

    // (B) 空行 → 关闭所有进行中的列表，跳过
    if (!line.trim()) {
      closeAllLists();
      i++;
      continue;
    }

    // (C) 水平分隔线 ---
    if (/^\s*([-*_])\s*\1\s*\1[\s\S]*$/.test(line)) {
      closeAllLists();
      out.push('<hr class="assessment-hr" />');
      i++;
      continue;
    }

    // (D) 标题 #~######
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      closeAllLists();
      const level = heading[1].length;
      const content = renderInline(heading[2]);
      out.push(
        `<h${level} class="assessment-h${level}">${content}</h${level}>`
      );
      i++;
      continue;
    }

    // (E) 引用块 > ...
    const blockquote = line.match(/^\s*>\s?(.*)$/);
    if (blockquote) {
      closeAllLists();
      const quoteLines: string[] = [blockquote[1]];
      let j = i + 1;
      while (j < lines.length && /^\s*>\s?/.test(lines[j])) {
        quoteLines.push(lines[j].replace(/^\s*>\s?/, ""));
        j++;
      }
      const inner = quoteLines
        .map((ql) => renderInline(ql))
        .join("<br />");
      out.push(
        `<blockquote class="assessment-blockquote">${inner}</blockquote>`
      );
      i = j;
      continue;
    }

    // (F) 无序列表项 -/*/+
    const ulItem = line.match(/^\s*(?:[-*+])\s+(.+?)\s*$/);
    if (ulItem) {
      // 结束当前有序列表（如正在进行）
      if (listStack[listStack.length - 1] === "ol") {
        out.push(`</li></${listStack.pop()}>`);
      }
      if (listStack[listStack.length - 1] !== "ul") {
        listStack.push("ul");
        out.push('<ul class="assessment-ul">');
      } else {
        out.push("</li>");
      }
      out.push(`<li>${renderInline(ulItem[1])}`);
      i++;
      continue;
    }

    // (G) 有序列表项 1. / 1)
    const olItem = line.match(/^\s*(\d+)[.)\u3001]\s+(.+?)\s*$/);
    if (olItem) {
      if (listStack[listStack.length - 1] === "ul") {
        out.push(`</li></${listStack.pop()}>`);
      }
      if (listStack[listStack.length - 1] !== "ol") {
        listStack.push("ol");
        out.push('<ol class="assessment-ol">');
      } else {
        out.push("</li>");
      }
      out.push(`<li>${renderInline(olItem[2])}`);
      i++;
      continue;
    }

    // (H) 普通段落
    closeAllLists();
    const paraLines: string[] = [line];
    let j = i + 1;
    while (
      j < lines.length &&
      lines[j].trim() &&
      !/^(#{1,6}\s|[*+\-]\s|\d+[.)\u3001]\s|>\s?|```|---|\*\*\*|___)/.test(lines[j])
    ) {
      paraLines.push(lines[j]);
      j++;
    }
    const paraContent = paraLines
      .map((pl) => renderInline(pl))
      .join('<br class="assessment-br" />');
    out.push(`<p class="assessment-p">${paraContent}</p>`);
    i = j;
  }

  // 收尾：关闭进行中的列表
  closeAllLists();

  return out.join("\n");
}

/* ─────────── 行内渲染：**粗体** / *斜体* / `代码` ───────── */

/**
 * 渲染行内格式。所有内容先整体转义，再按非重叠切片替换为 HTML。
 * 保证任何用户输入的 <script> / onerror 等最终为文本字符而非真实标签。
 */
function renderInline(src: string): string {
  // 先整体 HTML 转义
  const escaped = escapeHtml(src);
  // 再还原我们要支持的几个标记（注意：转义后 ** / * / ` 仍然是它们本身，不受影响）
  let s = escaped;

  // (1) 行内代码 `...` → <code>
  s = s.replace(/`([^`]+)`/g, (_, inner) => {
    return `<code class="assessment-inlinecode">${inner}</code>`;
  });

  // (2) 粗体 **text** / __text__
  s = s.replace(
    /\*\*([^*]+?)\*\*/g,
    '<strong class="assessment-strong">$1</strong>'
  );
  s = s.replace(
    /__([^_]+?)__/g,
    '<strong class="assessment-strong">$1</strong>'
  );

  // (3) 斜体 *text* / _text_（非重叠，避免与粗体冲突）
  s = s.replace(
    /(^|[^*])\*([^*\n]+?)\*(?!\*)/g,
    '$1<em class="assessment-em">$2</em>'
  );
  s = s.replace(
    /(^|[^_])_([^_\n]+?)_(?!_)/g,
    '$1<em class="assessment-em">$2</em>'
  );

  // (4) 最终清理：移除未配对的残留强调标记（*、**、__）
  //     这些是 AI 输出中常见的 Markdown 残留，会导致页面出现异常符号
  s = s.replace(/\*\*/g, "");
  s = s.replace(/\*/g, "");
  s = s.replace(/__/g, "");

  return s;
}

/** 基础 HTML 转义 — 防止 XSS 的核心屏障 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ──────────────────────────────────────────────────────── */
/*  6. 结构化 JSON 分段 — 保持 v1 逻辑稳定                  */
/* ──────────────────────────────────────────────────────── */

function matchHeading(line: string): { level: number; text: string } | null {
  const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
  if (!m) return null;
  return { level: m[1].length, text: stripInlineMarkdown(m[2]) };
}

function matchListItem(line: string): string | null {
  const m = line.match(/^\s*(?:[-*+]\s+|\d+[.)\u3001]\s+)(.+?)\s*$/);
  if (!m) return null;
  return stripInlineMarkdown(m[1]);
}

function extractItems(block: string): string[] {
  const lines = block.split("\n").map((l) => l.trimEnd());
  const items: string[] = [];
  let hasList = false;

  for (const line of lines) {
    if (!line.trim()) continue;
    const li = matchListItem(line);
    if (li !== null) {
      hasList = true;
      if (li) items.push(li);
    } else if (hasList && items.length > 0) {
      items[items.length - 1] += " " + stripInlineMarkdown(line.trim());
    }
  }

  if (!hasList) {
    const sentences = block
      .split(/(?<=[\u3002\uff01\uff1f.!?])\s*/)
      .map((s) => stripInlineMarkdown(s.trim()))
      .filter((s) => s.length > 0);
    return sentences.filter((s) => !/^#{1,6}\s/.test(s));
  }

  return items.filter((s) => s.length > 0);
}

/** Match bold text markers like `**优势**` or `**待提升**：` as section markers. */
function matchBoldSection(line: string): string | null {
  const m = line.match(/^\s*\*\*([^*]{2,20})\*\*\s*[:：]?\s*$/);
  if (!m) return null;
  return stripInlineMarkdown(m[1]);
}

function segmentByText(text: string): {
  advantages: string[];
  improvements: string[];
  suggestions: string[];
} {
  const lines = text.split("\n");
  const sections: Array<{ type: string; buffer: string[] }> = [
    { type: "advantages", buffer: [] },
  ];
  let current = sections[0];

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      const matched = SECTION_KEYWORDS.find((s) =>
        s.patterns.test(heading.text)
      );
      if (matched) {
        let target = sections.find((s) => s.type === matched.type);
        if (!target) {
          target = { type: matched.type, buffer: [] };
          sections.push(target);
        }
        current = target;
        continue;
      }
      current.buffer.push(heading.text);
      continue;
    }
    // Also check for bold text section markers (e.g., **优势**, **待提升**)
    const boldSection = matchBoldSection(line);
    if (boldSection) {
      const matched = SECTION_KEYWORDS.find((s) =>
        s.patterns.test(boldSection)
      );
      if (matched) {
        let target = sections.find((s) => s.type === matched.type);
        if (!target) {
          target = { type: matched.type, buffer: [] };
          sections.push(target);
        }
        current = target;
        continue;
      }
    }
    current.buffer.push(line);
  }

  const result = {
    advantages: [] as string[],
    improvements: [] as string[],
    suggestions: [] as string[],
  };
  for (const sec of sections) {
    const block = sec.buffer.join("\n").trim();
    if (!block) continue;
    const items = extractItems(block);
    if (items.length > 0) {
      result[sec.type as keyof typeof result].push(...items);
    }
  }
  return result;
}

/**
 * 去除组内重复条目（精确匹配，保留首次出现顺序）。
 * AI 反馈中同一观点可能在同区块重复列出，去重避免卡片内容重复。
 */
function dedupeItems(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const key = it.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it.trim());
  }
  return out;
}

/**
 * 跨组去重 — 同一观点若在多个分组（优势/挑战/建议）重复出现，
 * 仅保留最早出现的分组，其余组移除，避免三张卡片内容互相重复。
 */
function dedupeAcrossGroups(
  advantages: string[],
  improvements: string[],
  suggestions: string[]
): { advantages: string[]; improvements: string[]; suggestions: string[] } {
  const seen = new Set<string>();
  const pick = (items: string[]) => {
    const out: string[] = [];
    for (const it of items) {
      const key = it.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it.trim());
    }
    return out;
  };
  return {
    advantages: pick(advantages),
    improvements: pick(improvements),
    suggestions: pick(suggestions),
  };
}

/* ──────────────────────────────────────────────────────── */
/*  7. 摘要生成                                             */
/* ──────────────────────────────────────────────────────── */

function buildSummary(fullText: string, maxChars = 90): string {
  const flat = fullText
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (flat.length <= maxChars) return flat;
  const slice = flat.slice(0, maxChars);
  const lastStop = Math.max(
    slice.search(/[\u3002\uff01\uff1f.!?][^\u3002\uff01\uff1f.!?]*$/),
    slice.lastIndexOf("，"),
    slice.lastIndexOf(",")
  );
  const cut = lastStop > 20 ? slice.slice(0, lastStop + 1) : slice;
  return cut.trim() + "…";
}

/* ──────────────────────────────────────────────────────── */
/*  8. 对外主入口： parseFeedback                           */
/* ──────────────────────────────────────────────────────── */

/**
 * 解析 AI 反馈为结构化数据 + 安全 HTML。
 *
 * @param feedback   后端 feedback 字段（可能含 Markdown）
 * @param suggestions 后端 suggestions 字段（可能含 Markdown）
 * @returns ParsedFeedback — 同时含结构化列表 + 纯文本 + 安全 HTML
 */
export function parseFeedback(
  feedback: string | null,
  suggestions: string | null
): ParsedFeedback {
  const cleanedFeedback = cleanMarkdown(feedback ?? "");
  const cleanedSuggestions = cleanMarkdown(suggestions ?? "");

  // 主解析：以 feedback 为主，分段提取
  const segmented = segmentByText(cleanedFeedback);

  // suggestions 补充并入
  if (cleanedSuggestions) {
    const segSug = segmentByText(cleanedSuggestions);
    if (segSug.suggestions.length > 0) {
      segmented.suggestions.push(...segSug.suggestions);
    } else {
      if (segSug.advantages.length)
        segmented.advantages.push(...segSug.advantages);
      if (segSug.improvements.length)
        segmented.improvements.push(...segSug.improvements);
    }
    // 兜底：suggestions 无法识别结构 → 整体作为建议条目
    if (
      segSug.advantages.length === 0 &&
      segSug.improvements.length === 0 &&
      segSug.suggestions.length === 0
    ) {
      const items = extractItems(cleanedSuggestions);
      if (items.length > 0) segmented.suggestions.push(...items);
    }
  }

  // 最终兜底：三组全空但 feedback 有内容 → 不再强制全部归入优势，
  // 保留内容在 fullText/safeHtml 供 AI 详细记录展示，
  // 三张卡片显示各自的"暂无数据"提示，避免内容与标题不匹配。
  // 仅当 feedback 能提取出明确的列表项时，按语义分布到各分组。
  if (
    segmented.advantages.length === 0 &&
    segmented.improvements.length === 0 &&
    segmented.suggestions.length === 0 &&
    cleanedFeedback
  ) {
    const items = extractItems(cleanedFeedback);
    // 如果提取出的条目超过 3 条，尝试均分到三个分组
    if (items.length > 3) {
      const third = Math.ceil(items.length / 3);
      segmented.advantages = items.slice(0, third);
      segmented.improvements = items.slice(third, third * 2);
      segmented.suggestions = items.slice(third * 2);
    }
    // 条目 ≤ 3 时不强行分组，保持卡片为空，由 fullText 承载完整内容
  }

  // 去重：组内精确重复 + 跨组重复（保留最早分组），避免三张卡片内容重复
  const deduped = dedupeAcrossGroups(
    dedupeItems(segmented.advantages),
    dedupeItems(segmented.improvements),
    dedupeItems(segmented.suggestions)
  );

  // 展示用纯文本（去 Markdown 标记）
  const mergedClean = [cleanedFeedback, cleanedSuggestions]
    .filter(Boolean)
    .join("\n\n");
  const fullText = toDisplayText(mergedClean);

  // 安全 HTML（可直接 dangerouslySetInnerHTML）
  const safeHtml = markdownToSafeHtml(mergedClean);

  const summary = buildSummary(fullText);
  const hasDetails = fullText.length > summary.length + 4;

  return {
    advantages: deduped.advantages,
    improvements: deduped.improvements,
    suggestions: deduped.suggestions,
    summary,
    fullText,
    safeHtml,
    hasDetails,
  };
}
