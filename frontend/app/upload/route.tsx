import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const image = formData.get('image') as File

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  // Get the authorization header from the request
  const authHeader = request.headers.get('authorization')

  try {
    const backendFormData = new FormData()
    backendFormData.append('image', image)

    const headers: Record<string, string> = {}
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/upload/`, {
      method: 'POST',
      body: backendFormData,
      headers,
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

