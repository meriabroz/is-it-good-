// Share Utilities
// Web Share API with clipboard fallback

const LEGAL_DISCLAIMER = "AI-generated analysis. Always check the actual label. Not medical advice.";
const APP_URL = "https://isitgood.meria.us";

export interface ShareContent {
  title: string;
  text: string;
  url?: string;
}

// Share using Web Share API or clipboard fallback
export async function shareContent(content: ShareContent): Promise<boolean> {
  const fullText = `${content.text}\n\n${LEGAL_DISCLAIMER}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: content.title,
        text: fullText,
        url: content.url,
      });
      return true;
    } catch (err) {
      // User cancelled or error - fall back to clipboard
      if ((err as Error).name !== 'AbortError') {
        return copyToClipboard(fullText);
      }
      return false;
    }
  } else {
    return copyToClipboard(fullText);
  }
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Share the app itself
export async function shareApp(): Promise<boolean> {
  return shareContent({
    title: "Is It Good? · by Meria",
    text: `I'm using "Is It Good? · by Meria" to scan my food and products and see what's really inside. Try it!`,
    url: APP_URL,
  });
}

// Generate share text for a scan result
export function generateResultShareText(result: {
  productName: string;
  verdict: 'EXCELLENT' | 'GOOD' | 'MEH' | 'POOR' | 'BAD';
  score?: number | null;
  type: string;
  summary?: string;
  redFlags?: { name: string }[];
  goodStuff?: string[];
}): string {
  // Score and verdict display
  const scoreText = result.score !== null && result.score !== undefined 
    ? `${result.score}` 
    : '';
  
  const verdictText = 
    result.verdict === 'EXCELLENT' ? 'EXCELLENT' :
    result.verdict === 'GOOD' ? 'GOOD' :
    result.verdict === 'MEH' ? 'MEH' :
    result.verdict === 'POOR' ? 'POOR' :
    'AVOID';

  const verdictEmoji = 
    result.verdict === 'EXCELLENT' ? '✨' :
    result.verdict === 'GOOD' ? '💚' :
    result.verdict === 'MEH' ? '🤔' :
    result.verdict === 'POOR' ? '😬' :
    '🚩';

  const typeLabel = 
    result.type === 'food' ? 'Food' :
    result.type === 'menu' ? 'Menu' :
    result.type === 'body' ? 'Beauty' :
    'Product';

  // Build the share text
  let text = `${result.productName}`;
  
  // Add score if available
  if (scoreText) {
    text += `\n${verdictEmoji} ${scoreText} — ${verdictText}`;
  } else {
    text += `\n${verdictEmoji} ${verdictText}`;
  }
  
  text += `\n${typeLabel}`;

  // Red flags or clean status
  if (result.redFlags && result.redFlags.length > 0) {
    text += `\n\n⚠️ Watch out: ${result.redFlags[0].name}`;
  } else {
    text += `\n\n✓ No red flags`;
  }

  // Good stuff
  if (result.goodStuff && result.goodStuff.length > 0) {
    text += `\n✓ ${result.goodStuff[0]}`;
  }

  // CTA
  text += `\n\nScan. Know. Glow.`;
  text += `\n${APP_URL}`;

  return text;
}

// Generate share text for menu result
export function generateMenuShareText(result: {
  restaurantName: string;
  cleanMatches: { name: string }[];
}): string {
  const matchNames = result.cleanMatches.slice(0, 3).map(m => m.name).join(', ');
  const moreCount = result.cleanMatches.length > 3 ? result.cleanMatches.length - 3 : 0;

  let text = `Menu analyzed at ${result.restaurantName}\n\n🌿 Clean Matches: ${matchNames}`;
  
  if (moreCount > 0) {
    text += ` +${moreCount} more`;
  }

  text += `\n\nScan. Know. Glow.`;
  text += `\n${APP_URL}`;

  return text;
}

// Generate share text for menu/selection result
export function generateMenuSelectionShareText(result: {
  title: string;
  cleanestOptions: { name: string; whyItStandsOut: string }[];
  generalAdvice?: string;
}): string {
  const topPicks = result.cleanestOptions.slice(0, 3).map(o => o.name).join(', ');
  const moreCount = result.cleanestOptions.length > 3 ? result.cleanestOptions.length - 3 : 0;

  let text = `${result.title}\n\n✨ Cleanest Picks: ${topPicks}`;
  
  if (moreCount > 0) {
    text += ` +${moreCount} more`;
  }

  if (result.generalAdvice) {
    text += `\n\n💡 ${result.generalAdvice}`;
  }

  text += `\n\nScan. Know. Glow.`;
  text += `\n${APP_URL}`;

  return text;
}
