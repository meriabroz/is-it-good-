import React from 'react';
import { ScanResult } from '../types';

interface ShareCardProps {
  result: ScanResult;
}

export const ShareCard: React.FC<ShareCardProps> = ({ result }) => {
  const getGradient = () => {
    switch (result.verdict) {
      case 'EXCELLENT':
        return 'linear-gradient(180deg, #E8F4F8 0%, #7BBED2 40%, #5BA4C9 100%)';
      case 'GOOD':
        return 'linear-gradient(180deg, #F0F5E8 0%, #9BB068 40%, #7BBED2 100%)';
      case 'MEH':
        return 'linear-gradient(180deg, #F5F0E8 0%, #D4A574 40%, #E8927C 100%)';
      case 'POOR':
        return 'linear-gradient(180deg, #F5F0E8 0%, #E8927C 40%, #D4A5A5 100%)';
      case 'BAD':
        return 'linear-gradient(180deg, #F5F0E8 0%, #D4A5A5 40%, #C48B8B 100%)';
      default:
        return 'linear-gradient(180deg, #E8F4F8 0%, #7BBED2 40%, #5BA4C9 100%)';
    }
  };

  const getVerdictText = () => {
    switch (result.verdict) {
      case 'EXCELLENT': return 'EXCELLENT';
      case 'GOOD': return 'GOOD';
      case 'MEH': return 'MEH';
      case 'POOR': return 'POOR';
      case 'BAD': return 'AVOID';
      default: return 'CLEAN';
    }
  };

  const getCategoryLabel = () => {
    switch (result.type) {
      case 'food': return 'Food';
      case 'menu': return 'Menu';
      case 'body': return 'Beauty';
      default: return 'Product';
    }
  };

  return (
    <div
      style={{
        width: '320px',
        aspectRatio: '9/16',
        background: getGradient(),
        borderRadius: '32px',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 72px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Soft gradient orb - top right */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          right: '-15%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      
      {/* Soft gradient orb - bottom left */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '-10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header - Brand */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '8px' }}>
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#ffffff',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.5px',
          }}
        >
          Is It Good?
        </p>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '10px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '4px 0 0 0',
            textAlign: 'center',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          by Meria
        </p>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Score */}
        {result.score !== null ? (
          <>
            <p
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '72px',
                fontWeight: 600,
                color: '#ffffff',
                margin: 0,
                lineHeight: 1,
                textShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              {result.score}
            </p>
            <p
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '8px 0 0 0',
                letterSpacing: '3px',
              }}
            >
              {getVerdictText()}
            </p>
          </>
        ) : (
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '36px',
              fontWeight: 600,
              color: '#ffffff',
              margin: 0,
              textShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            {getVerdictText()}
          </p>
        )}

        {/* Divider line */}
        <div
          style={{
            width: '40px',
            height: '2px',
            background: 'rgba(255, 255, 255, 0.3)',
            margin: '24px 0',
            borderRadius: '1px',
          }}
        />

        {/* Product Name */}
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '22px',
            fontWeight: 500,
            color: '#ffffff',
            margin: '0 0 12px 0',
            lineHeight: 1.3,
            maxWidth: '260px',
          }}
        >
          {result.productName}
        </p>

        {/* Category Pill */}
        <span
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            color: '#ffffff',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {getCategoryLabel()}
        </span>
      </div>

      {/* Bottom Section */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Key Points */}
        <div 
          style={{ 
            marginBottom: '20px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {result.redFlags && result.redFlags.length > 0 ? (
            <p style={{ 
              fontFamily: '"Inter", sans-serif', 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ opacity: 0.8 }}>⚠️</span> {result.redFlags[0].name}
            </p>
          ) : (
            <p style={{ 
              fontFamily: '"Inter", sans-serif', 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ opacity: 0.8 }}>✓</span> No red flags
            </p>
          )}
          
          {result.goodStuff && result.goodStuff.length > 0 && (
            <p style={{ 
              fontFamily: '"Inter", sans-serif', 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.9)', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ opacity: 0.8 }}>✓</span> {result.goodStuff[0]}
            </p>
          )}
        </div>

        {/* Footer - Tagline & URL */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '14px',
              fontStyle: 'italic',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 6px 0',
              letterSpacing: '0.5px',
            }}
          >
            Scan. Know. Glow.
          </p>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              letterSpacing: '1px',
            }}
          >
            isitgood.meria.us
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareCard;
