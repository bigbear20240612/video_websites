import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse, getRequestBody } from '@/utils/api'
import { db } from '@/lib/mockData'
import { LoginRequest, AuthResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginRequest = await getRequestBody(request)
    
    if (!username || !password) {
      return createErrorResponse('用户名和密码不能为空', 400)
    }

    // 查找用户（可以是用户名或邮箱）
    const user = db.getUserByUsername(username) || db.getUserByEmail(username)
    
    if (!user) {
      return createErrorResponse('用户不存在', 404)
    }

    // 在真实应用中这里应该验证密码哈希
    // 这里简化处理，只要有用户就认为登录成功
    if (password !== '123456' && password !== 'admin') {
      return createErrorResponse('密码错误', 401)
    }

    // 生成 JWT token（在真实应用中应该使用真正的 JWT）
    const token = `mock-jwt-token-${user.id}-${Date.now()}`
    
    const response: AuthResponse = {
      token,
      user
    }
    
    return createResponse(response, '登录成功')
  } catch (error) {
    console.error('登录失败:', error)
    return createErrorResponse('登录失败', 500)
  }
}