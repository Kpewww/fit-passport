# Resume prompt — paste this to pick up where we left off

> This is the "cold-start" brief for a new chat. It captures the project, the hard
> constraints, what already exists, and the current top priority so work resumes
> instantly. Keep it updated at the end of a session (it mirrors the memory files).
>
> **Last updated: Session 40 · 2026-08-20 · commit `567b869`+ (real-page fetch + multi-dim engine + region prior + vision OCR + heavy tests).**
>
> ⚠️ **The project MOVED.** It now lives at
> `/Users/xkk/Desktop/Summer Intern Amazon/Kong Info/Self-Project/` (was
> `/Users/xkk/Desktop/Kong Info/Self-Project/`). If a new session's auto-memory
> looks empty, it's because the memory dir is keyed off the old path — this
> RESUME.md (in the repo) is the path-independent source of truth; re-save memory
> from it if needed.

---

我在继续开发 **Fit Passport** —— CMU 49-800 创业课项目,"消费者自有、可跨店携带的合身档案"Web 应用。代码在 `/Users/xkk/Desktop/Summer Intern Amazon/Kong Info/Self-Project/`(**2026-08-20 从 `~/Desktop/Kong Info/Self-Project` 搬来的**),app 在 `app-web/`,已推私有仓库 **github.com/Kpewww/fit-passport**(keychain 有凭证,可直接 `git push`,提交邮箱 xchkong@gmail.com,**仅仓库内,别用全局 Amazon 邮箱**)。

**【沟通约定】全程中文聊天;git commit message 用英文;DEVLOG.md 用英文。**

**技术栈(锁 Node 18.20,别升级):** Next.js 14.2.15 App Router + React 18 + TS + Tailwind 3 + Prisma 5.22 + SQLite + Zod + Vitest;动效 Framer Motion + Lenis;three.js 仅徽章 inspect 懒加载。命令:`npm run dev`、`npm run typecheck`、`npm test`(**172 个**)、`npm run build`、改 schema 后 `npm run db:push`、生成文档 PDF `npm run docs:pdf`。**每轮结束务必:tsc + test + build + live smoke 全过 → commit & push → 更新 DEVLOG + memory。**

**动手前必读**:memory 里的 `project-fit-passport-build-state`(架构/坑,读它)、`project-fit-passport-roadmap`(顶部有第一优先级)、`project-fit-passport-design-system`、`project-fit-passport-deployment`、`project-fit-passport-community-ecosystem`;仓库里 `README.md`、`DEVLOG.md`(到 Session 39)、`docs/DEPLOYMENT.md`、`docs/design/community-ecosystem.md`、`docs/prospectus/`(招股书 + 徽章设计文档,各 md+pdf)。

**上次(Session 39)做了什么:** ① 写了两份文档放 `docs/prospectus/`——投资招股书式项目介绍 + 徽章设计文档,各 `.md`+`.pdf`,由自写的 `app-web/scripts/md-to-pdf.mjs`(无外部依赖,自托管字体 + headless Chrome 渲染)生成。② 跑了一次**核心逻辑端到端体检**,结论见下。

**体检结论(重要):**
- **核心引擎 work 且透明**:`/api/recommend` 女款 chest 99 → 推荐 S(+2cm 含宽松量),带 `reasons:[{signal,weight,message}]`。8 页全 200(`/ask`→307 到 `/community` 正常),115 测试绿。
- **最大软肋 = 尺码是"推断"不是"真读页面"**:`/api/check` 返回里 `rawJson.source.derived===true`——没配 `ANTHROPIC_API_KEY` 时,尺码表是从 URL slug + 品牌规律 + fixtures 拼的,**没真去 fetch 那个商品页**。这动摇了"paste any product link"的核心承诺。
- **两个美术小项**:徽章缩略图 motif 在 ~64px 下几乎看不清;`/check` 粘链接前下半屏偏空。

**Session 40 (2026-08-20) 做了:真实商品页抓取的第一阶段。** 新增 `src/lib/pageParse.ts`(纯函数,无 key、无网络即可测):解析 JSON-LD(schema.org Product)+ OpenGraph/meta + **HTML `<table>` 里的真实尺码表**(支持行/列两种朝向、英寸→厘米、范围取中值、中文 胸围/腰围/肩宽)。`extractorLLM.extractSmart` 重写为分层:命中 fixture→信任;否则 fetch 真页→确定性解析(免费拿到真尺码表→`sizesFrom:"page"`);解析不到表且有 key→LLM 读"保留表格结构"的文本;都不行→URL 估算→`sizesFrom:"estimated"`。`ExtractedProduct.source` 加了 `sizesFrom:"fixture"|"page"|"estimated"`;`/check` 据此显示 **"✓ sizes read from the page"** 或 **"⚠ sizes estimated — confirm the chart"**;估算时置信度封顶 0.5。修了 `/api/check` **漏存 waistCm** 的老 bug。新增 12 个解析器测试(共 **127** 绿)。可用 `FIT_DISABLE_PAGE_FETCH=1` 关闭真实抓取。**同时派了研究 agent 扒现有合身/试衣产品与论文**,产出会写到 `docs/design/fit-algorithm-research.md`(若还没落盘就是子agent还在跑)。关键结论:主流图像试衣只做外观迁移、不预测真合身(Google TryOnDiffusion 官方"we don't promise fit"),印证我们**基于测量的透明引擎才是差异化**。
>
> **Session 40 续(全部已做并推送):** 引擎升级为**多维(胸+腰+肩)** + 号型/body-range + 品类 ease + 有序 verdict + 置信度按 margin 缩放;抓取加固(真实 Chrome UA、反爬识别 `looksBlocked`、按 URL 的 TTL 缓存、真实在售标签、失败重试);**图片尺码表视觉 OCR**(key-gated,只读数字不存图);**人群体型先验** `populationPrior.ts`(普查均值、按 region+sex、只作低置信先验、绝不推断人种);研究文件 `docs/design/fit-algorithm-research.md` + `docs/design/china-sizing-research.md`。测试 **115→172**。

**下一步候选:** ① 依据 `docs/design/fit-algorithm-research.md` 升级**打分算法/置信度校准/尺码系统归一化**(研究里最高优先级项);② 真实抓取的健壮性(更多站点、反爬、缓存);③ 部署上线 Vercel+Neon 拿真实用户;④ 手动办一场 $100 搭配赛。**用户还没拍板下一个,先看研究文件再定。**

**重要约束(不可违反):**
1. fit 引擎是**透明打分不是 LLM**(LLM 只抽商品数据,永不决定尺码)。
2. **隐私铁律**:凭账号码只能看 closet + 粗略体型,**精确厘米永不外泄**,deactivated 账号对外全屏蔽。
3. **不放品牌 logo/盗图**,品牌只用文字、图片只用用户自己上传。
4. `authEdge.ts` 必须和 `auth.ts` 字节兼容。
5. `KnownGoodItem.category` 是引擎服装类型**不可改名**,`Collection` 才是用户可改的文件夹。
6. 生产必须设 `SESSION_SECRET`(**按调用解析,不能在模块加载时抛错**,否则 build 挂)。
7. **跑过 `npm run dev` 后的生产冒烟不可信**,必须先 `rm -rf .next && npm run build`。
8. 页面 hang 在 Loading 先查 `lsof -nP -iTCP:3000 -sTCP:LISTEN`(僵尸 next 进程占端口)。
9. 改 schema 后**重启 dev server**(否则旧 Prisma Client 500)。

**已有的关键系统(别重造):** 徽章阶梯 铜→银→金→**钛(titanium,已替换 platinum)**→钻石→黑曜石 + 特殊色(紫水晶/玉/琥珀),源 `src/lib/badges.ts`;金属护照卡跟随最高徽章、可选已拥有金属、PNG 导出、社区横幅(`MetalCard.tsx`);徽章全站立体、悬停转动、点击进 CS2 式 inspect(`BadgeCoin.tsx`/`BadgeInspect.tsx`,无 flat 变体);**管理员账号 AK / 密码 12345678**(`node scripts/seed-admin.mjs`,`role=ADMIN`+`grantAllBadges`+会员 No.1,只有此脚本能授权,`/admin` 审核队列);会员编号 `No. 00000001`;拉黑 `Block` 模型双向生效;举报 + `REPORT_HIDE_THRESHOLD=3` 自动隐藏;限流器已支持 Upstash Redis(设 env 才启用,否则内存);字体自托管 `src/app/fonts/`。生态已建:关注+关注流、Ask&Answer(带真实衣橱证据)、每日 Top+Top 穿搭师榜。

**待办池:** 真实商品页抓取(顶置)、部署上线(Neon 用 `-pooler`、Vercel Root=`app-web`、Build=`npm run vercel-build`、填 `DATABASE_URL`/`SESSION_SECRET`/`APP_URL`)、手动 $100 比赛、集合拖拽排序、比赛系统、体型匹配筛选;课程交付物(客户访谈、期中 Product Opportunity 展示、BMC/VPC)。
