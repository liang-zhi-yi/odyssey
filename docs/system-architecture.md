# Odyssey System Architecture V1

## Architecture Overview

Odyssey 是一个基于能力图谱的 AI 成长操作系统。

系统由：

Frontend

↓

Backend API

↓

Database

↓

Assessment Engine

↓

LLM Service

组成。

---

# High Level Architecture

User

↓

Frontend (Next.js)

↓

Backend API (FastAPI)

↓

PostgreSQL

↓

Assessment Engine

↓

LLM Provider

(OpenAI / Claude)

---

# Core Philosophy

系统核心不是聊天。

系统核心是：

Capability Progression

能力成长推进。

因此：

所有功能最终都会作用于：

UserSkill

表。

---

# Frontend Layer

## Technology

Next.js

TypeScript

TailwindCSS

shadcn/ui

---

## Main Pages

### Dashboard

用户首页

展示：

* 当前Path
* 当前Skill
* 最近成长记录
* 今日Quest

---

### Skill Tree

能力图谱页面

展示：

Prompt

RAG

Workflow

LangGraph

及当前等级。

---

### Quest Center

任务中心

展示：

可接受Quest

已完成Quest

进行中Quest

---

### Quest Detail

任务详情页

展示：

任务描述

提交要求

能力要求

---

### Submission Page

提交答案

支持：

文本

Markdown

GitHub链接

Demo链接

---

### Assessment Page

AI评估结果

展示：

Knowledge

Reasoning

Application

Creation

评分

---

### Passport Page

能力护照

展示：

技能等级

认证

项目

成长记录

---

# Backend Layer

## Technology

FastAPI

Python

SQLAlchemy

Alembic

PostgreSQL

---

# Module Structure

app/

├── users/

├── skills/

├── paths/

├── quests/

├── submissions/

├── assessments/

├── credentials/

├── projects/

└── passport/

---

# User Module

负责：

用户管理

用户认证

用户资料

---

# Skill Module

负责：

能力定义

能力查询

能力成长

---

# Path Module

负责：

成长路径

路径解锁

路径进度

---

# Quest Module

负责：

Quest管理

Quest查询

Quest推荐

---

# Submission Module

负责：

接收用户提交

保存答案

触发评估

---

# Assessment Module

负责：

调用AI

生成评分

更新能力

---

# Credential Module

负责：

认证发放

认证查询

---

# Passport Module

负责：

生成能力护照

---

# Database Layer

PostgreSQL

核心表：

User

Skill

UserSkill

Quest

QuestSubmission

Assessment

ProgressLog

Credential

Project

---

# LLM Layer

## Purpose

AI不是聊天机器人。

AI负责：

评估能力

生成反馈

推荐成长路径

---

# Assessment Engine

系统核心。

---

Input

Quest

*

Submission

*

Skill

↓

Assessment Engine

↓

LLM

↓

Score

↓

Update UserSkill

---

# Assessment Flow

用户提交

↓

QuestSubmission

↓

Assessment Engine

↓

构造评估Prompt

↓

调用LLM

↓

生成评分

↓

保存Assessment

↓

更新UserSkill

↓

生成ProgressLog

↓

检查Credential

↓

返回结果

---

# Assessment Prompt

输入：

Skill

Quest

Submission

Rubric

---

输出：

Knowledge

Reasoning

Application

Creation

Feedback

Suggestions

---

Example

Prompt Skill

↓

Prompt Quest 03

↓

用户提交Prompt

↓

AI评分

↓

Knowledge = 80

Reasoning = 70

Application = 75

Creation = 50

↓

Overall = 69

---

# Capability Update Engine

Purpose

更新能力状态

---

Rule

新能力值

=

旧能力值 × 0.8

*

本次Assessment × 0.2

---

Example

Prompt

旧值

60

本次

80

↓

新值

64

---

避免能力波动过大。

---

# Credential Engine

每次Assessment后触发。

---

检查：

Prompt ≥ 60

↓

Prompt Practitioner

---

RAG ≥ 60

↓

RAG Practitioner

---

所有核心能力 ≥ 60

↓

Agent Engineer

---

自动发放认证。

---

# Passport Generator

动态生成。

不单独存储。

来源：

UserSkill

Credential

Project

ProgressLog

---

输出：

Capability Passport

---

# MVP Scope

仅保留：

Prompt

RAG

Workflow

LangGraph

---

仅保留：

Quest

Submission

Assessment

Progress

Credential

---

不包含：

NPC

世界地图

多人系统

社区

交易市场

Memory Agent

Multi-Agent

---

# Deployment

Frontend

Vercel

---

Backend

Railway

Render

Fly.io

---

Database

Supabase PostgreSQL

---

LLM

OpenAI

Claude

任选其一

---

# Future Architecture (V2)

Quest Generator Agent

Path Recommendation Agent

Capability Analyst Agent

Mentor Agent

World Simulation Engine

Memory System

Community Layer

暂不开发。
