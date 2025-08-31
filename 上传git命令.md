git status

现在让我检查一下当前的远程仓库配置：

git remote -v



添加所有未跟踪的文件到Git

git add .



提交文件

git commit -m "添加完整的视频网站项目代码，包括前端和后端实现"

将代码推送到GitHub远程仓库

git push origin main



检查Git配置

git config --global --list | findstr user

代理设置问题

git config --global --unset http.proxy



SSH方式连接GitHub,SSH方式需要SSH密钥配置

git remote set-url origin git@github.com:bigbear20240612/video_websites.git

HTTPS方式

git remote set-url origin https://github.com/bigbear20240612/video_websites.git



git push origin main