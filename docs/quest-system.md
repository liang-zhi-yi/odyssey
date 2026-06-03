# Odyssey Quest System V1

## Overview

Quest（任务）是 Odyssey 中连接能力成长与能力验证的核心机制。

Quest 不是题目。

Quest 不是课程作业。

Quest 是用户证明自己掌握某项能力的挑战任务。

用户通过完成 Quest：

* 训练能力
* 展示能力
* 证明能力
* 获得成长

Quest 是 Odyssey 核心循环的重要组成部分。

---

# Core Philosophy

传统学习产品：

学习

↓

打卡

↓

记录时长

↓

获得积分

---

Odyssey：

Skill

↓

Quest

↓

Submission

↓

Assessment

↓

Progress

↓

Credential

---

Odyssey 不奖励学习行为。

Odyssey 奖励能力证明。

---

# Quest Definition

Quest 是一个与特定 Skill 绑定的能力挑战。

每个 Quest 必须满足：

* 对应一个核心 Skill
* 对应一个能力维度
* 存在明确提交物
* 可以被评估
* 可以影响能力成长

---

# Quest Structure

每个 Quest 包含：

Title

任务名称

---

Description

任务背景描述

---

Skill

对应能力

例如：

Prompt

RAG

Workflow

LangGraph

---

Difficulty

难度等级

---

Quest Type

任务类型

---

Deliverable

提交物要求

---

Assessment Mapping

评分映射规则

---

# Quest Types

Quest 分为四种类型。

---

## Knowledge Quest

目标：

验证概念掌握程度。

评估维度：

Knowledge

---

示例：

解释：

* Embedding
* Chunk
* Retrieval

之间的关系。

---

预期提交：

文本回答

---

## Reasoning Quest

目标：

验证原理理解能力。

评估维度：

Reasoning

---

示例：

为什么 Chunk Size 会影响 RAG 检索效果？

---

预期提交：

分析报告

---

## Application Quest

目标：

验证实际解决问题能力。

评估维度：

Application

---

示例：

设计学校知识库问答系统。

---

预期提交：

方案设计

代码

流程图

---

## Creation Quest

目标：

验证创造能力。

评估维度：

Creation

---

示例：

设计企业级 RAG 平台。

---

预期提交：

完整项目方案

或项目实现

---

# Quest Difficulty

Quest 分为四个等级。

---

## Level 1

Foundation

基础任务

预计时间：

10~30分钟

---

目标：

掌握概念

---

示例：

解释 Prompt Engineering。

---

## Level 2

Practice

实践任务

预计时间：

30~90分钟

---

目标：

应用知识

---

示例：

设计用户反馈分类 Prompt。

---

## Level 3

Project

项目任务

预计时间：

1~3天

---

目标：

解决真实问题

---

示例：

设计学校知识库系统。

---

## Level 4

Trial

试炼任务

预计时间：

3~7天

---

目标：

完成阶段认证

---

示例：

Prompt Practitioner Trial

---

# Quest Lifecycle

Quest 生命周期：

AVAILABLE

↓

ACCEPTED

↓

IN_PROGRESS

↓

SUBMITTED

↓

ASSESSING

↓

ASSESSED

↓

PASSED

或

FAILED

---

## AVAILABLE

任务可接受

---

## ACCEPTED

用户已领取

---

## IN_PROGRESS

正在执行

---

## SUBMITTED

已提交答案

---

## ASSESSING

AI正在评估

---

## ASSESSED

评估完成

---

## PASSED

通过

---

## FAILED

未通过

---

# Quest Deliverables

Quest 必须有提交物。

---

支持类型：

TEXT

Markdown

GitHub Repository

Architecture Design

Workflow Diagram

Project Demo

Video

Document

---

示例：

Prompt Quest

↓

Prompt文本

---

RAG Quest

↓

架构设计

GitHub代码

---

LangGraph Quest

↓

完整项目

---

# Quest Assessment Mapping

每个 Quest 必须定义评分映射。

---

示例：

Prompt Quest

---

Knowledge

20%

---

Reasoning

20%

---

Application

50%

---

Creation

10%

---

Assessment Engine 根据映射进行评分。

---

# Quest Rewards

Odyssey 不采用：

* 金币
* 经验值
* 等级经验

---

Quest 奖励：

Skill Growth

Credential Progress

Project Evidence

---

示例：

Prompt Quest 03

通过

↓

Knowledge +2

Reasoning +3

Application +5

---

最终更新：

UserSkill

---

# Skill Impact

Quest 完成后影响：

UserSkill

---

示例：

Prompt

当前：

Knowledge = 60

Reasoning = 55

Application = 50

---

Quest通过后：

Knowledge = 63

Reasoning = 59

Application = 58

---

整体能力成长。

---

# Milestone Trial

每个阶段必须存在试炼。

---

Purpose

验证能力达到下一等级。

---

Example

Prompt Practitioner Trial

---

要求：

设计用户反馈自动分析系统。

---

通过后：

Prompt Practitioner

认证解锁。

---

# Retry Mechanism

未通过任务允许重新挑战。

---

FAILED

↓

Feedback

↓

Improve

↓

Resubmit

---

成长来自迭代。

---

# Quest Recommendation Engine

系统根据：

UserSkill

Assessment History

Path Progress

自动推荐 Quest。

---

示例：

Prompt

Knowledge = 80

Reasoning = 75

Application = 40

---

系统判断：

应用能力不足。

---

推荐：

Prompt Application Quest。

---

# Adaptive Quest Generation (Future)

V2规划。

---

Quest Generator Agent

根据用户能力自动生成任务。

---

输入：

UserSkill

Weakness

Goal

---

输出：

定制 Quest

---

示例：

用户：

Prompt Score = 55

Application = 30

---

系统自动生成：

设计客服分类 Prompt。

---

# Quest Completion Criteria

Quest 不以提交为完成。

Quest 以通过 Assessment 为完成。

---

错误：

提交答案

=

完成任务

---

正确：

提交答案

↓

通过 Assessment

↓

Quest Completed

---

# Quest Design Principles

原则一

真实世界优先

---

原则二

能力验证优先

---

原则三

项目优先于概念题

---

原则四

成长可证明

---

原则五

允许失败和重试

---

原则六

每个 Quest 必须对应能力成长

---

# Quest System Summary

Quest 是 Odyssey 的核心成长载体。

Quest 负责：

训练能力

↓

验证能力

↓

更新能力

↓

解锁认证

↓

推动成长路径前进

Quest 不记录学习。

Quest 证明成长。
