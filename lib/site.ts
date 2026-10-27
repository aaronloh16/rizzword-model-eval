export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://rizzword.vercel.app");

export const REPO_URL = "https://github.com/aaronloh16/rizzword-model-eval";

export const TAGLINE = "Frontier AI models race to solve a daily brainrot crossword.";
