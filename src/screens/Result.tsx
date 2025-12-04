import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Heart, Check, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Search, Camera, Loader2 } from 'lucide-react';
import { ScanResult, UserProfile, Verdict } from '../types';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ChatPanel from '../components/ChatPanel';
import ShareModal from '../components/ShareModal';
import { getVerdictHeadline } from '../constants/statements';
import { deepSearchForIngredients, DeepSearchResult } from '../services/googleSearch';

interface ResultProps {
  result: ScanResult;
  profile: UserProfile;
  isSaved: boolean;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onScanIngredients?: () => void;
  onDeepSearchComplete?: (ingredients: string, source: string, productUrl: string) => Promise<void>;
}

// Confetti component
const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  if (!active) return null;
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: ['#7BBED2', '#9BB068', '#D4A574', '#5BA4C9', '#E8927C'][Math.floor(Math.random() * 5)],
  }));
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: '-20px',
          width: '10px', height: '10px', borderRadius: '2px', background: p.color,
          animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
        }} />
      ))}
      <style>{`@keyframes confettiFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  );
};

export const Result: React.FC<ResultProps> = ({ result, profile, isSaved, onBack, onSave, onShare, onScanIngredients, onDeepSearchComplete }) => {
  const [expandedRecipe, setExpandedRecipe] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  
  // Deep search state
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [deepSearchStatus, setDeepSearchStatus] = useState('');
  const [deepSearchComplete, setDeepSearchComplete] = useState(false);
  const [deepSearchResult, setDeepSearchResult] = useState<DeepSearchResult | null>(null);
  
  // Handle deep search
  const handleDigDeeper = async () => {
    setIsDeepSearching(true);
    setDeepSearchStatus('Starting deep search...');
    
    try {
      const searchResult = await deepSearchForIngredients(
        result.productName,
        result.brand,
        (status) => setDeepSearchStatus(status)
      );
      
      setDeepSearchResult(searchResult);
      
      if (searchResult.success && searchResult.ingredients && onDeepSearchComplete) {
        // Show re-analyzing status
        setDeepSearchStatus('Found ingredients! Re-analyzing product...');
        
        // Call the re-analysis (this is async and will update the result)
        await onDeepSearchComplete(
          searchResult.ingredients,
          searchResult.source || 'online search',
          searchResult.productUrl || ''
        );
        
        // After re-analysis, the result prop will be updated and component will re-render
        // with ingredientsVerified = true, so the warning section won't show
      }
      
      setDeepSearchComplete(true);
    } catch (error) {
      console.error('Deep search failed:', error);
      setDeepSearchResult({
        success: false,
        ingredients: null,
        source: null,
        productUrl: null,
        searchesPerformed: 0,
        urlsChecked: 0,
      });
      setDeepSearchComplete(true);
    } finally {
      setIsDeepSearching(false);
    }
  };

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
    // Only show confetti if ingredients are verified AND score >= 95
    if (result.ingredientsVerified && result.score !== null && result.score >= 95) {
      setTimeout(() => setShowConfetti(true), 500);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [result.score, result.ingredientsVerified]);

  const getGradient = (): string => {
    // If ingredients aren't verified, show neutral gradient regardless of verdict
    if (!result.ingredientsVerified) {
      return 'linear-gradient(180deg, #B8C4CE 0%, #9AA8B4 100%)'; // Neutral gray-blue
    }
    
    switch (result.verdict) {
      case 'EXCELLENT': return 'linear-gradient(180deg, #7BBED2 0%, #5BA4C9 100%)';
      case 'GOOD': return 'linear-gradient(180deg, #9BB068 0%, #7BBED2 100%)';
      case 'MEH': return 'linear-gradient(180deg, #D4A574 0%, #E8927C 100%)';
      case 'POOR': return 'linear-gradient(180deg, #E8927C 0%, #D4A5A5 100%)';
      case 'BAD': return 'linear-gradient(180deg, #D4A5A5 0%, #C48B8B 100%)';
      default: return 'linear-gradient(180deg, #7BBED2 0%, #5BA4C9 100%)';
    }
  };

  const getScoreBarColor = () => {
    if (result.score === null) return '#D4A5A5';
    if (result.score >= 90) return '#5BA4C9';
    if (result.score >= 70) return '#9BB068';
    if (result.score >= 50) return '#D4A574';
    return '#E8927C';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', paddingBottom: '140px' }}>
      <Confetti active={showConfetti} />
      <ShareModal result={result} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />

      {/* Hero Banner */}
      <div style={{ background: getGradient(), padding: '16px 20px 48px 20px', borderRadius: '0 0 32px 32px', marginBottom: '-24px' }}>
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={onBack} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ArrowLeft size={22} />
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onSave} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isSaved ? '#fff' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSaved ? '#E8927C' : '#fff' }}>
              <Heart size={20} fill={isSaved ? '#E8927C' : 'none'} />
            </button>
            <button onClick={() => setShowShareModal(true)} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', opacity: isVisible ? 1 : 0, transform: isVisible ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s' }}>
          {!result.ingredientsVerified ? (
            <Search size={56} strokeWidth={1.5} color="#fff" />
          ) : (result.verdict === 'EXCELLENT' || result.verdict === 'GOOD') ? (
            <CheckCircle2 size={56} strokeWidth={1.5} color="#fff" />
          ) : (
            <AlertCircle size={56} strokeWidth={1.5} color="#fff" />
          )}
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 600, color: '#fff', textAlign: 'center', margin: '0 0 8px 0', letterSpacing: '-0.02em', textTransform: 'uppercase', opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s ease 0.2s' }}>
          {result.headline || getVerdictHeadline(result.verdict)}
        </h1>

        {/* Product name */}
        <p style={{ fontFamily: '"Inter", sans-serif', fontSize: 'clamp(14px, 4vw, 16px)', color: 'rgba(255,255,255,0.9)', textAlign: 'center', margin: 0, opacity: isVisible ? 1 : 0, transition: 'opacity 0.6s ease 0.3s' }}>
          {result.productName}{result.brand ? ` by ${result.brand}` : ''}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 20px 0 20px' }}>
        
        {/* INGREDIENTS NOT VERIFIED WARNING */}
        {!result.ingredientsVerified && (
          <Card variant="elevated" style={{ 
            marginBottom: '16px', 
            background: deepSearchComplete && deepSearchResult?.success 
              ? 'rgba(155, 176, 104, 0.1)' 
              : 'rgba(212, 165, 116, 0.1)', 
            border: `1px solid ${deepSearchComplete && deepSearchResult?.success 
              ? 'rgba(155, 176, 104, 0.3)' 
              : 'rgba(212, 165, 116, 0.3)'}`,
            padding: '16px 18px'
          }}>
            {/* Deep search success state */}
            {deepSearchComplete && deepSearchResult?.success ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'rgba(155, 176, 104, 0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={20} color="#9BB068" />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#9BB068', margin: '0 0 4px 0' }}>
                      ✓ Ingredients Found!
                    </p>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: 0, lineHeight: 1.5 }}>
                      Found on {deepSearchResult.source}. Checked {deepSearchResult.urlsChecked} sources.
                    </p>
                  </div>
                </div>
                <p style={{ 
                  fontFamily: '"Inter", sans-serif', 
                  fontSize: '13px', 
                  color: '#6B6B6B', 
                  margin: 0,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '8px',
                  lineHeight: 1.6,
                }}>
                  {deepSearchResult.ingredients}
                </p>
              </>
            ) : deepSearchComplete && !deepSearchResult?.success ? (
              /* Deep search failed state */
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'rgba(212, 165, 116, 0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Search size={20} color="#D4A574" />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#D4A574', margin: '0 0 4px 0' }}>
                      Ingredients Not Found Online
                    </p>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: 0, lineHeight: 1.5 }}>
                      We searched {deepSearchResult?.searchesPerformed || 0} queries and checked {deepSearchResult?.urlsChecked || 0} sources but couldn't find the ingredient list.
                    </p>
                  </div>
                </div>
                
                {onScanIngredients && (
                  <>
                    <button
                      onClick={onScanIngredients}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        padding: '14px 20px',
                        background: 'linear-gradient(135deg, #5BA4C9 0%, #7BBED2 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(91, 164, 201, 0.3)',
                      }}
                    >
                      <Camera size={20} color="#fff" />
                      <span style={{ 
                        fontFamily: '"Inter", sans-serif', 
                        fontSize: '15px', 
                        fontWeight: 600, 
                        color: '#fff',
                      }}>
                        Scan Ingredient Label
                      </span>
                    </button>
                    
                    <p style={{ 
                      fontFamily: '"Inter", sans-serif', 
                      fontSize: '12px', 
                      color: '#9A8F85', 
                      margin: '12px 0 0 0', 
                      textAlign: 'center',
                      lineHeight: 1.5,
                    }}>
                      📸 Photo the ingredient list on the package for a full analysis
                    </p>
                  </>
                )}
              </>
            ) : isDeepSearching ? (
              /* Deep searching state */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #5BA4C9 0%, #7BBED2 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '16px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <Search size={24} color="#fff" style={{ animation: 'spin 2s linear infinite' }} />
                </div>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#5BA4C9', margin: '0 0 8px 0' }}>
                  Digging Deeper...
                </p>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: 0, textAlign: 'center' }}>
                  {deepSearchStatus}
                </p>
                <style>{`
                  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
                `}</style>
              </div>
            ) : (
              /* Default state - not searched yet */
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'rgba(212, 165, 116, 0.2)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertCircle size={20} color="#D4A574" />
                  </div>
                  <div>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#D4A574', margin: '0 0 4px 0' }}>
                      Ingredients Not Verified
                    </p>
                    <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: 0, lineHeight: 1.5 }}>
                      Quick search didn't find the ingredient list.
                      {result.claimsOnly ? ' Analysis is based on visible claims only.' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Dig Deeper Button */}
                <button
                  onClick={handleDigDeeper}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #D4A574 0%, #C49A6C 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(212, 165, 116, 0.3)',
                    marginBottom: '12px',
                  }}
                >
                  <Search size={20} color="#fff" />
                  <span style={{ 
                    fontFamily: '"Inter", sans-serif', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    color: '#fff',
                  }}>
                    Dig Deeper
                  </span>
                  <span style={{ 
                    fontFamily: '"Inter", sans-serif', 
                    fontSize: '12px', 
                    color: 'rgba(255,255,255,0.8)',
                  }}>
                    (~15 sec)
                  </span>
                </button>
                
                {/* Scan Ingredient Label Button */}
                {onScanIngredients && (
                  <button
                    onClick={onScanIngredients}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '14px 20px',
                      background: 'transparent',
                      border: '2px solid #5BA4C9',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <Camera size={20} color="#5BA4C9" />
                    <span style={{ 
                      fontFamily: '"Inter", sans-serif', 
                      fontSize: '15px', 
                      fontWeight: 600, 
                      color: '#5BA4C9',
                    }}>
                      Scan Ingredient Label
                    </span>
                  </button>
                )}
                
                <p style={{ 
                  fontFamily: '"Inter", sans-serif', 
                  fontSize: '12px', 
                  color: '#9A8F85', 
                  margin: '12px 0 0 0', 
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}>
                  🔍 Dig Deeper searches more sources • 📸 Scan for instant results
                </p>
              </>
            )}
          </Card>
        )}

        {/* INGREDIENTS VERIFIED BADGE */}
        {result.ingredientsVerified && (
          <Card variant="elevated" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(123, 190, 210, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={20} color="#5BA4C9" />
            </div>
            <div>
              <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#3D3D3D', margin: 0 }}>
                ✓ Ingredients Verified
              </p>
              <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '12px', color: '#9A8F85', margin: 0 }}>
                {result.ingredientSource 
                  ? `From ${result.ingredientSource}` 
                  : result.ingredientsFromScan 
                    ? 'From scanned image' 
                    : 'Verified ingredient list'}
              </p>
            </div>
          </Card>
        )}

        {/* Official Clean Pick Badge - ONLY show if ingredients verified AND score >= 90 */}
        {result.ingredientsVerified && result.score !== null && result.score >= 90 && (
          <div style={{ background: 'linear-gradient(135deg, #5BA4C9 0%, #9BB068 100%)', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>Official Clean Pick</p>
              <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>100% compliant with standards.</p>
            </div>
          </div>
        )}

        {/* Score Bar - ONLY show if ingredients verified AND we have a score */}
        {result.ingredientsVerified && result.score !== null && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 500, color: '#9A8F85' }}>Clean Score</span>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#3D3D3D' }}>{result.score}/100</span>
            </div>
            <div style={{ height: '8px', borderRadius: '4px', background: '#F5F0E8', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '4px', background: getScoreBarColor(), width: `${result.score}%`, transition: 'width 1s ease' }} />
            </div>
          </Card>
        )}

        {/* Watch Outs */}
        {result.watchOuts && result.watchOuts.length > 0 && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertCircle size={18} color="#D4A574" />
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#D4A574' }}>Watch Outs</span>
            </div>
            {result.watchOuts.map((wo, i) => (
              <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid #F5F0E8' : 'none' }}>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#E8927C', margin: 0 }}>{wo.name}</p>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: '4px 0 0 0' }}>{wo.description}</p>
              </div>
            ))}
          </Card>
        )}

        {/* Red Flags */}
        {result.redFlags && result.redFlags.length > 0 && (
          <Card variant="elevated" style={{ marginBottom: '16px', background: 'rgba(212, 165, 165, 0.1)', border: '1px solid rgba(212, 165, 165, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertCircle size={18} color="#C48B8B" />
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#C48B8B' }}>Red Flags</span>
            </div>
            {result.redFlags.map((rf, i) => (
              <div key={i} style={{ padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(212, 165, 165, 0.2)' : 'none' }}>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', fontWeight: 600, color: '#C48B8B', margin: 0 }}>{rf.name}</p>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#9A8F85', margin: '4px 0 0 0' }}>{rf.description}</p>
              </div>
            ))}
          </Card>
        )}

        {/* Good Stuff */}
        {result.goodStuff && result.goodStuff.length > 0 && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={18} color="#9BB068" />
              <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#9BB068' }}>The Good Stuff</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.goodStuff.map((item, i) => (
                <span key={i} style={{ padding: '8px 14px', borderRadius: '100px', background: 'rgba(155, 176, 104, 0.1)', border: '1px solid rgba(155, 176, 104, 0.2)', fontFamily: '"Inter", sans-serif', fontSize: '13px', fontWeight: 500, color: '#9BB068' }}>
                  {item}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Summary */}
        <Card variant="elevated" style={{ marginBottom: '16px' }}>
          <h3 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '18px', fontWeight: 500, color: '#3D3D3D', margin: '0 0 12px 0' }}>The Breakdown</h3>
          <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', color: '#3D3D3D', lineHeight: 1.6, margin: 0 }}>{result.summary}</p>
        </Card>

        {/* Full Ingredients List */}
        {result.ingredients && result.ingredientsVerified && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
              onClick={() => setShowIngredients(!showIngredients)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📋</span>
                <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#3D3D3D' }}>
                  Full Ingredients
                </span>
              </div>
              {showIngredients ? (
                <ChevronUp size={20} color="#9A8F85" />
              ) : (
                <ChevronDown size={20} color="#9A8F85" />
              )}
            </div>
            
            {showIngredients && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F5F0E8' }}>
                <p style={{ 
                  fontFamily: '"Inter", sans-serif', 
                  fontSize: '13px', 
                  color: '#6B6B6B', 
                  lineHeight: 1.7, 
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  {result.ingredients}
                </p>
                {result.ingredientSource && (
                  <p style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '11px',
                    color: '#9A8F85',
                    marginTop: '12px',
                    fontStyle: 'italic',
                  }}>
                    Source: {result.ingredientSource}
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Product URL - Trust-First Approach */}
        {/* Only show verified product link if we're confident it's correct */}
        {result.productUrl ? (
          <a 
            href={result.productUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              padding: '14px 20px',
              margin: '0 0 16px 0',
              background: 'rgba(91, 164, 201, 0.08)',
              borderRadius: '12px',
              color: '#5BA4C9', 
              fontFamily: '"Inter", sans-serif', 
              fontSize: '14px', 
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid rgba(91, 164, 201, 0.15)',
            }}
          >
            <ExternalLink size={16} />
            <span>
              {result.productUrlSource === 'official' ? 'View Official Site' : 
               result.productUrlSource === 'marketplace' ? 'View Product Listing' : 
               `View on ${result.brand || 'Product Page'}`}
            </span>
          </a>
        ) : result.searchUrl ? (
          // Fallback: Google search link (clearly labeled as search, not source)
          <a 
            href={result.searchUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              padding: '12px', 
              color: '#9A8F85', 
              fontFamily: '"Inter", sans-serif', 
              fontSize: '13px', 
              textDecoration: 'none',
            }}
          >
            <span>🔍</span>
            <span>Search this product online</span>
          </a>
        ) : null}

        {/* Alternatives */}
        {result.alternatives && result.alternatives.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <SectionHeader title="Clean Alternatives" icon="✨" subtitle="Try these instead" />
            {result.alternatives.map((alt, i) => (
              <Card key={i} variant="elevated" style={{ marginBottom: '12px' }}>
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#3D3D3D', margin: '0 0 4px 0' }}>{alt.name}</p>
                {alt.brand && <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', color: '#5BA4C9', margin: '0 0 8px 0' }}>{alt.brand}</p>}
                <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', color: '#9A8F85', margin: 0 }}>{alt.reason}</p>
              </Card>
            ))}
          </div>
        )}

        {/* DIY Recipe */}
        {result.diyRecipes && result.diyRecipes.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Card variant="elevated" onClick={() => setExpandedRecipe(!expandedRecipe)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🧪</span>
                  <span style={{ fontFamily: '"Inter", sans-serif', fontSize: '15px', fontWeight: 600, color: '#3D3D3D' }}>DIY Recipe</span>
                </div>
                {expandedRecipe ? <ChevronUp size={20} color="#9A8F85" /> : <ChevronDown size={20} color="#9A8F85" />}
              </div>
              {expandedRecipe && result.diyRecipes[0] && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F5F0E8' }}>
                  <h4 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '16px', fontWeight: 500, color: '#3D3D3D', margin: '0 0 12px 0' }}>{result.diyRecipes[0].title}</h4>
                  {result.diyRecipes[0].description && <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', color: '#9A8F85', margin: '0 0 16px 0' }}>{result.diyRecipes[0].description}</p>}
                  <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', fontWeight: 600, color: '#5BA4C9', margin: '0 0 8px 0' }}>Ingredients:</p>
                  <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
                    {result.diyRecipes[0].ingredients.map((ing, i) => (
                      <li key={i} style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', color: '#3D3D3D', marginBottom: '4px' }}>{ing}</li>
                    ))}
                  </ul>
                  <p style={{ fontFamily: '"Inter", sans-serif', fontSize: '13px', fontWeight: 600, color: '#5BA4C9', margin: '0 0 8px 0' }}>Steps:</p>
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {result.diyRecipes[0].steps.map((step, i) => (
                      <li key={i} style={{ fontFamily: '"Inter", sans-serif', fontSize: '14px', color: '#3D3D3D', marginBottom: '8px' }}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Chat */}
        <div style={{ marginTop: '32px' }}>
          <ChatPanel scanResult={result} profile={profile} />
        </div>
      </div>
    </div>
  );
};

export default Result;
