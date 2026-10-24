# Fit Passport 产品升级计划（基于 2026-10-24 竞品调研）

**状态：** 2026-10-24 创始人批准。进度见 `DEVLOG.md`（Session 104 起）和 `todo/engineering/00-ORDER.md`。

## Context（为什么做）

agent 的调研（`origin/agent/research`，16 份文档，读 `docs/research/summary-2026-10-24.md` 起）结论：
- 国内外 AI 衣橱（穿啥、Outfity、搭搭、Acloset、Whering…）的"日历、穿着次数、天气推荐、抠图"已是常见功能；
  企业尺码（True Fit、Fit Analytics、Bold Metrics）和 Google 原生 Chrome 试穿在抢"购物页上的尺码/试穿"入口。
- 我们真正的缺口不是功能数量，而是**用户日常回来的理由**和**真实合身证据**：现在只有买东西时才知道推荐对不对。
- 调研给的第一优先：**记录"实际穿了什么"，顺手问"还合身吗"**，把日常使用变成合身数据；计划与实际分开。

创始人已定：试点**马上开始、升级并行**；用户**中美都有**；手机端**先做可安装网页 App（PWA）**；
照片类 AI（抠图、**AI 试穿图片/视频、换发型发色、风格档案**）**都做**，社区新模块也一起做（审阅计划时补充）。

目标：试点 3–4 周内上线"穿搭日历 + 今日一套"，提高留存并把每周的合身反馈从"只有购买"扩大到"每次穿着"；
试点结束后升级尺码页（三视图、对比熟悉衣物、买后回访），再做抠图和完整数据导出。

## 不变的边界

- 尺码由规则引擎决定；AI 试穿、换发型、风格分析的结果**一律标"AI 风格预览，不保证尺码或合身"，不进尺码计算**。生成补全不能改原图，原图永远保留。
- 照片类 AI 全部**用户主动选择**：每次上传前说明发给哪家、留多久、能否删除；人脸照片单独同意（中国个人信息保护法把人脸列为敏感信息；美国伊利诺伊州 BIPA 要求书面同意和保留期限）；不用于训练；可一键删除。
- 只用**可商用**的模型/服务：CatVTON、IDM-VTON、OOTDiffusion 等非商用许可一律不用；每家供应商先读现行协议和数据处理条款。
- 不推测种族、年龄等身份属性；/body 的脸仍由用户自己选（原则不变）。
- 摇一摇必须有按钮替代；松紧不能只靠颜色表达；所有新反馈都可跳过和撤销。
- 天气只用城市级位置，不把身体数据或照片发给天气方；天气不当个人冷热或尺码证据。
- 每个阶段遵守现有规则：中英文案、测试、`npm run build`、DEVLOG、commit 到 main（Kpew），生产迁移由 `scripts/vercel-build.mjs` 自动跑。

---

## 阶段 0：本周（准备）

- 创始人：合并 PR `agent/research`（只有文档）；按 `docs/pilot-guide.md` 发出试点邀请。
- Claude：在 `/admin` 试点面板加"日常使用"三项指标位（每周记录穿着的人数、穿着记录数、合身回答数），先读现有 `Event` 表，阶段 1 上线后自动有数。

## 阶段 1：穿搭日历 + 衣橱升级（试点第 1–2 周）

**数据（两份 schema 都改：`app-web/prisma/schema.prisma`、`schema.postgres.prisma`，新迁移目录照 `prisma/migrations/2026…` 格式）**
- 新表 `WearLog`：`id, userId, day`（用户本地日期字符串 `YYYY-MM-DD`）、`status`（`worn` | `planned`）、`outfitId?`、`note?`、`photo?`（经 `src/lib/photoStore.ts` `storePhoto` 存私有）、`createdAt`。
- 新表 `WearLogItem`：`wearLogId, itemId`（引用 `KnownGoodItem`，级联删除）。只有 `worn` 计入穿着次数；`planned` 要确认才变 `worn`。
- `KnownGoodItem` 加 `seasons String?`（逗号分隔 spring,summer,autumn,winter；空=四季）。
- 穿着次数和"上次穿"用查询聚合，不加冗余字段。

**逻辑复用**
- 把 `src/app/api/closet/refresh/route.ts` 里"写 ComfortCheck + 更新 `fitDirection`/`fitRating`"抽成 `src/lib/comfort.ts` `recordComfort(userId, itemId, direction, note?, reason)`；refresh 路由改调它。穿着时回答"合身吗"用 `reason: "worn"` 调同一函数（复用 `src/lib/fitDirection.ts` 的方向刻度）。
- `src/lib/accountMerge.ts` 加 WearLog 迁移；`src/lib/badgeStats.ts` 可选加"穿着记录"统计。

**API**：`src/app/api/wear/route.ts`（GET 按月、POST 记录、PATCH 计划转实际、DELETE 撤销），zod 校验、`getCurrentUser`、限流沿用现有 `rateLimit`。

**界面**
- 新页 `/calendar`：月历格子显示当天单品缩略图（`photoForClient`）或 `OutfitMannequin` 简图；点某天打开记录面板：从衣橱选单品（复用 `/outfits` 里的衣橱选择器）或选已存搭配，照片可选（复用 `PhotoSource`），每件衣服一行"偏紧 / 合身 / 偏松 / 跳过"按钮（文字+图标，不只靠颜色），写 ComfortCheck。
- 衣橱（`src/app/closet/page.tsx`、`DetailSheet.tsx`、`EditRow.tsx`）：顶部"已收录 N 件"，卡片"已穿 N 次 · 上次 X 天前"，季节筛选 chips，详情里编辑季节。
- 首页（`src/app/page.tsx`）：已登录用户一张"今天穿了什么？"主卡，一键进当天记录（调研：每天只给一个主行动）。
- Nav 加日历入口；文案进 `src/i18n/messages/en.ts`、`zh.ts`。
- 事件：`wear_logged`、`wear_fit_answered`、`wear_fit_skipped`、`wear_undo`（`/api/event` 现有通道）。

## 阶段 2：今日一套（摇一摇）+ 天气 + PWA（试点第 2–4 周）

**天气**（`src/lib/weather/`）
- 统一接口 `getForecast(lat, lon, day)` → 温度/体感/降雨概率/风 + `source, fetchedAt, validUntil, attribution`。
- 先接**和风天气**（中国强、也覆盖 200+ 国家；每月 5 万次免费）一家覆盖中美；只用坐标查天气，**不用和风 GeoAPI**（其条款禁止缓存/存储地理结果）——城市列表用开放数据（GeoNames，CC BY）放进仓库，用户手选城市。
- 服务器保管 key（`QWEATHER_KEY`），按"城市+小时"缓存（复用现有 Redis/内存缓存方式），天气旁显示署名。
- 若试点中海外延迟或准确度不佳，再加 WeatherAPI.com 第二个适配器（同接口）。无 key 或失败时：用户手选"冷 / 适中 / 热 / 下雨"。
- 用户资料加 `city`（城市 id+坐标），只在设置里填，不请求定位权限。

**抽一套**（纯函数 `src/lib/outfitDraw.ts`，可单测）
- 候选：自己的衣服、当季（`seasons`）、**最近反馈仍合身**（`fitDirection` 在舒适带内；最后一次 ComfortCheck 偏紧/偏松或超过 6 个月未确认的，标"不确定"并降权，不当成合身）、最近 3 天没穿过（读 WearLog）。
- 按品类角色组合（上衣+下装[+外套][+鞋]，用 `garmentTaxonomy` 的品类），天气规则决定是否加外套/防雨；可锁定一件再抽。
- 每套附理由（"当季、上次 12 天前穿、今天 8°C 加外套"）。
- 界面：首页主卡和 `/calendar` 上"随机抽一套"按钮；手机上可摇一摇（DeviceMotion，iOS 需用户点一次授权），按钮永远可用。"就穿这套"→ 写 `WearLog(worn)`，闭环到阶段 1。

**PWA**：`app/manifest.ts`（名称、图标复用 `icon.svg`/`apple-icon.png`、`display: standalone`）、最小 service worker 只缓存外壳和静态资源（不缓存 API 和照片），`/calendar` 做手机优先布局；安装提示放在设置里，不弹窗打扰。

## 阶段 3：尺码页升级（试点结束后，核心差异）

- **同角度相邻尺码对比**：`src/components/FitMap3D.tsx` 加固定相机角度（正/侧/背），推荐码与相邻码并排，标"示意，不是布料模拟"。
- **"为什么这个码 / 哪里不知道"**：在 /check 和插件结果里按部位列"品牌表给的 / 估算的 / 缺的"，并与用户衣橱里一件熟悉衣物比较（"比你那件 Uniqlo M 胸围大 2 cm"），复用 `bodyEstimate.ts` 和已存的衣物尺寸。
- **买后回访**：购买后 N 天提醒到 /history 填留下/退货（站内提示为主；邮件用现有 Resend，用户可关），支持跳过和撤回。
- **品牌表字母码横跨两列数字码**：在 `data/brand-guides` 文件里记"字母对应哪几列"，`brandGuides.ts` 编译成字母码范围（任务给 agent 收集，见 `todo/people/09`）。

## 阶段 4：照片类 AI（抠图 → 试穿 → 换发型 → 风格档案）

**4a 共用底座（先做一次，后面四个功能都用）**
- `src/lib/aiMedia/`：供应商适配器（同一接口：提交任务、查状态、取结果、删除）、异步任务表 `MediaJob`（用户、类型、状态、供应商、花费、过期时间）、结果另存 `photoStore`。
- 花费控制：每用户每日/每月次数、全站每月上限（环境变量，创始人定，建议试点期 $50），超额就停并提示；失败不计用户次数。
- 同意与删除：首次使用每类功能弹一次说明（发给谁、留多久、不训练、可删），人脸类单独勾选；设置里"我的 AI 照片"一键删除原图和结果，并调用供应商删除接口或记录删除请求。
- 原生替代：现有 `src/lib/tryonImage.ts`（纯文字生图）由新底座替换。

**4b 衣服照片抠图**
- 用 50 张自有/获准照片比较：BRIA 托管去背景（$0.018/张，先读现行 2026-09 协议和 DPA）与 MIT 许可的官方 BiRefNet 托管推理（可用现有 `REPLICATE_API_TOKEN`）；比边缘（蕾丝、细带、同色背景）、价格、留存。
- 结果另存，衣橱卡片切换"原图 / 抠图"、一键恢复；失败退回原图；不用抠图推断尺寸。

**4c AI 试穿（图片，之后视频）**
- 输入：用户全身照（主动上传、可删）+ 衣橱单品或正在看的商品图（插件页/检查页）；输出带"AI 预览"标记，原图/生成图可切换。
- 供应商：先接 FASHN API（v1.6 约 $0.075/张，条款允许商用、默认不训练；输入用 base64、不带姓名）做图片；视频选可商用的托管服务（如 FASHN 或可灵 Kling API，先比价和读条款）作为第二步。
- 放在尺码结果**旁边**而不是替代：尺码卡仍显示推荐码和理由，试穿是"看看样子"的入口。范围先限成年人、单人、正面全身照、上装/下装。
- 评测：在获同意的照片上量颜色/图案保真、失败率、单张接受成本，再扩大。

**4d 换发型 / 发色**
- 自拍 + 选择发型（女生/男生两组、长度、卷直、颜色），用可商用的图像编辑服务生成（候选：Qwen-Image-Edit 托管推理〔Apache 许可〕或供应商官方商用 API，选型时比价读条款）；只改头发，提示"效果仅供参考"。

**4e 风格档案**
- **色彩：用户自己比**，不靠机器判定肤色：在自拍旁显示几组色板（暖/冷、深/浅），用户点"哪组更好看"，得出"适合色板"；可同时参考衣橱里常穿颜色（衣物 `color` 统计）。
- **风格关键词和最佳搭配**：来自衣橱统计（品类、颜色、常穿组合、穿着记录），不需要人脸。
- **脸型/发型建议**：可选、单独同意；由模型给"建议尝试的发型"并联到 4d 换发型试看；明确写"建议，不是科学结论"，不输出身份属性。
- 结果进护照页一个"风格"分区，可随时删除或重做。

## 阶段 5：数据可携与删除（信任）

- 登录用户自助导出：版本化 JSON（身体、衣橱、穿着记录、ComfortCheck、购买结果）+ 照片打包；现有公开代码导出（`api/view/[code]/export`）保持不变。
- 设置里加"永久删除账号"（硬删除含照片，`dropPhotos`），与现有软停用并列，写清两者区别。

---

## 阶段 6：社区新模块（与阶段 2–4 穿插做）

现有：关注、搭配流、点赞、带证据问答、每日榜、徽章、审核屏蔽（`src/app/community`、`api/posts|answers|follow|leaderboard`）。新增四个，都建在已有社区和衣橱上：
1. **分享今天的穿搭**：日历里一天一键发到搭配流，可附"这件 M 偏松一点"的合身备注（来自当天的合身回答）；默认不公开尺寸和身体数据，用户勾选才显示。
2. **朋友帮我搭**：把衣橱以只读链接分享给关注的人（复用账号代码和 `exportPolicy` 的权限思路），对方从你的衣橱挑一套发回，你一键"就穿这套"或存为计划。
3. **同身形的人穿哪个码**：对某品牌某款，显示"和你身形相近的 N 位用户里多数留下了 M"——来自 `FitOutcome` 聚合；至少 5 人才显示，不显示任何个人；这是已设计未建的"跨用户合身聚合"，也会作为尺码引擎的一条证据（单独标来源）。
4. **试穿结果分享**（阶段 4c 之后）：AI 试穿图可分享，自动带"AI 生成"水印，只能分享自己的照片。
- 所有新内容走现有举报/屏蔽/审核；分享默认私密。

## 明确不做

原生 App（继续搁置，见 `todo/decisions/06`）；用非商用许可的开源试穿/抠图模型上线；把任何 AI 图片结果当尺码依据。

## 衡量（试点期间看 /admin）

每周：记录穿着的人数和留存（第 1→4 周）、穿着记录数、合身回答率（回答/记录件数）、"抽一套"被采纳率、可判定购买数。
小于约 20 笔购买不对外报准确率（`docs/pilot-guide.md`）。

## 分工

- Claude：阶段 0–6 全部代码、测试、文档、board 更新；每家 AI 供应商的条款摘要写进 `docs/research/`。
- 创始人：试点邀请；和风天气 key；AI 月度花费上限；FASHN / BRIA 等账号与 key（签约前我先给条款要点）。

**顺序**：阶段 1 → 2（试点中）→ 3 与 4a/4b 并行 → 4c 试穿图片 → 6.1–6.3 社区 → 4d 换发型 → 4e 风格档案 → 4c 视频 → 6.4 → 5。
- agent：品牌表"字母↔数字码"收集；用插件按用户方式实测（`todo/people/10`，需能操作桌面）。

## Verification（每阶段）

- `cd app-web && npx tsc --noEmit -p . && npx vitest run && npx next build`；`npm run db:pg:generate` 确认 Postgres schema 能生成。
- 新单测：`recordComfort`（refresh 与穿着两路写同样的数据）、`/api/wear`（计划≠实际、撤销、跨用户拒绝）、`outfitDraw`（季节/最近穿过/不确定合身/天气/锁定）、天气适配器（mock HTTP、缓存过期、失败回退手选）、`accountMerge` 带 WearLog。
- AI 底座单测（mock 供应商）：未同意不发送、超额停止、失败不计次、删除连带结果、结果永不写入尺码计算；同身形聚合少于 5 人不显示。
- 本地跑起来（`npm run dev`，Playwright 手机视口截图）走一遍：记录一天 → 回答合身 → 衣橱显示穿着次数 → 抽一套 → 就穿这套 → 日历出现。
- 推 main 后看 Vercel 生产部署和迁移日志；`/admin` 指标有数。
