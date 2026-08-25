# Resume prompt — paste this to pick up where we left off

> This is the "cold-start" brief for a new chat. It captures the project, the hard
> constraints, what already exists, and the current top priority so work resumes
> instantly. Keep it updated at the end of a session (it mirrors the memory files).
>
> **Last updated: Session 42 · 2026-08-25 — LIVE at https://fit-passport.vercel.app, 209 tests, GitHub auto-deploy on.**
>
> ⚠️ **The project changed COMPUTERS (2026-08-24).** It now lives at
> **`D:\Start-Up-Project\fit-passport`** on **Windows 11** — a fresh `git clone`.
> Every macOS path in older notes is dead. If a new session's auto-memory looks
> empty, it's because the memory dir is keyed off the old path — this RESUME.md
> (in the repo) is the path-independent source of truth; re-save memory from it.
>
> **A clone has source only.** Before anything runs: `npm install` →
> copy `.env.example` to `.env` → `npm run db:push` → `node scripts/seed-admin.mjs`.

---

我在继续开发 **Fit Passport** —— CMU 49-800 创业课项目,"消费者自有、可跨店携带的合身档案"Web 应用。代码在 **`D:\Start-Up-Project\fit-passport`**(**Windows 11**,2026-08-24 换电脑后从 GitHub 重新 clone 的),app 在 `app-web/`,私有仓库 **github.com/Kpewww/fit-passport**(凭证已在本机缓存,可直接 `git push`,提交邮箱 xchkong@gmail.com,**仅仓库内**)。

**【沟通约定】全程中文聊天;git commit message 用英文;DEVLOG.md 用英文。**

**技术栈:** **Node 24.19.0 LTS**(旧笔记里"锁 Node 18.20"是**上一台 Mac 的限制**,不是项目要求,换机时已解除)+ **Next.js 14.2.35**(安全补丁,见 Session 41)App Router + React 18 + TS + Tailwind 3 + Prisma 5.22 + SQLite(本地)/ Postgres(生产)+ Zod + Vitest;动效 Framer Motion(**Lenis 已移除**,见 memory 的 performance 条);three.js 仅徽章 inspect 懒加载。命令:`npm run dev`、`npm run typecheck`、`npm test`(**209 个**)、`npm run build`、改 schema 后 `npm run db:push`、生成文档 PDF `npm run docs:pdf`。**每轮结束务必:tsc + test + build + live smoke 全过 → commit & push → 更新 DEVLOG + memory。**

**动手前必读**:memory 里的 `project-fit-passport-build-state`(架构 + 14 条铁律,**必读**)、`project-fit-passport-performance`(性能陷阱,别重新引入)、`project-fit-passport-deployment`、`project-fit-passport-design-system`、`project-fit-passport-next-steps`;仓库里 `README.zh-CN.md`、`DEVLOG.md`(到 Session 42)、`docs/DEPLOYMENT.md`、`docs/design/fetch-strategy.md`、`docs/design/cost-model.md`、`docs/prospectus/Founder-Brief.html`。

---

## 现状(Session 42 · 2026-08-25)

**已上线:https://fit-passport.vercel.app** — Vercel + Neon Postgres + Upstash Redis,**209 测试**,GitHub 自动部署已接通(push 到 `main` 即上线)。生产管理员 `AK`,密码在 Session 41 播种时随机生成(与本地播种脚本的默认值不同)。

**Session 41–42 做完的事:**
- **部署上线**,并修了两个本地永远暴露不出来的坑:缺 `migration_lock.toml`、migration 走了连接池(改为 `directUrl` 走直连主机)
- **Next 14.2.15 → 14.2.35** 安全补丁(CVE-2025-29927 middleware 授权绕过,而我们的会话正是走 middleware)
- **置信度校准**:信号互相矛盾时降置信度并**说明原因**(`conflictNote`)。生产实测 1.0 → 0.6
- **抓取策略决策** `docs/design/fetch-strategy.md`:**不买穿透**(隐身代理 ≈ $16/1000 次,且击穿 403 落在判例的坏那一侧)。答案是**浏览器插件**,但要等客户访谈证据
- **抓取结果埋点** `source.fetch` = `blocked|unreachable|ok|skipped`。生产实测:H&M=blocked、Patagonia=unreachable、Allbirds=ok
- **成本模型** `docs/design/cost-model.md`,并修掉一个 **20 倍的成本 bug**(`MAX_PAGE_BYTES` 600KB→80KB)
- **性能**:移除 Lenis、修复两处"每次鼠标移动 setState"、修复 **WebGL 上下文泄漏**(`forceContextLoss` 从来没调过)、**徽章默认扁平**(卡片不动)
- **安全**:SSRF 守卫 `lib/urlSafety.ts`(重定向逐跳重检)、非服装页 422 拒绝、中文品类关键词

**下一步(第一优先级):客户访谈。** 东西在公网跑着、安全加固过、性能改过了,没有技术借口挡着;课程分值最高;而且"要不要做浏览器插件"这个决定**唯一的依据**就是访谈结果。

**重要约束(不可违反):**
1. fit 引擎是**透明打分不是 LLM**(LLM 只抽商品数据,永不决定尺码)。
2. **隐私铁律**:凭账号码只能看 closet + 粗略体型,**精确厘米永不外泄**,deactivated 账号对外全屏蔽。
3. **不放品牌 logo/盗图**,品牌只用文字、图片只用用户自己上传。
4. `authEdge.ts` 必须和 `auth.ts` 字节兼容。
5. `KnownGoodItem.category` 是引擎服装类型**不可改名**,`Collection` 才是用户可改的文件夹。
6. 生产必须设 `SESSION_SECRET`(**按调用解析,不能在模块加载时抛错**,否则 build 挂)。
7. **跑过 `npm run dev` 后的生产冒烟不可信**,必须先清 `.next` 再 build。Windows:`Remove-Item -Recurse -Force .next; npm run build`。
8. 页面 hang 在 Loading 先查端口有没有僵尸 next 进程。Windows:`Get-NetTCPConnection -LocalPort 3000`(旧笔记里的 `lsof` 是 macOS 的)。
10. **生产的 migration 必须走 direct 主机,不能走 `-pooler`**(PgBouncer 事务模式持不住会话级 advisory lock)。已由 `gen-postgres-schema.mjs` 生成的 `directUrl = env("DIRECT_URL")` 保证 —— 所以生产环境变量是 `DATABASE_URL`(pooled)**和** `DIRECT_URL`(direct)两条,少一条构建就挂。
11. `prisma/migrations/migration_lock.toml` **必须存在且提交**,否则 `prisma migrate deploy` 判断不出数据库类型直接失败。
12. `npm run db:pg:generate` 会把本地生成的 Prisma Client **覆盖成 Postgres 版**,跑完记得 `npx prisma generate` 切回 SQLite,否则本地 `npm run dev` 挂。
9. 改 schema 后**重启 dev server**(否则旧 Prisma Client 500)。

**已有的关键系统(别重造):** 徽章阶梯 铜→银→金→**钛(titanium,已替换 platinum)**→钻石→黑曜石 + 特殊色(紫水晶/玉/琥珀),源 `src/lib/badges.ts`;金属护照卡跟随最高徽章、可选已拥有金属、PNG 导出、社区横幅(`MetalCard.tsx`);徽章**默认扁平**(`BadgeCoin` 的 `dimensional` 默认 false,2026-08-25 的性能决定),立体版只保留在 CS2 式 inspect 舞台(`BadgeInspect.tsx`);**金属卡片不受影响,保持炫酷**;**本地管理员账号**由 `node scripts/seed-admin.mjs` 播种并把凭据打印出来(生产是另一个随机密码,Session 41 播种)(`node scripts/seed-admin.mjs`,`role=ADMIN`+`grantAllBadges`+会员 No.1,只有此脚本能授权,`/admin` 审核队列);会员编号 `No. 00000001`;拉黑 `Block` 模型双向生效;举报 + `REPORT_HIDE_THRESHOLD=3` 自动隐藏;限流器已支持 Upstash Redis(设 env 才启用,否则内存);字体自托管 `src/app/fonts/`。生态已建:关注+关注流、Ask&Answer(带真实衣橱证据)、每日 Top+Top 穿搭师榜。

**待办池:** ①**客户访谈**(第一优先级)②浏览器插件(答 403 + 淘宝,等访谈证据)③把 item 照片挪出 Postgres(Neon 免费档 0.5GB ≈ 340 用户,demo 阶段不急)④徽章重设计(你提供参考图,格式:24×24 纯描边 SVG)⑤手动办一场 $100 比赛 ⑥集合拖拽排序、比赛系统、体型匹配筛选;课程交付物(期中 Product Opportunity 展示、BMC/VPC)。
