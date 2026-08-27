# Resume prompt — paste this to pick up where we left off

> The cold-start brief for a new chat: what this is, the hard constraints, what
> already exists, and what to do next. Keep it current at the end of every session.
>
> **Last updated: Session 58 · 2026-08-27 — LIVE, 273 tests, closet add form rebuilt as a four-question flow.**
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
Framer Motion(**Lenis 已移除**);three.js 仅徽章 inspect 懒加载。
命令:`npm run dev`、`npm run typecheck`、`npm test`(**273 个**)、`npm run build`、
改 schema 后 `npm run db:push`(**还必须建 migration**,见铁律 10)、生成文档 PDF `npm run docs:pdf`。
测量工具:`app-web/scripts/mobile-audit.mjs`(移动端布局)、
`docs/design/assets/logo/tests/size-test.mjs`(标志尺寸)。两者都需 `npx playwright install chromium`。
**每轮结束务必:tsc + test + build + live smoke 全过 → commit & push → 更新
DEVLOG + memory。**

**动手前必读**:`docs/memory/README.md` 是索引,其中
`project-fit-passport-build-state`(架构 + 铁律,**必读**)、
`project-fit-passport-performance`(性能陷阱)、
`project-fit-passport-deployment`(**含一次生产事故的教训**)、
`project-fit-passport-design-system`(视觉 + **移动端规则**)、
`project-fit-passport-closet-signal-design`(合身信号)、
`project-fit-passport-logo`(标志资产 + 尺寸下限)、
`project-fit-passport-next-steps`(**待办,当前清单在文件底部**);
以及 `docs/design/*.md`(研究)、`DEVLOG.md`(逐次记录)。

---

## 现状(Session 58 · 2026-08-27)

**已上线:https://fit-passport.vercel.app** — Vercel + Neon Postgres + Upstash
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
- **信息架构已测量并写成草案**(`docs/design/information-architecture.md`,
  **未实现**)

**Session 57–58(信息架构):**
- **`/closet` 添加表单从 11 个字段的网格改成 4 个问题、一屏一问**(`AddItemFlow` +
  `src/lib/addFlow.ts`)。实测:输入控件 **28 → 15**,可点元素 **127 → 84**,
  **5.5 → 4.5 屏**。留哪四个问题由 FIC 预算决定并由 `addFlow.test.ts` 钉住
  (铁律 ㉙)。

**下一步:见 `docs/memory/project-fit-passport-next-steps.md` 底部的当前清单。**
(客户访谈**已由创始人推迟**;信息架构第 2、3 步是接下来的事。)

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
15. **手机上导航必须存在**——所有 nav 链接都是 `sm:block`,`Nav.tsx` 里的菜单面板
    就是手机上的导航本体。
16. 任何写 `fitRating` 的地方必须同时写 `fitDirection`,否则同一行数据自相矛盾。
17. **判断一个 SVG 是不是矢量,先看有没有 `<path>`**——文件名和来意都可能骗人。
18. **标志有尺寸下限**:母版 ≥40px、micro 24–40px、**16–20px 必须用另画的
    favicon 字形**。小尺寸要在 `deviceScaleFactor=1` 下判断,视网膜截图会骗人。
19. **衣橱添加流程只问引擎会读的东西**——`gender`/`color` 在 `fitEngine.ts` 里
    出现 **0 次**,`areaNotesJson` 只存不算。四个问题合计 30 FIC,正好是首次预算
    上限,加第五个就破线,`addFlow.test.ts` 会红。**且必须先问品类再问尺码**。

## 已有的关键系统(别重造)

徽章阶梯 铜→银→金→**钛**→钻石→黑曜石 + 特殊色,源 `src/lib/badges.ts`;金属护照卡
(`MetalCard.tsx`,**保持炫酷不动**);徽章**默认扁平**,立体版只在 inspect 舞台;
本地管理员由 `node scripts/seed-admin.mjs` 播种;会员编号;拉黑双向生效;举报 +
自动隐藏 + `/admin` 审核队列;Upstash 限流;字体自托管。
生态:关注+关注流、Ask&Answer(带真实衣橱证据)、每日 Top+Top 穿搭师榜。
工具:`app-web/scripts/mobile-audit.mjs`(移动端布局实测,需 `npx playwright install chromium`)。
