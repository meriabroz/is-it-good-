import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Share2 } from 'lucide-react';
import { UserProfile, ScanResult, MenuAnalysisResult, MenuSelectionResult } from '../types';
import { analyzeInput, analyzeMenu, smartAnalyze } from '../services/gemini';
import { getRandomStatement } from '../constants/statements';
import { shareApp } from '../utils/share';

interface ScanProps {
  profile: UserProfile;
  onScanComplete: (result: ScanResult) => void;
  onMenuScanComplete?: (result: MenuAnalysisResult) => void;
  onMenuSelectionComplete?: (result: MenuSelectionResult) => void;
}

export const Scan: React.FC<ScanProps> = ({ profile, onScanComplete, onMenuScanComplete, onMenuSelectionComplete }) => {
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [statement, setStatement] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatement(getRandomStatement());
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setIsAnalyzing(true);
    setAnalyzeStatus('Reading the fine print...');
    
    try {
      // Use smart analysis to auto-detect Product vs Menu/Selection mode
      const analysisResult = await smartAnalyze(file, profile);
      
      if (analysisResult.mode === 'menu_selection' && onMenuSelectionComplete) {
        setAnalyzeStatus('Menu spotted! Ranking your options...');
        onMenuSelectionComplete(analysisResult.result);
      } else if (analysisResult.mode === 'product') {
        setAnalyzeStatus('Almost there...');
        onScanComplete(analysisResult.result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      setAnalyzeStatus('');
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeStatus('Looking into it...');
    try {
      // Use smart analysis to auto-detect Product vs Menu/Selection mode
      const analysisResult = await smartAnalyze(textInput, profile);
      
      if (analysisResult.mode === 'menu_selection' && onMenuSelectionComplete) {
        setAnalyzeStatus('Found multiple items! Ranking your options...');
        onMenuSelectionComplete(analysisResult.result);
      } else if (analysisResult.mode === 'product') {
        setAnalyzeStatus('Almost there...');
        onScanComplete(analysisResult.result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      setAnalyzeStatus('');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Loading State - Dreamy sky
  if (isAnalyzing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #E8F4F8 0%, #7BBED2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 16px 48px rgba(46, 125, 155, 0.2)',
            animation: 'breathe 2.5s ease-in-out infinite',
          }}
        >
          <Camera size={48} color="#5BA4C9" strokeWidth={1.5} />
        </div>
        
        <h2
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '28px',
            fontWeight: 500,
            color: '#ffffff',
            margin: '0 0 12px 0',
            textAlign: 'center',
          }}
        >
          One sec...
        </h2>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {analyzeStatus}
        </p>

        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(0.95); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        minHeight: '100dvh',
        background: '#FDFBF7',
        padding: 'clamp(20px, 5vw, 32px)',
        paddingBottom: 'calc(clamp(100px, 20vw, 140px) + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '8px' }}>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 'clamp(10px, 2.5vw, 12px)',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#7BBED2',
            marginBottom: '8px',
          }}
        >
          Is It Good?
        </p>
        <h1
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(26px, 7vw, 36px)',
            fontWeight: 500,
            color: '#3D3D3D',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {profile.name ? `Hey ${profile.name}` : 'Hey gorgeous'}
        </h1>
      </div>

      {/* Editorial quote card */}
      <div
        style={{
          margin: 'clamp(16px, 4vw, 28px) 0',
          padding: 'clamp(16px, 4vw, 24px)',
          background: 'linear-gradient(135deg, rgba(123, 190, 210, 0.08) 0%, rgba(232, 146, 124, 0.06) 100%)',
          borderRadius: 'clamp(16px, 4vw, 24px)',
          borderLeft: '3px solid #7BBED2',
        }}
      >
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontStyle: 'italic',
            fontWeight: 400,
            color: '#5BA4C9',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          "{statement}"
        </p>
      </div>

      {/* Main Scan Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          background: dragActive
            ? 'linear-gradient(180deg, rgba(123, 190, 210, 0.1) 0%, rgba(123, 190, 210, 0.05) 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #F5F0E8 100%)',
          borderRadius: 'clamp(24px, 6vw, 36px)',
          padding: 'clamp(32px, 8vw, 56px) clamp(20px, 5vw, 32px)',
          textAlign: 'center',
          border: `2px dashed ${dragActive ? '#7BBED2' : 'rgba(123, 190, 210, 0.2)'}`,
          transition: 'all 0.3s ease',
          marginBottom: 'clamp(16px, 4vw, 24px)',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={e => e.target.files && handleFileChange(e.target.files[0])}
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
        />

        {/* Scan Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 'clamp(120px, 30vw, 160px)',
            height: 'clamp(120px, 30vw, 160px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7BBED2 0%, #5BA4C9 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto clamp(20px, 5vw, 28px) auto',
            boxShadow: '0 12px 40px rgba(91, 164, 201, 0.35)',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 16px 48px rgba(91, 164, 201, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(91, 164, 201, 0.35)';
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'scale(1.03)';
          }}
        >
          <Camera size={56} color="#ffffff" strokeWidth={1.5} style={{ width: 'clamp(44px, 12vw, 64px)', height: 'clamp(44px, 12vw, 64px)' }} />
        </button>

        <h3
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(18px, 5vw, 24px)',
            fontWeight: 500,
            color: '#3D3D3D',
            margin: '0 0 8px 0',
          }}
        >
          Tap to scan
        </h3>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            color: '#9A8F85',
            margin: 0,
          }}
        >
          Food · Menus · Beauty products
        </p>
      </div>

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: '100px',
          border: '1.5px solid rgba(123, 190, 210, 0.25)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '32px',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(123, 190, 210, 0.06)';
          e.currentTarget.style.borderColor = '#7BBED2';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(123, 190, 210, 0.25)';
        }}
      >
        <Upload size={18} color="#7BBED2" />
        <span
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            fontWeight: 500,
            color: '#5BA4C9',
          }}
        >
          Upload a photo
        </span>
      </button>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(154, 143, 133, 0.15)' }} />
        <span
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px',
            color: '#9A8F85',
          }}
        >
          or type it
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(154, 143, 133, 0.15)' }} />
      </div>

      {/* Text Input */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '4px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(123, 190, 210, 0.1)',
        }}
      >
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Product name or paste ingredients..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '16px',
            borderRadius: '20px',
            border: 'none',
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: '#3D3D3D',
            background: 'transparent',
            resize: 'none',
            outline: 'none',
          }}
        />
        <div style={{ padding: '4px 8px 8px 8px' }}>
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '100px',
              border: 'none',
              background: textInput.trim()
                ? 'linear-gradient(135deg, #7BBED2 0%, #5BA4C9 100%)'
                : '#F5F0E8',
              color: textInput.trim() ? '#ffffff' : '#9A8F85',
              fontFamily: '"Inter", sans-serif',
              fontSize: '15px',
              fontWeight: 600,
              cursor: textInput.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s ease',
              boxShadow: textInput.trim() ? '0 4px 16px rgba(91, 164, 201, 0.25)' : 'none',
            }}
          >
            Analyze
          </button>
        </div>
      </div>

      {/* Share CTA */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            color: '#9A8F85',
            margin: '0 0 12px 0',
          }}
        >
          Love this? Share with your people
        </p>
        <button
          onClick={() => shareApp()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '100px',
            background: 'transparent',
            border: '1.5px solid rgba(123, 190, 210, 0.25)',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#7BBED2',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(123, 190, 210, 0.06)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <Share2 size={16} />
          Share app
        </button>
      </div>
    </div>
  );
};

export default Scan;
