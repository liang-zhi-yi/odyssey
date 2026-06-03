"""
Prompt builder — constructs the evaluation prompt with rubric embedded inline.

The rubric is embedded in every evaluation prompt, not referenced by ID.
"""

RANK_ORDER = ["NOVICE", "BEGINNER", "PRACTITIONER", "ENGINEER", "ARCHITECT"]


def build_system_prompt(rubric: dict) -> str:
    """Build the system prompt with the full rubric embedded inline.

    Args:
        rubric: Full rubric dict as returned by get_rubric_for_skill().

    Returns:
        A complete system prompt string for the LLM evaluator.
    """
    skill_name = rubric["skill"]
    dims = rubric["dimensions"]

    prompt = f"""你是一位专业的 {skill_name} 能力评估专家。

你的任务是根据以下评分标准，对学生的提交内容进行四维能力评估。

# 评分规则

1. 每个维度评 0-100 分
2. 必须给出具体理由（justification），引用提交内容中的证据
3. 评分应基于提交内容本身的质量，而非猜测学生的潜在能力
4. 不同维度的分数可以独立，没有固定比例关系

---

# 评分标准（Rubric）

"""

    # Build per-dimension rubric sections
    dim_names = {
        "knowledge": "Knowledge（知识 — 知道什么）",
        "reasoning": "Reasoning（推理 — 理解为什么）",
        "application": "Application（应用 — 解决问题）",
        "creation": "Creation（创造 — 设计能力）",
    }

    for dim_key, dim_title in dim_names.items():
        dim_info = dims[dim_key]
        prompt += f"## {dim_title}\n"
        prompt += f"**评估维度说明**：{dim_info['description']}\n\n"

        prompt += "**各等级特征**：\n\n"
        for rank in RANK_ORDER:
            criteria = dim_info["ranks"].get(rank, "")
            prompt += f"- **{rank}（{_rank_score_range(rank)}）**：{criteria}\n"

        prompt += "\n---\n\n"

    prompt += """# 输出格式

你必须严格按照以下 JSON Schema 输出评估结果：

```json
{
  "knowledge": {
    "score": <0-100 整数>,
    "justification": "<引用提交内容的具体证据，说明为什么给这个分数>"
  },
  "reasoning": {
    "score": <0-100 整数>,
    "justification": "<引用提交内容的具体证据，说明为什么给这个分数>"
  },
  "application": {
    "score": <0-100 整数>,
    "justification": "<引用提交内容的具体证据，说明为什么给这个分数>"
  },
  "creation": {
    "score": <0-100 整数>,
    "justification": "<引用提交内容的具体证据，说明为什么给这个分数>"
  }
}
```

# 重要提醒

- 不要给出模棱两可的分数（如"可能是70"）——必须是确定的整数
- justification 必须包含提交内容中的具体证据
- 不要猜测学生未展示的能力
- 一个维度的分数只基于该维度对应的能力表现
"""
    return prompt


def build_user_message(submission_content: str, quest_title: str, quest_description: str) -> str:
    """Build the user message containing the submission to evaluate.

    Args:
        submission_content: The student's answer / submission text.
        quest_title: Title of the quest being evaluated.
        quest_description: Description/requirements of the quest.

    Returns:
        A user message string for the LLM evaluator.
    """
    return f"""请评估以下提交内容。

# Quest 信息
- **标题**：{quest_title}
- **要求**：{quest_description}

# 学生提交内容

{submission_content or "（无文本提交内容）"}

---

请根据评分标准，对以上提交进行四维能力评估。直接输出 JSON，不要输出其他内容。"""


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
