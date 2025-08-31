import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse, getSearchParams } from '@/utils/api'
import { db } from '@/lib/mockData'
import { VideoListParams } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = await getSearchParams(request)
    
    const params: VideoListParams = {
      page: parseInt(searchParams.page) || 1,
      limit: parseInt(searchParams.limit) || 20,
      category: searchParams.category,
      search: searchParams.search,
      sortBy: (searchParams.sortBy as any) || 'createdAt',
      sortOrder: (searchParams.sortOrder as 'asc' | 'desc') || 'desc'
    }

    const result = db.getVideos(params)
    
    return createResponse(result, '获取视频列表成功')
  } catch (error) {
    console.error('获取视频列表失败:', error)
    return createErrorResponse('获取视频列表失败', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 这里应该实现视频上传逻辑
    // 在真实应用中需要处理文件上传、视频转码等
    return createErrorResponse('视频上传功能暂未实现', 501)
  } catch (error) {
    console.error('上传视频失败:', error)
    return createErrorResponse('上传视频失败', 500)
  }
}