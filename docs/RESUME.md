# Resume prompt — paste this to pick up where we left off

> The cold-start brief for a new chat: what this is, the hard constraints, what
> already exists, and what to do next. Keep it current at the end of every session.
>
> **Last updated: Session 88 · 2026-10-06 — LIVE, 807 tests + 1 honest skip.**
>
> **Deliberately path- and machine-independent.** This file has been rewritten
> twice because it named one particular computer, and every path in it died the
> next time the project moved. Machine setup is not project knowledge and stays
> out of the repo. Whatever machine you are on: the app is in `app-web/`, and a
> fresh clone has **source only**.

**A clone needs setting up before anything runs:**

```bash
cd app-web
npm install
cp .env.example .env        # then set SESSION_SECRET to a random string
npm run db:push             # creates the local SQLite database
node scripts/seed-admin.mjs # prints the local admin credentials + demo data
npm run dev
```

⚠️ **`npm install` on macOS rewrites `package-lock.json`**, stripping the Linux
`libc` entries. Do **not** commit that diff — Vercel builds on Linux and needs
them. `git checkout -- app-web/package-lock.json` afterwards.

---

我在继续开发 **Fit Passport** —— "消费者自有、可跨店携带的
合身档案"Web 应用。app 在 `app-web/`,私有仓库 **github.com/Kpewww/fit-passport**。

**【沟通约定】全程中文聊天;git commit message 用英文;DEVLOG.md 用英文。**

**技术栈:** Node 24 LTS + **Next.js 14.2.35** App Router + React 18 + TS +
Tailwind 3 + Prisma 5.22 + SQLite(本地)/ Postgres(生产)+ Zod + Vitest;动效
Framer Motion(**Lenis 已移除**);three.js 懒加载:徽章 inspect **以及** 3D 人台/松量壳(`BodyMesh3D.tsx`)。
命令:`npm run dev`、`npm run typecheck`、`npm test`(**637 个 + 1 个诚实跳过;看退出码,不要只看 Tests 那一行**)、`npm run build`、
改 schema 后 `npm run db:push`(**还必须建 migration**,见铁律 10)、生成文档 PDF `npm run docs:pdf`。
测量工具:`app-web/scripts/mobile-audit.mjs`(移动端布局)、
`brand/tests/size-test.mjs`(标志尺寸)、`app-web/scripts/capture-chart.mjs`(抄品牌尺码表)、
`browser-extension/scripts/try-pages.mjs`(真实页面跑全链路)。均需 `npx playwright install chromium`。
评估:`npm run eval`(离线 B+S5)、`EVAL_LIVE=1 npm run eval`(加上服务器路径 A)。
**每轮结束务必:tsc + test + build + live smoke 全过 → commit & push → 更新
DEVLOG + memory。**

**课程分工:** `coursework/technical/` = 技术实现/可行性/作业；`coursework/startup/` = 市场/商业/产品交付。核心代码仍只有 `app-web/` 一份。

**动手前必读**:`docs/memory/README.md` 是索引,其中
`project-fit-passport-build-state`(架构 + 铁律,**必读**)、
`project-fit-passport-performance`(性能陷阱)、
`project-fit-passport-deployment`(**含一次生产事故的教训**)、
`project-fit-passport-design-system`(视觉 + **移动端规则**)、
`project-fit-passport-closet-signal-design`(合身信号)、
`project-fit-passport-logo`(标志资产 + 尺寸下限)、
`project-fit-passport-next-steps`(**为什么这么排 —— 推理与历史,当前清单在文件底部**);
以及 `docs/design/*.md`(研究)、`DEVLOG.md`(逐次记录)。

**要动手做什么,看 `todo/`** —— 那是可领取的任务板,按"谁能推动它"分组
(`people/` 需要人工、`decisions/` 等创始人拍板、`engineering/` 编码)。
`todo/` 说做什么,`next-steps.md` 说为什么。

---

## 现状(Session 76 · 2026-09-29)

**已上线:https://www.fitpassport.fit**(2026-10-06 起;旧地址 fit-passport.vercel.app 跳转过来,会话随之迁移) — Vercel + Neon Postgres + Upstash
Redis,**265 测试**,push 到 `main` 即自动部署。生产管理员 `AK`,密码在 Session 41
播种时随机生成(**与本地播种脚本的默认值不同**)。

**Session 41–48(引擎与体验):**
- 上线;安全(Next 14.2.35 补丁、SSRF 守卫逐跳重检、非服装页 422 拒绝)
- 置信度校准:信号矛盾时降置信并**说明原因**(`conflictNote`)
- 抓取策略:不买穿透代理(法律姿态),答案是浏览器插件;`source.fetch` 埋点
- 性能:移除 Lenis、修 per-pointermove setState、修 WebGL 泄漏、徽章默认扁平
- **带符号合身刻度**(S45):`-10 太紧 … 0 正好 … +10 太松`;`fitRating` 改为**推导**;
  `/check` 加松量示意图
- **生产事故 + 护栏**(S46):只跑 `db:push` 没建 migration → 生产 500;
  已加 `schemaMigrations.test.ts`
- **衣橱信号**(S47):品牌偏差**零购买记录**即可从衣橱学习;报告散乱降置信
- **移动端**(S48):**手机上原本没有导航**;已加菜单面板;修掉 3 处被
  `overflow-x-clip` 藏起来的裁切

**Session 49–56(文档与品牌):**
- 文档全面校准;`docs/course/` → **`docs/business/`**
- **Fit Thread 标志**:清理出真矢量母版 + 反白 + micro;**favicon 重画为矢量**
  (16px 404 字节);色板定为 **Cool Porcelain `#F3F3F1`**(Warm Ivory 退役)
- **陷阱**:一份"修复版"SVG 其实是位图套壳(零 path),且内嵌 PNG 与仓库已有的
  字节相同。**判断矢量先看有没有 `<path>`,别信文件名。**
- **信息架构已测量并写成草案**(`coursework/startup/product-design/information-architecture.md`,
  **未实现**)

**Session 57–58(信息架构):**
- **`/closet` 添加表单从 11 个字段的网格改成 4 个问题、一屏一问**(`AddItemFlow` +
  `src/lib/addFlow.ts`)。实测:输入控件 **28 → 15**,可点元素 **127 → 84**,
  **5.5 → 4.5 屏**。留哪四个问题由 FIC 预算决定并由 `addFlow.test.ts` 钉住
  (铁律 ㉙)。

**Session 59(整理):**
- **`brand/` 移到仓库根目录** —— 标志是构建输入不是文档。`docs/` 是读的,
  `brand/` 是构建用的;设计说明仍留在 `coursework/startup/product-design/LOGO_CONCEPT.md`。
- 颜色调色板从 **4 份合并成 1 份**(`src/lib/colors.ts`)。

**Session 72(品牌尺码表):**
- **大牌的尺码表改成"策展真数据",不再是编的。** `src/lib/brandCharts.ts`,新来源
  `sizesFrom: "brand-chart"`,排在 `page` 之下、`estimated` 之上。已收 **Nike 男装
  上衣**(官网 body 表,robots 允许)。被墙的品牌(Patagonia/Uniqlo/COS/H&M/Zara/
  Adidas)只能人工抄 —— 配方见 `docs/design/brand-size-charts.md`。
- **两个只有"看渲染页面"才能发现的 bug**:body range 的判语全反了(铁律 32);
  `/check` 对着一个从没读过的页面写"measurements from the page"。两个都通过了
  全部单元测试和 API 检查。**这是 Session 69 那条教训隔一轮又复现了一次。**

**Session 73–74(插件接口 + 人体/平铺之分):**
- `/api/check` 除 `{url}` 外接受 `{html}` —— 页面由浏览器递过来。`sizesFrom` 与
  `fetch` 分开记(铁律 54):数字仍来自零售商页面,但服务器什么都没抓。
- **实测:每次直接爬 URL 不可行**(铁律 53)—— 能过检测的配置需要真实窗口,
  serverless 没有;能部署的 headless 恰好是被检测的那个。
- 页面解析学会区分**人体围度 vs 平铺尺寸**(铁律 57):页面自己的原话优先,
  其次品牌已记录的惯例。重复尺码标签合并成区间(铁律 58)。

**Session 75–75d(Sprint 5:浏览器插件 + 评估):**
- **插件已建好并跑通**:`browser-extension/`(MV3,无构建步骤)。真实页面实测
  Patagonia **1.78 MB → 11 KB(−99.4%)**,16 ms;production 的 session cookie
  确实能从插件送达线上 API。
- 服务端先加固:`checkPolicy.ts`;插件无 session **401 而非偷偷建账号**(铁律 60);
  `/api/check` 限流;**绝不对浏览器递来的页面打分编造的尺码梯**(铁律 59)。
- **Uniqlo 曾返回 L(应为 M)** —— 插件第一个碰到的既有解析 bug(分数英寸、
  页面边角料误判平铺),75c 已修 → 现在 **M, true to size**。
- **评估框架 `app-web/eval/`**:11 个真实案例、三套系统(A 服务器 / B 仅策展表 /
  S5 插件)。**ground truth 目前 0/11 —— 所有数字都卡在这里,只有人能做。**
- ⚠️ **"有头浏览器能过"已不再可靠**:H&M、REI 现在连有头也拒绝,Patagonia
  间歇性挡。评估抓取改为人工点插件的 **Save this capture**。

**Session 76(redesign R0–R7,已完成):**
- "Editorial Atelier":emoji 全换成生成的 Phosphor 图标集(铁律 67/68)、新 shell
  与导航、衣橱改成用户自己照片的画廊、Check 结果**以答案开头**、首页删掉两个
  重复段落、无障碍审计(对比度 AA、焦点环、reduced-motion)。
- **教训:宽屏要在 1920 看,不只是 1440** —— 那轮三个布局问题全是宽屏才有。

**Session 78(评分系统 + 插件下载,分阶段推送 78a–78e):**
- 规格书 `docs/design/scoring-system.md` 是评分的唯一说明:每个数字都在
  `scoringConstants.ts` 登记来源(measured / cited / assumed),测试会校验文档与代码一致;
  改常数后运行 `node scripts/scoring-table.mjs`。
- 稳定性(`stability.ts`)取代原来的前两名差距:按体测 ±2 cm、尺码表 ±1 cm 做网格,
  页面上显示"胸围在 X–Y cm 之间都选这个"。
- 合身感受按区间处理,互相矛盾的反馈不会被平均;购买结果(outcome)必须说明往哪个方向不合身。
- 防捣乱(§9):自己的数据只影响自己 → 检测、不学习、说明原因;社区投票只计已认领、
  非作者的账号;跨用户品牌知识**只写了设计,没有实现**。
- 首页以插件为主,URL 输入框折叠并标注为 Beta;`/extension` 提供 zip 下载。换成 Chrome
  商店只需改 `extensionDistribution.ts` 一个常量。
- 内部评估(`npm run eval`)现在报告稳定性、Brier / 过度自信差值 / "自信但错了"
  (没有真值时 n = 0,显示为 null),以及捣乱人设的防护检查。S5 需要
  `eval/local/captures`(被 git 忽略,换电脑后不在)。
- ⚠ 本地 `.env` 的 Upstash 为空,开发环境用的是进程内限流(路由重新编译时会清零)。

**Session 79(中文版 + 中|EN 切换,分阶段推送 79a–79h):**
- 自建 i18n(`app-web/src/i18n/`,无依赖):`messages/en.ts` 是源,`zh.ts` 类型为
  `Messages`,少一个键 tsc 就报错。语言顺序:`x-fp-lang` 头 → `fp-lang` cookie →
  浏览器语言 → 英文。品牌名只用 Fit Passport。文案规范见 `docs/design/chinese-copy.md`。
- 除 `/admin` 外所有页面、引擎的理由与拒答(`lib/engineText.ts`)、API 的提示句
  (`say()` + `API_ZH`)、插件弹窗(0.3.0,自带切换)都有中英两版。存储的值仍是英文键,
  只在显示时翻译。
- 守卫测试 `i18n/untranslated.test.ts`:页面或组件里直接写英文短语会失败(铁律 81–83)。
- 天猫:没有 JSON-LD,品牌/性别从「参数信息」按标签读,商品名取清洗过的 `<title>`;
  淘宝的「我的档案」(身高/体重)从不读取。

**Session 80(创始人中文定稿 + 界面 + 衣橱链接 + 待购 + 二手判断,推送 80a–80e):**
- 中文文案以创始人定稿为准:`docs/design/chinese-copy-2026-09-30.md`(存档),术语与偏差表见
  `docs/design/chinese-copy.md`(合身护照、认领账户、身形数据、可信度;Chrome 按钮用实测的
  「加载未打包的扩展程序」)。`/admin` 也已双语。
- 页脚只剩 `© 2026 Fit Passport`,没有语言切换;顶部切换缩小 12%,点击区不变。桌面导航从
  **lg(1024px)** 起才显示,中英文坐标一致(Δ 0 px);640–1000px 原来英文会溢出、账户按钮被裁掉。
- 衣橱「按链接添加」只预填页面真读到的内容(`lib/closetExtract.ts`);演示数据只回答四个演示
  链接(`lib/demoProducts.ts`)并标「演示数据」。
- **待购**:`SavedItem` 独立表(迁移 `20260930120000_saved_items`),`/api/saved`、`/saved` 页;
  插件 0.4.0 起「加入待购」;「已购买，加入衣橱」走衣橱添加流程且必须回答合身感。
- **二手单品判断**(插件 0.5.0 + `/check`):`lib/sellerMeasurements.ts` 读卖家实测(腋下平铺 ×2
  = 衣物胸围),`lib/listingJudgement.ts` 给出「较可能合身 / 可能偏紧 / 可能偏松」+ 依据强度;
  eBay 描述框架用**可选**主机权限读取。eBay 拒绝我们的服务器,网站上靠用户手填卖家尺寸。
- 淘宝/天猫(80f,真实登录访问):两件商品读到参数信息和尺码表，四件「加入待购」200、重复 409;
  随后淘宝风控对自动化浏览器隐藏详情(「访问异常提示」)并跳登录页。插件 **0.5.1** 识别这两种页面，
  直接说明情况，不再给猜测的结论。

- **Session 81**:中文大标题不画标点(`components/Headline.tsx`,文案本身保留标点);首页恢复
  滚动卡片动画(`SignalsDeck`,lg 起);护照封面改为「合身卡 / Fit Card」。Chrome 商店上架:一次性
  US$5,需创始人注册;上架前要做的见 `todo/people/05-chrome-web-store.md`。

- **Session 82**:导航改为 衣橱 / 护照 / 搭配 / 社区 / 插件 / 尺码 / 帮助;标题保留 ？！ 和「」(半宽);
  Chrome 商店上架资料已备好(`docs/store/`,`pack-extension.mjs --store`,`/privacy`),还差创始人:
  注册付款、公开的联系邮箱(`lib/siteContact.ts`)、trader 声明、上传。插件 0.6.0。

- **Session 83–86**(另一台机器为主):选尺码表图片读图(83)、Jev 认品类 + 问用户品类(84)、
  网站引导到 Chrome 商店(85,0.6.0 已上架)、Vercel Web Analytics(86)。

- **Session 88**(创始人七项要求):
  - **男女装尺码**:`lib/womensSizes.ts`(美码为基准，德/欧 +30、法 +32、意 +36、英 +4);
    引擎按男女装线读数字尺码;换算器有 男装|女装,**EU 为主、可展开法国/意大利**。
  - **分清同款单品**:推荐理由点名用的是哪件(`pieceLabel`),/check 列出「依据的衣橱单品」;
    `styleWords.ts` 同款式优先(`KNOWN_GOOD.styleMismatch` = 0.6,假设值);衣橱提示给同款起名。
  - **衣橱**:删除可撤销 6 秒、多选删除;照片可上传 / 粘贴 / 截屏裁剪 / 拍照(`PhotoSource`);
    批量添加(`BatchAdd`);`photoFrom` 列(迁移 `20261006120000_closet_photo_from`)。
  - **插件 0.8.0**:「我有这件，加入衣橱」截图裁到商品图(activeTab,无新权限，只给本人看);
    弹窗可直接进网站(衣橱/待购/档案/查尺码)。商店下一次更新上传 0.8.0,并改隐私声明。

**下一步:见 `todo/`(做什么)与 `docs/memory/project-fit-passport-next-steps.md`
底部(为什么)。** 客户访谈**已由创始人推迟**;插件**已不再受访谈证据门槛限制**
(Session 73 创始人拍板)。

---

## 重要约束(不可违反)

1. fit 引擎是**透明打分不是 LLM**(LLM 只抽商品数据,永不决定尺码)。
2. **隐私铁律**:凭账号码只能看 closet + 粗略体型,**精确厘米永不外泄**,
   deactivated 账号对外全屏蔽。
3. **不放品牌 logo/盗图**,品牌只用文字、图片只用用户自己上传。
4. `authEdge.ts` 必须和 `auth.ts` 字节兼容。
5. `KnownGoodItem.category` 是引擎服装类型**不可改名**,`Collection` 才是用户可改的文件夹。
6. 生产必须设 `SESSION_SECRET`(**按调用解析**,不能在模块加载时抛错,否则 build 挂)。
7. **跑过 `npm run dev` 后的生产冒烟不可信**,必须先清 `.next` 再 build。
8. 页面 hang 在 Loading:**先查 API 再查组件**。改完 schema 之后尤其如此——
   Session 46 的 `/passport` 卡 loading 就是 `/api/status` 在 500。其次查端口僵尸进程。
9. 改 schema 后**重启 dev server**(否则旧 Prisma Client 500)。
10. **改 schema 必须建 migration**,`db:push` 只动本地 SQLite。见 `docs/DEPLOYMENT.md` §1。
11. 生产 migration 走 **direct 主机**不能走 `-pooler`;环境变量 `DATABASE_URL`(pooled)
    **和** `DIRECT_URL`(direct)两条都要。
12. `prisma/migrations/migration_lock.toml` **必须存在且提交**。
13. `npm run db:pg:generate` 会把本地 Prisma Client 覆盖成 Postgres 版,
    跑完 `npx prisma generate` 切回。
14. **合身输入永远不是拖动滑块**(实测手机放弃率 37% vs 单选 2.3%);
    `fitRating` 由 `fitDirection` **推导**,不单独问。
15. **1024px 以下导航必须存在**——桌面标签从 `lg` 起才显示(Session 80 前是 `sm`,
    英文在平板宽度会溢出),`Nav.tsx` 里的菜单面板就是 1024px 以下的导航本体。
16. 任何写 `fitRating` 的地方必须同时写 `fitDirection`,否则同一行数据自相矛盾。
17. **判断一个 SVG 是不是矢量,先看有没有 `<path>`**——文件名和来意都可能骗人。
18. **标志有尺寸下限**:母版 ≥40px、micro 24–40px、**16–20px 必须用另画的
    favicon 字形**。小尺寸要在 `deviceScaleFactor=1` 下判断,视网膜截图会骗人。
19. **衣橱添加流程只问引擎会读的东西**——`gender`/`color` 在 `fitEngine.ts` 里
    出现 **0 次**,`areaNotesJson` 只存不算。四个问题合计 30 FIC,正好是首次预算
    上限,加第五个就破线,`addFlow.test.ts` 会红。**且必须先问品类再问尺码**。
20. **`Logo.tsx` 是把母版路径当字符串内联的,不是读 SVG 文件**。两份要靠
    `logoAsset.test.ts` 守住;不一致时**从 SVG 重新导出组件,不能反过来**。
21. **颜色调色板只有 `src/lib/colors.ts` 一份**。曾经有四份,靠运气一致。
22. **`FitProfile` 有一行数据什么都不能证明** —— 每个访客第一个请求就会被种下一行
    (`preferredFit: "regular"`, `region: "US"`)。**永远不要用 `!!profile` 判断
    "用户填过了没有"**,用 `hasStatedProfile()`(`src/lib/profileCompleteness.ts`)。
23. **"能不能给这个人推尺码" 和 "再填一项能不能提高置信度" 是两个问题。**
    `hasBodyMeasurement` = 胸 ∪ 腰 ∪ 肩(引擎真正打分的三项,身高/体重引擎不读);
    `hasChestMeasurement` = 只看胸围 —— 引擎**只为胸围加置信度分**,所以凡是
    承诺"+35 分"的 UI 必须用后者,用错会对只填了腰围的人谎称机会已经用掉。
24. **3D 人台只渲染量到的东西,绝不发明。** 空档案拒绝画;推断出来的环
    `circumferenceCm` 必须是 null(界面就印不出用户没给过的厘米数);颈部和底座
    只是画法,放在单独的 `drawingRings()` 里、不列进清单。躯干放样必须用
    **centripetal** Catmull-Rom,均匀参数化会在肩→颈处过冲成花瓶。

25. **存服装尺寸必须同时存来源。** `garmentMeasuredFrom` 由 `/api/closet` 的 zod
    refinement 强制,不是靠自觉 —— 从零售商尺码表读到的数字和抽取器兜底猜的数字
    在屏幕上长得一样,而这个区别正是 `source.sizesFrom` 存在的理由。

26. **跨品牌锚点按"尺寸"对齐,不按"码名"。** `scoreKnownGood` 原来用
    `alphaIndex(kg.size)`,于是 118cm 的别家 M 和 100cm 的优衣库 M 落在同一档,
    引擎会推荐比用户说合身的那件**小 18cm** 的衣服。**同品牌锚点故意仍走码名**
    (同品牌尺码梯本来就对齐,且 [F1] 锚点主导依赖那条路径)。

27. **权重为 0 的理由是"上下文",必须照样进解释里。** `topReasons` 按权重取前两条,
    于是"个人松量目标"(它改变的是所有码共同的基准,不顶任何一个码)被永久埋掉 ——
    屏幕上写着"比 regular 目标小 14.5cm",而 regular 默认是 10cm,没有一句话解释。
28. **抓不到页面 + 尺码是估算的 → 直接拒绝(422 `unreadable`),不要端出一张尺码梯。**
    那种情况下屏幕上没有一个数字来自零售商:品牌来自域名、品类来自 URL 里一个词、
    尺码来自我们给已知品牌留的通用表。
29. **首页按意图排序**:已经给过数据的人,仪表盘紧跟首屏(原来在第 5.6/10 屏)。
    匿名访客仍看到完整说辞,顺序不变 —— 这条分支容易悄悄写坏,要单独验。

30. **大牌尺码表是"策展"来的,不是爬来的。** `src/lib/brandCharts.ts` 存品牌官网自己
    公布的数字,每张表都带 `sourceUrl` + `capturedAt` + `capturedBy`;第三方尺码
    聚合站**不能用**(测试强制 sourceUrl 必须在品牌自己的域名下)。`capturedBy:
    "fetch"` 还要求 robots.txt 允许该路径 —— Nike 允许所以收了,J.Crew 的数字来自
    它自己 robots 禁掉的模块所以没收。被墙的品牌只能**人工在浏览器里读了抄进来**。
31. **人体围度区间和服装平铺尺寸是两种断言,不能共用字段。** body 表只写
    `bodyChestMinCm/MaxCm`,只有 garment 表可以写 `chestCm`。放错会让该品牌的所有
    推荐**朝同一个方向差一整码**,看起来像调参问题而不是 bug。**且 body 表喂不了
    `personalEase.ts`** —— 它算 `garment − body`,需要服装那一侧。
32. **`verdictFromDelta` 的入参是"服装相对"的**(负 = 这件比你想要的小)。任何从
    "人体"那侧算出来的 delta 必须取反。body range 分支原来没取反,于是所有档位的
    判语是**反的**(胸围 100 时 L 显示"too small")。只有判语错、排序一直对,所以
    藏了很久。

33. **待购商品和已有衣物是两张表,待购永不参与合身学习。** `SavedItem` 不被引擎、徽章、
    公开页、社区读取(`savedInput.test.ts` 扫描守住);转入衣橱必须带 `fitDirection`,
    否则默认 `fitRating=4` 会让没穿过的衣服变成「已知合身」锚点。
34. **腋下平铺 ×2 是衣物围度,只写入衣物字段,永不与身体数据直接比较。** 单写的
    「Chest 22」、「29x20」、互相矛盾的读数都**不用**,交给用户确认。
35. **只有一个尺码的商品给判断,不做排名**(`listingJudgement.ts`,与引擎共用
    `easeFor` / `verdictFromDelta`)。排名里的「最大尺码」「平局」对单件商品都不成立。
36. **插件的可选主机权限只在用户点击时申请,只读尺寸行。** eBay 描述在
    `itm.ebaydesc.com` 框架里;主页面的自由文本从不读取(同页有别的卖家的 pit-to-pit)。

## 已有的关键系统(别重造)

徽章阶梯 铜→银→金→**钛**→钻石→黑曜石 + 特殊色,源 `src/lib/badges.ts`;金属护照卡
(`MetalCard.tsx`,**保持炫酷不动**);徽章**默认扁平**,立体版只在 inspect 舞台;
本地管理员由 `node scripts/seed-admin.mjs` 播种;中英双语(`src/i18n/`,文案进 messages,别写死在 JSX);会员编号;拉黑双向生效;举报 +
自动隐藏 + `/admin` 审核队列;Upstash 限流;字体自托管;待购清单(`/saved`);二手单品判断。
生态:关注+关注流、Ask&Answer(带真实衣橱证据)、每日 Top+Top 穿搭师榜。
工具:`app-web/scripts/mobile-audit.mjs`(移动端布局实测,需 `npx playwright install chromium`)。
