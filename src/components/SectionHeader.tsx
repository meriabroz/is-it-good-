import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
        <h2
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            color: '#5A4632',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            color: 'rgba(90, 70, 50, 0.7)',
            margin: '4px 0 0 0',
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
