// Brand Voice - Witty, Editorial, Fashion-Forward
// "Is It Good? · by Meria"

import { Verdict } from '../types';

// ═══════════════════════════════════════════════════════════
// ROTATING EDITORIAL STATEMENTS (Onboarding + Scan Screen)
// ═══════════════════════════════════════════════════════════

export const EDITORIAL_STATEMENTS = [
  // Bold & Witty
  "Let's see who's lying today.",
  "Clean living, but make it fashion.",
  "Truth tastes better.",
  "Glow, but make it clean.",
  "Let's expose some trash ingredients.",
  "If it stings, we drop it.",
  "Your gut will thank me later.",
  "Corporate cereal milk? Couldn't be me.",
  "A more beautiful way to live clean.",
  "Your body called — it wants better.",
  
  // Confident & Direct
  "No mystery ingredients on my watch.",
  "Main character energy starts with clean eating.",
  "Reading labels so you don't have to.",
  "That glow-up? It starts inside.",
  "Some products lie. I don't.",
  "Plot twist: you deserve better ingredients.",
  "Eating clean hits different.",
  "Not all heroes wear capes. Some scan barcodes.",
  "Clean girl era, activated.",
  "Your wellness, decoded.",
  
  // Playful & Relatable
  "Is it giving... clean? Let's find out.",
  "Ingredients should pass the vibe check.",
  "Red flags? We're not dating them.",
  "That ingredient list? Suspicious.",
  "Your snacks called. They have secrets.",
  "We don't gatekeep clean living.",
  "Serving looks AND clean ingredients.",
  "Hot take: you should know what you're eating.",
  "Unhinged ingredient lists? Not on my watch.",
  "Clean eating without the boring.",
  
  // Mediterranean Wellness Vibes
  "Mediterranean energy, bottled.",
  "Sunshine and clean ingredients only.",
  "Living like the Italians, but make it informed.",
  "La dolce vita, but clean.",
  "Coastal grandmother approved.",
  "Olive oil mindset.",
  "European summer, but for your gut.",
  "The good life starts with good food.",
  "Wellness, but chic.",
  "Clean living never looked so good.",
];

// ═══════════════════════════════════════════════════════════
// VERDICT HEADLINES - Score-Based (0-100 System)
// ═══════════════════════════════════════════════════════════

export const VERDICT_HEADLINES = {
  // 90-100: EXCELLENT
  EXCELLENT: [
    "PERFECTION.",
    "Queen behavior.",
    "Chef's kiss. Clean.",
    "Obsessed. No notes.",
    "She's THE moment.",
    "This is the vibe.",
    "Certified clean. Period.",
    "We stan a clean queen.",
    "Living your best life.",
    "Main character energy.",
  ],
  // 70-89: GOOD
  GOOD: [
    "Beautifully clean.",
    "Impressively good.",
    "Your body approves.",
    "A clean choice.",
    "Nicely done.",
    "The good stuff.",
    "Clean and lovely.",
    "You chose well.",
    "Solid pick.",
    "Looking good.",
  ],
  // 50-69: MEH
  MEH: [
    "Could be better.",
    "She's trying...",
    "Not quite there.",
    "Mixed signals.",
    "Room for improvement.",
    "Almost clean.",
    "Proceed with caution.",
    "You could do better.",
    "It's giving... maybe.",
    "The jury's still out.",
  ],
  // 0-49: POOR
  POOR: [
    "Hmm, maybe not.",
    "Your body deserves better.",
    "Not the move.",
    "Think twice.",
    "We can do better.",
    "This one's a stretch.",
    "Not ideal.",
    "Consider alternatives.",
    "Questionable choice.",
    "Let's find you something else.",
  ],
  // RED FLAG DETECTED: BAD (no score)
  BAD: [
    "Nope. Absolutely not.",
    "Corporate villain energy.",
    "Hard pass, bestie.",
    "The red flags are flagging.",
    "Not today.",
    "We don't claim her.",
    "This is not the vibe.",
    "Delete from cart.",
    "Major red flags.",
    "Run, don't walk.",
  ],
};

// ═══════════════════════════════════════════════════════════
// VERDICT SUBLINES - Gentle, Informative
// ═══════════════════════════════════════════════════════════

export const VERDICT_SUBLINES = {
  EXCELLENT: [
    "A truly clean and authentic formula.",
    "100% compliant with clean standards.",
    "No concerns here — enjoy!",
    "Clean living at its finest.",
  ],
  GOOD: [
    "A great choice with minor notes.",
    "Mostly clean with small considerations.",
    "Solid ingredients overall.",
    "A reliably clean option.",
  ],
  MEH: [
    "Some ingredients to be aware of.",
    "Mostly clean with some concerns.",
    "Not bad, but not great either.",
    "Consider the notes below.",
  ],
  POOR: [
    "Several concerning ingredients.",
    "May want to consider alternatives.",
    "Some red flags to review.",
    "Not our top pick.",
  ],
  BAD: [
    "Contains ingredients we always avoid.",
    "Red flags detected in this formula.",
    "Not recommended for clean living.",
    "Consider the alternatives below.",
  ],
};

// ═══════════════════════════════════════════════════════════
// BODY PRODUCT SPECIFIC LANGUAGE (Gentle & Elegant)
// ═══════════════════════════════════════════════════════════

export const BODY_PRODUCT_NOTES = {
  essentialOils: "Includes natural essential oils — lovely for most, but may be a bit strong for ultra-sensitive skin.",
  fragrance: "Contains natural fragrance. Since you prefer fragrance-free, you may want to patch test first.",
  preservatives: "Uses gentle preservatives like benzyl alcohol — safe for most, noted for ultra-sensitive skin.",
  silicones: "Contains silicones. These are safe but some prefer silicone-free formulas.",
  alcoholDenat: "Contains alcohol denat., which can be drying for some skin types.",
  retinol: "Contains retinol — great for skin but requires sun protection and may not suit all skin types.",
  tingles: "May produce a slight tingling sensation from active ingredients.",
  noSyntheticToxins: "No synthetic toxins detected — this is a genuinely clean formula.",
};

// ═══════════════════════════════════════════════════════════
// MENU CHAT LINES - Witty & Supportive
// ═══════════════════════════════════════════════════════════

export const MENU_CHAT_RESPONSES = {
  cleanMatch: [
    "Ooh the {dish}? Clean queen energy.",
    "Yes bestie, the {dish} is THE move.",
    "The {dish}? Excellent taste, literally.",
    "Go for the {dish}. Your gut will thank you.",
    "The {dish} understood the assignment.",
  ],
  cautionItem: [
    "The {dish}? You'll feel this one tomorrow.",
    "That one's giving... regret for breakfast.",
    "If you go for {dish}, hydrate tonight.",
    "The {dish} has some red flags, not gonna lie.",
    "Proceed with caution on the {dish}, bestie.",
  ],
  persuadeClean: [
    "Your Clean Matches are right there waiting...",
    "You could, but your body deserves better.",
    "How about something that loves you back?",
    "Main characters choose the cleaner option.",
    "If you compromise today, at least hydrate after.",
  ],
  encouragement: [
    "You've got this! Clean choices, happy body.",
    "Trust the process. Your gut knows.",
    "Clean eating hits different when it's delicious.",
    "Your future self will thank you.",
    "Wellness looks good on you.",
  ],
};

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

// Get a random statement
export function getRandomStatement(): string {
  const index = Math.floor(Math.random() * EDITORIAL_STATEMENTS.length);
  return EDITORIAL_STATEMENTS[index];
}

// Get a different statement than the one provided
export function getDifferentStatement(current: string): string {
  const filtered = EDITORIAL_STATEMENTS.filter(s => s !== current);
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}

// Get verdict from score
export function getVerdictFromScore(score: number | null): Verdict {
  if (score === null) return 'BAD';
  if (score >= 90) return 'EXCELLENT';
  if (score >= 70) return 'GOOD';
  if (score >= 50) return 'MEH';
  return 'POOR';
}

// Get a random verdict headline based on verdict
export function getVerdictHeadline(verdict: Verdict): string {
  const lines = VERDICT_HEADLINES[verdict];
  const index = Math.floor(Math.random() * lines.length);
  return lines[index];
}

// Get a random verdict subline based on verdict
export function getVerdictSubline(verdict: Verdict): string {
  const lines = VERDICT_SUBLINES[verdict];
  const index = Math.floor(Math.random() * lines.length);
  return lines[index];
}

// Legacy function for backward compatibility
export function getVerdictLine(verdict: Verdict): string {
  return getVerdictHeadline(verdict);
}

// Get a random menu chat response
export function getMenuChatResponse(type: keyof typeof MENU_CHAT_RESPONSES, dishName?: string): string {
  const lines = MENU_CHAT_RESPONSES[type];
  const index = Math.floor(Math.random() * lines.length);
  let line = lines[index];
  if (dishName) {
    line = line.replace('{dish}', dishName);
  }
  return line;
}
