/*
 * 大雄视频平台 - 视频上传页面
 * 支持多种视频格式上传、编辑信息、发布设置等功能
 */

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/layout/Header';
import Button from '../../components/common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { mediaQuery, responsiveStyles } from '../../utils/responsive';

// ============ 类型定义 ============

interface UploadFile {
  file: File;
  id: string;
  name: string;
  size: number;
  duration?: number;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  errorMessage?: string;
  previewUrl?: string;
  thumbnail?: string;
}

interface VideoInfo {
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  thumbnail: string;
  isPrivate: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  scheduleTime?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ============ 样式定义 ============

const PageContainer = styled.div`
  ${responsiveStyles.fullHeight}
  overflow-x: hidden;
  background: var(--background-primary);
`;

const MainContent = styled.main`
  ${responsiveStyles.trueFullScreenContainer}
  padding: var(--space-lg);
  
  ${mediaQuery.down('md')} {
    padding: var(--space-md);
  }
  
  ${mediaQuery.down('sm')} {
    padding: var(--space-sm);
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: var(--space-xl);
`;

const PageTitle = styled.h1`
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  
  @media (max-width: 768px) {
    font-size: var(--font-size-h2);
  }
`;

const PageSubtitle = styled.p`
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin: 0;
`;

const UploadContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-xl);
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
  }
`;

const UploadSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const DropZone = styled.div<{ $isDragActive: boolean; $hasFiles: boolean }>`
  position: relative;
  border: 2px dashed ${props => {
    if (props.$isDragActive) return 'var(--primary-color)';
    if (props.$hasFiles) return 'var(--success-color)';
    return 'var(--border-color)';
  }};
  border-radius: var(--border-radius-lg);
  padding: var(--space-xxxl) var(--space-xl);
  text-align: center;
  background: ${props => {
    if (props.$isDragActive) return 'rgba(24, 144, 255, 0.05)';
    if (props.$hasFiles) return 'rgba(82, 196, 26, 0.05)';
    return 'var(--background-secondary)';
  }};
  cursor: pointer;
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    border-color: var(--primary-color);
    background: rgba(24, 144, 255, 0.05);
  }
  
  @media (max-width: 768px) {
    padding: var(--space-xl) var(--space-lg);
  }
`;

const DropZoneIcon = styled.div<{ $isDragActive: boolean; $hasFiles: boolean }>`
  font-size: 64px;
  margin-bottom: var(--space-lg);
  color: ${props => {
    if (props.$isDragActive) return 'var(--primary-color)';
    if (props.$hasFiles) return 'var(--success-color)';
    return 'var(--text-tertiary)';
  }};
  transition: all var(--duration-base) var(--ease-out);
  
  @media (max-width: 768px) {
    font-size: 48px;
  }
`;

const DropZoneTitle = styled.h3`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-sm) 0;
`;

const DropZoneSubtitle = styled.p`
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0 0 var(--space-lg) 0;
`;

const SupportedFormats = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const FileItem = styled.div`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  display: flex;
  gap: var(--space-md);
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const FilePreview = styled.div`
  width: 120px;
  height: 68px;
  border-radius: var(--border-radius-base);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--background-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-tertiary);
`;

const FilePreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const FileName = styled.div`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  word-break: break-word;
`;

const FileDetails = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
`;

const FileStatus = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: ${props => {
    switch (props.$status) {
      case 'success': return 'var(--success-color)';
      case 'error': return 'var(--error-color)';
      case 'uploading': case 'processing': return 'var(--primary-color)';
      default: return 'var(--text-tertiary)';
    }
  }};
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--background-tertiary);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $progress: number; $status: string }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: ${props => {
    switch (props.$status) {
      case 'success': return 'var(--success-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--primary-color)';
    }
  }};
  transition: width 0.3s ease, background 0.3s ease;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  transition: all var(--duration-base) var(--ease-out);
  
  &:hover {
    background: var(--error-color);
    transform: scale(1.1);
  }
`;

const FormSection = styled.section`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const FormTitle = styled.h2`
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const Label = styled.label`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const RequiredMark = styled.span`
  color: var(--error-color);
`;

const Input = styled.input`
  padding: var(--space-md);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  transition: border-color var(--duration-base) var(--ease-out);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const TextArea = styled.textarea`
  padding: var(--space-md);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  min-height: 120px;
  resize: vertical;
  transition: border-color var(--duration-base) var(--ease-out);
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const Select = styled.select`
  padding: var(--space-md);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const TagInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  min-height: 40px;
  padding: var(--space-sm);
  background: var(--background-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-base);
  cursor: text;
  
  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--primary-color);
  color: var(--text-inverse);
  font-size: var(--font-size-sm);
  border-radius: var(--border-radius-full);
  white-space: nowrap;
`;

const TagRemoveButton = styled.button`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const TagInputField = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-base);
  
  &::placeholder {
    color: var(--text-tertiary);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin: 0;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const SidebarSection = styled.section`
  background: var(--background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
`;

const SidebarTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const TipsList = styled.ul`
  margin: 0;
  padding: 0 0 0 var(--space-md);
  list-style: none;
`;

const TipItem = styled.li`
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-base);
  margin-bottom: var(--space-sm);
  position: relative;
  
  &:before {
    content: '•';
    color: var(--primary-color);
    position: absolute;
    left: -var(--space-md);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const PublishActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-light);
  
  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

// ============ Mock 数据 ============

const mockCategories: Category[] = [
  { id: 'tech', name: '科技', icon: '💻', description: '科技数码相关内容' },
  { id: 'game', name: '游戏', icon: '🎮', description: '游戏相关内容' },
  { id: 'music', name: '音乐', icon: '🎵', description: '音乐相关内容' },
  { id: 'life', name: '生活', icon: '🌟', description: '生活分享内容' },
  { id: 'education', name: '教育', icon: '📚', description: '教育学习内容' },
  { id: 'entertainment', name: '娱乐', icon: '🎭', description: '娱乐相关内容' },
  { id: 'sport', name: '体育', icon: '⚽', description: '体育运动内容' },
  { id: 'food', name: '美食', icon: '🍳', description: '美食相关内容' }
];

// ============ 工具函数 ============

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const getFileTypeIcon = (file: File): string => {
  if (file.type.startsWith('video/')) return '🎬';
  if (file.type.startsWith('audio/')) return '🎵';
  if (file.type.startsWith('image/')) return '🖼️';
  return '📄';
};

// ============ 组件实现 ============

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({
    title: '',
    description: '',
    categoryId: '',
    tags: [],
    thumbnail: '',
    isPrivate: false,
    allowComments: true,
    allowDownload: false,
    scheduleTime: ''
  });
  
  // 处理文件选择
  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      file,
      id: generateId(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      previewUrl: file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    // 模拟上传进度
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile.id);
    });
  }, []);
  
  // 模拟上传过程
  const simulateUpload = (fileId: string) => {
    const updateProgress = () => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          if (file.progress < 100) {
            const increment = Math.random() * 20 + 5;
            const newProgress = Math.min(file.progress + increment, 100);
            
            let newStatus = file.status;
            if (newProgress >= 100) {
              newStatus = Math.random() > 0.1 ? 'success' : 'error';
              if (newStatus === 'error') {
                return { ...file, progress: 100, status: 'error', errorMessage: '上传失败，请重试' };
              }
            } else if (newProgress > 50) {
              newStatus = 'processing';
            } else {
              newStatus = 'uploading';
            }
            
            return { ...file, progress: newProgress, status: newStatus };
          }
        }
        return file;
      }));
    };
    
    const interval = setInterval(() => {
      updateProgress();
      
      setFiles(current => {
        const file = current.find(f => f.id === fileId);
        if (!file || file.progress >= 100) {
          clearInterval(interval);
        }
        return current;
      });
    }, 300 + Math.random() * 200);
  };
  
  // 处理拖拽
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };
  
  // 移除文件
  const handleRemoveFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  // 处理标签输入
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!videoInfo.tags.includes(currentTag.trim())) {
        setVideoInfo(prev => ({
          ...prev,
          tags: [...prev.tags, currentTag.trim()]
        }));
      }
      setCurrentTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setVideoInfo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // 处理发布
  const handlePublish = () => {
    const hasSuccessfulUploads = files.some(file => file.status === 'success');
    
    if (!hasSuccessfulUploads) {
      alert('请等待文件上传完成');
      return;
    }
    
    if (!videoInfo.title.trim()) {
      alert('请输入视频标题');
      return;
    }
    
    if (!videoInfo.categoryId) {
      alert('请选择分类');
      return;
    }
    
    console.log('发布视频:', { files, videoInfo });
    alert('视频发布成功！');
    navigate('/');
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待上传';
      case 'uploading': return '上传中';
      case 'processing': return '处理中';
      case 'success': return '上传成功';
      case 'error': return '上传失败';
      default: return '未知状态';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '📤';
      case 'processing': return '⚙️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };
  
  const hasFiles = files.length > 0;
  const hasSuccessfulUploads = files.some(file => file.status === 'success');
  
  return (
    <PageContainer>
      <Header />
      
      <MainContent>
        <PageHeader>
          <PageTitle>上传视频</PageTitle>
          <PageSubtitle>分享你的精彩内容，让更多人看到</PageSubtitle>
        </PageHeader>
        
        <UploadContainer>
          <UploadSection>
            <DropZone
              $isDragActive={isDragActive}
              $hasFiles={hasFiles}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <DropZoneIcon $isDragActive={isDragActive} $hasFiles={hasFiles}>
                {isDragActive ? '⬇️' : hasFiles ? '✅' : '📤'}
              </DropZoneIcon>
              <DropZoneTitle>
                {isDragActive ? '释放文件开始上传' : hasFiles ? '文件已添加' : '选择或拖拽文件到此处'}
              </DropZoneTitle>
              <DropZoneSubtitle>
                {hasFiles ? '你可以继续添加更多文件' : '支持多个文件同时上传'}
              </DropZoneSubtitle>
              <SupportedFormats>
                支持的格式：MP4, AVI, MOV, WMV, FLV, MKV (最大 2GB)
              </SupportedFormats>
              <Button type="secondary" size="large">
                选择文件
              </Button>
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
            </DropZone>
            
            {hasFiles && (
              <FileList>
                {files.map((file) => (
                  <FileItem key={file.id}>
                    <FilePreview>
                      {file.previewUrl ? (
                        <FilePreviewImage src={file.previewUrl} alt={file.name} />
                      ) : (
                        getFileTypeIcon(file.file)
                      )}
                    </FilePreview>
                    
                    <FileInfo>
                      <FileName>{file.name}</FileName>
                      <FileDetails>
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <FileStatus $status={file.status}>
                          {getStatusIcon(file.status)}
                          {getStatusText(file.status)}
                          {file.errorMessage && ` - ${file.errorMessage}`}
                        </FileStatus>
                      </FileDetails>
                    </FileInfo>
                    
                    <RemoveButton onClick={() => handleRemoveFile(file.id)}>
                      ×
                    </RemoveButton>
                    
                    {file.status !== 'success' && file.status !== 'error' && (
                      <ProgressBar>
                        <ProgressFill $progress={file.progress} $status={file.status} />
                      </ProgressBar>
                    )}
                  </FileItem>
                ))}
              </FileList>
            )}
            
            {hasSuccessfulUploads && (
              <FormSection>
                <FormTitle>
                  <span>📝</span>
                  <span>视频信息</span>
                </FormTitle>
                
                <FormGroup>
                  <Label>
                    标题 <RequiredMark>*</RequiredMark>
                  </Label>
                  <Input
                    type="text"
                    value={videoInfo.title}
                    onChange={(e) => setVideoInfo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="为你的视频起个吸引人的标题"
                    maxLength={100}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>简介</Label>
                  <TextArea
                    value={videoInfo.description}
                    onChange={(e) => setVideoInfo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="介绍一下你的视频内容..."
                    maxLength={1000}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label>
                    分类 <RequiredMark>*</RequiredMark>
                  </Label>
                  <Select
                    value={videoInfo.categoryId}
                    onChange={(e) => setVideoInfo(prev => ({ ...prev, categoryId: e.target.value }))}
                  >
                    <option value="">请选择分类</option>
                    {mockCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label>标签</Label>
                  <TagInput onClick={() => tagInputRef.current?.focus()}>
                    {videoInfo.tags.map((tag) => (
                      <Tag key={tag}>
                        #{tag}
                        <TagRemoveButton onClick={() => handleRemoveTag(tag)}>
                          ×
                        </TagRemoveButton>
                      </Tag>
                    ))}
                    <TagInputField
                      ref={tagInputRef}
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      placeholder={videoInfo.tags.length === 0 ? "添加标签，按回车确认" : ""}
                      maxLength={20}
                    />
                  </TagInput>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)' }}>
                    标签帮助更多人发现你的视频，最多添加10个
                  </div>
                </FormGroup>
                
                <FormGroup>
                  <Label>发布设置</Label>
                  <CheckboxGroup>
                    <CheckboxItem>
                      <input
                        type="checkbox"
                        checked={videoInfo.isPrivate}
                        onChange={(e) => setVideoInfo(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      />
                      <span>设为私密视频（仅自己可见）</span>
                    </CheckboxItem>
                    <CheckboxItem>
                      <input
                        type="checkbox"
                        checked={videoInfo.allowComments}
                        onChange={(e) => setVideoInfo(prev => ({ ...prev, allowComments: e.target.checked }))}
                      />
                      <span>允许评论</span>
                    </CheckboxItem>
                    <CheckboxItem>
                      <input
                        type="checkbox"
                        checked={videoInfo.allowDownload}
                        onChange={(e) => setVideoInfo(prev => ({ ...prev, allowDownload: e.target.checked }))}
                      />
                      <span>允许下载</span>
                    </CheckboxItem>
                  </CheckboxGroup>
                </FormGroup>
                
                <PublishActions>
                  <Button type="secondary" onClick={() => navigate('/')}>
                    取消
                  </Button>
                  <Button type="primary" onClick={handlePublish}>
                    发布视频
                  </Button>
                </PublishActions>
              </FormSection>
            )}
          </UploadSection>
          
          <Sidebar>
            <SidebarSection>
              <SidebarTitle>
                <span>💡</span>
                <span>上传提示</span>
              </SidebarTitle>
              <TipsList>
                <TipItem>建议视频时长控制在5-20分钟</TipItem>
                <TipItem>清晰的标题能获得更多播放量</TipItem>
                <TipItem>添加合适的标签有助于推荐</TipItem>
                <TipItem>高质量的缩略图很重要</TipItem>
                <TipItem>发布前仔细检查内容合规性</TipItem>
              </TipsList>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarTitle>
                <span>📊</span>
                <span>规格要求</span>
              </SidebarTitle>
              <TipsList>
                <TipItem><strong>分辨率：</strong>推荐1080p或以上</TipItem>
                <TipItem><strong>格式：</strong>MP4格式兼容性最佳</TipItem>
                <TipItem><strong>大小：</strong>单文件最大2GB</TipItem>
                <TipItem><strong>时长：</strong>最长不超过4小时</TipItem>
                <TipItem><strong>帧率：</strong>推荐30fps或60fps</TipItem>
              </TipsList>
            </SidebarSection>
            
            <SidebarSection>
              <SidebarTitle>
                <span>⚠️</span>
                <span>注意事项</span>
              </SidebarTitle>
              <TipsList>
                <TipItem>确保拥有视频内容的版权</TipItem>
                <TipItem>不得包含违法违规内容</TipItem>
                <TipItem>避免恶意刷取播放量</TipItem>
                <TipItem>尊重他人隐私和肖像权</TipItem>
                <TipItem>遵守平台社区公约</TipItem>
              </TipsList>
            </SidebarSection>
          </Sidebar>
        </UploadContainer>
      </MainContent>
    </PageContainer>
  );
};

export default UploadPage;