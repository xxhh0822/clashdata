# Clash Data

《部落冲突》中文数据图鉴。项目使用 Vue 3、Vite 和 TypeScript 构建，数据与图片来自
[`chiefpansancolt/clash-of-clans-data`](https://github.com/chiefpansancolt/clash-of-clans-data)。

## 本地开发

```bash
npm install
npm run sync:data -- --source ../clash-of-clans-data
npm run dev
```

## 校验与构建

```bash
npm run check
npm run build
```

数据更新后可运行 `npm run translate:missing` 生成缺失的静态中文翻译，再人工审校
`translations/entities.zh-CN.json`。站点运行时不会请求翻译服务。

## 声明

本项目是非官方粉丝项目，与 Supercell 没有关联，未获得其认可或赞助。
Clash of Clans 是 Supercell 的商标。
