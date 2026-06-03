# Odyssey MVP PRD

Version: v1.0

Status: MVP

Owner: Founder

Target Development Time: 4~8 Weeks

---

# 1. Product Overview

## Product Name

Odyssey

---

## Product Positioning

Odyssey 是一个基于能力图谱（Capability Graph）的 AI 成长操作系统。

不同于传统学习平台记录学习行为。

Odyssey 关注：

用户是否真正掌握能力。

---

## Core Value

帮助用户：

从目标

↓

成长路径

↓

任务挑战

↓

能力验证

↓

能力认证

完成能力成长闭环。

---

# 2. MVP Goal

验证以下核心假设：

用户愿意通过 AI 评估来验证自己的能力成长。

---

MVP 不追求：

* 完整学习平台
* 社区
* 游戏世界
* NPC系统
* 多Agent系统

---

MVP 只验证：

Quest

↓

Assessment

↓

Capability Growth

这条核心链路。

---

# 3. Target User

## Primary User

AI 学习者

---

典型用户：

* AI开发初学者
* Agent开发学习者
* LangChain学习者
* LangGraph学习者
* 独立开发者

---

## User Pain Points

无法判断：

* 是否真正学会
* 当前能力水平
* 下一步学什么
* 如何证明自己的能力

---

# 4. MVP Scope

只保留：

Agent Engineer Path

---

只保留四项能力：

Prompt Engineering

RAG

Workflow Design

LangGraph

---

只保留：

Quest

Assessment

Progress

Credential

---

# 5. User Journey

用户注册

↓

选择 Agent Engineer Path

↓

查看能力树

↓

领取 Quest

↓

完成任务

↓

提交答案

↓

AI评估

↓

能力成长

↓

获得认证

---

# 6. Core Features

## Feature 1

Skill Tree

---

Description

展示能力图谱。

---

Skills

Prompt

RAG

Workflow

LangGraph

---

Display

Skill Name

Current Score

Current Rank

Progress

---

Priority

P0

---

## Feature 2

Quest Center

---

Description

展示任务列表。

---

Functions

查看Quest

领取Quest

提交Quest

查看状态

---

Priority

P0

---

## Feature 3

Quest Submission

---

Description

提交任务成果。

---

Support

Text

Markdown

GitHub URL

Demo URL

---

Priority

P0

---

## Feature 4

AI Assessment

---

Description

AI自动评分。

---

Input

Quest

Submission

Skill

Rubric

---

Output

Knowledge

Reasoning

Application

Creation

Overall Score

Feedback

Suggestions

---

Priority

P0

---

## Feature 5

Capability Progress

---

Description

记录成长变化。

---

Display

Previous Score

Current Score

Growth History

---

Priority

P0

---

## Feature 6

Credential System

---

Description

能力认证。

---

Example

Prompt Practitioner

RAG Practitioner

Workflow Practitioner

LangGraph Practitioner

Agent Engineer

---

Priority

P1

---

## Feature 7

Capability Passport

---

Description

能力档案。

---

Display

Skills

Projects

Credentials

Growth History

---

Priority

P1

---

# 7. Out Of Scope

以下内容绝不开发：

---

Community

---

Guild

---

Marketplace

---

NPC

---

Game World

---

Chat Agent

---

Memory System

---

Multi-Agent

---

Quest Generator

---

Learning Content

---

Course System

---

这些全部属于 V2。

---

# 8. Pages

## Dashboard

功能：

查看成长概览

---

## Skill Tree

功能：

查看能力图谱

---

## Quest Center

功能：

浏览任务

---

## Quest Detail

功能：

查看任务详情

---

## Submission

功能：

提交任务

---

## Assessment Result

功能：

查看评估结果

---

## Passport

功能：

查看能力档案

---

# 9. Assessment Flow

用户提交

↓

QuestSubmission

↓

Assessment Engine

↓

LLM评分

↓

生成Assessment

↓

更新UserSkill

↓

生成ProgressLog

↓

检查Credential

↓

返回结果

---

# 10. Success Metrics

## Metric 1

Quest Completion Rate

目标：

> 50%

---

## Metric 2

Assessment Pass Rate

目标：

> 40%

---

## Metric 3

7 Day Retention

目标：

> 20%

---

## Metric 4

Average Quests Completed

目标：

≥3

---

## Metric 5

Credential Earned

目标：

≥1

---

# 11. Technical Stack

Frontend

Next.js

TypeScript

Tailwind

shadcn/ui

---

Backend

FastAPI

Python

SQLAlchemy

---

Database

PostgreSQL

Supabase

---

LLM

OpenAI

Claude

任选一种

---

Deployment

Vercel

*

Railway

---

# 12. Development Plan

Week 1

数据库

认证

Skill Tree

Quest模块

---

Week 2

Submission模块

Assessment模块

Prompt评估

---

Week 3

Progress模块

Credential模块

Passport模块

---

Week 4

UI优化

Bug修复

部署上线

---

# 13. MVP Release Criteria

满足以下条件即可上线：

---

用户可注册

---

用户可查看Skill Tree

---

用户可领取Quest

---

用户可提交Quest

---

AI可完成评估

---

能力分数可更新

---

认证可解锁

---

Passport可查看

---

达到以上条件：

立即上线。

禁止继续开发新功能。

---

# 14. Future Vision

V2

Memory System

Quest Generator

Personal Mentor Agent

---

V3

World System

NPC

Guild

Community

---

V4

Capability Marketplace

Talent Passport

AI Career Coach

---

# Final Principle

Odyssey MVP 的目标不是构建完美产品。

而是验证：

用户是否愿意通过 AI Quest 和 AI Assessment 来证明自己的能力成长。

如果验证成功：

再扩展世界观、NPC、成长系统。

如果验证失败：

立即调整方向。
