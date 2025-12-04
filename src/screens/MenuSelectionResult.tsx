import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Sparkles, Check, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { MenuSelectionResult as MenuSelectionResultType, UserProfile } from '../types';
import Card from '../components/Card';

interface MenuSelectionResultProps {
  result: MenuSelectionResultType;
  profile: UserProfile;
  onBack: () => void;
  onShare: () => void;
}

export const MenuSelectionResult: React.FC<MenuSelectionResultProps> = ({
  result,
  profile,
  onBack,
  onShare,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FDFBF7', paddingBottom: '140px' }}>
      
      {/* Hero Banner - Mediterranean Teal Gradient */}
      <div
        style={{
          background: 'linear-gradient(180deg, #7BBED2 0%, #5BA4C9 60%, #4A9BBF 100%)',
          padding: '16px 20px 48px 20px',
          borderRadius: '0 0 32px 32px',
          marginBottom: '-24px',
        }}
      >
        {/* Top nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={onBack}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ArrowLeft size={22} />
          </button>
          <button
            onClick={onShare}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
          }}
        >
          <Sparkles size={56} strokeWidth={1.5} color="#fff" />
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(24px, 7vw, 32px)',
            fontWeight: 600,
            color: '#fff',
            textAlign: 'center',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.2s',
          }}
        >
          Your Best Bets
        </h1>

        {/* Title */}
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(14px, 4vw, 16px)',
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            margin: 0,
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.3s',
          }}
        >
          {result.title}
        </p>

        {/* Item count badge */}
        {result.itemCount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '16px',
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 0.6s ease 0.4s',
            }}
          >
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 16px',
                borderRadius: '100px',
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
              }}
            >
              {result.itemCount} items analyzed
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '40px 20px 0 20px' }}>
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CLEANEST PICKS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {result.cleanestOptions.length > 0 && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(155, 176, 104, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#9BB068" />
              </div>
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#9BB068',
                  margin: 0,
                }}
              >
                Your Cleanest Picks
              </h2>
            </div>

            {result.cleanestOptions.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '14px 0',
                  borderTop: index > 0 ? '1px solid #F5F0E8' : 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#3D3D3D',
                    margin: '0 0 4px 0',
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '13px',
                    color: '#9BB068',
                    margin: '0 0 4px 0',
                    fontWeight: 500,
                  }}
                >
                  {item.whyItStandsOut}
                </p>
                {item.notes && (
                  <p
                    style={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '12px',
                      color: '#9A8F85',
                      margin: 0,
                    }}
                  >
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ALSO GOOD */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {result.alsoGoodOptions.length > 0 && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(91, 164, 201, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={18} color="#5BA4C9" />
              </div>
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#5BA4C9',
                  margin: 0,
                }}
              >
                Also Great Choices
              </h2>
            </div>

            {result.alsoGoodOptions.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 0',
                  borderTop: index > 0 ? '1px solid #F5F0E8' : 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#3D3D3D',
                    margin: '0 0 4px 0',
                  }}
                >
                  {item.name}
                </p>
                {item.notes && (
                  <p
                    style={{
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '13px',
                      color: '#9A8F85',
                      margin: 0,
                    }}
                  >
                    {item.notes}
                  </p>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* CAUTION ITEMS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {result.cautionItems.length > 0 && (
          <Card
            variant="elevated"
            style={{
              marginBottom: '16px',
              background: 'rgba(212, 165, 116, 0.08)',
              border: '1px solid rgba(212, 165, 116, 0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(212, 165, 116, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={18} color="#D4A574" />
              </div>
              <h2
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#D4A574',
                  margin: 0,
                }}
              >
                Go Easy On These
              </h2>
            </div>

            {result.cautionItems.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 0',
                  borderTop: index > 0 ? '1px solid rgba(212, 165, 116, 0.15)' : 'none',
                }}
              >
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#3D3D3D',
                    margin: '0 0 4px 0',
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '13px',
                    color: '#D4A574',
                    margin: 0,
                  }}
                >
                  {item.reason}
                </p>
              </div>
            ))}
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* GENERAL ADVICE */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {result.generalAdvice && (
          <Card variant="elevated" style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(123, 190, 210, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Info size={18} color="#7BBED2" />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#3D3D3D',
                    margin: '0 0 6px 0',
                  }}
                >
                  Quick Tip
                </h3>
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    color: '#6B6B6B',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {result.generalAdvice}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* DISCLAIMER */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: 'rgba(154, 143, 133, 0.08)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '24px',
          }}
        >
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '12px',
              color: '#9A8F85',
              margin: 0,
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            {result.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuSelectionResult;
