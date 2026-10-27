/**
 * The RizzWord word bank: brainrot slang + a clue written in the same dialect.
 *
 * Rules (enforced by `pnpm puzzles:validate`):
 *  - answers are A-Z only, 3-11 letters, no spaces (NOCAP, not NO CAP)
 *  - a clue never contains its own answer
 *  - clues should be fair: a terminally online human should get them
 *
 * `era` is a loose vibe tag used to spread puzzles across slang generations.
 */
export interface WordBankEntry {
  answer: string;
  clue: string;
  era: "classic" | "2020s" | "italian" | "ai";
}

export const WORD_BANK: WordBankEntry[] = [
  // --- core brainrot ---
  { answer: "RIZZ", clue: "Charisma stat that gets you the number, fr fr", era: "2020s" },
  { answer: "SIGMA", clue: "Lone-wolf grindset archetype who doesn't need the pack", era: "2020s" },
  { answer: "SKIBIDI", clue: "___ toilet: singing porcelain menace with a banger theme", era: "2020s" },
  { answer: "AURA", clue: "Invisible points: +1000 for clutch plays, -500 for tripping", era: "2020s" },
  { answer: "OHIO", clue: "U.S. state where literally anything cursed can happen", era: "2020s" },
  { answer: "GRIDDY", clue: "Viral heel-tap touchdown dance", era: "2020s" },
  { answer: "BUSSIN", clue: "When the food is so good it's absolutely ___", era: "2020s" },
  { answer: "COOK", clue: "\"Let him ___\" (stop interrupting his genius)", era: "2020s" },
  { answer: "MEWING", clue: "Tongue-on-the-roof-of-your-mouth jawline technique", era: "2020s" },
  { answer: "FANUM", clue: "___ tax: when your friend steals a bite of your food", era: "2020s" },
  { answer: "GYAT", clue: "Exclamation of shock at someone's... silhouette", era: "2020s" },
  { answer: "DELULU", clue: "Delusional, but make it cute (\"is the solulu\")", era: "2020s" },
  { answer: "MID", clue: "Aggressively average; neither fire nor trash", era: "2020s" },
  { answer: "NPC", clue: "Background character energy; just repeats the same lines", era: "2020s" },
  { answer: "GLAZING", clue: "Hyping someone up way too hard", era: "2020s" },
  { answer: "YAPPING", clue: "Talking nonstop with zero substance", era: "2020s" },
  { answer: "COPIUM", clue: "Imaginary substance you inhale after taking an L", era: "2020s" },
  { answer: "HOPIUM", clue: "Copium's optimistic cousin", era: "2020s" },
  { answer: "BRAINROT", clue: "What happens after six hours of short-form scrolling", era: "2020s" },
  { answer: "RIZZLER", clue: "One with unspoken game, or the kid from the viral clip", era: "2020s" },
  { answer: "CRASHOUT", clue: "Spectacular emotional meltdown, often over something tiny", era: "2020s" },
  { answer: "LOCKIN", clue: "\"Time to ___\": stop scrolling and actually focus (2 words)", era: "2020s" },
  { answer: "UNC", clue: "Anyone over 25 who says their back hurts", era: "2020s" },
  { answer: "TWIN", clue: "What you call your bestie even if you look nothing alike", era: "2020s" },
  { answer: "OPP", clue: "The enemy, in drill-rap parlance", era: "2020s" },
  { answer: "CHOPPED", clue: "Looks-wise, absolutely not it (opposite of mogging)", era: "2020s" },
  { answer: "MOGGING", clue: "Outshining everyone nearby with sheer facial structure", era: "2020s" },
  { answer: "LOOKSMAXX", clue: "Optimize your face like it's a min-max RPG build", era: "2020s" },
  { answer: "SIXSEVEN", clue: "Two numbers kids yelled all of 2025 (spelled out, 2 words)", era: "2020s" },
  { answer: "AURAFARMING", clue: "Doing something slow and cool purely for the clout", era: "2020s" },
  { answer: "GOOBER", clue: "Lovable goofball", era: "2020s" },
  { answer: "DEMURE", clue: "Very mindful, very cutesy (2024 summer word)", era: "2020s" },
  { answer: "BRAT", clue: "Lime-green summer of 2024 aesthetic", era: "2020s" },
  { answer: "ATE", clue: "\"She ___ and left no crumbs\"", era: "2020s" },
  { answer: "SLAY", clue: "Absolutely crush it", era: "2020s" },
  { answer: "PERIODT", clue: "End of discussion, with an extra consonant for emphasis", era: "2020s" },
  { answer: "ICK", clue: "Sudden turnoff that ruins a crush forever", era: "2020s" },
  { answer: "RENTFREE", clue: "Living ___ in your head (2 words)", era: "2020s" },
  { answer: "TOUCHGRASS", clue: "Advice for the chronically online (2 words)", era: "2020s" },
  { answer: "GOAT", clue: "Greatest of all time, or a farm animal emoji", era: "2020s" },
  { answer: "FINNA", clue: "About to (Southern-inflected)", era: "2020s" },
  { answer: "BIGBACK", clue: "Person who always orders the extra large (2 words)", era: "2020s" },

  // --- classic internet ---
  { answer: "SUS", clue: "When the imposter is acting kinda shady (Among Us)", era: "classic" },
  { answer: "CAP", clue: "No ___ = I'm being completely serious rn", era: "classic" },
  { answer: "NOCAP", clue: "Completely serious, no lie (2 words)", era: "classic" },
  { answer: "SALTY", clue: "Bitter about taking an L", era: "classic" },
  { answer: "RATIO", clue: "When your reply gets more likes than the post", era: "classic" },
  { answer: "BRUV", clue: "British for \"bro\"", era: "classic" },
  { answer: "BLUD", clue: "London roadman's word for mate", era: "classic" },
  { answer: "YEET", clue: "Throw with reckless abandon", era: "classic" },
  { answer: "BASED", clue: "Unbothered and true to yourself, even if unpopular", era: "classic" },
  { answer: "CRINGE", clue: "Secondhand embarrassment, as an adjective", era: "classic" },
  { answer: "STAN", clue: "Obsessive fan, after an Eminem song", era: "classic" },
  { answer: "SHEESH", clue: "Drawn-out exclamation when something is impressive", era: "classic" },
  { answer: "BET", clue: "One-word \"okay, deal\"", era: "classic" },
  { answer: "VIBE", clue: "The overall energy of a room", era: "classic" },
  { answer: "DRIP", clue: "Fire outfit, or swagger in general", era: "classic" },
  { answer: "FLEX", clue: "Show off", era: "classic" },
  { answer: "GHOSTED", clue: "Left on read... permanently", era: "classic" },
  { answer: "SIMP", clue: "Someone who does way too much for their crush", era: "classic" },
  { answer: "BOOMER", clue: "\"OK, ___\" (dismissive generational comeback)", era: "classic" },
  { answer: "LOWKEY", clue: "Secretly or kind of; opposite of highkey", era: "classic" },
  { answer: "SHOOK", clue: "Absolutely stunned", era: "classic" },
  { answer: "TEA", clue: "Gossip; \"spill the ___\"", era: "classic" },
  { answer: "SNATCHED", clue: "Looking flawless, especially the waist", era: "classic" },
  { answer: "SAVAGE", clue: "Brutally, impressively harsh", era: "classic" },
  { answer: "FOMO", clue: "Anxiety that everyone else is at the better party (abbr.)", era: "classic" },
  { answer: "SKRRT", clue: "Tire-screech sound effect for leaving fast", era: "classic" },
  { answer: "OOF", clue: "Roblox death noise, or a sympathetic reaction to an L", era: "classic" },
  { answer: "POG", clue: "Twitch emote word for hype", era: "classic" },

  // --- Italian brainrot ---
  { answer: "TRALALERO", clue: "___ Tralala: the shark in Nikes", era: "italian" },
  { answer: "TUNGTUNG", clue: "Start of a wooden log's name: ___ Tung Sahur", era: "italian" },
  { answer: "CROCODILO", clue: "Bombardiro ___: a bomber plane with a reptile head", era: "italian" },
  { answer: "BALLERINA", clue: "___ Cappuccina: coffee-headed dancer", era: "italian" },
  { answer: "PATAPIM", clue: "Brr Brr ___: a forest creature with big feet", era: "italian" },

  // --- AI slang (it's a model eval, after all) ---
  { answer: "CLANKER", clue: "Slur for robots that went viral in 2025", era: "ai" },
  { answer: "SLOP", clue: "Low-effort AI-generated content flooding the feed", era: "ai" },
  { answer: "VIBECODE", clue: "Ship an app by just asking the model nicely", era: "ai" },
  { answer: "PROMPT", clue: "What you type before the model starts yapping", era: "ai" },
  { answer: "TOKEN", clue: "What models eat and bill you for", era: "ai" },
  { answer: "AGENT", clue: "An LLM with tools and too much confidence", era: "ai" },
];
