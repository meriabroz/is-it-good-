import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { getRandomStatement } from '../constants/statements';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [statement, setStatement] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setStatement(getRandomStatement());
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #E8F4F8 0%, #7BBED2 40%, #5BA4C9 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Soft gradient orbs for depth */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '-20%',
          width: 'min(400px, 80vw)',
          height: 'min(400px, 80vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '-15%',
          width: 'min(300px, 60vw)',
          height: 'min(300px, 60vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232, 146, 124, 0.2) 0%, transparent 60%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(40px, 8vh, 80px) clamp(24px, 6vw, 48px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Small branding */}
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 'clamp(16px, 4vh, 32px)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.5s ease 0.1s',
          }}
        >
          Is It Good?
        </p>

        {/* Big editorial headline - Playfair Display */}
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(32px, 10vw, 56px)',
            fontWeight: 500,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 'min(360px, 85vw)',
            margin: '0 0 clamp(24px, 5vh, 40px) 0',
            textShadow: '0 2px 20px rgba(0,0,0,0.1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          {statement}
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(14px, 3.5vw, 17px)',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.85)',
            textAlign: 'center',
            maxWidth: 'min(300px, 80vw)',
            lineHeight: 1.6,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.4s',
          }}
        >
          Scan your food, menus & products. See what's actually inside.
        </p>
      </div>

      {/* Bottom section */}
      <div
        style={{
          padding: '0 clamp(24px, 6vw, 48px) clamp(32px, 6vh, 56px)',
          paddingBottom: 'max(clamp(32px, 6vh, 56px), env(safe-area-inset-bottom, 32px))',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* CTA Button */}
        <button
          onClick={onComplete}
          style={{
            width: '100%',
            maxWidth: '400px',
            margin: '0 auto',
            display: 'flex',
            padding: 'clamp(16px, 4vw, 22px) clamp(24px, 6vw, 36px)',
            borderRadius: '100px',
            border: 'none',
            background: '#ffffff',
            color: '#2E7D9B',
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(15px, 3.5vw, 17px)',
            fontWeight: 600,
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.5s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
          }}
        >
          Let's go
          <ArrowRight size={20} strokeWidth={2} />
        </button>

        {/* Meria signature */}
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            marginTop: 'clamp(20px, 4vh, 32px)',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.5s ease 0.7s',
          }}
        >
          by Meria
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
