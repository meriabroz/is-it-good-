import React, { useState } from 'react';
import { ArrowLeft, Share2, MessageCircle, Send, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Minus } from 'lucide-react';
import { MenuAnalysisResult, UserProfile, ChatMessage, AnalyzedMenuItem } from '../types';
import Card from '../components/Card';
import { askMenuQuestion } from '../services/gemini';

interface MenuResultProps {
  result: MenuAnalysisResult;
  profile: UserProfile;
  onBack: () => void;
  onShare: () => void;
}

// Menu Item Card Component
const MenuItemCard: React.FC<{
  item: AnalyzedMenuItem;
  variant: 'clean' | 'caution' | 'neutral';
}> = ({ item, variant }) => {
  const [expanded, setExpanded] = useState(false);

  const getBorderColor = () => {
    switch (variant) {
      case 'clean':
        return 'rgba(11, 180, 223, 0.3)';
      case 'caution':
        return 'rgba(227, 4, 145, 0.2)';
      default:
        return 'rgba(90, 70, 50, 0.1)';
    }
  };

  const getAccentColor = () => {
    switch (variant) {
      case 'clean':
        return '#0bb4df';
      case 'caution':
        return '#e30491';
      default:
        return 'rgba(90, 70, 50, 0.5)';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'clean':
        return '✓';
      case 'caution':
        return item.verdict === 'AVOID' ? '✕' : '!';
      default:
        return '–';
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px',
        borderLeft: `4px solid ${getBorderColor()}`,
        boxShadow: '0 2px 8px rgba(90, 70, 50, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: variant === 'clean' 
                  ? 'linear-gradient(135deg, #0bb4df 0%, #266edc 100%)'
                  : variant === 'caution'
                  ? 'linear-gradient(135deg, #e30491 0%, #ad14ad 100%)'
                  : 'rgba(90, 70, 50, 0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {getIcon()}
            </span>
            <h3
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#5A4632',
                margin: 0,
              }}
            >
              {item.name}
            </h3>
          </div>
          {item.price && (
            <span
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: 'rgba(90, 70, 50, 0.6)',
                marginLeft: '32px',
              }}
            >
              {item.price}
            </span>
          )}
        </div>
        <div style={{ color: 'rgba(90, 70, 50, 0.4)', marginTop: '4px' }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Reason - always visible */}
      <p
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: '14px',
          color: getAccentColor(),
          margin: '8px 0 0 32px',
          fontWeight: 500,
        }}
      >
        {item.reason}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: '12px', marginLeft: '32px' }}>
          {item.description && (
            <p
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                color: 'rgba(90, 70, 50, 0.7)',
                margin: '0 0 12px 0',
                fontStyle: 'italic',
              }}
            >
              {item.description}
            </p>
          )}

          {/* Cleaner Tips for clean items */}
          {variant === 'clean' && item.cleanerTips && item.cleanerTips.length > 0 && (
            <div
              style={{
                background: 'rgba(11, 180, 223, 0.08)',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '8px',
              }}
            >
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0bb4df',
                  margin: '0 0 6px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                ✨ Make it Even Cleaner
              </p>
              {item.cleanerTips.map((tip, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '13px',
                    color: '#5A4632',
                    margin: i === 0 ? 0 : '4px 0 0 0',
                  }}
                >
                  • {tip}
                </p>
              ))}
            </div>
          )}

          {/* Flags for caution items */}
          {variant === 'caution' && item.flags && item.flags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {item.flags.map((flag, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    background: 'rgba(227, 4, 145, 0.1)',
                    color: '#e30491',
                    fontWeight: 500,
                  }}
                >
                  {flag}
                </span>
              ))}
            </div>
          )}

          {/* Allergen warnings */}
          {item.allergensConcern && item.allergensConcern.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
                padding: '8px 12px',
                background: 'rgba(227, 4, 145, 0.1)',
                borderRadius: '8px',
              }}
            >
              <AlertTriangle size={14} color="#e30491" />
              <span
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '12px',
                  color: '#e30491',
                  fontWeight: 600,
                }}
              >
                Contains: {item.allergensConcern.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MenuResult: React.FC<MenuResultProps> = ({
  result,
  profile,
  onBack,
  onShare,
}) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCaution, setShowCaution] = useState(true);
  const [showNeutral, setShowNeutral] = useState(false);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await askMenuQuestion(result, profile, chatMessages, chatInput);
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F7F3EC 0%, #E7DDCE 100%)',
        paddingBottom: chatOpen ? '320px' : '140px',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'rgba(247, 243, 236, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 50,
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5A4632',
          }}
        >
          <ArrowLeft size={22} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '17px',
              fontWeight: 700,
              color: '#5A4632',
              margin: 0,
            }}
          >
            {result.restaurantName}
          </h1>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '11px',
              color: 'rgba(90, 70, 50, 0.5)',
              margin: '2px 0 0 0',
            }}
          >
            Is It Good? · by Meria
          </p>
        </div>

        <button
          onClick={onShare}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#5A4632',
          }}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {/* Category Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '100px',
              background: 'rgba(247, 243, 236, 0.9)',
              border: '1px solid rgba(90, 70, 50, 0.1)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#5A4632',
            }}
          >
            🍽️ Menu Analysis
          </span>
        </div>

        {/* Summary Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0bb4df 0%, #266edc 100%)',
            borderRadius: '24px',
            padding: '24px',
            marginBottom: '24px',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <Sparkles size={32} style={{ marginBottom: '12px', opacity: 0.9 }} />
          <h2
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            {result.cleanMatches.length} Clean Match{result.cleanMatches.length !== 1 ? 'es' : ''} Found
          </h2>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '15px',
              margin: 0,
              opacity: 0.9,
            }}
          >
            {result.summary}
          </p>
        </div>

        {/* Clean Matches Section */}
        {result.cleanMatches.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#5A4632',
                  margin: '0 0 4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                🌿 Clean Matches for You
              </h3>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: 'rgba(90, 70, 50, 0.6)',
                  margin: 0,
                }}
              >
                Safe choices based on your profile
              </p>
            </div>
            
            {result.cleanMatches.map((item, index) => (
              <MenuItemCard key={index} item={item} variant="clean" />
            ))}
          </div>
        )}

        {/* Caution Section */}
        {result.cautionItems.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <button
              onClick={() => setShowCaution(!showCaution)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '0 0 16px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#5A4632',
                    margin: '0 0 4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  ⚠️ Caution or Avoid
                </h3>
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    color: 'rgba(90, 70, 50, 0.6)',
                    margin: 0,
                    textAlign: 'left',
                  }}
                >
                  {result.cautionItems.length} item{result.cautionItems.length !== 1 ? 's' : ''} to be mindful of
                </p>
              </div>
              <div style={{ color: 'rgba(90, 70, 50, 0.4)' }}>
                {showCaution ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {showCaution && result.cautionItems.map((item, index) => (
              <MenuItemCard key={index} item={item} variant="caution" />
            ))}
          </div>
        )}

        {/* Neutral Section */}
        {result.neutralItems.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <button
              onClick={() => setShowNeutral(!showNeutral)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '0 0 16px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#5A4632',
                    margin: '0 0 4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                >
                  📋 Everything Else
                </h3>
                <p
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    color: 'rgba(90, 70, 50, 0.6)',
                    margin: 0,
                    textAlign: 'left',
                  }}
                >
                  {result.neutralItems.length} item{result.neutralItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ color: 'rgba(90, 70, 50, 0.4)' }}>
                {showNeutral ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {showNeutral && result.neutralItems.map((item, index) => (
              <MenuItemCard key={index} item={item} variant="neutral" />
            ))}
          </div>
        )}

        {/* Menu Disclaimer */}
        <Card variant="outlined" padding="sm" style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '12px',
              color: 'rgba(90, 70, 50, 0.6)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            🍽️ Menu items vary. Always confirm ingredients with your server.
          </p>
        </Card>

        {/* Disclaimer */}
        <div
          style={{
            padding: '16px',
            background: 'rgba(231, 221, 206, 0.3)',
            borderRadius: '16px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '12px',
              color: 'rgba(90, 70, 50, 0.5)',
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            ⚠️ May contain errors. Always verify with restaurant staff. Not medical advice.
          </p>
        </div>
      </div>

      {/* Chat FAB */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #672ec9 0%, #e30491 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(103, 46, 201, 0.4)',
            zIndex: 60,
          }}
        >
          <MessageCircle size={26} color="#ffffff" />
        </button>
      )}

      {/* Chat Panel */}
      {chatOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '12px',
            right: '12px',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 -4px 32px rgba(90, 70, 50, 0.15)',
            zIndex: 60,
            maxHeight: '50vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(231, 221, 206, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h4
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#5A4632',
                  margin: 0,
                }}
              >
                Ask about the menu
              </h4>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '12px',
                  color: 'rgba(90, 70, 50, 0.5)',
                  margin: '2px 0 0 0',
                }}
              >
                "What about the salmon?" "Is the steak okay?"
              </p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: 'rgba(231, 221, 206, 0.5)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronDown size={18} color="#5A4632" />
            </button>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              maxHeight: '200px',
            }}
          >
            {chatMessages.length === 0 && (
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: 'rgba(90, 70, 50, 0.5)',
                  textAlign: 'center',
                  margin: '20px 0',
                }}
              >
                Ask me about any dish on the menu!
              </p>
            )}
            
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #0bb4df 0%, #266edc 100%)'
                      : 'rgba(231, 221, 206, 0.5)',
                    color: msg.role === 'user' ? '#ffffff' : '#5A4632',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'rgba(231, 221, 206, 0.5)',
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '14px',
                    color: 'rgba(90, 70, 50, 0.6)',
                  }}
                >
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div
            style={{
              padding: '12px 16px 16px 16px',
              borderTop: '1px solid rgba(231, 221, 206, 0.5)',
              display: 'flex',
              gap: '10px',
            }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about any dish..."
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '100px',
                border: '2px solid rgba(231, 221, 206, 0.8)',
                fontFamily: '"Inter", sans-serif',
                fontSize: '15px',
                color: '#5A4632',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: chatInput.trim()
                  ? 'linear-gradient(135deg, #0bb4df 0%, #266edc 100%)'
                  : 'rgba(231, 221, 206, 0.8)',
                border: 'none',
                cursor: chatInput.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={20} color={chatInput.trim() ? '#ffffff' : 'rgba(90, 70, 50, 0.4)'} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuResult;
