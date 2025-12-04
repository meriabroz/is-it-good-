import React from 'react';
import { Scan, Bookmark, User } from 'lucide-react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'scan', icon: <Scan size={24} />, label: 'Scan' },
    { screen: 'history', icon: <Bookmark size={24} />, label: 'Saved' },
    { screen: 'profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(253, 251, 247, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(123, 190, 210, 0.1)',
        padding: '8px 16px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
        maxWidth: '768px',
        margin: '0 auto',
      }}
    >
      {navItems.map(item => {
        const isActive = currentScreen === item.screen;
        return (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 'clamp(6px, 2vw, 10px) clamp(12px, 4vw, 24px)',
              borderRadius: '16px',
              transition: 'all 0.25s ease',
              color: isActive ? '#5BA4C9' : '#9A8F85',
              minHeight: '44px', /* Touch target */
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'clamp(44px, 12vw, 56px)',
                height: 'clamp(30px, 8vw, 36px)',
                borderRadius: '100px',
                background: isActive
                  ? 'rgba(123, 190, 210, 0.12)'
                  : 'transparent',
                transition: 'all 0.25s ease',
              }}
            >
              {item.icon}
            </div>
            <span
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: 'clamp(10px, 2.5vw, 12px)',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
