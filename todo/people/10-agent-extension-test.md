# 按用户的方式测插件（还没做的部分）

**谁做：** 创始人本人，或者真正能操作桌面的 agent（能点浏览器工具栏里的插件图标）。
**为什么：** 插件是产品的主入口。2026-10-24 的 agent 打不开 `chrome://extensions`，也控制不了桌面，
所以下面两部分一项都没测（A 页面存档、D 多张尺码表已完成，已合并在 PR #5）。
它写好的手动步骤在 `docs/review/extension-test-2026-10-24.md` 末尾。

## 部署安全规则

同以前：从最新 `origin/main` 新建分支 `agent/extension-test-2`，只改 `docs/review/**`、`app-web/eval/**`；
推送前 `npm run guides`、`npm test`、`npm run build` 都要过；开 PR，不合并；不登录零售商，不绕过验证码。

## B. 按用户的方式测插件（Chrome Web Store 版 0.9.2）

1. 在 www.fitpassport.fit 新建测试账号 `agent-test-<日期>`，填编造数据：男，胸围 100 cm，常规松紧。报告里写账户代码。
2. 每一步截图到 `docs/review/screenshots/extension-<日期>/`，结果写进 `docs/review/extension-test-<日期>.md`：

| # | 打开什么 | 期望 |
|---|---|---|
| 1 | Uniqlo AIRism Cotton T 恤、Nike Dri-FIT Legend T 恤 | 给出一个尺码，来源写"从页面读取" |
| 2 | 没有尺码表的上衣：J.Crew 男 T 恤、Old Navy 男 T 恤 | J.Crew 写"J.Crew 公开的尺码指南"；Old Navy 写"估算"并说依据 |
| 3 | 品牌不明、页面没有尺码表的上衣（小众网店） | 拒答，并请你上传尺码表截图或输入尺寸（决策 03） |
| 4 | 两个尺码几乎一样合适（胸围改成 103.8 或 104 cm） | 选大一码，理由写"几乎一样，偏宽松" |
| 5 | 天猫/淘宝男 T 恤（不登录能打开的） | 读出参数或尺码表，或明确说读不到 |
| 6 | eBay 二手衬衫，标题里有 pit to pit | 给出"可能合身 / 偏紧 / 偏松" |
| 7 | 第 1 步的页面"存到待买"，再到 /saved 点"买了" | /history 多一条"留下" |
| 8 | 网站切到中文再点插件 | 插件和网站都显示中文 |
| 9 | 一双鞋、一个帮助页面 | 拒答并说明原因 |

## C. 手动存评测页面

用插件的 **Show exactly what would be sent → Save this capture**（不登录零售商）：
- `hm-regular-fit-tee-mens`、`rei-rainier-rain-jacket-mens`（链接在 `app-web/eval/cases/`）；
- eBay 二手衬衫 3 件：标题有 pit to pit / 只在描述里有 / 只有尺码没有尺寸，各建一个 case 文件，写真实链接。

存到 `app-web/eval/local/captures/<case id>.capture.json`，然后 `npm run captures:pack`，
再跑 `npx vitest run --config vitest.eval.config.ts eval/run.eval.ts`（只跑这一个），提交结果。
