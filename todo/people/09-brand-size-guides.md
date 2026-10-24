# 采集品牌官网尺码指南（给 agent 的需求）

**谁做：** 能操作浏览器的 agent（GPT agent / Codex 等）先采集，**再由人核对**。
**为什么：** 引擎要靠品牌自己的尺码表来判断"这个品牌的 M 到底对应多大的身体"。
- 美码字母（S/M/L）没有国家标准，至少 **3 个美国品牌**录入同一个字母后，衣橱里的美码衣服才能用来估算身体尺寸（Session 103）。
- 每个品牌偏大还是偏小，也要靠它自己的表来校准。

目前只有 Nike（男上装）和 Patagonia（男/女）两家，需要补到：**美国品牌 10 个以上、奢侈品牌 5 个以上**，男女上装各一份。

---

## 给 agent 的话（可以整段复制）

你在 Fit Passport 仓库（github.com/Kpewww/fit-passport）里工作。任务是：从**品牌自己的官网**抄下上装（T 恤、衬衫、毛衣、外套）的尺码表，每个品牌、每个系列（男装 / 女装）写成一个 JSON 文件，并附上截图。

### 必须遵守（违反任何一条，这份数据就作废）

1. **只用品牌自己的官网。** 网址的域名必须属于该品牌（例如 gap.com、ralphlauren.com）。
   - 不要用淘宝、京东、天猫、亚马逊、得物等电商平台。
   - 不要用第三方"尺码对照表"网站。这些网站互相矛盾，项目规定它们不算证据。
2. **不登录、不绕过。** 遇到登录墙、验证码、"Access Denied"、"请完成安全验证"，就在报告里记下这个品牌和原因，跳过它。
   - 不要换 IP、用代理、伪装浏览器，或者反复重试。
3. **像人一样慢慢看。** 每个品牌只打开它的尺码指南页，不要批量抓商品页，不要写循环脚本去请求网站。
4. **数字照抄，单位照抄，不换算，不推算。**
   - 页面写英寸就填 `"units": "in"`，写厘米就填 `"cm"`。
   - 范围（如 "38–40"）填成 `chestMin` 和 `chestMax`。
   - 每个尺码只印一个数字（如 "38"）的，填 `chest`（或 `waist`），**不要自己扩成范围**。
   - 页面没有的数不要填。
5. **尺码标签照抄**，如 `XS`、`2XL`、`46`、`0`。不要把 2XL 改成 XXL，也不要把 46 改成 M。
6. **分清人体尺寸和成衣尺寸。**
   - 页面说的是"身体量多少"（Body measurements、"measure around your chest"、"适合胸围"）：填 `"kind": "body"`。
   - 页面说的是衣服本身平铺量多少（Garment measurements、"measured flat"、"衣长、胸宽"）：填 `"garment"`。
   - 把页面上用来判断这一点的原话**逐字**复制到 `kindEvidence`。
   - 一页里两种表都有，就分成两个文件。
7. **只抄常规版型（Regular）。** Tall / Petite / Big & Tall / Slim 不抄，在 `note` 里写一句它们存在。
8. **`reviewed` 必须是 `false`。** 只有人审核通过后才改成 `true`；agent 永远不要自己改。没审核的数据，引擎不会使用。

### 文件放哪、叫什么

- 数据文件：`app-web/data/brand-guides/<品牌>-<mens|womens>.json`。品牌名用小写加连字符，如 `ralph-lauren-mens.json`。
- 截图：`app-web/data/brand-guides/screenshots/<同名>.png`。要能看清整张表的每一个数字，一屏放不下就截多张，命名为 `-1.png`、`-2.png`。`screenshot` 字段填第一张。
- 格式照 `app-web/data/brand-guides/_example.json`。字段规则在 `app-web/src/lib/brandGuides.ts`。
- `brand` 写品牌自己的写法，如 `"Ralph Lauren"`、`"J.Crew"`、`"Levi's"`。
- `sourceUrl` 写你截图的那一页的完整网址。**用品牌的美国站**：网址里带 `/us/` 或 `en-us`，或者本身就是 `.com` 美国站。
- `capturedBy` 填你自己的名字（如 "GPT agent"），`capturedAt` 填今天的日期（YYYY-MM-DD）。

### 品牌清单（按顺序做，做不了就跳过并说明原因）

**美国品牌（男装和女装各一份）：**
Gap · Old Navy · J.Crew · Banana Republic · Abercrombie & Fitch · American Eagle · Levi's · Ralph Lauren · Tommy Hilfiger · Calvin Klein · L.L.Bean · Carhartt · Brooks Brothers · Under Armour · Columbia · Everlane · Madewell（只有女装）

**奢侈品牌（用它们的美国站，男装和女装各一份）：**
Gucci · Prada · Burberry · Saint Laurent · Balenciaga · Moncler · Zegna（只有男装）

已经有的不用做：Nike 男上装、Patagonia 男/女。

### 写完之后

1. 在 `app-web/` 里运行 `npm run guides`。它必须输出 **`0 invalid`**；有错误会指出是哪个文件、哪个字段，改到没有为止。
2. 运行 `npm test`，必须全部通过。
3. 在新分支 `agent/brand-guides` 上提交（commit message 用英文），推送，然后开一个 Pull Request。**不要合并到 main。**
4. PR 描述里列一张表，每个品牌一行：
   - 是否完成（完成 / 跳过）；
   - 跳过的原因（登录墙、没有尺码表、只有成衣尺寸等）；
   - 拿不准的地方。

---

## 人怎么核对（采集完之后）

在 PR 里逐个文件看：
1. 打开截图，对照 JSON 的**每一个数字**、单位、尺码标签。
2. 打开 `sourceUrl` 确认是品牌官网，而且内容和截图一致。
3. 看 `kindEvidence` 是不是页面原话，`kind` 填得对不对。
4. 都对的话，把 `reviewed` 改成 `true`（不用写名字），运行 `npm run guides`，提交。
5. 全部核对完再合并 PR。合并后，数据在下一次部署时生效。可以在 `/admin` 的"品牌校准"里看到。

**完成标准：** 至少 10 个美国品牌和 5 个奢侈品牌的人体尺码表核对完毕并合并；`/admin` 的美码字母共识里出现 S/M/L/XL。

**为什么这样设计：** 数据进仓库，每个数字都有来源网址和截图可查，谁采的、谁核的都有记录。没人核对的数据，引擎一律不用（和评测标准答案是同一个原则）。

---

## 进度(2026-10-23)

**第一批已采集**,在 `codex/people-tasks` 分支:9 个美国品牌、16 份表。报告见该分支的 `docs/brand-guide-research-2026-10-23.md`。

**Claude 预检**(机器预检,**不算人工审核**,`reviewed` 仍为 false):
- 16 份逐一对照截图,数字、单位、尺码标签**全部一致**,没有发现抄错;
- 都来自品牌官网,都是人体尺寸。

| 能被引擎使用(有印出的范围) | 只印单个数字(照规则不计入) |
|---|---|
| Banana Republic 男、Calvin Klein 男/女、Columbia 男/女、J.Crew 男、Levi's 男、L.L.Bean 男、Under Armour 男/女 | Banana Republic 女、J.Crew 女、Levi's 女、Madewell 女、Tommy Hilfiger 男/女 |

**核对通过后的效果**(用这批数据模拟):
- 男装美码共识覆盖 XS 到 3XL,大多来自 7 个品牌。例如 M 对应胸围 96.5–101.6 cm。
- 女装形成 S、M、L 三个尺码的共识,各来自 3 个品牌。

**人核对时留意:**
- **Tommy Hilfiger 男/女、Banana Republic 女**:表头的字母尺码(S、M…)横跨两列数字尺码,文件里只记了数字。要不要把"字母对应哪几列"也记下来,待定。
- **Calvin Klein 女 M**:腰围页面印成 "29.5" 30.5""(缺连字符),已按规则省略。
- **Madewell**:品牌库里查不到它的国家,而且只印单个数字,不影响结果。

**还没做:**
- 美国品牌:Gap、Old Navy、Abercrombie & Fitch、American Eagle、Ralph Lauren、Carhartt(条款弹窗,未接受)、Brooks Brothers、Everlane、L.L.Bean 女装(尺码标签长度上限已放宽到 24,可以补)。
- 7 个奢侈品牌全部未完成。

### 第二批预检(2026-10-23,PR #2,共 31 份)

- **数字核对**:新增 15 份里,有印出范围、会被引擎使用的 9 份已对照截图逐个核对,数字全部一致:
  A&F 男/女、Everlane 男/女、L.L.Bean 女、Moncler 男、Burberry 女、Ralph Lauren 男、Gucci 男。
- **未逐个核对**:Burberry 男、Gucci 女、Moncler 女、Ralph Lauren 女、Saint Laurent 男/女。这 6 份每个尺码只印一个数字,引擎不使用。
- **⚠ Ralph Lauren 男装不要按"人体"核对通过。** 页面标题写 Body Measurements,但表里有后身长 28、短袖长 8.75,胸围 M=44——这些是衣服的尺寸。应改成 `"kind": "garment"`,或者不收。
- **Burberry 女装**:XXXS 胸围 26 英寸看起来偏小,但页面确实这么印,和同表的中国号型(S 84 cm,170/84A)也对得上,不算抄错。
- **PR 的 Preview 部署失败**:已在 main 修好(`8f19bdf`:Preview 不再跑数据库迁移)。把 main 合并进 `codex/people-tasks` 后,Preview 应该会通过。

### 审核状态(2026-10-23)

- **已审核通过(`reviewed: true`)**:J.Crew、Levi's、Calvin Klein、Columbia、Under Armour、L.L.Bean、A&F 男装。
  这 7 份已进入引擎,男装美码共识来自 9 个品牌。
- **审核方式改了**:创始人决定不写名字,改成 `reviewed: true`。旧文件里的 `verifiedBy` 仍然被认可。

### 待重新采集(2026-10-24)

- ~~Patagonia 男/女~~ **已采集(PR #4)。更正**:旧表没有过时。Patagonia 同时有两张表:
  通用尺码页(XS 35 / S 37 / M 40,和 `brandCharts.ts` 一致)和商品页弹窗里的数字尺码表
  (S=38/39、M=40/41)。两张都保留,各自标明来源。
- ~~Gap(全部上衣表,男/女)~~ **已采集(PR #4)**:5 张表。男装表和评测里 Gap 那题的数字一致。
