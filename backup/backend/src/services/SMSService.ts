/*
 * 大雄视频平台 - 短信服务
 * 处理短信验证码发送功能
 */

import axios from 'axios';

interface SMSOptions {
  phone: string;
  code: string;
  template?: string;
  type?: 'register' | 'login' | 'reset';
}

class SMSService {
  private apiUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private signName: string;

  constructor() {
    // 这里可以配置不同的短信服务商
    this.apiUrl = process.env.SMS_API_URL || '';
    this.apiKey = process.env.SMS_API_KEY || '';
    this.apiSecret = process.env.SMS_API_SECRET || '';
    this.signName = process.env.SMS_SIGN_NAME || '大雄视频平台';
  }

  /**
   * 发送短信验证码
   */
  public async sendSMS(options: SMSOptions): Promise<boolean> {
    try {
      // 开发环境模拟发送
      if (process.env.NODE_ENV === 'development') {
        console.log(`[模拟短信] 发送到 ${options.phone}:`);
        console.log(`验证码: ${options.code}`);
        console.log(`类型: ${options.type || 'register'}`);
        return true;
      }

      // 生产环境实际发送
      if (process.env.SMS_PROVIDER === 'aliyun') {
        return this.sendAliyunSMS(options);
      } else if (process.env.SMS_PROVIDER === 'tencent') {
        return this.sendTencentSMS(options);
      } else if (process.env.SMS_PROVIDER === 'twilio') {
        return this.sendTwilioSMS(options);
      } else {
        console.warn('未配置短信服务商，使用模拟发送');
        return this.mockSend(options);
      }

    } catch (error) {
      console.error('短信发送失败:', error);
      return false;
    }
  }

  /**
   * 阿里云短信服务
   */
  private async sendAliyunSMS(options: SMSOptions): Promise<boolean> {
    try {
      // 阿里云短信模板
      const templates = {
        register: 'SMS_123456789',
        login: 'SMS_123456790',
        reset: 'SMS_123456791'
      };

      const templateCode = templates[options.type || 'register'];
      
      const params = {
        PhoneNumbers: options.phone,
        SignName: this.signName,
        TemplateCode: templateCode,
        TemplateParam: JSON.stringify({
          code: options.code
        })
      };

      // 这里需要使用阿里云SDK的实际实现
      console.log('发送阿里云短信:', params);
      
      // 模拟成功
      return true;
    } catch (error) {
      console.error('阿里云短信发送失败:', error);
      return false;
    }
  }

  /**
   * 腾讯云短信服务
   */
  private async sendTencentSMS(options: SMSOptions): Promise<boolean> {
    try {
      // 腾讯云短信实现
      const params = {
        PhoneNumberSet: [options.phone],
        TemplateID: process.env.TENCENT_SMS_TEMPLATE_ID,
        Sign: this.signName,
        TemplateParamSet: [options.code, '10'] // 验证码, 有效期
      };

      console.log('发送腾讯云短信:', params);
      return true;
    } catch (error) {
      console.error('腾讯云短信发送失败:', error);
      return false;
    }
  }

  /**
   * Twilio短信服务（国外）
   */
  private async sendTwilioSMS(options: SMSOptions): Promise<boolean> {
    try {
      const message = `【${this.signName}】您的验证码是：${options.code}，有效期10分钟，请勿泄露。`;
      
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          From: process.env.TWILIO_PHONE_NUMBER || '',
          To: options.phone,
          Body: message
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID || '',
            password: process.env.TWILIO_AUTH_TOKEN || ''
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      console.log('Twilio短信发送成功:', response.data.sid);
      return true;
    } catch (error) {
      console.error('Twilio短信发送失败:', error);
      return false;
    }
  }

  /**
   * 模拟发送（开发测试用）
   */
  private async mockSend(options: SMSOptions): Promise<boolean> {
    console.log('=== 模拟短信发送 ===');
    console.log(`手机号: ${options.phone}`);
    console.log(`验证码: ${options.code}`);
    console.log(`类型: ${options.type || 'register'}`);
    console.log('===================');
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }

  /**
   * 验证手机号格式
   */
  public isValidPhoneNumber(phone: string): boolean {
    // 中国大陆手机号验证
    const chinaPhoneRegex = /^1[3-9]\d{9}$/;
    
    // 国际手机号验证（简单版）
    const internationalPhoneRegex = /^\+?[1-9]\d{1,14}$/;
    
    return chinaPhoneRegex.test(phone) || internationalPhoneRegex.test(phone);
  }

  /**
   * 检查短信发送频率限制
   */
  public async checkSendLimit(phone: string): Promise<{ allowed: boolean; remainingTime?: number }> {
    // 这里可以使用Redis实现频率限制
    const key = `sms_limit:${phone}`;
    
    // 模拟检查逻辑
    // 实际实现中应该检查Redis中的记录
    
    return { allowed: true };
  }

  /**
   * 记录短信发送
   */
  public async recordSMSSent(phone: string, code: string, type: string): Promise<void> {
    const record = {
      phone,
      code: code.substring(0, 2) + '****', // 部分隐藏验证码
      type,
      timestamp: new Date(),
      ip: 'system' // 实际使用时应该记录发送IP
    };
    
    // 这里可以写入数据库或日志
    console.log('短信发送记录:', record);
  }

  /**
   * 生成短信验证码
   */
  public generateSMSCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * 获取短信模板内容
   */
  public getSMSTemplate(type: 'register' | 'login' | 'reset', code: string): string {
    const templates = {
      register: `【${this.signName}】欢迎注册！您的验证码是：${code}，有效期10分钟，请勿泄露给他人。`,
      login: `【${this.signName}】您正在登录，验证码是：${code}，有效期10分钟，请勿泄露给他人。`,
      reset: `【${this.signName}】您正在重置密码，验证码是：${code}，有效期10分钟，请勿泄露给他人。`
    };
    
    return templates[type];
  }
}

// 创建单例实例
export const smsService = new SMSService();

// 导出便捷函数
export const sendSMS = (options: SMSOptions) => smsService.sendSMS(options);
export const generateSMSCode = (length?: number) => smsService.generateSMSCode(length);
export const isValidPhoneNumber = (phone: string) => smsService.isValidPhoneNumber(phone);