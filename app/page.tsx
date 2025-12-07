"use client";

import { useState, useCallback } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { RaceArena, RaceResult } from "@/components/RaceArena";
import { Results } from "@/components/Results";
import { ClueList } from "@/components/CrosswordGrid";
import { ModelConfig } from "@/lib/models";

type GamePhase = "select" | "race" | "results";

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("select");
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);

  const handleModelToggle = useCallback((model: ModelConfig) => {
    setSelectedModels((prev) => {
      const exists = prev.find((m) => m.id === model.id);
      if (exists) {
        return prev.filter((m) => m.id !== model.id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, model];
    });
  }, []);

  const handleStartGame = useCallback(() => {
    if (selectedModels.length >= 2) {
      setPhase("race");
    }
  }, [selectedModels]);

  const handleRaceComplete = useCallback((raceResults: RaceResult[]) => {
    setResults(raceResults);
    setPhase("results");
  }, []);

  const handlePlayAgain = useCallback(() => {
    setResults([]);
    setPhase("select");
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            BRAINROT CROSSWORD
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Watch AI models compete to solve Gen Z slang! Who has the most rizz when it comes to internet culture? No cap, this is gonna be bussin fr fr.
          </p>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-cyan-900/50 rounded-full text-xs text-cyan-400 border border-cyan-700">
              Vercel AI SDK
            </span>
            <span className="px-3 py-1 bg-purple-900/50 rounded-full text-xs text-purple-400 border border-purple-700">
              Model Eval Game
            </span>
            <span className="px-3 py-1 bg-pink-900/50 rounded-full text-xs text-pink-400 border border-pink-700">
              AI Gateway
            </span>
          </div>
        </header>

        {/* Main content */}
        <main>
          {phase === "select" && (
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Model selector */}
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800">
                  <ModelSelector
                    selectedModels={selectedModels}
                    onModelToggle={handleModelToggle}
                  />

                  {selectedModels.length >= 2 && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={handleStartGame}
                        className="px-10 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg rounded-full hover:from-cyan-400 hover:to-purple-400 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                      >
                        START THE RACE
                      </button>
                    </div>
                  )}
                </div>

                {/* Clue preview */}
                <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-4">
                    Crossword Clues
                  </h2>
                  <div className="grid grid-cols-2 gap-6">
                    <ClueList direction="across" />
                    <ClueList direction="down" />
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="mt-12 bg-slate-900/30 backdrop-blur rounded-2xl p-8 border border-slate-800">
                <h2 className="text-2xl font-bold text-center mb-6 text-slate-200">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-900/50 flex items-center justify-center text-3xl">
                      🤖
                    </div>
                    <h3 className="font-bold text-cyan-400 mb-2">
                      1. Select Models
                    </h3>
                    <p className="text-sm text-slate-400">
                      Choose 2-4 AI models to compete in the brainrot knowledge
                      showdown
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-900/50 flex items-center justify-center text-3xl">
                      🏁
                    </div>
                    <h3 className="font-bold text-purple-400 mb-2">
                      2. Watch Them Race
                    </h3>
                    <p className="text-sm text-slate-400">
                      Models solve clues in real-time, using intersecting letters
                      to help
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-900/50 flex items-center justify-center text-3xl">
                      🏆
                    </div>
                    <h3 className="font-bold text-pink-400 mb-2">
                      3. See Results
                    </h3>
                    <p className="text-sm text-slate-400">
                      Find out which AI truly understands Gen Z internet culture
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {phase === "race" && (
            <RaceArena
              selectedModels={selectedModels}
              onRaceComplete={handleRaceComplete}
            />
          )}

          {phase === "results" && (
            <Results results={results} onPlayAgain={handlePlayAgain} />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-500 text-sm">
          <p>
            Built with{" "}
            <a
              href="https://sdk.vercel.ai"
              className="text-cyan-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel AI SDK
            </a>{" "}
            &{" "}
            <a
              href="https://vercel.com/docs/ai-gateway"
              className="text-purple-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              AI Gateway
            </a>
          </p>
          <p className="mt-2 text-xs text-slate-600">
            No skibidi toilets were harmed in the making of this game
          </p>
        </footer>
      </div>
    </div>
  );
}
