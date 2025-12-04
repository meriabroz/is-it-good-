import React from 'react';
import { Share2, Sparkles } from 'lucide-react';
import { UserProfile, BODY_SENSITIVITIES } from '../types';
import Card from '../components/Card';
import Pill from '../components/Pill';
import SectionHeader from '../components/SectionHeader';
import { shareApp } from '../utils/share';

interface ProfileProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

const CRITICAL_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Shellfish',
  'Fish',
  'Sesame',
  'Eggs',
  'Dairy',
  'Gluten',
  'Soy',
];

const SENSITIVITIES = [
  'Lactose',
  'Gluten',
  'Corn',
  'Legumes',
  'Nightshades',
  'Caffeine',
  'Alcohol',
  'Sulfites',
];

const DIETARY_PREFERENCES = [
  'Vegan',
  'Vegetarian',
  'Pescatarian',
  'Paleo',
  'Keto',
  'Mediterranean',
  'Low Sugar',
  'Low Sodium',
  'Low FODMAP',
  'High Protein',
  'Organic-First',
  'No Seed Oils',
  'No Refined Grains',
  'No Ultra-Processed Foods',
];

export const Profile: React.FC<ProfileProps> = ({ profile, onUpdateProfile }) => {
  const toggleItem = (
    list: string[],
    item: string,
    field: keyof Pick<UserProfile, 'criticalAllergies' | 'sensitivities' | 'dietaryPreferences' | 'bodySensitivities'>
  ) => {
    const newList = list.includes(item) ? list.filter(i => i !== item) : [...list, item];
    onUpdateProfile({ ...profile, [field]: newList });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FDFBF7',
        padding: '24px 20px 140px 20px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
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
          Your Profile
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
          Your Preferences
        </h1>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: 'rgba(90, 70, 50, 0.6)',
            margin: 0,
          }}
        >
          Personalize your clean living analysis
        </p>
      </div>

      {/* Name Input */}
      <div style={{ marginBottom: '28px' }}>
        <SectionHeader title="Your Name" icon="👋" subtitle="How should we greet you?" />
        <Card variant="elevated">
          <input
            type="text"
            value={profile.name}
            onChange={e => onUpdateProfile({ ...profile, name: e.target.value })}
            placeholder="Enter your name"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '16px',
              border: '2px solid rgba(231, 221, 206, 0.8)',
              fontFamily: '"Inter", sans-serif',
              fontSize: '16px',
              color: '#5A4632',
              background: '#F7F3EC',
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={e => (e.target.style.borderColor = '#e30491')}
            onBlur={e => (e.target.style.borderColor = 'rgba(231, 221, 206, 0.8)')}
          />
        </Card>
      </div>

      {/* Critical Allergies */}
      <div style={{ marginBottom: '28px' }}>
        <SectionHeader
          title="Critical Allergies"
          icon="🚨"
          subtitle="Select any life-threatening allergies"
        />
        <Card variant="elevated">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {CRITICAL_ALLERGIES.map(allergy => (
              <Pill
                key={allergy}
                label={allergy}
                selected={profile.criticalAllergies.includes(allergy)}
                onClick={() => toggleItem(profile.criticalAllergies, allergy, 'criticalAllergies')}
                variant="danger"
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Sensitivities */}
      <div style={{ marginBottom: '28px' }}>
        <SectionHeader
          title="Sensitivities"
          icon="⚡"
          subtitle="Foods that may cause discomfort"
        />
        <Card variant="elevated">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {SENSITIVITIES.map(sensitivity => (
              <Pill
                key={sensitivity}
                label={sensitivity}
                selected={profile.sensitivities.includes(sensitivity)}
                onClick={() => toggleItem(profile.sensitivities, sensitivity, 'sensitivities')}
                variant="warning"
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Dietary Preferences */}
      <div style={{ marginBottom: '28px' }}>
        <SectionHeader
          title="Goals & Diet"
          icon="🎯"
          subtitle="Your eating preferences and goals"
        />
        <Card variant="elevated">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {DIETARY_PREFERENCES.map(pref => (
              <Pill
                key={pref}
                label={pref}
                selected={profile.dietaryPreferences.includes(pref)}
                onClick={() => toggleItem(profile.dietaryPreferences, pref, 'dietaryPreferences')}
                variant="brand"
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Skin & Body Sensitivities */}
      <div style={{ marginBottom: '28px' }}>
        <SectionHeader
          title="Skin & Body Sensitivities"
          icon="✨"
          subtitle="For body product analysis"
        />
        <Card variant="elevated">
          <p
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: '13px',
              color: '#9A8F85',
              margin: '0 0 16px 0',
              lineHeight: 1.5,
            }}
          >
            Select any ingredients your skin is sensitive to. We'll note them when scanning body products.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {BODY_SENSITIVITIES.map(sensitivity => (
              <Pill
                key={sensitivity}
                label={sensitivity}
                selected={(profile.bodySensitivities || []).includes(sensitivity)}
                onClick={() => toggleItem(profile.bodySensitivities || [], sensitivity, 'bodySensitivities')}
                variant={sensitivity === 'Anything that tingles' ? 'warning' : 'brand'}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card
        variant="outlined"
        style={{
          background: 'rgba(227, 4, 145, 0.05)',
          borderColor: 'rgba(227, 4, 145, 0.2)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <h4
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#e30491',
                margin: '0 0 4px 0',
              }}
            >
              Important Disclaimer
            </h4>
            <p
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: '13px',
                color: 'rgba(90, 70, 50, 0.7)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This app cannot guarantee allergen accuracy. Always verify ingredient labels directly
              and consult with healthcare professionals for medical dietary advice.
            </p>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {(profile.criticalAllergies.length > 0 ||
        profile.sensitivities.length > 0 ||
        profile.dietaryPreferences.length > 0 ||
        (profile.bodySensitivities || []).length > 0) && (
        <Card variant="elevated" style={{ marginBottom: '28px' }}>
          <h4
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '18px',
              fontWeight: 500,
              color: '#3D3D3D',
              margin: '0 0 16px 0',
            }}
          >
            Your Profile Summary
          </h4>
          
          {profile.criticalAllergies.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9A8F85',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Allergies
              </span>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: '#E8927C',
                  margin: '4px 0 0 0',
                }}
              >
                {profile.criticalAllergies.join(', ')}
              </p>
            </div>
          )}
          
          {profile.sensitivities.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9A8F85',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Food Sensitivities
              </span>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: '#3D3D3D',
                  margin: '4px 0 0 0',
                }}
              >
                {profile.sensitivities.join(', ')}
              </p>
            </div>
          )}
          
          {profile.dietaryPreferences.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9A8F85',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Diet & Goals
              </span>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: '#5BA4C9',
                  margin: '4px 0 0 0',
                }}
              >
                {profile.dietaryPreferences.join(', ')}
              </p>
            </div>
          )}

          {(profile.bodySensitivities || []).length > 0 && (
            <div>
              <span
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9A8F85',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Skin & Body Sensitivities
              </span>
              <p
                style={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: '14px',
                  color: '#9BB068',
                  margin: '4px 0 0 0',
                }}
              >
                {(profile.bodySensitivities || []).join(', ')}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Share App Section */}
      <div
        style={{
          marginTop: '28px',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(123, 190, 210, 0.08) 0%, rgba(232, 146, 124, 0.06) 100%)',
          borderRadius: '24px',
          textAlign: 'center',
          border: '1px solid rgba(123, 190, 210, 0.1)',
        }}
      >
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '18px',
            fontWeight: 500,
            color: '#3D3D3D',
            margin: '0 0 16px 0',
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
            padding: '14px 28px',
            borderRadius: '100px',
            background: 'linear-gradient(135deg, #7BBED2 0%, #5BA4C9 100%)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            fontWeight: 600,
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(91, 164, 201, 0.3)',
            transition: 'all 0.25s ease',
          }}
        >
          <Share2 size={18} />
          Share app
        </button>
      </div>

      {/* Footer with Meria signature */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px',
            color: '#9A8F85',
            margin: '0 0 14px 0',
          }}
        >
          Version 1.0.0
        </p>
        <p
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '18px',
            fontStyle: 'italic',
            color: 'rgba(123, 190, 210, 0.6)',
            margin: 0,
          }}
        >
          by Meria
        </p>
      </div>
    </div>
  );
};

export default Profile;
