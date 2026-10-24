# 竞品调研：AI 衣橱和插件试穿（2026-10-24）

> 历史初步扫描，保留原文以便追溯；以下绝对性判断、身份关联和许可简写不再代表本项目当前结论。2026-10-24 扩展核查见 [综合研究](summary-2026-10-24.md)、[更正账本](corrections-2026-10-24.md) 和 [项目现状基线](fit-passport-baseline-2026-10-24.md)。原文来自搜索摘要／厂商自述，不是亲自试用；尤其不要沿用“只有 Mira 做尺码”“Leffa 唯一商用候选”“AGPL 不能复制”等说法。

创始人发来两个产品（穿啥 App、trymira.style），要求实际搜索它们的做法，有开源代码就参考。
**方法说明：** 这个云端环境的网络策略挡住了 Chrome 商店、App Store 和这些产品的官网，所以下面的内容来自搜索引擎摘要
和商店页面上的厂商自述，**不是亲自试用，也不是独立评测**。

## 1. 穿啥 App（南京孤岛网络科技，iOS）

- **衣橱：** 拍照入橱，自动识别品类、颜色、风格；能抓淘宝、小红书、得物的商品链接；有单品和组合两种视图，按季节筛选，
  显示"已穿 N 次"和衣橱总价值。
- **每日：** "AI 抽搭"（每天给一套）、衣橱胶囊和穿搭胶囊（摇一摇随机抽）、穿搭日历（每天穿了什么）、带天气的场景。
- **AI 试穿：** 数字模特、真人照换装、模特照换脸、5 秒试穿视频、正侧背三视图。按 AI 点数收费，会员每月有额度。
- **其他：** 换发型和发色、风格档案（色彩季型、五官分析、妆容、首饰）。
- **它不做：** 尺码。

**同类（国内很挤）：** Outfity（穿搭日历、提前规划一周）、WearWow（截图同款试穿、出行规划）、搭搭（自称 200 万用户，
按天气温度推荐 OOTD）、AI 衣橱（会员 18 元/月、68 元/年）、Acloset（AI 造型师对话）。
**结论：** 按天气推荐、穿搭日历、AI 抠图在这个赛道已经是标配，不构成差异。

## 2. trymira.style（Mira，Chrome 插件）

- 官网写的是"Chrome 上的 3D 时尚轮播"。用户上传一张照片、填身体尺寸，生成自己的虚拟形象；在任何购物网站的商品页打开插件，
  就把商品渲染到形象上。可以叠穿成一整套，能分辨衣服是穿着的还是拿在手里的。
- 商店页面声称在浏览器本地运行，并且会记录用户看过的商品页上的商品（名称、价格、图片、位置）。评分 5.0，只有 1 条评价。
- **它和我们的插件是同一个入口**（在别人的商品页上点一下），但给的是"看起来怎么样"，不是"该买哪个尺码"。
- 同名的还有：一个叫"Mira — AI 尺码推荐 + 虚拟试穿"的插件（说是读商店尺码表、按身体尺寸推荐，**最直接的竞品**，
  但第三方镜像显示它已从商店下架）；yourmira.io（给 Shopify 商家的试穿插件）；创始人作品页上描述的"用照片建 3D 身体模型、
  物理引擎模拟布料下垂"（仍在开发，没有公布准确度）。
- 一家试穿厂商自己的常见问题里写着：尺码需要测量数据，测量数据来自尺码表，不是来自图片。**这正是我们的位置。**

## 3. 可以参考的开源项目（只借鉴思路，用代码前先看许可证）

| 项目 | 做什么 | 许可证 | 能不能用 |
|---|---|---|---|
| Libre Closet | 自托管衣橱：搭配、**穿搭日历（一天可排多套、标记已穿）**、抠图、离线 PWA | AGPL-3.0 | 只看思路，**不能拷代码**（会传染到我们的私有代码） |
| zebangeth/ai-closet | React Native 衣橱 App，数字化、搭配 | MIT | 可以参考代码 |
| wardrowbe | FastAPI + Postgres，天气用 Open-Meteo | 未核实 | 只看思路 |
| Leffa（试穿模型） | 图片虚拟试穿 | 代码和权重 MIT（依赖的底模另有条款） | 以后真做图片试穿时唯一可商用的开源候选 |
| CatVTON / IDM-VTON / OOTDiffusion / FitDiT | 图片虚拟试穿 | CC BY-NC-SA 4.0 | **不能商用** |
| RMBG-2.0（抠图） | 衣服照片去背景 | CC BY-NC 4.0 | **不能商用**，要买授权 |
| XQ0820/open-virtual-try-on-models | 按许可证整理的开源试穿模型清单（2026-10-19 核对） | — | 选模型时查 |

**天气：** Open-Meteo 免费版只限非商业使用，商用要订阅。我们要做天气推荐，需要选一个商用许可清楚的来源（或者付费），
这一点要先定。

## 4. 对 Fit Passport 的结论

1. **定位不变，而且更清楚了：** 别人都在做"好不好看"（AI 试穿）和"今天穿什么"（衣橱），只有已下架的那个 Mira 尝试过
   "该买哪个尺码"。我们的插件 + 尺码引擎 + 评测是别人没有的。
2. **借日常功能，但让它产出合身数据：** 穿搭日历的每条记录都顺手问一句"合不合身"，写进现有的穿着感受记录（`ComfortCheck`）。
   别人的日历只是回顾，我们的日历在攒衡量推荐准确率的数据。
3. **随机抽一套只抽"现在合身、当季、最近没穿"的**：只有我们知道哪件现在合身。
4. **三视图用我们的 3D 合身图做（正、侧、背），不用生成图**：AI 生成的图永远好看，看不出紧还是松。
5. **不做：** AI 换装图片和视频（贵，而且会误导尺码）、换发型、从自拍分析五官（违反"脸由用户自己选，从不推测"，
   人脸属于敏感个人信息）、色彩季型（缺乏研究依据）。

## 来源

- 穿啥 App Store：https://apps.apple.com/cn/app/id6764898167
- 一亩三分地开源衣橱帖：https://www.1point3acres.com/bbs/thread-1106256-1-1.html
- Outfity：https://apps.apple.com/cn/app/id6745757612 · WearWow：https://apps.apple.com/cn/app/id6748722716 · 搭搭：https://apps.apple.com/app/id1616484963
- Mira 官网：https://www.trymira.style/ · Mira 插件：https://chromewebstore.google.com/detail/mira-virtual-try-on/njokbehokhenelmjcnfcngonekekjkip
- "Mira — AI 尺码推荐"插件镜像：https://socket.dev/chrome/package/mpnjdjkdhhakflegopbbpamceenbjadp
- 创始人作品页：https://parsayp.com/work/mira-virtual-try-on · yourmira.io：https://www.yourmira.io/
- 试穿模型许可证：https://github.com/XQ0820/open-virtual-try-on-models · https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models
- RMBG-2.0：https://github.com/Bria-AI/RMBG-2.0
- Libre Closet：https://dungeontools.duckdns.org/ · ai-closet：https://awesome.ecosyste.ms/projects/github.com%2Fzebangeth%2Fai-closet · wardrowbe：https://www.sourcepulse.org/projects/29145999
