import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse, getRequestBody, validateEmail, generateId } from '@/utils/api'
import { db } from '@/lib/mockData'
import { RegisterRequest, AuthResponse, User } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password }: RegisterRequest = await getRequestBody(request)
    
    if (!username || !email || !password) {
      return createErrorResponse('用户名、邮箱和密码不能为空', 400)
    }

    if (!validateEmail(email)) {
      return createErrorResponse('邮箱格式不正确', 400)
    }

    if (password.length < 6) {
      return createErrorResponse('密码长度不能少于6位', 400)
    }

    // 检查用户名是否已存在
    if (db.getUserByUsername(username)) {
      return createErrorResponse('用户名已存在', 409)
    }

    // 检查邮箱是否已存在
    if (db.getUserByEmail(email)) {
      return createErrorResponse('邮箱已被注册', 409)
    }

    // 创建新用户
    const newUser = db.createUser({
      username,
      email,
      avatar: `/api/placeholder/64/64?${generateId()}`,
      bio: `我是 ${username}，欢迎关注我！`,
      role: 'user',
      followerCount: 0,
      followingCount: 0,
      videoCount: 0
    })

    // 生成 JWT token（在真实应用中应该使用真正的 JWT）
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`
    
    const response: AuthResponse = {
      token,
      user: newUser
    }
    
    return createResponse(response, '注册成功', 201)
  } catch (error) {
    console.error('注册失败:', error)
    return createErrorResponse('注册失败', 500)
  }
}