import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
            }}
          >
            <span style={{ fontSize: '40px', color: '#667eea' }}>👗</span>
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            OpenFashion
          </span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            margin: '0 0 20px 0',
            lineHeight: '1.2',
          }}
        >
          AI-Powered Fashion
        </h1>
        <h2
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            margin: '0 0 40px 0',
            lineHeight: '1.2',
          }}
        >
          Analyzer & Discovery
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '28px',
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            margin: '0 0 40px 0',
            maxWidth: '800px',
            lineHeight: '1.4',
          }}
        >
          Upload clothing images • Find similar items • Get style recommendations
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</span>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>AI Analysis</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</span>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Image Search</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
            }}
          >
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>💡</span>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>Style Tips</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 