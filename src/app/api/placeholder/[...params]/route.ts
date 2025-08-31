import { NextRequest, NextResponse } from 'next/server'

// 简单的占位图片生成 API
export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  const [width, height] = params.params
  const { searchParams } = new URL(request.url)
  const seed = searchParams.get('seed') || Math.random().toString()
  
  // 生成简单的 SVG 占位图
  const w = parseInt(width) || 400
  const h = parseInt(height) || 300
  
  // 基于 seed 生成颜色
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const hue = Math.abs(hash) % 360
  const color = `hsl(${hue}, 70%, 60%)`
  const textColor = `hsl(${hue}, 70%, 20%)`
  
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${w} × ${h}
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}