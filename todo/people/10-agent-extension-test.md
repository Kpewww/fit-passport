# Agent 任务：测插件、抓页面、收集多张尺码表

**谁做：** 能操作桌面和浏览器的 agent（可以点插件图标）。
**为什么：** 插件是产品的主入口，需要按真实用户的方式完整测一遍；评测需要把抓下来的页面放进仓库；
很多品牌不止一张尺码表，要收齐、分好类。

---

## 部署安全规则（每次都一样，必须遵守）

1. `git fetch`，从最新的 `origin/main` 新建分支 `agent/extension-test`，只在这个分支上工作。不推 main，不合并 PR。
2. 只允许改这些位置：
   - `app-web/data/brand-guides/**`
   - `app-web/eval/captures/**`、`app-web/eval/replay-baseline.json`、`app-web/eval/results/**`、`app-web/eval/cases/**`
   - `app-web/src/lib/brandGuides.generated.json`（只能通过 `npm run guides` 生成）
   - `docs/review/**`

   代码、`package.json`、`package-lock.json`、`prisma/`、`scripts/`、Vercel 设置、环境变量，一律不动。
3. 装依赖用 `npm ci`，不要用 `npm install`。如果 `package-lock.json` 变了，用 `git checkout -- app-web/package-lock.json` 还原。
4. 推送前在 `app-web` 里依次跑：`npm run guides`（0 invalid）、`npm test`、`npm run build`，三个都必须通过。
5. 开 PR，看 Vercel Preview。变红就读日志、写进报告，不要去改设置。
6. 不登录零售商网站，不绕过验证码、拦截或条款弹窗。遇到就跳过并记下原因。

---

## A. 把已有的评测页面放进仓库

1. 你电脑上的 `app-web/eval/local/captures/` 里应该有 9 个 `*.capture.json`。
2. 在 `app-web` 里运行 `npm run captures:pack`。压缩后放进 `app-web/eval/captures/`；登录状态下抓的页面会被拒绝。
3. 运行 `npx vitest run --config vitest.eval.config.ts eval/run.eval.ts`。
   - 只跑这一个文件。不要跑完整的 `npm run eval`，里面有一个付费的分类测试。
   - 它会写出 `eval/results/<日期>.md/.json` 和 `eval/replay-baseline.json`，都要提交。
4. 再跑 `npm test`，必须全部通过。

## B. 按用户的方式测插件

**准备：**
- 用 Chrome Web Store 上的 Fit Passport 插件（0.9.2）。
- 在 www.fitpassport.fit 新建一个测试账号，用户名 `agent-test-<日期>`。
- 填编造的身体数据：男，胸围 100 cm，常规松紧。**不要用任何真人的数据。**
- 在报告里写下账号的账户代码，创始人测完会在 /admin 删掉它。

**每一步都截图**，放在 `docs/review/screenshots/extension-<日期>/`，然后记录结果：

| # | 打开什么 | 期望 |
|---|---|---|
| 1 | 有尺码表的商品页：Uniqlo AIRism Cotton T-Shirt、Nike Dri-FIT Legend T-Shirt | 给出一个尺码，来源写"从页面读取"，有推荐理由 |
| 2 | **没有尺码表**的上衣页：J.Crew 男士 T 恤、Old Navy 男士 T 恤 | 不拒答。J.Crew 写"J.Crew 自己的尺码表"；Old Navy 写"估算"，并给出依据 |
| 3 | 两个尺码几乎一样合适的情况（换胸围试 103.8 或 104 cm） | 选大一码，理由写"几乎一样，偏宽松"，次选写小一码 |
| 4 | 天猫/淘宝的一件男士 T 恤（不登录能打开的） | 读出参数或尺码表，或者明确说读不到 |
| 5 | eBay 二手衬衫，标题里有 pit to pit | 给出"可能合身 / 偏紧 / 偏松"的判断 |
| 6 | 在第 1 步的页面点"存到待买"，再到 /saved 点"买了"，填松紧 | /history 里多一条"留下"的记录 |
| 7 | 网站切到中文，再点一次插件 | 插件和网站都显示中文 |
| 8 | 一双鞋、一个帮助页面 | 拒答，并说明原因 |

结果写进 `docs/review/extension-test-<日期>.md`：每一步写通过 / 不通过，期望是什么，实际是什么，截图文件名。
**不通过的地方写清楚就好，不要去改代码。**

## C. 手动抓评测页面（之前自动化做不了的）

用插件的 **Show exactly what would be sent → Save this capture**（不登录零售商）：
- `hm-regular-fit-tee-mens`、`rei-rainier-rain-jacket-mens`：链接在 `app-web/eval/cases/` 里。
- eBay 二手衬衫 2–3 件，每种各一件：
  - 标题里写了 pit to pit；
  - 只在描述里写了；
  - 只有尺码、没有测量数据。

  每件照现有格式在 `app-web/eval/cases/` 里新建一个 case 文件，写上真实链接。

存到 `app-web/eval/local/captures/<case id>.capture.json`，然后重做 A 的第 2–4 步。

## D. 收齐每个品牌的所有尺码表，并分类

对 `app-web/data/brand-guides/` 里的每个品牌（再加上 Nike），去官网找出**所有不同的上衣尺码表**：
- 通用尺码页 vs 商品页弹窗里的表；
- 按品类分的表：T 恤、衬衫、毛衣/针织、外套、卫衣、运动服；
- 只收常规版型（Regular）。Tall、Slim、Petite、Big 不收，但在备注里写明它们存在。

还没收的表，每张另存一个文件。字段规则见 `todo/people/09-brand-size-guides.md`，`reviewed` 填 `false`。**每个文件都要填：**
- `appliesTo`：这张表印给哪些衣服：`tshirt` / `shirt` / `sweater` / `jacket` / `hoodie` / `polo` / `top`；适用于所有上衣就不填；
- `variant`：通用尺码页填 `general`，商品页弹窗填 `product`。

同一个品牌、同一个品类，两张表数字一样就只留一张，在备注里写"另一张数字相同"。

最后写 `docs/review/multi-chart-brands-<日期>.md`，每个品牌一行：
- 一共有几张表、每张适用什么；
- 哪些数字互相矛盾；
- 哪些没收到、为什么。

---

## 最后给创始人

PR 链接、Preview 状态，以及 B 的测试结果表（通过几项、不通过几项、最重要的问题）。
