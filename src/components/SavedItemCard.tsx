import React from 'react';
import { Trash2, Share2, ChevronRight } from 'lucide-react';
import { ScanResult, Verdict } from '../types';
import Pill from './Pill';

interface SavedItemCardProps {
  result: ScanResult;
  onView: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export const SavedItemCard: React.FC<SavedItemCardProps> = ({
  result,
  onView,
  onDelete,
  onShare,
}) => {
  const getVerdictVariant = (verdict: Verdict): 'success' | 'warning' | 'danger' => {
    switch (verdict) {
      case 'PERFECT':
        return 'success';
      case 'MEH':
        return 'warning';
      case 'BAD':
        return 'danger';
    }
  };

  const getVerdictLabel = (verdict: Verdict): string => {
    switch (verdict) {
      case 'PERFECT':
        return '✨ Perfect';
      case 'MEH':
        return '🤔 Meh';
      case 'BAD':
        return '⚠️ Not Good';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(90, 70, 50, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={onView}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(90, 70, 50, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(90, 70, 50, 0.06)';
      }}
    >
      {/* Product Icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background:
            result.verdict === 'PERFECT'
              ? 'linear-gradient(135deg, rgba(11, 180, 223, 0.15) 0%, rgba(163, 177, 138, 0.15) 100%)'
              : result.verdict === 'MEH'
              ? 'linear-gradient(135deg, rgba(243, 216, 196, 0.5) 0%, rgba(230, 180, 95, 0.3) 100%)'
              : 'linear-gradient(135deg, rgba(227, 4, 145, 0.1) 0%, rgba(173, 20, 173, 0.1) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
        }}
      >
        {result.type === 'menu' ? '🍽️' : result.type === 'body' ? '✨' : '🍎'}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#5A4632',
            margin: '0 0 4px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {result.productName}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pill label={getVerdictLabel(result.verdict)} variant={getVerdictVariant(result.verdict)} size="sm" />
          <span
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '12px',
              color: 'rgba(90, 70, 50, 0.5)',
            }}
          >
            {formatDate(result.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={e => {
            e.stopPropagation();
            onShare();
          }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(231, 221, 206, 0.5)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5A4632',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(231, 221, 206, 0.8)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(231, 221, 206, 0.5)')}
        >
          <Share2 size={16} />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(227, 4, 145, 0.1)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e30491',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(227, 4, 145, 0.2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(227, 4, 145, 0.1)')}
        >
          <Trash2 size={16} />
        </button>
        <ChevronRight size={20} color="rgba(90, 70, 50, 0.3)" />
      </div>
    </div>
  );
};

export default SavedItemCard;
