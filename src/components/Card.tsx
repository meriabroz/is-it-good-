import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  onClick?: () => void;
  gradient?: 'brand' | 'perfect' | 'meh' | 'bad';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  onClick,
  gradient,
}) => {
  const paddingMap = {
    none: '0',
    sm: '14px',
    md: '22px',
    lg: '30px',
  };

  const gradientMap = {
    brand: 'linear-gradient(135deg, rgba(123, 190, 210, 0.08) 0%, rgba(232, 146, 124, 0.06) 100%)',
    perfect: 'linear-gradient(135deg, rgba(155, 176, 104, 0.08) 0%, rgba(123, 190, 210, 0.06) 100%)',
    meh: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(232, 146, 124, 0.08) 100%)',
    bad: 'linear-gradient(135deg, rgba(232, 146, 124, 0.1) 0%, rgba(212, 165, 165, 0.08) 100%)',
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: '24px',
    padding: paddingMap[padding],
    transition: 'all 0.3s ease',
    cursor: onClick ? 'pointer' : 'default',
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'elevated':
        return {
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        };
      case 'outlined':
        return {
          background: 'transparent',
          border: '1.5px solid rgba(123, 190, 210, 0.15)',
        };
      case 'glass':
        return {
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        };
      case 'gradient':
        return {
          background: gradient ? gradientMap[gradient] : gradientMap.brand,
          border: '1px solid rgba(123, 190, 210, 0.08)',
        };
      default:
        return {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
        };
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyles,
        ...getVariantStyles(),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
