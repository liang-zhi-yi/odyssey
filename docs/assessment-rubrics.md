# Odyssey Assessment Rubrics V1

Version: 1.0

Status: MVP

---

# Overview

Assessment 是 Odyssey 的核心引擎。

Odyssey 不评估：

* 学习时长
* 打卡次数
* 视频观看进度

Odyssey 只评估：

用户是否真正掌握能力。

---

# Assessment Philosophy

传统学习平台：

学习

↓

完成课程

↓

获得证书

---

Odyssey：

Quest

↓

Submission

↓

Assessment

↓

Capability Growth

↓

Credential

---

能力成长必须建立在能力证明之上。

---

# Assessment Goals

Assessment Engine 的目标不是绝对准确。

第一阶段目标：

稳定、一致、可解释。

---

系统需要回答：

用户知道什么？

用户理解什么？

用户会做什么？

用户能创造什么？

---

# Universal Capability Framework

所有 Skill 统一采用四维能力模型。

---

## Knowledge

知识掌握

评估：

是否知道核心概念。

---

关注：

定义

术语

组成部分

概念关系

---

## Reasoning

原理理解

评估：

是否理解为什么。

---

关注：

原因

逻辑

权衡

取舍

系统思维

---

## Application

实践能力

评估：

是否能够独立完成任务。

---

关注：

设计

实现

调试

优化

落地

---

## Creation

创造能力

评估：

是否能够提出新的方案。

---

关注：

创新

扩展

架构设计

方法论总结

---

# Score Definition

所有维度：

0~100

---

# Universal Score Bands

## 0-20

No Understanding

无法解释概念。

无法完成任务。

---

## 21-40

Basic Awareness

知道术语。

理解有限。

无法独立完成任务。

---

## 41-60

Functional Understanding

理解核心原理。

能够在指导下完成任务。

---

## 61-80

Independent Practitioner

能够独立解决问题。

能够完成项目。

---

## 81-100

Advanced Mastery

能够优化方案。

能够指导他人。

能够提出创新设计。

---

# Mastery Levels

Assessment 最终会映射为 Mastery Level。

---

## Novice

0-20

---

特征：

刚接触领域。

---

## Beginner

21-40

---

特征：

理解基础概念。

---

## Practitioner

41-60

---

特征：

能够完成任务。

---

## Engineer

61-80

---

特征：

能够独立解决复杂问题。

---

## Architect

81-100

---

特征：

能够设计系统。

能够建立方法论。

---

# Prompt Engineering Rubric

---

## Knowledge

检查：

* Prompt是什么
* Role Prompt
* Few-shot
* CoT
* Structured Output

---

评分标准：

20

知道术语

---

40

知道用途

---

60

理解差异

---

80

能够解释最佳实践

---

100

能够总结设计原则

---

## Reasoning

检查：

* 为什么需要Few-shot
* 为什么CoT有效
* 为什么结构化输出稳定

---

评分重点：

逻辑完整性

因果关系

解释深度

---

## Application

检查：

是否能够：

* 编写Prompt
* 调试Prompt
* 优化Prompt

---

项目示例：

客服分类Prompt

会议纪要Prompt

数据提取Prompt

---

## Creation

检查：

是否能够：

* 设计Prompt框架
* 总结Prompt模式
* 提出优化策略

---

# RAG Rubric

---

## Knowledge

检查：

* Chunk
* Embedding
* Vector Database
* Retrieval
* Re-ranking

---

## Reasoning

检查：

* Chunk为什么影响召回
* Embedding为什么影响结果
* Rerank为什么必要

---

## Application

检查：

是否能够：

* 构建完整RAG系统
* 调试检索问题
* 优化召回率

---

项目示例：

学校知识库

企业文档问答

法律问答系统

---

## Creation

检查：

是否能够：

* 设计检索策略
* 设计Chunk策略
* 提出优化方案

---

# Workflow Design Rubric

---

## Knowledge

检查：

* Workflow
* Task Decomposition
* State Flow

---

## Reasoning

检查：

为什么拆分任务。

为什么设计多个步骤。

---

## Application

检查：

是否能够设计：

Research

↓

Outline

↓

Write

↓

Review

完整工作流。

---

## Creation

检查：

是否能够：

设计复杂流程。

优化现有流程。

---

# LangGraph Rubric

---

## Knowledge

检查：

* Node
* Edge
* State
* Conditional Routing

---

## Reasoning

检查：

为什么需要状态管理。

为什么需要条件路由。

---

## Application

检查：

是否能够：

实现LangGraph Agent。

---

项目示例：

Research Agent

Travel Agent

Code Review Agent

---

## Creation

检查：

是否能够：

设计复杂Agent图。

设计长期运行Agent。

---

# Submission Evaluation Rules

Assessment Engine 必须优先评估：

---

真实性

---

完整性

---

逻辑性

---

可执行性

---

创新性

---

禁止仅依据篇幅评分。

---

禁止仅依据代码长度评分。

---

禁止仅依据关键词数量评分。

---

# Project Evaluation Rubric

项目任务额外评估：

---

Problem Definition

问题定义是否清晰。

---

Solution Design

方案是否合理。

---

Implementation

是否实现核心功能。

---

Testing

是否进行验证。

---

Reflection

是否总结经验。

---

# Assessment Output Format

Assessment Engine 必须输出：

{
"knowledge": 75,
"reasoning": 68,
"application": 82,
"creation": 55,

"overall": 70,

"mastery_level": "Engineer",

"strengths": [
"...",
"..."
],

"weaknesses": [
"...",
"..."
],

"feedback": "...",

"suggestions": [
"...",
"..."
]
}

---

# Overall Score Formula

overall_score

=

knowledge × 0.2

+

reasoning × 0.25

+

application × 0.35

+

creation × 0.2

---

Application 权重最高 (0.35)。

因为：

知道概念不等于会用。
Odyssey 重视实践能力。
Reasoning 次之 (0.25)。

---

# Credential Thresholds

Credential requires multi-dimension threshold.
ALL four dimensions of the skill must each >= 60.

---

Prompt Practitioner:

  Prompt Knowledge    >= 60
  AND Prompt Reasoning    >= 60
  AND Prompt Application  >= 60
  AND Prompt Creation     >= 60

---

RAG Practitioner:

  RAG Knowledge    >= 60
  AND RAG Reasoning    >= 60
  AND RAG Application  >= 60
  AND RAG Creation     >= 60

---

Workflow Practitioner:

  Workflow Knowledge    >= 60
  AND Workflow Reasoning    >= 60
  AND Workflow Application  >= 60
  AND Workflow Creation     >= 60

---

LangGraph Practitioner:

  LangGraph Knowledge    >= 60
  AND LangGraph Reasoning    >= 60
  AND LangGraph Application  >= 60
  AND LangGraph Creation     >= 60

---

Agent Engineer:

  ALL four core skills (Prompt, RAG, Workflow, LangGraph)
  must each meet the multi-dimension threshold above.
  i.e., every dimension of every skill >= 60.

---

# Assessment Engine Prompting Principles

LLM 必须：

* 给出评分理由
* 给出具体反馈
* 给出改进建议

---

LLM 不允许：

* 空泛夸奖
* 无依据打分
* 只给最终分数

---

每一个评分必须可解释。

---

# MVP Limitation

MVP 不追求：

绝对准确评分。

---

MVP 追求：

同水平用户获得相近评分。

---

Consistency

> Accuracy

---

# Future Enhancements

V2

Peer Review

专家评审

---

V3

Code Sandbox Evaluation

自动运行代码

自动测试项目

---

V4

Multi-Agent Assessment

多智能体交叉评审

---

# Final Principle

Assessment 的目标不是判断用户是否优秀。

Assessment 的目标是：

帮助用户理解自己当前处于成长路径的哪个阶段。

并指出下一步应该提升什么能力。
