# Fit Passport 人工任务最终汇总（2026-10-22）

本报告记录 2026-10-22 人工任务的现场核查和本地评估结果。所有尺码文件仍是未经两人核验的辅助草稿。

## 已完成

- 已读取 README.md、docs/RESUME.md、todo/README.md、todo/people/ 全部文件和相关本地技能。工作依据为交接文件；没有读取受限制的旧会话文件。初始 main/b9e003c 工作区干净，fetch 后从 origin/main 43ff9e7 建立 codex/people-tasks。
- A：Vercel Production 的 UPSTASH_REDIS_REST_URL、UPSTASH_REDIS_REST_TOKEN 均存在。未显示、复制、截图或记录值；该项无截图。
- B：closet-photos 已存在，Private，IAD1；BLOB_READ_WRITE_TOKEN 存在于 Production（也标有 Preview）。管理员登录后 /admin 显示私有存储开启、存储 0 张、数据库 0 张。没有待迁移照片；页面没有 dry-run 操作，未运行迁移脚本或 POST 写入。该项无截图。
- 生产核查：Vercel 的 43ff9e7 为 Production Ready；旧通知 026f9ab 是失败的 Preview，不据此认定生产故障，也未修代码或重新部署。
- E：完成全部 11 个原有 case 的未验证草稿，8 个 answer、3 个 refuse；全部 verifiedBy=[]。只写 app-web/eval/truth/_drafts/，正式 truth 未改。共 24 张截图在其 screenshots/ 子目录，每个 JSON 的 _screenshots 指向相应证据。读取使用用户 Chrome；后续操作只在用户授权的独立 Chrome 窗口，未操作主窗口。未使用代理、无头浏览器或反爬绕过。
- F：npm install 成功，package-lock.json 未改；node scripts/pack-extension.mjs --store 成功，生成 app-web/store-build/fit-passport-extension-0.9.2-store.zip（15 files，142.5 KB）。SHA256：D99093D271D8047BCB391899E940F61FC617C7FF3D71A9C540BC6519F2844126。未上传、未提交审核。
- G：已通过的命令是 npm run eval -- eval/run.eval.ts，退出码 0，1 test passed；不是完整 npm run eval。11 cases、9 captures、0 formal truth；B/S5 执行错误均为 0，guardrails B 6/6、S5 8/8。没有正式标准答案，不能将其称为准确率验证通过。
- 草稿校验通过：11/11 JSON 可解析、ID 对应 case、verifiedBy 为空、数值字段及所有截图引用有效；git diff --check 通过。没有改产品代码、没有强制提交 captures。
- 本地英文提交：9e54cc7068b96f16abed1e27ddfaa9f13058f468（Add unverified retailer sizing drafts and screenshots）；本次新增 dd8d85dfe183e785130009e5f35e08bbf970c59a（Complete unverified sizing drafts for all evaluation cases）。分支 codex/people-tasks；这两个提交此前仅在本地，现已获准随报告同步。
- 本次同步纳入 `app-web/eval/results/2026-10-22.json` 和 `.md`。结果中的 personas 与仓库固定合成测试数据完全相同，不是用户身体资料；文件通过凭据模式检查，且不受 gitignore 限制。未纳入 captures。

以下每一行对应同名 _drafts/<case id>.json。所有草稿都需要两人独立人工填写/核对，不能直接提升为正式 truth。

| case id | 尺码表/草稿 | 类型、单位 | 主要不确定点 | 现有 capture |
|---|---|---|---|---|
| arcteryx-atom-hoody-mens | 已读，answer | 人体，cm | 图表含商品选项未列的 XXS；单值原样保留 | 有，0/0 tables |
| everlane-organic-cotton-crew-mens | 商品下架，refuse/no-chart-on-page | 不适用 | 当前页明确 no longer available；不是反爬拦截 | 有，0/0 tables |
| gap-classic-tee-mens | 已读，answer | 人体，in | Regular 表仅 XS–XXL，商品提供 XXXL；未编造缺失行；草稿抄胸围 | 有，0/0 tables |
| hm-regular-fit-tee-mens | 已读，answer | 人体，cm | 抄 Regular 的 cm 行，未换算；Long 未纳入 | 缺失 |
| nike-air-force-1-shoe-mens | 已核对鞋款，refuse/unsupported-category | 不适用 | 因鞋类不支持拒答，不声称无鞋码表 | 有，0/0 tables |
| nike-dri-fit-legend-tee-mens | 已读链接的官方表，answer | 人体，in | 通用表 XXS–4XL 含 Tall，可能超出商品实际供货尺码 | 有，0/0 tables |
| nike-size-help-page | 帮助文章，refuse/not-apparel | 不适用 | 有尺码表链接，但自身不是服装商品 | 有，0/0 tables |
| patagonia-better-sweater-mens | 已读，answer | 人体，in | 同一字母码多数字码行；保留重复 label 和辅助 numericSize，未合并推断范围 | 有，1/1 tables |
| patagonia-better-sweater-womens | 已读，answer | 人体，in | 同上；最终标准答案如何映射字母码需两人决定 | 有，1/1 tables |
| rei-rainier-rain-jacket-mens | 已读，answer | 人体，in | 只抄 Regular 字母码胸/腰；Tall 调整和裤装数字码未展开 | 缺失 |
| uniqlo-airism-cotton-tee-mens | 已读 Body Size，answer | 人体，in | _printedRows 保留原分数；数值字段以等值小数表达同一英寸量，未换单位。XS/S 腰围重叠照抄。URL E474244 显示 Product ID 482524，需人工核对 | 有，2/18 tables |

截图目录：`app-web/eval/truth/_drafts/screenshots/`。每份草稿的 `_screenshots` 列出证据。

- Arc'teryx：arcteryx-chart.jpg。
- Everlane：everlane-unavailable.jpg。
- Gap：gap-chart.jpg、gap-evidence.jpg。
- H&M：hm-xs-m.jpg、hm-l-xxl.jpg、hm-3xl.jpg、hm-kind-evidence.jpg。
- Nike：nike-shoe.jpg、nike-help-page.jpg、nike-tops-chart.jpg、nike-tops-chart-middle-confirmed.jpg、nike-tops-chart-large.jpg。
- Patagonia：patagonia-men-chart.jpg、patagonia-men-chart-lower.jpg、patagonia-men-evidence.jpg；patagonia-women-chart.jpg、patagonia-women-chart-lower.jpg、patagonia-women-evidence.jpg。
- REI：rei-chart.jpg、rei-chart-middle.jpg、rei-chart-large.jpg、rei-chart-xxxl.jpg。
- Uniqlo：uniqlo-body-chart.jpg。

## 需要用户确认或决定的

- 用户随后明确批准将发现及结果同步到 GitHub 的 `codex/people-tasks` 分支。本次同步包含两次草稿提交以及本报告和评估结果提交；不合并 main，不创建 PR。
- 完整 npm run eval 会包含 category.eval.ts：从环境或 .env.local 读取 TYPESAFE_API_KEY（未打印/读取其值），有 key 时向 https://api.typesafe.ai/v1/systemone 发送 133 个测试商品名称和固定分类问题，可能产生 API 费用。该测试只传 TypeSafe key，不启用 Haiku 回退；不发送用户身体或衣柜数据。未运行分类校准；若要运行，需确认付费调用。没有核实当前账单或价格，也不保证费用金额。
- C/D 需用户通过已装扩展弹窗保存 H&M、REI 和 2–3 个 eBay 页面 capture，再放到 app-web/eval/local/captures/。实际已安装扩展版本尚未验证；若已是仓库 0.9.2 且有 Save this capture 功能，无需重复安装。eBay 需标题含尺寸、描述含尺寸、只有尺码三类，保存后才能据真实 URL 建 case，不伪造。
- F 的 zip 已可用，但后台上传未完成；提交 Chrome Web Store 审核仍需新确认。支付、删除、生产环境变量更改、--apply、迁移等均未执行；如以后需要仍须确认。目前照片待迁移为 0，无迁移必要。
- E 的草稿不能代替两人的独立标准答案，特别需审阅 Patagonia 多行字母码、Uniqlo 商品编号变化与分数表示、通用表额外尺码。

## 失败或阻塞的（附原因）

- C/D：chrome://extensions 被浏览器安全限制明确拒绝，只允许 http/https 且禁止替代途径绕过。当前浏览器能力只有网页和窗口管理，没有可用的扩展工具栏弹窗控制；未尝试绕过。状态：已拒绝/能力受限。没有新增 captures，没有新增 eBay cases。H&M/REI 实际商品页可读，不能记成 Access Denied。
- F：访问 https://chrome.google.com/webstore/devconsole 返回 Not allowed。状态：已拒绝；上传和提交均未执行，未更换入口绕过。
- 完整 eval 的分类校准未执行，原因是可能的付费外部 API 调用尚未确认；聚焦离线 run.eval.ts 已通过。
- npm install 报告 20 vulnerabilities（4 moderate、13 high、3 critical），未运行 audit fix，因为不在本次手动任务范围。
- Uniqlo 会员页重定向到登录页，支持当前未登录判断；读取登录页内容曾超时，未登录、未填任何资料。其商品尺码表和截图已成功取得，不把该超时视为无尺码表。
