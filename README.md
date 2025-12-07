# 🎯 RizzWord

> **Vercel AI Gateway Hackathon Submission** - Model Eval Game Category

Which AI has the most rizz? A real-time model evaluation game where GPT-4o, Claude, Gemini, and Grok race to solve a Gen Z slang crossword. Watch them battle head-to-head to prove who truly understands internet culture!

![RizzWord](https://img.shields.io/badge/Vercel-AI%20Gateway-purple)
![Category](https://img.shields.io/badge/Category-Model%20Eval%20Game-cyan)
![AI SDK](https://img.shields.io/badge/AI%20SDK-v5-green)

<img width="1213" height="751" alt="Screenshot 2025-12-07 at 6 14 24 AM" src="https://github.com/user-attachments/assets/fd514f22-4364-4585-8981-9e858230ea29" />


## 🎮 What is this?

**RizzWord** is a Model Eval Game that tests how well different AI models understand Gen Z internet slang and memes. 

- Select 2-4 AI models to compete
- Watch them race to solve a crossword filled with terms like "SKIBIDI", "RIZZ", "GYATT", and "SIGMA"
- Models use intersecting letters as hints (just like a real crossword!)
- See which AI truly has the rizz when it comes to internet culture

<img width="1280" height="784" alt="Screenshot 2025-12-07 at 6 15 27 AM" src="https://github.com/user-attachments/assets/1a12c766-dbb7-40e6-a4a9-66d50938af5d" />


## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai) + [AI Gateway](https://vercel.com/ai-gateway)
- **Styling**: Tailwind CSS 4
- **Rate Limiting**: Upstash Redis / Vercel KV
- **Deployment**: Vercel Edge Runtime

## 🤖 Supported Models

All accessed through a **single API key** via Vercel AI Gateway:

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5 |
| Google | Gemini 2.0 Flash |
| xAI | Grok 4, Grok 4 Fast |

## 🏗️ Architecture

```
Frontend (React) → API Route (/api/solve) → Vercel AI Gateway → AI Providers
```

Key features:
- **Parallel racing**: All models solve simultaneously
- **Sequential solving per model**: Uses intersecting letters as hints
- **Real-time updates**: Watch grids fill in as models answer
- **Edge Runtime**: Fast cold starts globally
- **Rate limiting**: ~5 games per hour per IP

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.

## 🎯 Hackathon Category

**Model Eval Game** - This project creates an interactive experience that evaluates and compares different AI models on their understanding of Gen Z internet culture through a crossword puzzle format.

## 🛠️ Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   # .env.local
   AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
   ```
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## 🚢 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/rizzword)

### Step 1: Deploy

1. Click the deploy button or import from GitHub
2. Add environment variables (see below)
3. Deploy!

### Step 2: Environment Variables

**Required:**
```
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

**Optional (for rate limiting) - use ONE of these:**
```bash
# Vercel KV (auto-added when you create a KV store)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# OR Upstash Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### Getting an AI Gateway API Key

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **AI Gateway** tab
3. Select **API Keys** → **Create Key**
4. Copy the key and add it to your environment variables

### Setting Up Rate Limiting (Recommended)

To prevent API abuse, you can use either **Vercel KV** or **Upstash Redis**:

**Option A: Vercel KV (easiest)**
1. In your Vercel project, go to Storage → Create → KV
2. The env vars are automatically added!

**Option B: Upstash Redis (free)**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a free Redis database
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Rate limit: **~5 games per hour per IP** (configurable in `api/solve/route.ts`)

## 📁 Project Structure

```
rizzword/
├── app/
│   ├── page.tsx              # Main game UI
│   └── api/solve/route.ts    # AI Gateway endpoint
├── components/
│   ├── CrosswordGrid.tsx     # SVG puzzle renderer
│   ├── ModelRacer.tsx        # Individual model panel
│   ├── RaceArena.tsx         # Race orchestration
│   └── Results.tsx           # Leaderboard
├── lib/
│   ├── crossword-data.ts     # Puzzle definition
│   └── models.ts             # AI model configs
└── ARCHITECTURE.md           # Technical docs
```

## 🎨 Features

- **Dark cyberpunk UI** with neon accents
- **Real-time progress tracking** for each model
- **Animated countdown** before race starts
- **Winner celebration** with rankings
- **Statistics dashboard** showing accuracy and speed

## 📝 The Crossword

13 brainrot terms including:
- SIGMA, SKIBIDI, RIZZ, GYATT
- BUSSIN, GRIDDY, AURA, RATIO
- SUS, OHIO, BLUD, CAP, COOK

Each clue is written in Gen Z style for maximum authenticity!

## 🙏 Credits

Built for the [Vercel AI Gateway Hackathon](https://vercel.com/ai-gateway)

---

**No skibidi toilets were harmed in the making of this game** 🚽
