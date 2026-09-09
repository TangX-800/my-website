# 正式首页源码

此目录保存 home-v3 发布时的可编辑源码及素材。复用同一份 React + Three.js 主页，使用 Vite 打包为 GitHub Pages 静态网页，不需要服务器、数据库或 Sites 项目标识。

## 构建

需要 Node.js 22.13 或更新版本。在本目录运行：

```sh
npm ci
npx vite build --config vite.pages.config.ts
```

结果位于 `out/pages/`。检查后将其中 `index.html`、`assets/`、`cards/`、`original/`、`favicon.svg` 复制到网站根目录，保留根目录 `CNAME`、`.nojekyll` 和其他旧页面，再提交并推送到 main。

## 编辑

- `app/page.tsx`：图片顺序、动效、卡片交互及详情。
- `app/globals.css`：样式。
- `public/cards/`：作品图片。
- `pages-static/index.html`：网页标题及搜索描述。

原始框架项目位于本机 `../home-v3/`，`../home-v3/start-local.cmd` 仍可用于实验预览。继续在实验项目修改时，正式发布前需要同步更新本目录源码和生成文件。

该主页源自 https://github.com/sun090909090/dongxiao （提交 9879b830589dc05af731c62973a1946a84de203a），保留原版空间动效，图片与交互按本站需求调整。源仓库未附 LICENSE；原出处记录保留于此。
