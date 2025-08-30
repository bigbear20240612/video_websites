/*
 * 大雄视频平台 - 简化版登录注册页面
 * 用于调试白屏问题
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// 类型定义
interface LoginForm {
  identifier: string;
  password: string;
  rememberMe: boolean;
  captcha: string;
}

interface PhoneLoginForm {
  phone: string;
  verificationCode: string;
}

interface RegisterForm {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

type AuthMode = 'login' | 'register' | 'phone-login' | 'qr-login';

// 动画
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 样式
const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  background: var(--background-primary);
  overflow-x: hidden;
`;

const AuthPageContent = styled.div`
  background: linear-gradient(135deg, 
    rgba(24, 144, 255, 0.1) 0%, 
    rgba(114, 46, 209, 0.1) 100%
  );
  min-height: calc(100vh - 80px); /* 减去Header高度 */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  
  ${mediaQuery.up('sm')} {
    padding: var(--space-lg);
  }
`;

const AuthContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: clamp(400px, 80vw, 800px);
  width: 100%;
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;
  
  ${mediaQuery.down('md')} {
    grid-template-columns: 1fr;
    max-width: clamp(320px, 90vw, 400px);
  }
`;

const WelcomeSection = styled.div`
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: var(--text-inverse);
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const WelcomeTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--space-md) 0;
`;

const FormSection = styled.div`
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: var(--space-lg);
`;

const FormTitle = styled.h2`
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
`;

const ModeSwitch = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--background-secondary);
  border-radius: var(--border-radius-full);
  padding: 4px;
  margin-bottom: var(--space-lg);
  gap: 2px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }
`;

const ModeSwitchItem = styled.button<{ $active: boolean }>`
  padding: var(--space-sm) var(--space-xs);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-xs);
    padding: var(--space-xs);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const Label = styled.label`
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: var(--space-md);
  background: var(--background-secondary);
  border: 2px solid ${props => props.$error ? 'var(--error-color)' : 'transparent'};
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$error ? 'var(--error-color)' : 'var(--primary-color)'};
    background: var(--background-primary);
  }
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const ErrorMessage = styled.div<{ $visible: boolean }>`
  font-size: var(--font-size-sm);
  color: var(--error-color);
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
`;

const SubmitButton = styled(Button)<{ $loading: boolean }>`
  width: 100%;
  margin-top: var(--space-md);
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: var(--space-sm);
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: var(--space-xl) 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-light);
  }
  
  span {
    padding: 0 var(--space-md);
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
  }
`;

const SocialButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
  }
`;

const SocialButton = styled.button<{ $provider: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: ${props => {
    switch (props.$provider) {
      case 'wechat': return '#07c160';
      case 'qq': return '#1677ff';
      case 'weibo': return '#ff6b6b';
      case 'phone': return '#52c41a';
      case 'email': return '#722ed1';
      case 'github': return '#24292e';
      default: return 'var(--background-secondary)';
    }
  }};
  color: ${props => {
    switch (props.$provider) {
      case 'wechat': case 'qq': case 'weibo': case 'phone': case 'email': case 'github': return 'white';
      default: return 'var(--text-primary)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$provider) {
      case 'wechat': return '#07c160';
      case 'qq': return '#1677ff';
      case 'weibo': return '#ff6b6b';
      case 'phone': return '#52c41a';
      case 'email': return '#722ed1';
      case 'github': return '#24292e';
      default: return 'var(--border-light)';
    }
  }};
  border-radius: var(--border-radius-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 480px) {
    justify-content: flex-start;
    gap: var(--space-md);
  }
`;

const QRCodeSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
`;

const QRCodeContainer = styled.div`
  width: 160px;
  height: 160px;
  background: var(--background-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary-color);
    background: var(--background-tertiary);
  }
`;

const QRCodeIcon = styled.div`
  font-size: 48px;
`;

const QRModeSwitch = styled.div`
  display: flex;
  background: var(--background-secondary);
  border-radius: var(--border-radius-full);
  padding: 2px;
`;

const QRModeItem = styled.button<{ $active: boolean }>`
  padding: var(--space-xs) var(--space-md);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s ease;
`;

const PhoneLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const VerificationCodeGroup = styled.div`
  display: flex;
  gap: var(--space-sm);
`;

const VerificationInput = styled(Input)`
  flex: 1;
`;

const SendCodeButton = styled.button<{ $disabled: boolean; $countdown: number }>`
  padding: var(--space-md);
  background: ${props => props.$disabled ? 'var(--background-tertiary)' : 'var(--primary-color)'};
  color: ${props => props.$disabled ? 'var(--text-tertiary)' : 'var(--text-inverse)'};
  border: none;
  border-radius: var(--border-radius-base);
  font-size: var(--font-size-sm);
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 100px;
  
  &:hover {
    background: ${props => props.$disabled ? 'var(--background-tertiary)' : 'var(--primary-hover)'};
  }
`;

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrMode, setQrMode] = useState<'wechat' | 'app'>('wechat');
  const [countdown, setCountdown] = useState(0);
  
  const [loginForm, setLoginForm] = useState<LoginForm>({
    identifier: '',
    password: '',
    rememberMe: false,
    captcha: ''
  });
  
  const [phoneLoginForm, setPhoneLoginForm] = useState<PhoneLoginForm>({
    phone: '',
    verificationCode: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false
  });
  
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'register') setMode('register');
    else setMode('login');
  }, [searchParams]);
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);
  
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validatePhone = (phone: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phone);
  };
  
  const validateIdentifier = (identifier: string): boolean => {
    return validateEmail(identifier) || validatePhone(identifier);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!loginForm.identifier) {
      newErrors.identifier = '请输入邮箱或手机号';
    } else if (!validateIdentifier(loginForm.identifier)) {
      newErrors.identifier = '请输入有效的邮箱地址或手机号';
    }
    
    if (!loginForm.password) {
      newErrors.password = '请输入密码';
    } else if (loginForm.password.length < 6) {
      newErrors.password = '密码至少6位字符';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: 'user-1',
        username: loginForm.identifier.includes('@') 
          ? loginForm.identifier.split('@')[0] 
          : `用户${loginForm.identifier.slice(-4)}`,
        email: loginForm.identifier.includes('@') ? loginForm.identifier : `${loginForm.identifier}@example.com`,
        avatar: 'https://picsum.photos/120/120?random=me',
        isVip: Math.random() > 0.5
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (error) {
      setErrors({ general: '登录失败，请检查用户名和密码' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!registerForm.username) {
      newErrors.username = '请输入用户名';
    } else if (registerForm.username.length < 2) {
      newErrors.username = '用户名至少2个字符';
    }
    
    if (!registerForm.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(registerForm.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!registerForm.password) {
      newErrors.password = '请输入密码';
    } else if (registerForm.password.length < 8) {
      newErrors.password = '密码至少8位字符';
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = '两次密码输入不一致';
    }
    
    if (!registerForm.acceptTerms) {
      newErrors.acceptTerms = '请阅读并同意服务条款';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('注册成功！请登录您的账号');
      setMode('login');
    } catch (error) {
      setErrors({ general: '注册失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!phoneLoginForm.phone) {
      newErrors.phone = '请输入手机号';
    } else if (!validatePhone(phoneLoginForm.phone)) {
      newErrors.phone = '请输入有效的手机号';
    }
    
    if (!phoneLoginForm.verificationCode) {
      newErrors.verificationCode = '请输入验证码';
    } else if (phoneLoginForm.verificationCode.length !== 6) {
      newErrors.verificationCode = '验证码应为6位数字';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: 'user-phone',
        username: `用户${phoneLoginForm.phone.slice(-4)}`,
        email: `${phoneLoginForm.phone}@phone.login`,
        avatar: 'https://picsum.photos/120/120?random=phone',
        isVip: Math.random() > 0.5
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (error) {
      setErrors({ general: '手机登录失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendCode = async () => {
    if (!phoneLoginForm.phone) {
      setErrors({ phone: '请先输入手机号' });
      return;
    }
    
    if (!validatePhone(phoneLoginForm.phone)) {
      setErrors({ phone: '请输入有效的手机号' });
      return;
    }
    
    setCountdown(60);
    // 模拟发送验证码
    console.log(`发送验证码到: ${phoneLoginForm.phone}`);
  };
  
  const handleSocialLogin = (provider: string) => {
    console.log(`使用 ${provider} 登录`);
    // 模拟第三方登录
    setTimeout(() => {
      const userData = {
        id: `user-${provider}`,
        username: `${provider}用户`,
        email: `${provider}@social.login`,
        avatar: `https://picsum.photos/120/120?random=${provider}`,
        isVip: Math.random() > 0.5
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    }, 1000);
  };
  
  const getModeTitle = (): string => {
    switch (mode) {
      case 'register': return '创建账号';
      case 'phone-login': return '手机登录';
      case 'qr-login': return '扫码登录';
      default: return '欢迎回来';
    }
  };
  
  const getModeSubtitle = (): string => {
    switch (mode) {
      case 'register': return '加入大雄视频，发现更多精彩内容';
      case 'phone-login': return '使用手机号快速登录';
      case 'qr-login': return '使用微信或APP扫码登录';
      default: return '登录您的账号，继续精彩旅程';
    }
  };
  
  return (
    <PageContainer>
      <Header onSearch={() => {}} />
      <AuthPageContent>
        <AuthContainer>
          <WelcomeSection>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎬</div>
          <WelcomeTitle>大雄视频</WelcomeTitle>
          <p>发现精彩内容，分享美好时光</p>
          </WelcomeSection>
        
          <FormSection>
          <FormHeader>
            <FormTitle>{getModeTitle()}</FormTitle>
            <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {getModeSubtitle()}
            </p>
          </FormHeader>
          
          <ModeSwitch>
            <ModeSwitchItem 
              type="button"
              $active={mode === 'login'} 
              onClick={() => setMode('login')}
            >
              密码登录
            </ModeSwitchItem>
            <ModeSwitchItem 
              type="button"
              $active={mode === 'phone-login'} 
              onClick={() => setMode('phone-login')}
            >
              手机登录
            </ModeSwitchItem>
            <ModeSwitchItem 
              type="button"
              $active={mode === 'qr-login'} 
              onClick={() => setMode('qr-login')}
            >
              扫码登录
            </ModeSwitchItem>
            <ModeSwitchItem 
              type="button"
              $active={mode === 'register'} 
              onClick={() => setMode('register')}
            >
              注册
            </ModeSwitchItem>
          </ModeSwitch>
          
          {errors.general && (
            <ErrorMessage $visible={!!errors.general}>
              {errors.general}
            </ErrorMessage>
          )}
          
          {mode === 'login' && (
            <Form onSubmit={handleLogin}>
              <FormGroup>
                <Label>邮箱 / 手机号</Label>
                <Input
                  type="text"
                  value={loginForm.identifier}
                  onChange={(e) => {
                    setLoginForm(prev => ({ ...prev, identifier: e.target.value }));
                    if (errors.identifier) setErrors(prev => ({ ...prev, identifier: '' }));
                  }}
                  placeholder="请输入邮箱或手机号"
                  $error={!!errors.identifier}
                />
                <ErrorMessage $visible={!!errors.identifier}>
                  {errors.identifier}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <Label>密码</Label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm(prev => ({ ...prev, password: e.target.value }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="请输入密码"
                  $error={!!errors.password}
                />
                <ErrorMessage $visible={!!errors.password}>
                  {errors.password}
                </ErrorMessage>
              </FormGroup>
              
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                />
                记住我
              </CheckboxItem>
              
              <SubmitButton 
                type="primary" 
                disabled={loading} 
                $loading={loading}
              >
                {loading && <LoadingSpinner />}
                {loading ? '登录中...' : '登录'}
              </SubmitButton>
            </Form>
          )}
          
          {/* 手机登录表单 */}
          {mode === 'phone-login' && (
            <Form onSubmit={handlePhoneLogin}>
              <FormGroup>
                <Label>手机号</Label>
                <Input
                  type="tel"
                  value={phoneLoginForm.phone}
                  onChange={(e) => {
                    setPhoneLoginForm(prev => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="请输入手机号"
                  $error={!!errors.phone}
                  maxLength={11}
                />
                <ErrorMessage $visible={!!errors.phone}>
                  {errors.phone}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <Label>验证码</Label>
                <VerificationCodeGroup>
                  <VerificationInput
                    type="text"
                    value={phoneLoginForm.verificationCode}
                    onChange={(e) => {
                      setPhoneLoginForm(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g, '') }));
                      if (errors.verificationCode) setErrors(prev => ({ ...prev, verificationCode: '' }));
                    }}
                    placeholder="请输入验证码"
                    $error={!!errors.verificationCode}
                    maxLength={6}
                  />
                  <SendCodeButton
                    type="button"
                    $disabled={countdown > 0 || !phoneLoginForm.phone}
                    $countdown={countdown}
                    onClick={handleSendCode}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </SendCodeButton>
                </VerificationCodeGroup>
                <ErrorMessage $visible={!!errors.verificationCode}>
                  {errors.verificationCode}
                </ErrorMessage>
              </FormGroup>
              
              <SubmitButton 
                type="primary" 
                disabled={loading} 
                $loading={loading}
              >
                {loading && <LoadingSpinner />}
                {loading ? '登录中...' : '手机登录'}
              </SubmitButton>
            </Form>
          )}
          
          {/* 扫码登录 */}
          {mode === 'qr-login' && (
            <QRCodeSection>
              <QRModeSwitch>
                <QRModeItem
                  type="button"
                  $active={qrMode === 'wechat'}
                  onClick={() => setQrMode('wechat')}
                >
                  微信扫码
                </QRModeItem>
                <QRModeItem
                  type="button"
                  $active={qrMode === 'app'}
                  onClick={() => setQrMode('app')}
                >
                  APP扫码
                </QRModeItem>
              </QRModeSwitch>
              
              <QRCodeContainer onClick={() => console.log('刷新二维码')}>
                <QRCodeIcon>{qrMode === 'wechat' ? '💬' : '📱'}</QRCodeIcon>
                <div>点击刷新二维码</div>
                <div style={{ fontSize: 'var(--font-size-xs)' }}>
                  {qrMode === 'wechat' ? '使用微信扫一扫' : '使用大雄视频APP扫一扫'}
                </div>
              </QRCodeContainer>
              
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                扫码后请在{qrMode === 'wechat' ? '微信' : 'APP'}中确认登录
              </div>
            </QRCodeSection>
          )}
          
          {mode === 'register' && (
            <Form onSubmit={handleRegister}>
              <FormGroup>
                <Label>用户名</Label>
                <Input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => {
                    setRegisterForm(prev => ({ ...prev, username: e.target.value }));
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  placeholder="请输入用户名"
                  $error={!!errors.username}
                />
                <ErrorMessage $visible={!!errors.username}>
                  {errors.username}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <Label>邮箱地址</Label>
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => {
                    setRegisterForm(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="请输入邮箱地址"
                  $error={!!errors.email}
                />
                <ErrorMessage $visible={!!errors.email}>
                  {errors.email}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <Label>密码</Label>
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => {
                    setRegisterForm(prev => ({ ...prev, password: e.target.value }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="请输入密码（至少8位）"
                  $error={!!errors.password}
                />
                <ErrorMessage $visible={!!errors.password}>
                  {errors.password}
                </ErrorMessage>
              </FormGroup>
              
              <FormGroup>
                <Label>确认密码</Label>
                <Input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => {
                    setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="请再次输入密码"
                  $error={!!errors.confirmPassword}
                />
                <ErrorMessage $visible={!!errors.confirmPassword}>
                  {errors.confirmPassword}
                </ErrorMessage>
              </FormGroup>
              
              <CheckboxItem>
                <input
                  type="checkbox"
                  checked={registerForm.acceptTerms}
                  onChange={(e) => {
                    setRegisterForm(prev => ({ ...prev, acceptTerms: e.target.checked }));
                    if (errors.acceptTerms) setErrors(prev => ({ ...prev, acceptTerms: '' }));
                  }}
                />
                我已阅读并同意服务条款
              </CheckboxItem>
              <ErrorMessage $visible={!!errors.acceptTerms}>
                {errors.acceptTerms}
              </ErrorMessage>
              
              <SubmitButton 
                type="primary" 
                disabled={loading} 
                $loading={loading}
              >
                {loading && <LoadingSpinner />}
                {loading ? '注册中...' : '注册'}
              </SubmitButton>
            </Form>
          )}
          
          {/* 第三方登录选项 */}
          {mode === 'login' && (
            <>
              <Divider>
                <span>其他方式登录</span>
              </Divider>
              
              <SocialButtons>
                <SocialButton $provider="wechat" onClick={() => handleSocialLogin('微信')}>
                  <span>💬</span>
                  <span>微信</span>
                </SocialButton>
                <SocialButton $provider="qq" onClick={() => handleSocialLogin('QQ')}>
                  <span>🐧</span>
                  <span>QQ</span>
                </SocialButton>
                <SocialButton $provider="weibo" onClick={() => handleSocialLogin('微博')}>
                  <span>📰</span>
                  <span>微博</span>
                </SocialButton>
                <SocialButton $provider="github" onClick={() => handleSocialLogin('GitHub')}>
                  <span>🐙</span>
                  <span>GitHub</span>
                </SocialButton>
                <SocialButton $provider="email" onClick={() => handleSocialLogin('邮箱')}>
                  <span>📧</span>
                  <span>邮箱</span>
                </SocialButton>
                <SocialButton $provider="phone" onClick={() => setMode('phone-login')}>
                  <span>📱</span>
                  <span>手机登录</span>
                </SocialButton>
              </SocialButtons>
            </>
          )}
          
          {mode === 'phone-login' && (
            <>
              <Divider>
                <span>其他方式登录</span>
              </Divider>
              
              <SocialButtons>
                <SocialButton $provider="wechat" onClick={() => handleSocialLogin('微信')}>
                  <span>💬</span>
                  <span>微信</span>
                </SocialButton>
                <SocialButton $provider="qq" onClick={() => handleSocialLogin('QQ')}>
                  <span>🐧</span>
                  <span>QQ</span>
                </SocialButton>
                <SocialButton $provider="weibo" onClick={() => handleSocialLogin('微博')}>
                  <span>📰</span>
                  <span>微博</span>
                </SocialButton>
                <SocialButton $provider="github" onClick={() => handleSocialLogin('GitHub')}>
                  <span>🐙</span>
                  <span>GitHub</span>
                </SocialButton>
                <SocialButton $provider="email" onClick={() => handleSocialLogin('邮箱')}>
                  <span>📧</span>
                  <span>邮箱</span>
                </SocialButton>
                <SocialButton $provider="phone" onClick={() => setMode('login')}>
                  <span>🔐</span>
                  <span>密码登录</span>
                </SocialButton>
              </SocialButtons>
            </>
          )}
          </FormSection>
        </AuthContainer>
      </AuthPageContent>
    </PageContainer>
  );
};

export default AuthPage;