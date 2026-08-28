# Fit Passport

*[English](README.md) · **简体中文***

> **One body. One fit identity. Any store.**
> 一个消费者自有的服装合身档案层。

团队:Xiangchen Kong · Alyssa Qi · Jenny Cao · Nicolas Wang

**线上地址:https://fit-passport.vercel.app**

各品牌的尺码从来对不上。Fit Passport 让你拥有**一份可携带的档案** —— 你的身体尺寸、
偏好的松紧程度,以及那些已经穿着合身的衣服 —— 然后把它翻译到你粘贴的任何商品页上。
每一条推荐都会展示自己的推理过程,因为引擎是**透明的规则打分模型,不是黑盒**。

---

## 快速开始

```bash
cd app-web
npm install
cp .env.example .env   # 本地只需默认的 DATABASE_URL="file:./dev.db"
npm run db:push        # 创建/刷新本地 SQLite 数据库
npm run dev            # http://localhost:3000
```

其他命令:

```bash
npm test               # 单元测试(合身引擎、徽章、抽取器、尺码换算…)
npm run typecheck      # tsc --noEmit
npm run build          # 生产构建

node scripts/seed-admin.mjs                    # 创建/刷新管理员账号
node scripts/moderate.mjs reports              # 查看待处理的举报
node scripts/moderate.mjs unhide POST <id>     # 恢复被误隐藏的内容
```

字体是**自托管**的(`src/app/fonts/`,均为 OFL 1.1),不在构建时向 Google 请求 ——
构建不该依赖第三方是否可达。

**本地开发不需要任何 API key,也不需要云服务** —— SQLite 加上处处合理的降级方案。
可选的 key 只解锁额外能力(见 [`app-web/.env.example`](app-web/.env.example))。

> **按平台的等价命令**(这个项目不绑定任何一个平台,两边都会用到):
>
> | 做什么 | macOS / Linux | Windows (PowerShell) |
> |---|---|---|
> | 清理构建产物 | `rm -rf .next` | `Remove-Item -Recurse -Force .next` |
> | 查 3000 端口占用 | `lsof -nP -iTCP:3000 -sTCP:LISTEN` | `Get-NetTCPConnection -LocalPort 3000` |
> | 调用 npm 装的 CLI | `vercel` | `vercel.cmd` |
>
> Windows 上 PowerShell 默认禁止运行 npm 生成的 `.ps1` 启动脚本。遇到 "running
> scripts is disabled" 时改用 `.cmd` 后缀,不必放宽整机执行策略。
>
> macOS 上 `npm install` 会改写 `package-lock.json`(删掉 Linux 的 `libc` 条目),
> **不要提交那个 diff** —— Vercel 在 Linux 上构建,靠它解析原生包。

---

## 目前实现了什么

| 模块 | 内容 |
|---|---|
| **护照(Passport)** | 一张金属信用卡式的身份页 —— 头像、持有人、地区、偏好版型、验证码行。卡面材质跟随你已获得的最高等级徽章(也可以在已拥有的金属里自选),可导出 PNG。 |
| **衣橱(Closet)** | 可自定义颜色的收藏夹、单品照片、按 URL 添加、同款合并、档案柜式文件夹视图(把文件抽到"桌面"上、把单品放进对比篮),以及编辑历史。每件衣服还记录**它往哪边不合身**——一条带符号的刻度(*太紧 … 正好 … 太松*),可以用词也可以用数字。方向才是引擎能真正使用的信号,原来的 1–5 星现在由它**推导**出来,不再单独问。 |
| **尺码检查(Size check)** | 粘贴任意商品链接(裸域名也可以)→ 抽取器读取**真实页面**(schema.org JSON-LD、OpenGraph、页面内的尺码表;图片尺码表可选视觉 OCR;中国 GB/T `号型` 编码)→ 透明引擎在**胸围 + 腰围 + 肩宽**三个维度上给每个尺码打分,附带逐信号理由和有序判定(*偏小 … 正合适 … 偏大*)。它会诚实地告诉你尺码是**从页面读到的**还是**估算的**,估算时会给置信度封顶。另有实时多地区尺码换算器。 |
| **合身刷新(Fit refresh)** | 随时间重新评价衣物的穿着感受;身体会变,档案要跟着漂移。记录的是**方向**而不是评分。 |
| **穿搭(Outfits)** | 在按体型生成的 SVG 假人上搭配造型、发布、收集点赞。配置图像 key 后可生成写实试穿图。 |
| **社区(Community)** | 自愿加入的成员目录(每人一条自己卡面材质的金属横幅),外加可在 **Everyone**(按点赞排序)和 **Following**(你关注的人,按时间排序)之间切换的穿搭流。关注需要双方都已认领账号,所以关注数是挣来的。 |
| **榜单(The board)** | 每日 **Top looks** 与 **Top stylists**,在 UTC 自然日(或滚动周)窗口内计数,所以每天重置,新人今天就有机会赢。穿搭师排名 = `点赞数 + 3 × 有帮助的回答`,**绝不看关注数**。 |
| **问与答(Ask & Answer)** | 带**实证**的合身提问 —— 提问或回答都可以附上作者**真实拥有**的衣物(品牌 · 尺码 · 合身评分 · 适配的身型),让回复带证据而非猜测。支持有帮助投票、采纳答案,以及"待回答"筛选。整合在 **Community** 内,每个话题有独立 URL。 |
| **内容治理(Moderation)** | 任何帖子、回答或造型都可举报。三个不同举报人会自动隐藏(可撤销);被隐藏的内容对作者仍可见,不会悄无声息地消失。管理员在 `/admin` 有**审核队列**,可双向覆盖阈值;`node scripts/moderate.mjs` 是等效的命令行工具。 |
| **拉黑(Blocking)** | 在对方主页上拉黑。**双向生效** —— 他的造型、提问、回答会从你的流和目录里消失,你的也会从他那里消失。拉黑同时双向取消关注。对方不会被告知。 |
| **会员编号** | 每个认领的账号获得一个递增的 `No. 00000042`,压印在护照卡上(以及 PNG 导出里),并显示在公开主页。认领时签发 —— 匿名会话还不算会员。 |
| **徽章(Badges)** | 四条四级赛道(青铜 → 白银 → 黄金 → **钛**)—— 衣橱、合身记录、工坊、参谋 —— 外加稀有封顶徽章(钻石 / 黑曜石)和特殊荣誉(紫水晶 / 玉 / 琥珀)。钛取代了铂金,因为铂金的浅灰几乎无法与低两级的白银区分。全站每一枚徽章都是**立体铸造勋章**:静止时就以一定角度站立,让滚花边缘和厚度可见;单一方向打光(穹顶、明暗界线、边缘光、下沉底面、浮雕纹样);随光标转动;点击进入 inspect 舞台,用 WebGL 挤出它真实的轮廓。**2026-08-25 起,列表里默认渲染扁平奖章** —— 立体版在徽章陈列页要付出约 140 个合成图层的代价,在性能较弱的机器上过重,所以立体只保留在 inspect 舞台(一次只看一枚)。`BadgeCoin` 的 `dimensional` 参数可恢复。 |
| **身份(Identity)** | 匿名会话 → 认领账号 → 一个可分享的高熵账号码。可用用户名、邮箱或账号码登录。支持邮件重置密码、修改密码、软停用。 |

### 隐私铁律

**你的账号码只能让别人看到你的衣橱和一个*粗略*的体型 —— 永远看不到精确尺寸。**
`/api/view/[code]` 刻意不 select 那些厘米字段,社区列表是自愿加入的,体型可以隐藏,
被停用的账号对所有外部访问都不可见。详见
[docs/design/identity-and-sharing.md](docs/design/identity-and-sharing.md)。

### 关于图片的说明

品牌**只以文字呈现**,图片**只显示用户自己上传的照片**。不使用任何抓取来的品牌图像
或 logo —— 这是一个有意为之的商标 / 版权决定。

---

## 架构

```
app-web/
  src/app/            # Next.js App Router 页面 + /api 路由处理器
  src/components/     # UI:MetalCard、BadgeMedallion、BadgeInspect、OutfitMannequin…
  src/lib/            # 领域逻辑(关键部分均有单元测试)
    fitEngine.ts      #   透明的多维打分引擎
    extractor.ts      #   URL → 商品(品牌 / 品类 / 性别 / 尺码阶梯)
    pageParse.ts      #   确定性的真实页面解析(JSON-LD、表格、号型、尺码表图片)
    extractorLLM.ts   #   抓取 + 解析真实页面;可选 Claude 文本/视觉,带缓存与反爬识别
    populationPrior.ts#   地区冷启动体型先验(基于人口普查,治理安全)
    badges.ts         #   徽章阶梯 + 金属(唯一事实来源)
    auth.ts / authEdge.ts  # HMAC 会话(Node + Edge,字节级兼容)
  prisma/schema.prisma     # 数据模型(本地 SQLite,生产 Postgres)
  middleware.ts       # 在任何 API 调用之前铸造会话 cookie
brand/                # Fit Thread 标志 —— **构建输入,不是文档**。
                      #   Logo.tsx 直接渲染母版路径,两者不一致时测试会失败
docs/
  RESUME.md           # 冷启动简报:新会话先读这份
  DEPLOYMENT.md       # Vercel + Neon 部署手册
  memory/             # 项目为何是现在这样 —— 决定、铁律、踩过的坑
  design/             # 设计文档与研究(合身算法、信息架构、身份威胁模型、标志)
  prospectus/         # 招股书式项目介绍、徽章设计文档、Founder Brief
  business/           # 商业模式、定位与讯息架构、风险与法律
  proposals/          # 最初的提案 PDF
DEVLOG.md             # 逐次开发日志 —— 记决定,以及决定的代价
```

**目录划分的逻辑**:`docs/` 是**读**的,`brand/` 是应用和印刷件**构建时用**的。
标志原本放在 `docs/design/assets/` 下,看上去像是可有可无的附件 —— 它不是。
现在 `src/lib/logoAsset.test.ts` 会在 `Logo.tsx` 与母版 SVG 不一致时报错。

**技术栈:** Next.js 14.2 · React 18 · TypeScript · Tailwind 3 · Prisma 5 · Zod ·
Vitest(**285 个测试**)· Framer Motion(动效)· three.js(懒加载,仅用于徽章 inspect)。

**Node 版本:** 当前在 Node 24 LTS 上开发与部署。早期文档里"锁定 Node 18.20"
是上一台开发机的限制,不是项目要求,换机时已解除。

贡献前值得知道的几个关键设计决定:

- **引擎不是 LLM。** 胸围/腰围/肩宽上的规则与权重,所以可测试、可解释。LLM 只负责
  **抽取**商品数据(页面文本或尺码表图片),**永远不决定尺码**。
- **诚实的来源标注。** 尺码表会被标记为 `page`(从商品页读到)或 `estimated`
  (由品牌规律合成);界面会说明是哪一种,估算时置信度封顶。地区体型先验同理 ——
  冷启动的猜测会被标注,且绝不覆盖用户自己的数据。全部依据见
  [docs/design/fit-algorithm-research.md](docs/design/fit-algorithm-research.md)。
- **置信度反映信号的一致性。** 当各信号指向不同尺码时(比如你的锚定衣物说 M,而你的
  尺寸说 XL),置信度会下降,并**说明原因** —— 一个没有解释的更低数字只是一个更差的数字。
- **`KnownGoodItem.category` 是引擎的服装类型**,不可改名。`Collection` 才是面向用户
  的文件夹 —— 那个才是用户可以重命名的。
- **`authEdge.ts` 必须与 `auth.ts` 保持字节级兼容。** 中间件跑在 Edge 运行时,
  签发的 cookie 要由 Node 侧验证。
- **所有 key 门控的能力都优雅降级。** 没有 key → 一个可用的降级方案,而不是报错。

---

## 部署

生产环境跑在 **Vercel + Neon Postgres** 上。本地仍是 SQLite;Postgres 的 schema 在
构建时由同一份源 schema **派生**而来,所以两者不会漂移。

⚠️ 生产需要**两个**数据库 URL:`DATABASE_URL` 用连接池(`-pooler`)主机给应用,
`DIRECT_URL` 用直连主机给 migration —— 连接池是 PgBouncer 事务模式,持不住
migration 需要的会话级 advisory lock。

完整手册、环境变量表、验证清单、已知限制与成本:
**[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**。

成本模型(单次调用价格、扩容场景、先撞哪堵墙):
**[docs/design/cost-model.md](docs/design/cost-model.md)**。

---

## 商业与定位文档

| 文档 | 位置 |
|---|---|
| 项目全貌(招股书式) | [docs/prospectus/Fit-Passport-Prospectus.md](docs/prospectus/Fit-Passport-Prospectus.md) |
| 讯息架构 —— 定位与语气 | [docs/business/message-architecture.html](docs/business/message-architecture.html) |
| Founder Brief | [docs/prospectus/Founder-Brief.html](docs/prospectus/Founder-Brief.html) |
| 项目计划 | [docs/business/project-plan.md](docs/business/project-plan.md) |
| Business Model Canvas | [docs/business/business-model-canvas.md](docs/business/business-model-canvas.md) |
| Value Proposition Canvas | [docs/business/value-proposition-canvas.md](docs/business/value-proposition-canvas.md) |
| 客户访谈提纲 | [docs/business/interview-guide.md](docs/business/interview-guide.md) |
| 风险、法律与治理 | [docs/business/risks-and-legal.md](docs/business/risks-and-legal.md) |
| 标志设计说明 | [docs/design/LOGO_CONCEPT.zh-CN.md](docs/design/LOGO_CONCEPT.zh-CN.md) |
| 品牌素材清单 —— 哪个文件用在哪 | [brand/README.md](brand/README.md) |
| 项目记忆 —— 决定、铁律、踩过的坑 | [docs/memory/README.md](docs/memory/README.md) |
| 开发日志 | [DEVLOG.md](DEVLOG.md) |

---

*这是一个可用的原型,不是已上市的产品。它已部署、有测试、能真的用,但没有为商业流量
做过加固 —— 已知限制见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。*
