import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Supabase Storage upload (when bucket is available)
async function uploadToSupabase(file: File, folder: string, filename: string): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) return null

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const filePath = `${folder}/${filename}`

    const res = await fetch(`${supabaseUrl}/storage/v1/object/agrilink-images/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    })

    if (res.ok) {
      const data = await res.json()
      // Return the public URL
      return `${supabaseUrl}/storage/v1/object/public/agrilink-images/${filePath}`
    }

    return null
  } catch {
    return null
  }
}

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

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Try Supabase Storage first
    const supabaseUrl = await uploadToSupabase(file, folder, filename)
    if (supabaseUrl) {
      return NextResponse.json({ url: supabaseUrl, storage: 'supabase' })
    }

    // Fallback: Save to local filesystem (public/uploads/)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    // Return the local URL path
    const localUrl = `/uploads/${folder}/${filename}`

    return NextResponse.json({ url: localUrl, storage: 'local' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
