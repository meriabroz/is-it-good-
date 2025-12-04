import React, { useState } from 'react';
import { X, Share2, Copy, Check } from 'lucide-react';
import { ScanResult } from '../types';
import ShareCard from './ShareCard';
import { shareContent, generateResultShareText, copyToClipboard } from '../utils/share';

interface ShareModalProps {
  result: ScanResult;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ result, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = generateResultShareText(result);
    const success = await shareContent({
      title: `Is It Good? - ${result.productName}`,
      text,
      url: 'https://isitgood.meria.us',
    });
    
    if (success) {
      onClose();
    }
  };

  const handleCopyText = async () => {
    const text = generateResultShareText(result);
    const fullText = `${text}\n\nAI-generated analysis. Always check the actual label. Not medical advice.`;
    const success = await copyToClipboard(fullText);
    
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <X size={24} />
      </button>

      {/* Card Container */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <ShareCard result={result} />
      </div>

      {/* Action Buttons */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '24px',
          animation: 'fadeIn 0.3s ease 0.1s both',
        }}
      >
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 28px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, #0bb4df 0%, #266edc 100%)',
            color: '#ffffff',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(11, 180, 223, 0.4)',
          }}
        >
          <Share2 size={18} />
          Share Result
        </button>

        <button
          onClick={handleCopyText}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px',
            borderRadius: '100px',
            background: 'rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Hint */}
      <p
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: '13px',
          color: 'rgba(255, 255, 255, 0.6)',
          marginTop: '20px',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease 0.2s both',
        }}
      >
        📸 Screenshot this card to share on Stories
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ShareModal;
