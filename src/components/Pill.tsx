import React, { useState } from 'react';

interface PillProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'brand';
  size?: 'sm' | 'md';
}

export const Pill: React.FC<PillProps> = ({
  label,
  selected = false,
  onClick,
  variant = 'default',
  size = 'md',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (onClick) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
      onClick();
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '100px',
    fontFamily: '"Inter", sans-serif',
    fontWeight: 500,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 0.25s ease',
    border: '1.5px solid transparent',
    padding: size === 'sm' ? '6px 14px' : '10px 18px',
    fontSize: size === 'sm' ? '12px' : '14px',
    transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
  };

  const getVariantStyles = (): React.CSSProperties => {
    if (selected) {
      return {
        background: 'linear-gradient(135deg, #7BBED2 0%, #5BA4C9 100%)',
        color: '#ffffff',
        borderColor: 'transparent',
        boxShadow: '0 2px 8px rgba(91, 164, 201, 0.3)',
      };
    }

    switch (variant) {
      case 'danger':
        return {
          background: 'rgba(232, 146, 124, 0.12)',
          color: '#E8927C',
          borderColor: 'rgba(232, 146, 124, 0.25)',
        };
      case 'warning':
        return {
          background: 'rgba(212, 165, 116, 0.12)',
          color: '#D4A574',
          borderColor: 'rgba(212, 165, 116, 0.25)',
        };
      case 'success':
        return {
          background: 'rgba(155, 176, 104, 0.12)',
          color: '#9BB068',
          borderColor: 'rgba(155, 176, 104, 0.25)',
        };
      case 'brand':
        return {
          background: 'rgba(123, 190, 210, 0.1)',
          color: '#5BA4C9',
          borderColor: 'rgba(123, 190, 210, 0.2)',
        };
      default:
        return {
          background: 'rgba(245, 240, 232, 0.8)',
          color: '#3D3D3D',
          borderColor: 'rgba(154, 143, 133, 0.15)',
        };
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        ...baseStyles,
        ...getVariantStyles(),
      }}
      type="button"
    >
      {label}
    </button>
  );
};

export default Pill;
