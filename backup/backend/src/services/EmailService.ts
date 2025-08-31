/*
 * 大雄视频平台 - 邮件服务
 * 处理邮件发送功能，包括验证码、通知等邮件
 */

import nodemailer from 'nodemailer';
import { readFile } from 'fs/promises';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  text?: string;
  html?: string;
  data?: { [key: string]: any };
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, string> = new Map();

  constructor() {
    this.initializeTransporter();
  }

  /**
   * 初始化邮件传输器
   */
  private initializeTransporter(): void {
    // 根据环境变量配置不同的邮件服务
    if (process.env.EMAIL_SERVICE === 'smtp') {
      // 自定义SMTP配置
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else if (process.env.EMAIL_SERVICE === 'ses') {
      // Amazon SES 配置
      this.transporter = nodemailer.createTransporter({
        SES: {
          apiVersion: '2010-12-01',
          region: process.env.AWS_REGION || 'us-east-1'
        }
      });
    } else {
      // 开发环境使用测试配置
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass'
        }
      });
      
      console.warn('使用测试邮件配置 - 邮件将不会真实发送');
    }
  }

  /**
   * 加载邮件模板
   */
  private async loadTemplate(templateName: string): Promise<string> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
      const template = await readFile(templatePath, 'utf-8');
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`加载邮件模板失败: ${templateName}`, error);
      return this.getDefaultTemplate();
    }
  }

  /**
   * 获取默认邮件模板
   */
  private getDefaultTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>大雄视频平台</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; }
          .header { background: #1890ff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 大雄视频平台</h1>
          </div>
          <div class="content">
            {{content}}
          </div>
          <div class="footer">
            <p>此邮件由系统自动发送，请勿回复</p>
            <p>© 2024 大雄视频平台. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 渲染邮件模板
   */
  private renderTemplate(template: string, data: { [key: string]: any }): string {
    let rendered = template;
    
    // 简单的模板变量替换
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    });

    return rendered;
  }

  /**
   * 发送邮件
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = '';
      
      if (options.template) {
        // 使用模板
        const template = await this.loadTemplate(options.template);
        html = this.renderTemplate(template, options.data || {});
      } else if (options.html) {
        // 直接使用HTML
        html = options.html;
      } else if (options.text) {
        // 使用默认模板包装纯文本
        const template = this.getDefaultTemplate();
        html = this.renderTemplate(template, { content: options.text });
      }

      const mailOptions = {
        from: `"大雄视频平台" <${process.env.EMAIL_FROM || 'noreply@daxiong.video'}>`,
        to: options.to,
        subject: options.subject,
        html: html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('邮件发送成功:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      // 开发环境下打印预览链接
      if (process.env.NODE_ENV === 'development' && info.previewURL) {
        console.log('邮件预览链接:', info.previewURL);
      }

      return true;
    } catch (error) {
      console.error('邮件发送失败:', error);
      return false;
    }
  }

  /**
   * 发送验证码邮件
   */
  public async sendVerificationCode(to: string, code: string, type: 'register' | 'reset' | 'change'): Promise<boolean> {
    const subjects = {
      register: '邮箱验证 - 大雄视频平台',
      reset: '重置密码 - 大雄视频平台',
      change: '邮箱变更 - 大雄视频平台'
    };

    const contents = {
      register: `
        <h2>欢迎加入大雄视频平台！</h2>
        <p>您的邮箱验证码是：</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1890ff; margin: 20px 0;">
          ${code}
        </div>
        <p>验证码有效期为10分钟，请及时使用。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
      `,
      reset: `
        <h2>重置密码</h2>
        <p>您正在重置大雄视频平台的登录密码。</p>
        <p>您的验证码是：</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1890ff; margin: 20px 0;">
          ${code}
        </div>
        <p>验证码有效期为10分钟，请及时使用。</p>
        <p>如果这不是您的操作，请立即联系客服。</p>
      `,
      change: `
        <h2>邮箱变更确认</h2>
        <p>您正在将大雄视频平台账号的邮箱变更为此邮箱地址。</p>
        <p>您的验证码是：</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #1890ff; margin: 20px 0;">
          ${code}
        </div>
        <p>验证码有效期为10分钟，请及时使用。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
      `
    };

    return this.sendEmail({
      to,
      subject: subjects[type],
      template: 'verification-code',
      data: {
        content: contents[type],
        code
      }
    });
  }

  /**
   * 发送欢迎邮件
   */
  public async sendWelcomeEmail(to: string, nickname: string): Promise<boolean> {
    const content = `
      <h2>欢迎加入大雄视频平台，${nickname}！</h2>
      <p>感谢您注册大雄视频平台，这里有丰富的视频内容等您探索。</p>
      
      <h3>您可以：</h3>
      <ul>
        <li>🎥 观看海量精彩视频内容</li>
        <li>📤 上传您的创意作品</li>
        <li>💬 与其他用户互动交流</li>
        <li>❤️ 关注您喜欢的创作者</li>
        <li>🎯 发现个性化推荐内容</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://daxiong.video'}" 
           style="background: #1890ff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          立即开始探索
        </a>
      </div>
      
      <p>如果您有任何问题，随时可以联系我们的客服团队。</p>
      <p>祝您在大雄视频平台度过愉快的时光！</p>
    `;

    return this.sendEmail({
      to,
      subject: '欢迎加入大雄视频平台！',
      data: { content }
    });
  }

  /**
   * 发送密码修改通知
   */
  public async sendPasswordChangeNotification(to: string, nickname: string, ip: string): Promise<boolean> {
    const content = `
      <h2>密码修改通知</h2>
      <p>亲爱的 ${nickname}，</p>
      <p>您的大雄视频平台账号密码已成功修改。</p>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <strong>修改信息：</strong><br>
        时间：${new Date().toLocaleString('zh-CN')}<br>
        IP地址：${ip}
      </div>
      
      <p>如果这不是您的操作，请立即：</p>
      <ul>
        <li>联系客服：support@daxiong.video</li>
        <li>或访问我们的帮助中心</li>
      </ul>
      
      <p>为了您的账号安全，建议您定期修改密码，并启用两步验证。</p>
    `;

    return this.sendEmail({
      to,
      subject: '密码修改通知 - 大雄视频平台',
      data: { content }
    });
  }

  /**
   * 验证邮件服务连接
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('邮件服务连接正常');
      return true;
    } catch (error) {
      console.error('邮件服务连接失败:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();

// 导出便捷函数
export const sendEmail = (options: EmailOptions) => emailService.sendEmail(options);
export const sendVerificationCode = (to: string, code: string, type: 'register' | 'reset' | 'change') => 
  emailService.sendVerificationCode(to, code, type);
export const sendWelcomeEmail = (to: string, nickname: string) => 
  emailService.sendWelcomeEmail(to, nickname);
export const sendPasswordChangeNotification = (to: string, nickname: string, ip: string) => 
  emailService.sendPasswordChangeNotification(to, nickname, ip);