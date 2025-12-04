import React, { useEffect, useState } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { Verdict } from '../types';
import { getVerdictHeadline, getVerdictSubline } from '../constants/statements';

interface VerdictBannerProps {
  verdict: Verdict;
  score: number | null;
  headline?: string;
  productName?: string;
  subline?: string;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({ 
  verdict, 
  score, 
  headline,
  productName,
  subline 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayHeadline] = useState(() => headline || getVerdictHeadline(verdict));
  const [displaySubline] = useState(() => subline || getVerdictSubline(verdict));

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [verdict]);

  // Mediterranean color palette gradients
  const getGradient = (): string => {
    switch (verdict) {
      case 'EXCELLENT':
        return 'linear-gradient(180deg, #7BBED2 0%, #5BA4C9 100%)'; // Teal/ocean
      case 'GOOD':
        return 'linear-gradient(180deg, #9BB068 0%, #7BBED2 100%)'; // Green to teal
      case 'MEH':
        return 'linear-gradient(180deg, #D4A574 0%, #E8927C 100%)'; // Gold to coral
      case 'POOR':
        return 'linear-gradient(180deg, #E8927C 0%, #D4A5A5 100%)'; // Coral to rosé
      case 'BAD':
        return 'linear-gradient(180deg, #D4A5A5 0%, #C48B8B 100%)'; // Rosé (soft, not harsh red)
      default:
        return 'linear-gradient(180deg, #7BBED2 0%, #5BA4C9 100%)';
    }
  };

  const getIcon = () => {
    const iconProps = { size: 48, strokeWidth: 2, color: '#ffffff' };
    switch (verdict) {
      case 'EXCELLENT':
      case 'GOOD':
        return <Check {...iconProps} />;
      case 'MEH':
      case 'POOR':
        return <AlertCircle {...iconProps} />;
      case 'BAD':
        return <X {...iconProps} />;
      default:
        return <Check {...iconProps} />;
    }
  };

  return (
    <div
      style={{
        background: getGradient(),
        borderRadius: '0 0 32px 32px',
        padding: '60px 28px 40px 28px',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Soft glow overlay */}
      <div
        style={{
          position: 'absolute',
          top: '-30%',
          left: '-30%',
          right: '-30%',
          bottom: '-30%',
          background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1,
          transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        }}
      >
        {/* Icon */}
        <div 
          style={{ 
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
            transform: isVisible ? 'scale(1)' : 'scale(0.5)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon()}
          </div>
        </div>
        
        {/* Main Headline */}
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(32px, 10vw, 48px)',
            fontWeight: 600,
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {displayHeadline}
        </h1>
        
        {/* Product name / subline */}
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(14px, 4vw, 16px)',
            margin: 0,
            opacity: 0.9,
            fontWeight: 400,
            maxWidth: '300px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {productName || displaySubline}
        </p>
      </div>
    </div>
  );
};

export default VerdictBanner;
