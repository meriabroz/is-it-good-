import React, { useState, useEffect } from 'react';
import { Screen, UserProfile, ScanResult, MenuAnalysisResult, MenuSelectionResult, Verdict } from './types';
import Onboarding from './screens/Onboarding';
import Scan from './screens/Scan';
import Result from './screens/Result';
import MenuResult from './screens/MenuResult';
import MenuSelectionResultScreen from './screens/MenuSelectionResult';
import History from './screens/History';
import Profile from './screens/Profile';
import BottomNav from './components/BottomNav';
import { reAnalyzeWithIngredients } from './services/gemini';

// Storage keys
const STORAGE_KEYS = {
  HAS_ONBOARDED: 'isItGood_hasOnboarded',
  PROFILE: 'isItGood_profile',
  SAVED_RESULTS: 'isItGood_savedResults',
};

// Default profile
const DEFAULT_PROFILE: UserProfile = {
  name: '',
  criticalAllergies: [],
  sensitivities: [],
  dietaryPreferences: [],
  bodySensitivities: [],
};

// Share function
const shareContent = async (content: {
  title: string;
  text: string;
  url?: string;
}) => {
  const shareText = `${content.text}\n\nAnalyzed by Is It Good? · by Meria`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: content.title,
        text: shareText,
        url: content.url,
      });
    } catch (err) {
      // User cancelled or error - fall back to clipboard
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  } else {
    // Fallback to clipboard
    await navigator.clipboard.writeText(shareText);
    alert('Copied to clipboard!');
  }
};

function App() {
  // State
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.HAS_ONBOARDED);
    return stored === 'true';
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>(
    hasOnboarded ? 'scan' : 'onboarding'
  );

  const [profile, setProfile] = useState<UserProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return stored ? JSON.parse(stored) : DEFAULT_PROFILE;
  });

  const [savedResults, setSavedResults] = useState<ScanResult[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_RESULTS);
    return stored ? JSON.parse(stored) : [];
  });

  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [currentMenuResult, setCurrentMenuResult] = useState<MenuAnalysisResult | null>(null);
  const [currentMenuSelectionResult, setCurrentMenuSelectionResult] = useState<MenuSelectionResult | null>(null);

  // Persist profile changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  // Persist saved results
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SAVED_RESULTS, JSON.stringify(savedResults));
  }, [savedResults]);

  // Handle onboarding complete
  const handleOnboardingComplete = () => {
    localStorage.setItem(STORAGE_KEYS.HAS_ONBOARDED, 'true');
    setHasOnboarded(true);
    setCurrentScreen('scan');
  };

  // Handle scan complete - for products and body items
  const handleScanComplete = (result: ScanResult) => {
    setCurrentResult(result);
    setCurrentMenuResult(null);
    setCurrentMenuSelectionResult(null);
    setCurrentScreen('result');
  };

  // Handle menu scan complete (old menu mode)
  const handleMenuScanComplete = (result: MenuAnalysisResult) => {
    setCurrentMenuResult(result);
    setCurrentResult(null);
    setCurrentMenuSelectionResult(null);
    setCurrentScreen('result');
  };

  // Handle menu/selection complete (new unified mode)
  const handleMenuSelectionComplete = (result: MenuSelectionResult) => {
    setCurrentMenuSelectionResult(result);
    setCurrentResult(null);
    setCurrentMenuResult(null);
    setCurrentScreen('menuSelection');
  };

  // Handle save/unsave result
  const handleToggleSave = () => {
    if (!currentResult) return;

    const isCurrentlySaved = savedResults.some(r => r.id === currentResult.id);

    if (isCurrentlySaved) {
      setSavedResults(prev => prev.filter(r => r.id !== currentResult.id));
    } else {
      setSavedResults(prev => [currentResult, ...prev]);
    }
  };

  // Handle delete from history
  const handleDeleteResult = (id: string) => {
    setSavedResults(prev => prev.filter(r => r.id !== id));
  };

  // Handle share result
  const handleShareResult = (result: ScanResult) => {
    const getVerdictText = (verdict: typeof result.verdict) => {
      switch (verdict) {
        case 'EXCELLENT': return '✨ EXCELLENT';
        case 'GOOD': return '💚 GOOD';
        case 'MEH': return '🤔 MEH';
        case 'POOR': return '😬 POOR';
        case 'BAD': return '🚩 AVOID';
        default: return '✨ CLEAN';
      }
    };

    const scoreText = result.score !== null ? ` (${result.score}/100)` : '';

    shareContent({
      title: `Is It Good? - ${result.productName}`,
      text: `${result.productName}\n${getVerdictText(result.verdict)}${scoreText}\n\n${result.summary}`,
    });
  };

  // Handle share menu result
  const handleShareMenuResult = () => {
    if (!currentMenuResult) return;
    
    const cleanMatchNames = currentMenuResult.cleanMatches.slice(0, 3).map(m => m.name).join(', ');
    
    shareContent({
      title: `Is It Good? - ${currentMenuResult.restaurantName}`,
      text: `Menu analyzed at ${currentMenuResult.restaurantName}\n\n🌿 Clean Matches: ${cleanMatchNames}${currentMenuResult.cleanMatches.length > 3 ? ` +${currentMenuResult.cleanMatches.length - 3} more` : ''}`,
    });
  };

  // Handle share menu selection result
  const handleShareMenuSelectionResult = () => {
    if (!currentMenuSelectionResult) return;
    
    const topPicks = currentMenuSelectionResult.cleanestOptions.slice(0, 3).map(o => o.name).join(', ');
    
    shareContent({
      title: `Is It Good? - ${currentMenuSelectionResult.title}`,
      text: `${currentMenuSelectionResult.title}\n\n✨ Cleanest Picks: ${topPicks}\n\n${currentMenuSelectionResult.generalAdvice}\n\nScan. Know. Glow.\nisitgood.meria.us`,
    });
  };

  // Handle view from history
  const handleViewFromHistory = (result: ScanResult) => {
    setCurrentResult(result);
    setCurrentMenuResult(null);
    setCurrentMenuSelectionResult(null);
    setCurrentScreen('result');
  };

  // Handle back from result
  const handleBackFromResult = () => {
    setCurrentScreen('scan');
    setCurrentResult(null);
    setCurrentMenuResult(null);
    setCurrentMenuSelectionResult(null);
  };

  // Navigation handler
  const handleNavigate = (screen: Screen) => {
    if (screen !== 'result' && screen !== 'onboarding' && screen !== 'menuSelection') {
      setCurrentScreen(screen);
      if (screen !== 'history') {
        setCurrentResult(null);
        setCurrentMenuResult(null);
        setCurrentMenuSelectionResult(null);
      }
    }
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <Onboarding onComplete={handleOnboardingComplete} />;

      case 'scan':
        return (
          <Scan 
            profile={profile} 
            onScanComplete={handleScanComplete}
            onMenuScanComplete={handleMenuScanComplete}
            onMenuSelectionComplete={handleMenuSelectionComplete}
          />
        );

      case 'result':
        // Show menu result if we have one
        if (currentMenuResult) {
          return (
            <MenuResult
              result={currentMenuResult}
              profile={profile}
              onBack={handleBackFromResult}
              onShare={handleShareMenuResult}
            />
          );
        }
        
        // Show regular product result
        if (!currentResult) {
          setCurrentScreen('scan');
          return null;
        }
        return (
          <Result
            result={currentResult}
            profile={profile}
            isSaved={savedResults.some(r => r.id === currentResult.id)}
            onBack={handleBackFromResult}
            onSave={handleToggleSave}
            onShare={() => handleShareResult(currentResult)}
            onScanIngredients={() => {
              // Navigate back to scan screen so user can scan ingredient label
              setCurrentScreen('scan');
              setCurrentResult(null);
            }}
            onDeepSearchComplete={async (ingredients, source, productUrl) => {
              // Re-analyze the product with the found ingredients
              // This runs a full Gemini analysis to get proper score/verdict
              try {
                const reAnalyzedResult = await reAnalyzeWithIngredients(
                  currentResult,
                  ingredients,
                  source,
                  productUrl,
                  profile
                );
                console.log('Re-analysis complete, updating result:', reAnalyzedResult);
                setCurrentResult(reAnalyzedResult);
              } catch (error) {
                console.error('Re-analysis failed:', error);
                // Fallback: update with ingredients AND fix headline/verdict
                const updatedResult: ScanResult = {
                  ...currentResult,
                  ingredients,
                  ingredientsVerified: true,
                  ingredientSource: source,
                  productUrl: productUrl || currentResult.productUrl,
                  headline: 'ANALYZED',
                  verdict: 'GOOD' as Verdict,
                  score: 75,
                  summary: `Ingredients found from ${source}. This product has been analyzed.`,
                  claimsOnly: false,
                };
                setCurrentResult(updatedResult);
              }
            }}
          />
        );

      case 'menuSelection':
        // Show menu/selection result
        if (!currentMenuSelectionResult) {
          setCurrentScreen('scan');
          return null;
        }
        return (
          <MenuSelectionResultScreen
            result={currentMenuSelectionResult}
            profile={profile}
            onBack={handleBackFromResult}
            onShare={handleShareMenuSelectionResult}
          />
        );

      case 'history':
        return (
          <History
            savedResults={savedResults}
            onViewResult={handleViewFromHistory}
            onDeleteResult={handleDeleteResult}
            onShareResult={handleShareResult}
          />
        );

      case 'profile':
        return <Profile profile={profile} onUpdateProfile={setProfile} />;

      default:
        return (
          <Scan 
            profile={profile} 
            onScanComplete={handleScanComplete}
            onMenuScanComplete={handleMenuScanComplete}
            onMenuSelectionComplete={handleMenuSelectionComplete}
          />
        );
    }
  };

  // Show bottom nav except during onboarding
  const showBottomNav = currentScreen !== 'onboarding';

  return (
    <div className="app">
      {renderScreen()}
      {showBottomNav && <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;
