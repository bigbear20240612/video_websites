/*
 * 大雄视频平台 - 直播服务
 * 处理直播推流、状态管理、观众连接等核心功能
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import LiveStream, { ILiveStream, StreamStatus } from '../models/LiveStream';
import LiveMessage, { ILiveMessage, MessageType } from '../models/LiveMessage';
import User from '../models/User';
import redis from '../config/redis';

// WebSocket消息类型
export enum WSMessageType {
  JOIN_STREAM = 'join_stream',
  LEAVE_STREAM = 'leave_stream',
  CHAT_MESSAGE = 'chat_message',
  GIFT_MESSAGE = 'gift_message',
  LIKE_MESSAGE = 'like_message',
  VIEWER_COUNT = 'viewer_count',
  STREAM_STATUS = 'stream_status',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

// 客户端连接信息
interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  username?: string;
  streamId?: string;
  joinTime: Date;
  lastPing: Date;
}

// 直播间信息
interface StreamRoom {
  streamId: string;
  clients: Map<string, ClientConnection>;
  viewerCount: number;
  lastUpdate: Date;
}

export class LiveStreamService extends EventEmitter {
  private wss: WebSocketServer;
  private rooms: Map<string, StreamRoom> = new Map();
  private heartbeatInterval: NodeJS.Timeout;
  private cleanupInterval: NodeJS.Timeout;

  constructor(port: number = 8080) {
    super();
    
    // 创建WebSocket服务器
    this.wss = new WebSocketServer({ 
      port,
      perMessageDeflate: true,
      maxPayload: 1024 * 1024 // 1MB
    });

    this.initializeWebSocketHandlers();
    this.startHeartbeat();
    this.startCleanupTimer();
    
    console.log(`直播WebSocket服务启动在端口 ${port}`);
  }

  /**
   * 初始化WebSocket事件处理
   */
  private initializeWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      const connection: ClientConnection = {
        ws,
        joinTime: new Date(),
        lastPing: new Date()
      };

      // 连接事件处理
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, connection, message);
        } catch (error) {
          this.sendError(ws, '无效的消息格式');
        }
      });

      // 断开连接处理
      ws.on('close', () => {
        this.handleClientDisconnect(clientId, connection);
      });

      // 错误处理
      ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
        this.handleClientDisconnect(clientId, connection);
      });

      // 发送连接确认
      this.sendMessage(ws, {
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * 处理客户端消息
   */
  private async handleClientMessage(
    clientId: string,
    connection: ClientConnection,
    message: any
  ): Promise<void> {
    try {
      switch (message.type) {
        case WSMessageType.JOIN_STREAM:
          await this.handleJoinStream(clientId, connection, message);
          break;

        case WSMessageType.LEAVE_STREAM:
          await this.handleLeaveStream(clientId, connection);
          break;

        case WSMessageType.CHAT_MESSAGE:
          await this.handleChatMessage(clientId, connection, message);
          break;

        case WSMessageType.GIFT_MESSAGE:
          await this.handleGiftMessage(clientId, connection, message);
          break;

        case WSMessageType.LIKE_MESSAGE:
          await this.handleLikeMessage(clientId, connection, message);
          break;

        case WSMessageType.HEARTBEAT:
          this.handleHeartbeat(clientId, connection);
          break;

        default:
          this.sendError(connection.ws, '未知的消息类型');
      }
    } catch (error) {
      console.error('处理客户端消息失败:', error);
      this.sendError(connection.ws, '消息处理失败');
    }
  }

  /**
   * 加入直播间
   */
  private async handleJoinStream(
    clientId: string,
    connection: ClientConnection,
    message: any
  ): Promise<void> {
    const { streamId, userId, token } = message;

    // 验证直播间是否存在
    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      this.sendError(connection.ws, '直播间不存在');
      return;
    }

    // 检查直播状态
    if (stream.status !== StreamStatus.LIVE) {
      this.sendError(connection.ws, '直播已结束或未开始');
      return;
    }

    // 验证用户身份（可选）
    if (userId && token) {
      const user = await this.validateUserToken(userId, token);
      if (user) {
        connection.userId = userId;
        connection.username = user.username;
      }
    }

    // 加入直播间
    connection.streamId = streamId;
    this.addClientToRoom(streamId, clientId, connection);

    // 更新观众数
    await this.updateViewerCount(streamId);

    // 发送加入成功消息
    this.sendMessage(connection.ws, {
      type: 'joined_stream',
      streamId,
      timestamp: new Date().toISOString()
    });

    // 发送最近的聊天记录
    const recentMessages = await LiveMessage.getStreamMessages(
      stream._id,
      20,
      undefined,
      [MessageType.CHAT, MessageType.GIFT, MessageType.SUPERCHAT]
    );

    this.sendMessage(connection.ws, {
      type: 'recent_messages',
      messages: recentMessages
    });
  }

  /**
   * 离开直播间
   */
  private async handleLeaveStream(
    clientId: string,
    connection: ClientConnection
  ): Promise<void> {
    if (!connection.streamId) return;

    this.removeClientFromRoom(connection.streamId, clientId);
    await this.updateViewerCount(connection.streamId);

    connection.streamId = undefined;
    
    this.sendMessage(connection.ws, {
      type: 'left_stream',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理聊天消息
   */
  private async handleChatMessage(
    clientId: string,
    connection: ClientConnection,
    message: any
  ): Promise<void> {
    if (!connection.streamId || !connection.userId) {
      this.sendError(connection.ws, '未加入直播间或未登录');
      return;
    }

    const { content } = message;
    
    // 验证消息内容
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      this.sendError(connection.ws, '消息内容不能为空');
      return;
    }

    if (content.length > 500) {
      this.sendError(connection.ws, '消息内容过长');
      return;
    }

    // 检查发言频率限制
    const canSend = await this.checkMessageRateLimit(connection.userId);
    if (!canSend) {
      this.sendError(connection.ws, '发言过于频繁，请稍后重试');
      return;
    }

    // 保存消息到数据库
    const chatMessage = new LiveMessage({
      streamId: connection.streamId,
      userId: connection.userId,
      type: MessageType.CHAT,
      content: content.trim()
    });

    await chatMessage.save();

    // 获取用户信息
    const user = await User.findById(connection.userId).select('username nickname avatar verified level');

    // 广播消息到直播间
    const broadcastMessage = {
      type: 'new_message',
      message: {
        _id: chatMessage._id,
        type: chatMessage.type,
        content: chatMessage.content,
        userId: {
          _id: user?._id,
          username: user?.username,
          nickname: user?.nickname,
          avatar: user?.avatar,
          verified: user?.verified,
          level: user?.level
        },
        createdAt: chatMessage.createdAt,
        likes: 0
      }
    };

    this.broadcastToRoom(connection.streamId, broadcastMessage);
  }

  /**
   * 处理礼物消息
   */
  private async handleGiftMessage(
    clientId: string,
    connection: ClientConnection,
    message: any
  ): Promise<void> {
    if (!connection.streamId || !connection.userId) {
      this.sendError(connection.ws, '未加入直播间或未登录');
      return;
    }

    const { giftId, quantity = 1 } = message;

    // 验证礼物信息
    const giftInfo = await this.getGiftInfo(giftId);
    if (!giftInfo) {
      this.sendError(connection.ws, '无效的礼物');
      return;
    }

    // 验证用户余额
    const user = await User.findById(connection.userId);
    const totalCost = giftInfo.value * quantity;
    
    if (!user || user.virtualCurrency < totalCost) {
      this.sendError(connection.ws, '余额不足');
      return;
    }

    // 扣除用户余额
    await User.findByIdAndUpdate(connection.userId, {
      $inc: { virtualCurrency: -totalCost }
    });

    // 增加主播收入
    const stream = await LiveStream.findById(connection.streamId);
    if (stream) {
      await User.findByIdAndUpdate(stream.streamerId, {
        $inc: { virtualCurrency: Math.floor(totalCost * 0.7) } // 70%分成
      });
    }

    // 保存礼物消息
    const giftMessage = new LiveMessage({
      streamId: connection.streamId,
      userId: connection.userId,
      type: MessageType.GIFT,
      content: `送出了 ${quantity} 个 ${giftInfo.name}`,
      giftInfo: {
        giftId,
        giftName: giftInfo.name,
        giftValue: giftInfo.value,
        quantity,
        animation: giftInfo.animation
      }
    });

    await giftMessage.save();

    // 广播礼物消息
    const broadcastMessage = {
      type: 'gift_message',
      message: {
        ...giftMessage.toObject(),
        userId: {
          _id: user._id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          verified: user.verified
        }
      }
    };

    this.broadcastToRoom(connection.streamId, broadcastMessage);
  }

  /**
   * 处理点赞消息
   */
  private async handleLikeMessage(
    clientId: string,
    connection: ClientConnection,
    message: any
  ): Promise<void> {
    if (!connection.streamId) {
      this.sendError(connection.ws, '未加入直播间');
      return;
    }

    // 更新直播间点赞数
    await LiveStream.findByIdAndUpdate(connection.streamId, {
      $inc: { 'stats.likes': 1 }
    });

    // 广播点赞消息
    this.broadcastToRoom(connection.streamId, {
      type: 'stream_liked',
      userId: connection.userId,
      username: connection.username,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 处理心跳
   */
  private handleHeartbeat(clientId: string, connection: ClientConnection): void {
    connection.lastPing = new Date();
    
    this.sendMessage(connection.ws, {
      type: 'heartbeat_ack',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 客户端断开连接处理
   */
  private async handleClientDisconnect(
    clientId: string,
    connection: ClientConnection
  ): Promise<void> {
    if (connection.streamId) {
      this.removeClientFromRoom(connection.streamId, clientId);
      await this.updateViewerCount(connection.streamId);
    }
  }

  // ==================== 直播间管理 ====================

  /**
   * 添加客户端到直播间
   */
  private addClientToRoom(streamId: string, clientId: string, connection: ClientConnection): void {
    let room = this.rooms.get(streamId);
    
    if (!room) {
      room = {
        streamId,
        clients: new Map(),
        viewerCount: 0,
        lastUpdate: new Date()
      };
      this.rooms.set(streamId, room);
    }

    room.clients.set(clientId, connection);
    room.viewerCount = room.clients.size;
    room.lastUpdate = new Date();
  }

  /**
   * 从直播间移除客户端
   */
  private removeClientFromRoom(streamId: string, clientId: string): void {
    const room = this.rooms.get(streamId);
    if (!room) return;

    room.clients.delete(clientId);
    room.viewerCount = room.clients.size;
    room.lastUpdate = new Date();

    // 如果房间为空，删除房间
    if (room.clients.size === 0) {
      this.rooms.delete(streamId);
    }
  }

  /**
   * 更新直播间观众数
   */
  private async updateViewerCount(streamId: string): Promise<void> {
    const room = this.rooms.get(streamId);
    const viewerCount = room ? room.viewerCount : 0;

    // 更新数据库
    await LiveStream.findByIdAndUpdate(streamId, {
      'stats.currentViewers': viewerCount,
      lastHeartbeat: new Date()
    });

    // 广播观众数更新
    if (room) {
      this.broadcastToRoom(streamId, {
        type: WSMessageType.VIEWER_COUNT,
        count: viewerCount,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 广播消息到直播间
   */
  private broadcastToRoom(streamId: string, message: any): void {
    const room = this.rooms.get(streamId);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    room.clients.forEach((connection, clientId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageStr);
      } else {
        // 移除无效连接
        room.clients.delete(clientId);
      }
    });
  }

  /**
   * 发送消息给特定客户端
   */
  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: WSMessageType.ERROR,
      error,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== 辅助方法 ====================

  /**
   * 生成客户端ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证用户令牌
   */
  private async validateUserToken(userId: string, token: string): Promise<any> {
    try {
      // 这里应该实现JWT令牌验证
      // 简化实现，直接查询用户
      return await User.findById(userId).select('username nickname avatar verified level');
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查消息发送频率限制
   */
  private async checkMessageRateLimit(userId: string): Promise<boolean> {
    const key = `message_rate:${userId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 10); // 10秒窗口
    }
    
    return count <= 5; // 10秒内最多5条消息
  }

  /**
   * 获取礼物信息
   */
  private async getGiftInfo(giftId: string): Promise<any> {
    // 礼物配置（实际应用中应该从数据库获取）
    const gifts: { [key: string]: any } = {
      'rose': { name: '玫瑰', value: 1, animation: 'rose' },
      'heart': { name: '爱心', value: 5, animation: 'heart' },
      'diamond': { name: '钻石', value: 100, animation: 'diamond' },
      'crown': { name: '皇冠', value: 500, animation: 'crown' }
    };
    
    return gifts[giftId] || null;
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 60秒超时

      this.rooms.forEach((room, streamId) => {
        room.clients.forEach((connection, clientId) => {
          const timeSinceLastPing = now.getTime() - connection.lastPing.getTime();
          
          if (timeSinceLastPing > timeout) {
            // 连接超时，移除客户端
            connection.ws.terminate();
            room.clients.delete(clientId);
          }
        });

        // 更新房间信息
        room.viewerCount = room.clients.size;
        
        if (room.clients.size === 0) {
          this.rooms.delete(streamId);
        }
      });
    }, 30000); // 每30秒检查一次
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(async () => {
      try {
        // 清理离线的直播
        await LiveStream.cleanupOfflineStreams();
        
        // 清理过期的聊天消息
        await LiveMessage.cleanupExpiredMessages();
        
        console.log('直播数据清理完成');
      } catch (error) {
        console.error('直播数据清理失败:', error);
      }
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 获取直播服务状态
   */
  public getServiceStatus(): any {
    return {
      activeRooms: this.rooms.size,
      totalConnections: Array.from(this.rooms.values()).reduce((sum, room) => sum + room.clients.size, 0),
      rooms: Array.from(this.rooms.entries()).map(([streamId, room]) => ({
        streamId,
        viewerCount: room.viewerCount,
        lastUpdate: room.lastUpdate
      }))
    };
  }

  /**
   * 关闭服务
   */
  public shutdown(): void {
    console.log('关闭直播服务...');
    
    clearInterval(this.heartbeatInterval);
    clearInterval(this.cleanupInterval);
    
    // 关闭所有WebSocket连接
    this.rooms.forEach((room) => {
      room.clients.forEach((connection) => {
        connection.ws.terminate();
      });
    });
    
    this.wss.close();
    this.rooms.clear();
  }
}

export default new LiveStreamService(parseInt(process.env.WEBSOCKET_PORT || '8080'));