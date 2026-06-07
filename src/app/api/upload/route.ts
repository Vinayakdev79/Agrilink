import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const BUCKET_NAME = 'agrilink-images'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'products'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
    const filePath = `${folder}/${filename}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Supabase upload error:', res.status, errorText)
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
    }

    // Return the public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`

    return NextResponse.json({ url: publicUrl, storage: 'supabase' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
