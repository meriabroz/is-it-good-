import React, { useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { ScanResult } from '../types';
import SavedItemCard from '../components/SavedItemCard';
import ShareModal from '../components/ShareModal';
import { shareApp } from '../utils/share';

interface HistoryProps {
  savedResults: ScanResult[];
  onViewResult: (result: ScanResult) => void;
  onDeleteResult: (id: string) => void;
  onShareResult: (result: ScanResult) => void;
}

export const History: React.FC<HistoryProps> = ({
  savedResults,
  onViewResult,
  onDeleteResult,
  onShareResult,
}) => {
  const [shareModalResult, setShareModalResult] = useState<ScanResult | null>(null);

  const handleShare = (result: ScanResult) => {
    setShareModalResult(result);
  };

  return (
    <div
      className="animate-pageEnter"
      style={{
        minHeight: '100vh',
        background: '#FDFBF7',
        padding: '24px 20px 120px 20px',
      }}
    >
      {/* Share Modal */}
      {shareModalResult && (
        <ShareModal 
          result={shareModalResult} 
          isOpen={true} 
          onClose={() => setShareModalResult(null)} 
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#7BBED2',
            marginBottom: '8px',
          }}
        >
          Your Scans
        </p>
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '32px',
            fontWeight: 500,
            color: '#3D3D3D',
            margin: '0 0 4px 0',
          }}
        >
          Saved
        </h1>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: 'rgba(90, 70, 50, 0.6)',
            margin: 0,
          }}
        >
          {savedResults.length === 0
            ? 'No saved items yet'
            : `${savedResults.length} item${savedResults.length === 1 ? '' : 's'} saved`}
        </p>
      </div>

      {/* Gallery Banner (shows after 3+ items) */}
      {savedResults.length >= 3 && (
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(11, 180, 223, 0.1) 0%, rgba(38, 110, 220, 0.1) 100%)',
            borderRadius: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '14px',
              color: '#5A4632',
              margin: 0,
            }}
          >
            ✨ Building your clean-living gallery
          </p>
          <button
            onClick={() => savedResults[0] && handleShare(savedResults[0])}
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              color: '#0bb4df',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Share one?
          </button>
        </div>
      )}

      {/* Empty State */}
      {savedResults.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(231, 221, 206, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <X size={40} color="rgba(90, 70, 50, 0.3)" />
          </div>
          <h2
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#5A4632',
              margin: '0 0 8px 0',
            }}
          >
            No saved scans yet
          </h2>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '15px',
              color: 'rgba(90, 70, 50, 0.6)',
              margin: 0,
              maxWidth: '280px',
              lineHeight: 1.5,
            }}
          >
            When you scan products and tap the save button, they'll appear here for easy reference.
          </p>
        </div>
      )}

      {/* Saved Items List */}
      {savedResults.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {savedResults.map((result, index) => (
            <div
              key={result.id}
              style={{
                animation: 'staggerIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                animationDelay: `${index * 50}ms`,
                opacity: 0,
              }}
            >
              <SavedItemCard
                result={result}
                onView={() => onViewResult(result)}
                onDelete={() => onDeleteResult(result.id)}
                onShare={() => handleShare(result)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '40px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px',
            color: 'rgba(90, 70, 50, 0.4)',
            margin: 0,
          }}
        >
          Is It Good? · by Meria
        </p>
      </div>

      <style>{`
        @keyframes staggerIn {
          0% {
            opacity: 0;
            transform: translateY(16px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default History;
