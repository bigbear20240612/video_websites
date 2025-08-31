import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/utils/api'
import { db } from '@/lib/mockData'

export async function GET(request: NextRequest) {
  try {
    const categories = db.getCategories()
    return createResponse(categories, '获取分类列表成功')
  } catch (error) {
    console.error('获取分类列表失败:', error)
    return createErrorResponse('获取分类列表失败', 500)
  }
}