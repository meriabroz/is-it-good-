# 🌿 Clean Plate Club - "Is It Good?" by Meria

A beautiful, production-ready clean food scanner app built with React, TypeScript, and Vite.

## ✨ Features

- **Unified Scan Capture**: Upload photos, scan barcodes, or type product names/ingredients
- **Personalized Analysis**: Set your Food DNA (allergies, sensitivities, dietary preferences)
- **AI-Powered Verdicts**: PERFECT / MEH / BAD ratings with detailed explanations
- **Red Flags & Watch-Outs**: Identify problematic ingredients personalized to your profile
- **Cleaner Alternatives**: Suggested better products with verified links
- **DIY Recipes**: Make clean versions at home
- **Built-in Chatbot**: Ask follow-up questions about analyzed products
- **Save & Share**: Keep your scan history and share results

## 🎨 Design System

**Mediterranean × Meria Aesthetic**
- Warm peach stucco tones
- Soft sunlight gradients
- Seafoam green accents
- Coastal beige sand
- Editorial clean-girl wellness vibe

**Color Palette**
- Sand/Cream: `#F7F3EC`
- Warm Stucco: `#F3D8C4`
- Meria Pink: `#e30491`
- Meria Purple: `#672ec9`
- Meria Aqua: `#0bb4df`
- Coffee Brown: `#5A4632`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── App.tsx                 # Main app with routing & state
├── index.css              # Global styles
├── main.tsx               # Entry point
├── types/
│   └── index.ts           # TypeScript interfaces
├── services/
│   ├── gemini.ts          # AI analysis service (mock)
│   └── productLookup.ts   # Product URL verification
├── screens/
│   ├── Onboarding.tsx     # Welcome flow
│   ├── Scan.tsx           # Main scan interface
│   ├── Result.tsx         # Analysis results
│   ├── History.tsx        # Saved scans
│   └── Profile.tsx        # Food DNA settings
└── components/
    ├── BottomNav.tsx      # Navigation bar
    ├── Card.tsx           # Card component
    ├── ChatPanel.tsx      # AI chatbot
    ├── Pill.tsx           # Tag/chip component
    ├── SavedItemCard.tsx  # History item card
    ├── SectionHeader.tsx  # Section titles
    └── VerdictBanner.tsx  # Verdict display
```

## 🤖 Integrating Gemini AI

The app is pre-scaffolded for Gemini integration. To connect real AI:

### 1. Update `src/services/gemini.ts`

```typescript
// Replace the mock analyzeInput function with:
export async function analyzeInput(
  fileOrText: File | string,
  profile: UserProfile
): Promise<ScanResult> {
  const apiKey = 'YOUR_GEMINI_API_KEY';
  
  // If file, convert to base64 for vision API
  let content: string;
  if (fileOrText instanceof File) {
    content = await fileToBase64(fileOrText);
  } else {
    content = fileOrText;
  }
  
  // Build prompt with user profile
  const prompt = buildAnalysisPrompt(content, profile);
  
  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );
  
  // Parse response into ScanResult
  return parseGeminiResponse(await response.json());
}
```

### 2. Environment Variables

Create `.env` file:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile:
- Touch-friendly interactions
- Safe area insets for notched devices
- Smooth 60fps animations
- PWA-ready structure

## 🔒 Legal Disclaimers

All required disclaimers are embedded:
- Result screen: "May contain errors. Always verify ingredient labels directly. Not medical advice."
- Menu scans: "Menu items vary. Confirm ingredients with your server."
- Profile: "This app cannot guarantee allergen accuracy."
- Share: "AI-generated analysis. Always check actual labels."
- Product URLs: "Links provided for convenience. Verify on official site."

## 📄 License

© 2024 Meria. All rights reserved.

---

**Clean Plate Club · by Meria** 🌿
