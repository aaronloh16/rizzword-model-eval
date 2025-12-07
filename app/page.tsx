"use client";

import { useState, useCallback } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { RaceArena, RaceResult } from "@/components/RaceArena";
import { Results } from "@/components/Results";
import { ClueList } from "@/components/CrosswordGrid";
import { ModelConfig, getDefaultModels } from "@/lib/models";

type GamePhase = "select" | "race" | "results";

export default function Home() {
  const [phase, setPhase] = useState<GamePhase>("select");
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>(getDefaultModels);
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
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              AI MODEL EVALUATION GAME
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              BRAINROT
            </span>
            <br />
            <span className="text-white/90">CROSSWORD</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Watch AI models compete to solve Gen Z slang! Who has the most{" "}
            <span className="text-purple-400">rizz</span> when it comes to
            internet culture? No cap, this is gonna be{" "}
            <span className="text-cyan-400">bussin</span> fr fr.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 rounded-full text-xs text-cyan-400 border border-cyan-500/20 font-medium">
              Vercel AI SDK
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-full text-xs text-purple-400 border border-purple-500/20 font-medium">
              AI Gateway
            </span>
            <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500/10 to-pink-500/5 rounded-full text-xs text-pink-400 border border-pink-500/20 font-medium">
              13 Brainrot Clues
            </span>
          </div>
        </header>

        {/* Main content */}
        <main>
          {phase === "select" && (
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-6">
                {/* Model selector - wider */}
                <div className="lg:col-span-3 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/50 shadow-2xl">
                  <ModelSelector
                    selectedModels={selectedModels}
                    onModelToggle={handleModelToggle}
                  />

                  {selectedModels.length >= 2 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleStartGame}
                        className="group relative px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-lg rounded-2xl overflow-hidden transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/25"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <svg
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          START THE RACE
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Clue preview - narrower */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/50 shadow-2xl">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Crossword Clues
                  </h2>
                  <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <ClueList direction="across" />
                    <ClueList direction="down" />
                  </div>
                </div>
              </div>

              {/* How it works */}
              <div className="mt-10 bg-gradient-to-br from-slate-900/60 to-slate-900/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-800/30">
                <h2 className="text-xl font-bold text-center mb-8 text-white/90">
                  How It Works
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      🤖
                    </div>
                    <h3 className="font-bold text-cyan-400 mb-2">
                      1. Select Models
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Choose 2-4 AI models to compete in the ultimate brainrot
                      knowledge showdown
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      🏎️
                    </div>
                    <h3 className="font-bold text-purple-400 mb-2">
                      2. Watch Them Race
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Models solve clues in real-time, using intersecting
                      letters for hints
                    </p>
                  </div>
                  <div className="text-center group">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 border border-pink-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      🏆
                    </div>
                    <h3 className="font-bold text-pink-400 mb-2">
                      3. See Results
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
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
        <footer className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800/50">
            <span className="text-slate-500 text-sm">Built with</span>
            <a
              href="https://sdk.vercel.ai"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel AI SDK
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://vercel.com/docs/ai-gateway"
              className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              AI Gateway
            </a>
          </div>
          <p className="mt-4 text-xs text-slate-600">
            No skibidi toilets were harmed in the making of this game
          </p>
        </footer>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
