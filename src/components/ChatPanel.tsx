import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { ChatMessage, ScanResult, UserProfile } from '../types';
import { askFollowupQuestion } from '../services/gemini';

interface ChatPanelProps {
  scanResult: ScanResult;
  profile: UserProfile;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ scanResult, profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi${profile.name ? ` ${profile.name}` : ''}! I analyzed ${scanResult.productName}. Feel free to ask me anything about the ingredients, alternatives, or how this fits your dietary goals!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askFollowupQuestion(scanResult, profile, messages, input.trim());
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble right now. Please try again!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #e30491 0%, #672ec9 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(227, 4, 145, 0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          transition: 'transform 0.2s ease',
          zIndex: 1000,
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '340px',
        maxHeight: '450px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 8px 40px rgba(90, 70, 50, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #e30491 0%, #672ec9 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
            }}
          >
            Ask me anything
          </h3>
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '2px 0 0 0',
            }}
          >
            About {scanResult.productName}
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#F7F3EC',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background:
                  msg.role === 'user'
                    ? 'linear-gradient(135deg, #F3D8C4 0%, #E7DDCE 100%)'
                    : 'linear-gradient(135deg, rgba(11, 180, 223, 0.15) 0%, rgba(163, 177, 138, 0.15) 100%)',
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: '#5A4632',
                lineHeight: 1.5,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '20px 20px 20px 4px',
                background: 'linear-gradient(135deg, rgba(11, 180, 223, 0.15) 0%, rgba(163, 177, 138, 0.15) 100%)',
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: '#5A4632',
              }}
            >
              <span className="typing-dots">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(231, 221, 206, 0.5)',
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '100px',
            border: '2px solid rgba(231, 221, 206, 0.8)',
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            outline: 'none',
            background: '#F7F3EC',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background:
              isLoading || !input.trim()
                ? '#E7DDCE'
                : 'linear-gradient(135deg, #e30491 0%, #672ec9 100%)',
            border: 'none',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
