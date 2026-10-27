# RizzWord

**Frontier AI models race to solve a daily brainrot crossword.** You watch them stream their reasoning, fill the grid, and burn tokens side by side, then see who knew what *"let him cook"* means.

[rizzword.vercel.app](https://rizzword.vercel.app) · Next.js 16 · AI SDK 7 · Vercel AI Gateway

![RizzWord: AI models racing a crossword](https://rizzword.vercel.app/opengraph-image)

---

## Why

Leaderboards like [LMArena](https://lmarena.ai) and [Kaggle Game Arena](https://www.kaggle.com/game-arena) showed that evals are more convincing when you can *watch* them. RizzWord is a small spectator eval built around that idea:

- **One task everyone gets:** a 14-clue crossword of internet slang. A human can judge it at a glance.
- **Visible process:** each model's reasoning streams next to its grid, so you see *how* it got (or missed) `SKIBIDI`.
- **Real tradeoffs:** time, accuracy, tokens and dollars for every model, on the same prompt.
- **Free to watch:** races are recorded as event logs and committed to the repo. Visitors replay them with **zero API calls**. Live races exist, but sit behind keys and hard cost caps.

## Features

| | |
|---|---|
| **Daily puzzle** | Generated from a curated word bank, seeded by date, validated before it's committed. |
| **Race replay** | Lanes for every model with letters popping into the grid, reasoning ticker, live standings, play/pause/scrub/2×–8×. Works with no keys. |
| **Live race** | Pick up to 4 models; one streaming call each through AI Gateway, rendered as it arrives. Save the transcript to turn it into a replay. |
| **Per-model stats** | Solved entries, letter accuracy, finish time, time to first answer, cost (from the gateway when reported, else list price), tokens in/out/reasoning, revisions. |
| **Call it** | Predict the winner before the flag drops. Picks are stored locally and, with Redis, tallied into a crowd split. Share card at the end. |
| **Play mode** | Solve the puzzle yourself (fully keyboard-driven) and see where you'd have placed against the models. |
| **History** | Every day's result plus a season table at [`/history`](https://rizzword.vercel.app/history), and as JSON at [`/api/history`](https://rizzword.vercel.app/api/history). |
| **OG images** | Generated per race with the day's grid and standings. |

> **Honesty note.** Until real races are recorded, the committed transcripts are **simulated**: synthetic events in which every model gets the same odds. They're labelled *Simulated* everywhere they appear (UI, OG image, JSON feed), and they make no claim about real model quality. Replace them with `pnpm race:record`.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3600: replays, history and play mode work with no env
```

Node 22+ and pnpm 10.

## Recording real races

```bash
cp .env.example .env.local      # set AI_GATEWAY_API_KEY
pnpm race:record --dry-run      # prints the exact prompt + worst-case cost, no calls
pnpm race:record                # races the daily lineup on the latest puzzle
git add data/races && git commit -m "Record race for $(date +%F)"
```

`race:record` runs the **same engine** as the live API, prints answers as they land, and writes `data/races/<date>.json` with `source: "live"`. It refuses to start if the worst case exceeds `--max-usd` (default $1). For the daily lineup (five flagships plus DeepSeek Flash) the worst case is about **$0.18**, and a typical race should cost a fraction of that. Flags: `--date YYYY-MM-DD`, `--models id,id`, `--max-usd`.

New day? `pnpm puzzles:generate` fills in any missing dates up to today, then record.

## Live racing and its guards

Live racing is **off by default** and **fails closed**. `POST /api/race` checks, in order:

1. `LIVE_RACES_ENABLED=true` and gateway credentials (`AI_GATEWAY_API_KEY`, or Vercel OIDC when deployed)
2. In production, an abuse guard must exist: Redis **or** `LIVE_RACE_ACCESS_CODE`. Without one, live racing stays off.
3. Same-origin request, zod-validated body, access code (constant-time compare)
4. Models must be in the roster allowlist (max 4). Arbitrary model ids are never accepted.
5. **Per-race cost ceiling:** worst case (full prompt in, every model maxing `maxOutputTokens`) must be ≤ `LIVE_RACE_MAX_USD` (default $0.25)
6. With Redis: **per-IP** rate limit (3/hour), **global daily race cap** (40), and a **global daily budget** ($5). The worst case is *reserved* before the race and settled to the real cost after, so concurrent races can't overshoot.
7. Each model call has a token cap, a 75s timeout and `reasoning: "low"`. If the viewer closes the tab, the stream is cancelled and every in-flight call is aborted.

Belt and braces: give the gateway key its own [AI Gateway budget](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets) too.

## How it works

```
             ┌──────────── data/puzzles/<date>.json ◄── pnpm puzzles:generate (seeded, validated)
             │
 lib/race/engine.ts ── streamText × N models ──► AI Gateway ──► OpenAI · Anthropic · Google · SpaceXAI · Moonshot · DeepSeek …
             │   (one call per model, in parallel)
             │   text-delta  → AnswerStreamParser → "fill" events   ("4D: SIGMA")
             │   reasoning-delta → throttled "think" events
             │   finish → usage + gateway cost → "done" event
             ▼
     RaceEvent[]  ─────────────┬──► /api/race streams them as NDJSON (live)
                               └──► data/races/<date>.json (replay, committed)
                                         │
                       deriveRace(puzzle, events, t) ──► lanes, standings, stats
                       (pure fold, so live and replay share every component)
```

- **Prompt** (`lib/race/prompt.ts`): the grid as ASCII, every clue with its length and exact crossings (`letter 2 = 4D letter 1`), and a strict output contract of one `ID: ANSWER` line per answer, easiest first, revisions allowed. Versioned (`promptVersion`) and stored in each transcript.
- **Parsing:** tolerant of markdown and formatting noise (`**12D:** no cap` → `NOCAP`). Only complete lines commit, and the last answer for an entry wins.
- **Scoring:** most correct entries, then correct letters, then finish time, then cost.
- **Event log:** `start` · `think` · `fill` · `done` (usage, cost, cost source) · `error`. A transcript is ~35 KB.

### Puzzle generation and validation

`lib/puzzle/generate.ts` is a seeded greedy freeform constructor. It places a long seed word, then repeatedly crosses new words through existing letters. Placements that would touch other words side-on or extend them are rejected, and it prefers more crossings and squarer grids. It keeps the best of 60 attempts.

`lib/puzzle/validate.ts` (run in CI by `pnpm puzzles:validate`) rejects any puzzle where:
- crossing letters disagree, or two entries overlap in the same direction
- any run of 2+ letters isn't a clued entry (no accidental words)
- an entry crosses nothing, or the grid isn't connected
- numbering isn't standard row-major crossword numbering
- a clue is empty, longer than 120 chars, **contains its own answer**, or an answer repeats

It also lints the word bank and checks every transcript references real entries and models.

## Models

Gateway IDs and list prices come from the public catalog at `https://ai-gateway.vercel.sh/v1/models` (snapshot 2026-10-27). They live in [`lib/models.ts`](lib/models.ts). Add a line there and the UI, the allowlist and the recorder all pick it up.

| Heavyweights | Gateway ID | $/M in · out |
|---|---|---|
| GPT-6.1 Sol | `openai/gpt-6.1-sol` | 2 · 10 |
| Claude Opus 5.5 | `anthropic/claude-opus-5.5` | 4 · 20 |
| Gemini 4 Argon | `google/gemini-4-argon` | 2 · 10 |
| Grok 4.7 | `spacexai/grok-4.7` | 2 · 6 |
| Kimi K3.1 Pro | `moonshotai/kimi-k3.1-pro` | 2 · 10 |
| Claude Sonnet 5.5 | `anthropic/claude-sonnet-5.5` | 2 · 10 |
| Muse Spark 1.3 | `meta/muse-spark-1.3` | 1.25 · 4.25 |

| Speedrunners | Gateway ID | $/M in · out |
|---|---|---|
| DeepSeek V4.1 Flash | `deepseek/deepseek-v4.1-flash` | 0.075 · 0.30 |
| GPT-6 Luna | `openai/gpt-6-luna` | 0.10 · 0.50 |
| Claude Haiku 5.5 | `anthropic/claude-haiku-5.5` | 0.10 · 0.50 |
| Gemini 3.8 Flash | `google/gemini-3.8-flash` | 0.75 · 3.75 |
| GLM 5.3 Flash | `zai/glm-5.3-flash` | 0.15 · 0.50 |
| Qwen 3.7 Flash | `alibaba/qwen3.7-flash` | 0.03 · 0.13 |

The **daily lineup** is fixed (`DAILY_LINEUP`), so the history stays comparable from day to day.

## Scripts

| Command | |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js on port 3600 |
| `pnpm check` | typecheck + lint + unit tests + puzzle/transcript validation (what CI runs) |
| `pnpm puzzles:generate` | generate missing daily puzzles (`--date`, `--from/--to`, `--force`) |
| `pnpm puzzles:validate` | validate every puzzle, clue and transcript |
| `pnpm race:record` | record a real race via AI Gateway (costs money) |
| `pnpm race:simulate` | write simulated transcripts for days without one (never overwrites real ones) |

## Deploying to Vercel

Import the repo. That's it for replay mode: no env vars needed, and every page except `/live` is statically generated.

To enable live racing in production, set `LIVE_RACES_ENABLED=true`, add an Upstash Redis integration (or set `LIVE_RACE_ACCESS_CODE`), and optionally set a budget on the project in AI Gateway. Deployments authenticate to the gateway via OIDC, so you don't need a key. See [`.env.example`](.env.example) for every knob.

## Accessibility

- Play mode is fully keyboard-operable: type to fill, arrows move, Space flips direction, Tab/Shift+Tab jump clues, Backspace erases. A single real input follows the cursor, so mobile keyboards and screen readers work. Its label always reads the current clue, length and cell.
- Replays: Space plays and pauses, ←/→ seek, the scrubber is labelled, and a polite live region announces lead changes and finishes (not every letter).
- `prefers-reduced-motion` disables the countdown, the ticker and letter pops. Colour is never the only signal: answers also get ✓/✗ and wrong letters are struck through.

## Project structure

```
app/                 routes: / · /race/[date] · /play/[date] · /history · /live · /api/{race,vote,history}
components/          RaceBoard, LaneCard, MiniGrid, ReplayPlayer, LiveRace, PlayBoard, …
lib/puzzle/          types, grid helpers, generator, validator (+ tests)
lib/race/            engine (AI SDK), prompt, stream parser, state fold, guards, simulator (+ tests)
lib/data/            static manifest of committed puzzles/races (auto-generated)
data/                wordbank.ts · puzzles/*.json · races/*.json
scripts/             generate · validate · record · simulate
```

## Roadmap

- Scheduled daily recording (GitHub Action with a budget-capped gateway key)
- Per-clue difficulty from aggregate model misses; "hardest clue of the week"
- Head-to-head Elo across days once there's enough real data

---

Built by [Aaron Loh](https://github.com/aaronloh16). Originally a Vercel AI Gateway hackathon entry, rebuilt in October 2026. No skibidi toilets were harmed.
