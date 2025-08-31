/*
 * 大雄视频平台 - 简化版登录注册页面
 * 用于调试白屏问题
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';

// 类型定义
interface LoginForm {
  identifier: string;
  password: string;
  rememberMe: boolean;
  captcha: string;
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

type AuthMode = 'login' | 'register';

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
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(24, 144, 255, 0.1) 0%, 
    rgba(114, 46, 209, 0.1) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
`;

const AuthContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 800px;
  width: 100%;
  background: var(--background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: ${fadeInUp} 0.6s ease-out;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    max-width: 400px;
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
  display: flex;
  background: var(--background-secondary);
  border-radius: var(--border-radius-full);
  padding: 4px;
  margin-bottom: var(--space-lg);
`;

const ModeSwitchItem = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'var(--text-inverse)' : 'var(--text-secondary)'};
  border: none;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
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

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [loginForm, setLoginForm] = useState<LoginForm>({
    identifier: '',
    password: '',
    rememberMe: false,
    captcha: ''
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
  
  return (
    <PageContainer>
      <AuthContainer>
        <WelcomeSection>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>🎬</div>
          <WelcomeTitle>大雄视频</WelcomeTitle>
          <p>发现精彩内容，分享美好时光</p>
        </WelcomeSection>
        
        <FormSection>
          <FormHeader>
            <FormTitle>{mode === 'login' ? '欢迎回来' : '创建账号'}</FormTitle>
          </FormHeader>
          
          <ModeSwitch>
            <ModeSwitchItem 
              type="button"
              $active={mode === 'login'} 
              onClick={() => setMode('login')}
            >
              登录
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
        </FormSection>
      </AuthContainer>
    </PageContainer>
  );
};

export default AuthPage;