# Gemini AI 客户端

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

基于Electron + React + TypeScript开发的Gemini AI桌面客户端

## 功能特点

- 跨平台桌面应用 (Windows/macOS，Linux支持未经验证)
- 现代化UI界面 (React + Tailwind CSS)
- 深度集成Google Gemini AI，支持以下功能：
  - 多轮对话管理
  - 流式消息响应
  - 文件上传和解析(支持图片、视频等)
  - 函数调用功能
  - 代码执行和结果返回
  - 自动生成对话标题
  - 系统指令自定义
  - 支持图像生成模型
  - 搜索功能集成
  - 对话历史持久化存储
- 支持Markdown消息渲染和Mermaid图表
- 多语言国际化支持(i18n)，包含以下语言：
  - 简体中文 (zh-CN)
  - 英语 (en)
  - 日语 (ja)
  - 韩语 (ko)
- 模型上下文协议(MCP)集成
- 本地数据存储(Dexie)

## 安装指南

1. 克隆仓库:
   ```bash
   git clone https://github.com/wrtx-dev/gochat.git
   cd gochat
   ```

2. 安装依赖:
   ```bash
   pnpm install
   ```

## 开发运行

```bash
# 开发模式运行
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 项目构建

```bash
# 构建当前平台应用
pnpm build

# 平台特定构建
pnpm build:win    # Windows版本
pnpm build:mac    # macOS版本
```

## 技术栈

- 前端:
  - React 18
  - TypeScript
  - Tailwind CSS
  - shadcn/ui组件库
  - Zustand状态管理
  - i18next国际化支持

- 后端:
  - Electron
  - Vite构建工具
  - Dexie (IndexedDB封装)

## 许可证

Apache 2.0 © wrtx.dev
