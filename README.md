# KetonpyChat

KetonpyChat 是一个基于 Python Flask 的简易聊天应用，采用前后端分离架构，支持用户登录、消息记录与历史管理。

## 目录结构

```
backend/         # 后端服务（Flask）
  app.py         # 主应用入口
  config.py      # 配置文件
  main.py        # 启动脚本
  requirements.txt # Python依赖
  chatlogs/      # 聊天记录存储
  service/       # 业务逻辑模块
frontend/        # 前端页面与静态资源
  static/        # JS/CSS 静态文件
  templates/     # HTML模板
```

## 安装与运行

### 1. 克隆项目

```bash
git clone https://github.com/trig29/KetonpyChat.git
cd KetonpyChat
```

### 2. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 启动后端服务

```bash
python main.py
```

### 4. 访问前端页面

在浏览器中打开：`http://localhost:5000`

## 功能简介

- 用户登录页面
- 聊天界面，支持消息发送与接收
- 聊天历史记录管理
- 前后端分离，易于扩展

## 依赖

- Python 3.8+
- Flask
- 其他依赖见 `backend/requirements.txt`
