import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'TaskMeLater — Card-Based Project Planner';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            T
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
            }}
          >
            TaskMeLater
          </span>
        </div>
        <p
          style={{
            fontSize: '24px',
            color: '#a8a29e',
            maxWidth: '600px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Card-based project planner for features, bugs, and change requests
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '32px',
          }}
        >
          {['Features', 'Bugs', 'Changes'].map((label) => (
            <div
              key={label}
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: '#c4b5fd',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
