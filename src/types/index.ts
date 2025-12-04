export type Verdict = 'EXCELLENT' | 'GOOD' | 'MEH' | 'POOR' | 'BAD';
export type ScanType = 'food' | 'menu' | 'body';
export type MenuItemVerdict = 'CLEAN' | 'CAUTION' | 'AVOID' | 'NEUTRAL';

// Score brackets for clean scoring
export interface ScoreBracket {
  min: number;
  max: number;
  verdict: Verdict;
  label: string;
}

export const SCORE_BRACKETS: ScoreBracket[] = [
  { min: 90, max: 100, verdict: 'EXCELLENT', label: 'Excellent' },
  { min: 70, max: 89, verdict: 'GOOD', label: 'Good' },
  { min: 50, max: 69, verdict: 'MEH', label: 'Meh' },
  { min: 0, max: 49, verdict: 'POOR', label: 'Poor' },
];

// Body sensitivities options
export const BODY_SENSITIVITIES = [
  'Fragrance',
  'Essential Oils',
  'Peppermint',
  'Bergamot',
  'Cedarwood',
  'Alcohol (denat.)',
  'Silicones',
  'Retinol',
  'Benzyl Alcohol / Sorbic Acid',
  'Anything that tingles',
] as const;

export interface UserProfile {
  name: string;
  criticalAllergies: string[];
  sensitivities: string[];
  dietaryPreferences: string[];
  bodySensitivities: string[];
}

// Menu Analysis Types
export interface AnalyzedMenuItem {
  name: string;
  description?: string;
  price?: string;
  verdict: MenuItemVerdict;
  reason: string;
  cleanerTips?: string[];
  flags?: string[];
  allergensConcern?: string[];
}

export interface MenuAnalysisResult {
  id: string;
  type: 'menu';
  restaurantName: string;
  cleanMatches: AnalyzedMenuItem[];
  cautionItems: AnalyzedMenuItem[];
  neutralItems: AnalyzedMenuItem[];
  summary: string;
  createdAt: string;
}

export interface RedFlag {
  name: string;
  description: string;
}

export interface WatchOut {
  name: string;
  description: string;
}

export interface Alternative {
  name: string;
  brand?: string;
  reason: string;
  productUrl?: string;
}

export interface DIYRecipe {
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
}

export interface GreenwashAlert {
  suggested: boolean;
  reason: string;
}

export interface ScanResult {
  id: string;
  type: ScanType;
  productName: string;
  brand?: string;
  imageUrl?: string;
  verdict: Verdict;
  score: number | null; // null means RED FLAG detected OR ingredients not verified
  headline: string;
  summary: string;
  redFlags: RedFlag[];
  watchOuts: WatchOut[];
  goodStuff: string[];
  greenwashAlert?: GreenwashAlert;
  alternatives: Alternative[];
  diyRecipes: DIYRecipe[];
  productUrl?: string; // Only set if highly confident it's correct
  productUrlSource?: 'official' | 'marketplace' | 'retailer';
  searchUrl?: string; // Google search fallback - always available
  verifiedOnline?: boolean;
  // Ingredient verification tracking
  ingredientsVerified: boolean; // True ONLY if we have actual INCI list
  ingredientSource?: string; // Domain where ingredients were found (e.g., "ulta.com")
  ingredientsFromScan?: boolean; // True if ingredients came from scanned image
  claimsOnly?: boolean; // True if we only have claims, no verified ingredients
  ingredients?: string; // The actual ingredient list (comma-separated)
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type Screen = 'onboarding' | 'scan' | 'result' | 'history' | 'profile' | 'menuSelection';

// ═══════════════════════════════════════════════════════════════
// MENU / SELECTION MODE TYPES
// For menus, multi-product comparisons, shelf photos, etc.
// NO scores, NO ingredient verification — just relative ranking
// ═══════════════════════════════════════════════════════════════

export interface CleanestOption {
  name: string;
  whyItStandsOut: string;
  notes?: string;
}

export interface AlsoGoodOption {
  name: string;
  notes?: string;
}

export interface CautionItem {
  name: string;
  reason: string;
}

export interface MenuSelectionResult {
  id: string;
  type: 'menu_or_selection';
  title: string; // e.g., "Café Meria Menu" or "Protein Powder Comparison"
  cleanestOptions: CleanestOption[];
  alsoGoodOptions: AlsoGoodOption[];
  cautionItems: CautionItem[];
  generalAdvice: string;
  disclaimer: string;
  itemCount: number; // How many items were analyzed
  createdAt: string;
}

// Union type for all result types
export type AnalysisResult = ScanResult | MenuSelectionResult | MenuAnalysisResult;
