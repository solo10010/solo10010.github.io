---
title: "Cutting AI agent costs: a full scan for $1 instead of a $200 subscription"
description: "Practical principles for saving money on AI agents from building Qyran: code handles the routine, the model is chosen per task, agents get prepared data instead of raw logs, and every autonomous session has a budget."
lead: "Agents can easily eat hundreds of dollars a month. The principles that brought a full Qyran scan down to about a dollar: code instead of tokens, the right model for the task, short context and a hard budget."
date: 2026-11-02T21:30:00+05:00
lastmod: 2026-11-03T12:00:00+05:00
draft: false
weight: 40
images: []
contributors: ["Anton S."]
url: "/en/blog/ai-agent-costs/"
---

When I started building AI agents into my bug bounty platform [Qyran](/en/blog/qyran/), the first shock wasn't the models' intelligence but the bills. An agent told to "just check the site" happily reads megabytes of logs, reruns the same commands ten times and drags the entire conversation history into every request. Subscriptions to top models cost around $200 a month, and pay-as-you-go API usage without control burns money even faster.

In the end a full target scan in Qyran costs **about one dollar**. Here are the principles that got it there.

![Cost pyramid: free code at the bottom, cheap models above, strong models higher, a human at the top](pyramid.svg)

## 1. Whatever can be done with code, do with code

The core principle. Subdomain recon, liveness checks, technology fingerprinting, port scanning, deduplication, comparison with the previous run — these are deterministic tasks. Plain code and tools do them **for free and the same way every time**.

An agent shouldn't "run subfinder and read the output". It should receive **an already collected and cleaned asset table** and decide where to dig. Every operation you move from the model to code saves tokens and makes the result reproducible.

## 2. The model fits the task, not one model for everything

Agent tasks vary a lot:

| Task | What it needs from the model | Which to use |
|---|---|---|
| classification, sorting, field extraction | discipline, format | cheap and fast |
| analyzing a finding, writing a check template | understanding code and protocols | mid-tier, strong at code |
| business logic, attack chains, complex analysis | reasoning | strong |
| private data, unhurried routine | confidentiality | local |

Qyran's AI layer is built on opencode, which lets you connect different providers and **assign different models to different agents**. The orchestrator and the skeptical verifier get a stronger model; routine agents get a cheap one. In my measurements one of the DeepSeek models gave the best price/quality for the main work; prices and rankings change every couple of months, so the choice is worth revisiting.

## 3. Short context is the biggest saving

Most of the money goes not to answers but to **input tokens**: system prompts, conversation history, tool output.

- **Don't feed raw output.** Instead of 50,000 log lines — an aggregate: "top 20 endpoints returning 500". Code does the preparation.
- **Skills load on demand.** Qyran has 120+ playbooks, but an agent doesn't keep them all in context — it loads only the one the task needs.
- **New task, new session.** A long conversation drags its whole history along. Save the session outcome as a short note and start fresh.
- **Use prompt caching** from your provider: a repeated prefix (instructions, skills) costs noticeably less.

## 4. Autonomous work needs a budget

An autonomous agent without limits is an open wallet. In Qyran autonomous work runs in **shifts**:

- a shift has a **deadline and a cost limit**; hitting either one stops it and triggers a handover;
- cost is synced as the work goes, not counted after the fact;
- a **watchdog** catches looping and stuck agents;
- a **coverage log** shows what has already been checked, so the agent doesn't repeat the same checks.

Even without your own platform the principle is easy to apply: spending limits in the provider console, separate API keys for different tasks and a daily look at the spend.

## 5. Don't wake the agent for nothing

Periodic "pings", health checks and heartbeat requests to an expensive model quietly eat money every day. That kind of thing belongs to code or the cheapest model; the expensive one should only join when there is real work.

## 6. Measure the cost per unit of work

"How much does one scan cost", "how much does triaging one finding cost" — you need to know these numbers. Without them you can't tell whether an optimization helped. Once I started tracking the cost per scan, it became obvious which agents and stages spent the most — and that's where I directed the optimization.

## Summary

| Before | After |
|---|---|
| the agent runs tools itself and reads their output | code collects and cleans data, the agent analyzes |
| one expensive model for everything | the model fits the task, a local one for private data |
| the whole history in every request | short sessions, on-demand skills, caching |
| "let it run until it finds something" | shifts with a deadline and a budget |

AI is a powerful component, but not the only one. The more routine code takes over, the cheaper and more reliable the agents become.
