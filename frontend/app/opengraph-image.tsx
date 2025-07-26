import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Updated Open Graph image with correct meta-pink colors and logo
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
            justifyContent: 'center',
          }}
        >
                      {/* Logo with built-in white circle */}
            <img
              src="https://openfashion.vercel.app/inverted_openfashion_logo_white_circle.png?v=2"
              width="120"
              height="120"
              style={{
                marginRight: '30px',
              }}
            />
          <span
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            OpenFashion
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
} 