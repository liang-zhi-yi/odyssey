"""
Prompt builder — constructs the evaluation prompt with rubric embedded inline.

The rubric is embedded in every evaluation prompt, not referenced by ID.
V2: Enhanced with evaluation methodology, evidence requirements, quest-type
awareness, and calibration anchors for more professional assessments.
"""

import logging

logger = logging.getLogger(__name__)

RANK_ORDER = ["NOVICE", "BEGINNER", "PRACTITIONER", "ENGINEER", "ARCHITECT"]

# ── Quest-type-specific evaluation guidance ─────────────────────────────

QUEST_TYPE_GUIDANCE = {
    "KNOWLEDGE": {
        "focus": "概念理解的深度和准确性、知识体系的完整性、术语使用的精确性",
        "key_questions": [
            "概念定义是否准确且完整？",
            "是否展示了知识之间的关联？",
            "是否区分了核心概念和边缘细节？",
            "术语使用是否恰当和精确？",
        ],
    },
    "APPLICATION": {
        "focus": "将理论应用于实际问题的能力、方案的可执行性、对约束条件的处理",
        "key_questions": [
            "解决方案是否直接回应了问题？",
            "是否考虑了真实场景中的约束条件？",
            "方案是否具体可执行（而非泛泛而谈）？",
            "是否展示了从理论到实践的转化能力？",
        ],
    },
    "PROJECT": {
        "focus": "端到端项目交付能力、架构设计、工程实践、完整性",
        "key_questions": [
            "项目结构是否合理且完整？",
            "是否展示了端到端的实现能力？",
            "是否考虑了边界条件和异常处理？",
            "代码/产出是否具备可维护性？",
        ],
    },
    "MASTERY": {
        "focus": "创新性、系统性思维、复杂问题拆解、最佳实践判断",
        "key_questions": [
            "是否展示了超越标准答案的深入思考？",
            "是否对现有方案进行了批判性分析？",
            "是否提出了新颖且有价值的观点或方案？",
            "是否从系统层面思考了问题的本质？",
        ],
    },
}

# ── Deliverable-type-specific evaluation notes ──────────────────────────

DELIVERABLE_GUIDANCE = {
    "PROMPT": "评估 Prompt 的设计质量：清晰度、结构化程度、约束的完整性、对 LLM 行为的引导能力",
    "ARCHITECTURE": "评估架构设计的质量：模块划分合理性、数据流清晰度、扩展性考量、技术选型的论证",
    "WORKFLOW": "评估工作流设计的质量：步骤完整性、条件分支的合理性、异常处理、效率优化",
    "CODE": "评估代码的质量：正确性、可读性、健壮性、测试覆盖、设计模式运用",
    "REPORT": "评估报告的质量：论证的严谨性、数据的充分性、结论的合理性、表达的清晰度",
}

# ── Score calibration anchors ───────────────────────────────────────────

SCORE_ANCHORS = """
**分数校准锚点**：

| 分数区间 | 等级 | 含义 |
|----------|------|------|
| 0-20 | NOVICE | 几乎未展示该维度能力，或存在严重误解 |
| 21-40 | BEGINNER | 展示了基础理解，但不够深入或存在明显盲区 |
| 41-60 | PRACTITIONER | 具备独立解决问题的能力，但仍有提升空间 |
| 61-80 | ENGINEER | 展示系统化理解和较强的实践能力 |
| 81-100 | ARCHITECT | 展示专家级能力，有创新或系统性贡献 |

**评分注意事项**：
- 60 分是"能独立完成任务"的基准线——提交内容达到任务核心要求即给 60+
- 不要因为"可以更好"就给低分——评分基于实际展示的能力，而非未展示的潜力
- 不要因为"写得很多"就给高分——评分基于质量和深度，而非篇幅
- 同一维度的分数应与该维度直接相关，不应被其他维度的表现影响
"""

# ── Evaluation methodology ──────────────────────────────────────────────

EVALUATION_METHODOLOGY = """
# 评估方法论

## 第一步：通读理解
仔细阅读提交内容，理解学生在做什么、为什么这样做、如何做的。

## 第二步：逐维度评分
按照以下四个维度的定义**独立**评分：

- **Knowledge（知识 — 知道什么）**：评估对概念、术语、理论的掌握程度。
  *核心问题：学生知道什么？概念理解有多深？*

- **Reasoning（推理 — 理解为什么）**：评估分析、推理、论证的质量。
  *核心问题：学生理解为什么这样做吗？论证是否有逻辑？*

- **Application（应用 — 解决问题）**：评估将知识转化为实际解决方案的能力。
  *核心问题：方案是否解决了问题？是否具体可执行？*

- **Creation（创造 — 设计能力）**：评估独立设计、创新、系统性思考的能力。
  *核心问题：学生能否独立创造？是否有超出预期的创新？*

## 第三步：证据锚定
每个维度的评分和理由**必须**引用学生提交内容中的具体证据。
- 好的证据："在你的 Prompt 设计中，通过 Role + Output Format + Few-shot 三层结构约束了输出质量..."
- 差的证据："提交内容展示了较好的 Prompt 设计能力"

## 第四步：发现改进空间
对每个维度，识别 1-2 个**具体的、可操作的**改进方向。不说"继续努力"，而说"建议在以下方面加强：..."。

## 第五步：综合判断
检查四个维度的分数是否内部一致（例如：知识分很高但应用分很低，需要解释原因）。
"""


def build_system_prompt(
    rubric: dict,
    quest_type: str | None = None,
    deliverable_type: str | None = None,
) -> str:
    """Build a comprehensive system prompt with evaluation methodology,
    rubric, quest-type guidance, and calibration anchors.

    Args:
        rubric: Full rubric dict as returned by get_rubric_for_skill().
        quest_type: Optional quest type (KNOWLEDGE, APPLICATION, PROJECT, MASTERY).
        deliverable_type: Optional deliverable type (PROMPT, CODE, etc.).

    Returns:
        A complete system prompt string for the LLM evaluator.
    """
    skill_name = rubric["skill"]
    if skill_name == "__default__":
        skill_name = "通用技能"
    dims = rubric["dimensions"]

    # ── Header: role definition ─────────────────────────────────────
    prompt = f"""你是一位资深的能力评估专家，专注于评估「{skill_name}」领域的实际能力。

# 你的使命

你不是在"批改作业"——你是在**诊断一个学习者的真实能力水平**，并为其提供**具体、可操作的成长建议**。

一个优秀的评估应该让被评估者感到：
1. **被理解**——评分和理由反映了他们实际提交的内容
2. **被尊重**——每个分数都有充分的证据支撑
3. **有方向**——清楚地知道下一步应该在哪些方面提升

{EVALUATION_METHODOLOGY}

---
"""

    # ── Quest-type-specific guidance ────────────────────────────────
    if quest_type and quest_type in QUEST_TYPE_GUIDANCE:
        guidance = QUEST_TYPE_GUIDANCE[quest_type]
        prompt += f"""
# 本次评估的任务类型：{quest_type}

**评估重点**：{guidance['focus']}

**关键评估问题**：
"""
        for q in guidance["key_questions"]:
            prompt += f"- {q}\n"
        prompt += "\n---\n"

    # ── Deliverable-specific guidance ───────────────────────────────
    if deliverable_type and deliverable_type in DELIVERABLE_GUIDANCE:
        prompt += f"""
# 本次提交的产出类型：{deliverable_type}

{DELIVERABLE_GUIDANCE[deliverable_type]}

---
"""

    # ── Rubric ─────────────────────────────────────────────────────
    prompt += """
# 评分标准（Rubric）

"""
    dim_names = {
        "knowledge": "维度一：Knowledge（知识 — 知道什么）",
        "reasoning": "维度二：Reasoning（推理 — 理解为什么）",
        "application": "维度三：Application（应用 — 解决问题）",
        "creation": "维度四：Creation（创造 — 设计能力）",
    }

    for dim_key, dim_title in dim_names.items():
        dim_info = dims[dim_key]
        prompt += f"## {dim_title}\n"
        prompt += f"**维度定义**：{dim_info['description']}\n\n"
        prompt += "**各等级特征**：\n\n"
        for rank in RANK_ORDER:
            criteria = dim_info["ranks"].get(rank, "")
            prompt += f"- **{rank}（{_rank_score_range(rank)} 分）**：{criteria}\n"
        prompt += "\n---\n\n"

    # ── Score calibration ──────────────────────────────────────────
    prompt += SCORE_ANCHORS
    prompt += "\n---\n\n"

    # ── Output format ──────────────────────────────────────────────
    prompt += """# 输出格式

你必须严格按照以下 JSON Schema 输出评估结果：

```json
{
  "knowledge": {
    "score": <0-100 整数>,
    "justification": "<引用提交内容中的具体证据，200-400字，说明评分理由>",
    "strengths": ["<该维度的具体优点1>", "<具体优点2>"],
    "weaknesses": ["<该维度的具体不足1>", "<具体不足2>"],
    "improvement_actions": ["<可操作的具体改进建议1>", "<可操作的具体改进建议2>"]
  },
  "reasoning": {
    "score": <0-100 整数>,
    "justification": "<同上>",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "improvement_actions": ["..."]
  },
  "application": {
    "score": <0-100 整数>,
    "justification": "<同上>",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "improvement_actions": ["..."]
  },
  "creation": {
    "score": <0-100 整数>,
    "justification": "<同上>",
    "strengths": ["..."],
    "weaknesses": ["..."],
    "improvement_actions": ["..."]
  },
  "overall_assessment": {
    "summary": "<100-200字的综合总结，概括整体表现>",
    "top_strength": "<最大的亮点是什么>",
    "top_growth_area": "<最需要提升的维度及原因>",
    "next_step_recommendation": "<给出一个最优先的下一步行动建议>"
  }
}
```

# 输出规范（极其重要）

1. **分数必须是确定的整数**，不能模棱两可（禁止"可能是70"）
2. **justification 必须包含学生提交内容的具体证据**——直接引用原文或用"你提到..."、"在你的方案中..."开头
3. **strengths 和 weaknesses 必须是具体的、有内容的**——每条 15-50 字，不要写"还不错"或"需改进"
4. **improvement_actions 必须是可操作的**——学生看完就知道具体该做什么（不是"多学习"而是"练习为不同场景设计3种以上Prompt模板"）
5. **overall_assessment.summary 应该给出整体判断**——而非重复各维度分数
6. **分数应该反映了真实的能力水平**——不要因为"鼓励"给虚高分数，也不因"严格"给打压分数
7. **每个维度独立评分**——一个维度的分数不受其他维度表现影响
"""
    return prompt


def build_user_message(
    submission_content: str,
    quest_title: str,
    quest_description: str,
    quest_difficulty: str | None = None,
    quest_type: str | None = None,
) -> str:
    """Build the user message containing the submission to evaluate.

    Args:
        submission_content: The student's answer / submission text.
        quest_title: Title of the quest being evaluated.
        quest_description: Description/requirements of the quest.
        quest_difficulty: Optional difficulty level (LEVEL_1 through LEVEL_4).
        quest_type: Optional quest type for context.

    Returns:
        A user message string for the LLM evaluator.
    """
    difficulty_labels = {
        "LEVEL_1": "⭐ 入门",
        "LEVEL_2": "⭐⭐ 基础",
        "LEVEL_3": "⭐⭐⭐ 进阶",
        "LEVEL_4": "⭐⭐⭐⭐ 专家",
    }
    difficulty_note = ""
    if quest_difficulty:
        label = difficulty_labels.get(quest_difficulty, quest_difficulty)
        difficulty_note = f"- **难度**：{label}\n"
        if quest_difficulty == "LEVEL_1":
            difficulty_note += "  *入门级任务，重点评估基础理解和简单应用能力*\n"
        elif quest_difficulty == "LEVEL_4":
            difficulty_note += "  *专家级任务，评估标准应更严格——除基础能力外还需创新性和系统性思维*\n"

    msg = f"""请评估以下学生提交内容。

# Quest 信息
- **标题**：{quest_title}
{difficulty_note}- **任务类型**：{QUEST_TYPE_GUIDANCE.get(quest_type or "", {}).get("focus", "综合评估")}
- **任务要求**：{quest_description or "（无详细描述）"}

# 学生提交内容

{submission_content or "（无文本提交内容）"}

---

请严格按照评估方法论和评分标准，对以上提交进行四维能力评估。**直接输出 JSON，不要输出任何其他内容。**"""
    return msg


def _rank_score_range(rank: str) -> str:
    """Return the score range for a rank label."""
    ranges = {
        "NOVICE": "0-20",
        "BEGINNER": "21-40",
        "PRACTITIONER": "41-60",
        "ENGINEER": "61-80",
        "ARCHITECT": "81-100",
    }
    return ranges.get(rank, "?-?")
