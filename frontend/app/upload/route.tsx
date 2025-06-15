import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const image = formData.get('image') as File

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  try {
    const backendFormData = new FormData()
    backendFormData.append('image', image)

    const response = await fetch('http://127.0.0.1:5000/upload', {
      method: 'POST',
      body: backendFormData,
    })

    if (!response.ok) {
      throw new Error('Failed to process the image')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing image:', error)
    return NextResponse.json({ error: 'Error processing image' }, { status: 500 })
  }
}

