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
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '30px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '30px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Actual Logo from android-chrome-512x512.png */}
            <img
              src="https://openfashion.vercel.app/android-chrome-512x512.png"
              width="80"
              height="80"
              style={{
                borderRadius: '20px',
              }}
            />
          </div>
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