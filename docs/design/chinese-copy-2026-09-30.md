# Fit Passport 中文本地化修改清单

**使用说明**  
以下内容只修改中文 locale；英文版保持不变。Claude Code 应按“模块 \+ 页面位置 \+ 英文原文”定位，再将中文替换为指定文本。未列出的文案和样式暂不修改。

**处理顺序**  
先完成“首页”，再依次处理“尺码”和“插件”。每次只补充、确认和实现一个大模块，避免不同页面的修改混在一起。

## 模块 00｜全局组件

### 00.1 顶部导航栏

页面位置：桌面端 Header 主导航

英文原文：Check  
中文替换：尺码

英文原文：Extension  
中文替换：插件

英文原文：Closet  
中文替换：衣橱

英文原文：Passport  
中文替换：护照

英文原文：Outfits  
中文替换：搭配

英文原文：Community  
中文替换：社区

英文原文：Help  
中文替换：帮助

英文原文：Claim account  
中文替换：认领账户  
备注：CTA 按钮可以保留四个字；如果后续必须压缩，可以改为“认领”。

**导航排版要求（给 Claude Code）**  
1\. 中文和英文导航共用相同的桌面内容宽度，不要让导航总宽度随中文字符数量自动收缩。  
2\. 桌面端为导航链接容器设置统一的 width 或 flex-basis，并使用 display: flex、justify-content: space-between、align-items: center。不要只依赖统一的 gap。  
3\. 以当前英文版为视觉基准。切换语言后，第一个导航项与最后一个“帮助 / Help”的左右端点应基本一致；语言切换和账户按钮的位置不应跳动。  
4\. 中文标签可使用约 0.06em–0.10em 的 letter-spacing，让两个汉字更舒展；不要在翻译字符串里手动加入空格。  
5\. 保持英文版现有字号、字重、导航高度以及 hover / active 状态，只调整中文标签与横向分布。  
6\. 移动端继续沿用原有 responsive layout。统一桌面宽度只在 desktop breakpoint 生效，避免小屏溢出。  
7\. 当前英文导航约 500px 的视觉宽度可作为参考，但不要对所有屏幕硬编码为 500px，应复用现有 header breakpoint。

**导航验收标准**  
中英文来回切换时，导航整体宽度和左右边界基本不变；中文标签舒展但不过度分散；右侧语言切换和账户按钮不移动；没有文字换行、遮挡或溢出。

### 00.2 页面元信息

页面位置：全局组件 → 页面元信息；代码定位：app-web/src/i18n/messages/en.ts → meta.title  
英文原文：Fit Passport  
中文替换：Fit Passport

页面位置：全局组件 → 页面元信息；代码定位：app-web/src/i18n/messages/en.ts → meta.description  
英文原文：One body. One fit identity. Any store. A consumer-owned fit layer for apparel.  
中文替换：一身一证，通行每一家店。Fit Passport，让你掌握自己的合身身份。

### 00.3 全局动作、状态与可访问性

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.languageLabel  
英文原文：Language  
中文替换：语言

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.zhShort  
英文原文：中  
中文替换：中

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.enShort  
英文原文：EN  
中文替换：EN

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.zhLong  
英文原文：中文  
中文替换：中文

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.enLong  
英文原文：English  
中文替换：English

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.backToTop  
英文原文：Back to top  
中文替换：返回顶部

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.dismiss  
英文原文：Dismiss  
中文替换：关闭

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.beta  
英文原文：Beta  
中文替换：测试版

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.build  
英文原文：{type} build  
中文替换：{type}体型

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.accuracy.low  
英文原文：Basic accuracy  
中文替换：基础准确度

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.accuracy.medium  
英文原文：Good accuracy  
中文替换：较高准确度

页面位置：全局组件 → 全局动作、状态与可访问性；代码定位：app-web/src/i18n/messages/en.ts → common.accuracy.high  
英文原文：High accuracy  
中文替换：高准确度

### 00.4 导航与移动端菜单

页面位置：全局组件 → 导航与移动端菜单；代码定位：app-web/src/i18n/messages/en.ts → nav.main  
英文原文：Main  
中文替换：主导航

页面位置：全局组件 → 导航与移动端菜单；代码定位：app-web/src/i18n/messages/en.ts → nav.review  
英文原文：Review  
中文替换：内容审核

页面位置：全局组件 → 导航与移动端菜单；代码定位：app-web/src/i18n/messages/en.ts → nav.yourAccount  
英文原文：Your account, @{username}  
中文替换：我的账户，@{username}

页面位置：全局组件 → 导航与移动端菜单；代码定位：app-web/src/i18n/messages/en.ts → nav.openMenu  
英文原文：Open menu  
中文替换：展开菜单

页面位置：全局组件 → 导航与移动端菜单；代码定位：app-web/src/i18n/messages/en.ts → nav.closeMenu  
英文原文：Close menu  
中文替换：收起菜单

### 00.5 页脚链接与品牌说明

页面位置：全局组件 → 页脚链接与品牌说明；代码定位：app-web/src/i18n/messages/en.ts → footer.demo  
英文原文：DEMO  
中文替换：产品示例

### 00.6 认领账户提示

页面位置：全局组件 → 认领账户提示；代码定位：app-web/src/i18n/messages/en.ts → claimNudge.title  
英文原文：Save your passport  
中文替换：保存你的合身护照

页面位置：全局组件 → 认领账户提示；代码定位：app-web/src/i18n/messages/en.ts → claimNudge.body  
英文原文：Set a username and password, so your closet and measurements stay when you close the browser.  
中文替换：设置用户名与密码，关闭浏览器后，衣橱与身形数据仍可保留。

页面位置：全局组件 → 认领账户提示；代码定位：app-web/src/i18n/messages/en.ts → claimNudge.cta  
英文原文：Claim account  
中文替换：认领账户

### 00.7 既有确认文案的源码定位

代码定位：app-web/src/i18n/messages/en.ts → nav.check。沿用 00.1 顶部导航栏 中英文原文“Check”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.extension。沿用 00.1 顶部导航栏 中英文原文“Extension”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.closet。沿用 00.1 顶部导航栏 中英文原文“Closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.passport。沿用 00.1 顶部导航栏 中英文原文“Passport”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.outfits。沿用 00.1 顶部导航栏 中英文原文“Outfits”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.community。沿用 00.1 顶部导航栏 中英文原文“Community”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.help。沿用 00.1 顶部导航栏 中英文原文“Help”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → nav.claimAccount。沿用 00.1 顶部导航栏 中英文原文“Claim account”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.tagline。沿用 01.6 最终行动区与页脚 中英文原文“One body. One fit identity. Any store. A consumer-owned fit layer — you keep the profile, it works wherever you shop.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.privacy。沿用 01.6 最终行动区与页脚 中英文原文“Precise measurements never leave your account.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.columns.product。沿用 01.6 最终行动区与页脚 中英文原文“PRODUCT”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.columns.community。沿用 01.6 最终行动区与页脚 中英文原文“COMMUNITY”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.columns.account。沿用 01.6 最终行动区与页脚 中英文原文“ACCOUNT”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.check。沿用 01.6 最终行动区与页脚 中英文原文“Check a size”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.extension。沿用 01.6 最终行动区与页脚 中英文原文“Browser extension”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.closet。沿用 01.6 最终行动区与页脚 中英文原文“Your closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.passport。沿用 01.6 最终行动区与页脚 中英文原文“Passport”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.outfits。沿用 01.6 最终行动区与页脚 中英文原文“Outfits”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.directory。沿用 01.6 最终行动区与页脚 中英文原文“Directory”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.badges。沿用 01.6 最终行动区与页脚 中英文原文“Badges”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.help。沿用 01.6 最终行动区与页脚 中英文原文“Help & guide”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.account。沿用 01.6 最终行动区与页脚 中英文原文“Your account”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.login。沿用 01.6 最终行动区与页脚 中英文原文“Log in”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.links.recover。沿用 01.6 最终行动区与页脚 中英文原文“Reset password”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → footer.demoLine。沿用 01.6 最终行动区与页脚 中英文原文“A working prototype. Recommendations are explained, never guessed at silently.”对应的已确认中文。

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 顶部导航保持现有单行布局；窄屏继续使用原有折叠菜单。菜单文案居左，开关按钮保留可访问名称。  
9\. 页脚桌面端沿用现有列数；移动端按原分组纵向排列。Fit Passport 和团队成员姓名不翻译。  
英文基准：Kpewww/fit-passport，main 分支，提交 eb42fc68a8f90f1e377c26e0be196b206abb3ef8。公共界面 1,122 个文案键均已对应既有确认项或本次新增译文；另补充徽章目录、推荐依据、可见错误及内容审核。新增译文以英文源码和已确认品牌语感为依据。徽章在帮助页与护照中的显示，统一引用模块 05 的对应条目，不另建一套译名。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 01｜首页

### 01.1 首屏 Hero

页面位置：首页首屏主标题  
英文原文：Know what fits, anywhere.  
中文替换：「穿」越时空，合身随行。

页面位置：首页首屏说明文字  
英文原文：Check your size on any product page. We weigh it against the clothes you already own — and show our working.  
中文替换：无论在哪个品牌，Fit Passport 都会记住你的尺寸、偏好，以及真正适合你的衣服。

### 01.2 “理念”与三步流程

页面位置：区块标签  
英文原文：THE IDEA  
中文替换：理念

页面位置：左侧大标题  
英文原文：Your fit, carried between stores.  
中文替换：合身无界，自在随行。  
桌面端建议分为两行：  
合身无界，  
自在随行。

页面位置：左侧说明文字  
英文原文：Sizes never agree across brands. Fit Passport holds one portable profile and translates it anywhere you shop — no retailer integration, no guessing.  
中文替换：尺码纷繁，不再迷人眼。Fit Passport 记住你的尺寸与偏好，让熟悉的合身感，随你去往每一家店。

页面位置：左侧按钮  
英文原文：Build your passport  
中文替换：创建合身护照

页面位置：步骤 01 标题  
英文原文：Open a product page  
中文替换：打开商品页面

页面位置：步骤 01 说明  
英文原文：Click Fit Passport on any store's product page. It reads the brand, the garment and the size chart from the page you're looking at.  
中文替换：在任意商店的商品页面打开 Fit Passport。它会读取当前页面中的品牌、服装类型和尺码表。

页面位置：步骤 02 标题  
英文原文：We weigh it against you  
中文替换：与你逐项比对

页面位置：步骤 02 说明  
英文原文：Your measurements, your preferred fit, and the clothes you already own and love — all considered.  
中文替换：你的身形数据、版型偏好，以及衣橱里那些你喜欢且真正合身的衣服，都会纳入判断。

页面位置：步骤 03 标题  
英文原文：A size, and the reason  
中文替换：一个尺码，一份依据

页面位置：步骤 03 说明  
英文原文：Not a guess. Every recommendation shows its work, so you can trust it — or overrule it.  
中文替换：每一次推荐，都有迹可循；每一次选择，都由你决定。依据在眼前，合身由你定义。

**本区块排版要求（给 Claude Code）**  
1\. 中文版继续保留英文版的字号、字重、卡片高度、数字 01 / 02 / 03 和图标位置。  
2\. 左侧中文大标题在桌面端按上面的两行显示，以保持与英文版相近的视觉高度和留白；移动端允许自然换行。  
3\. 不要为了塞入中文而缩小标题或正文。说明文字可以自然换行，但不能超出卡片或与图标重叠。  
4\. 破折号使用中文全角形式“——”，不要替换成两个短横线。

### 01.3 随身衣橱与核心功能

页面位置：区块标签  
英文原文：WHAT YOU GET  
中文替换：你将拥有

页面位置：区块大标题  
英文原文：A wardrobe that travels.  
中文替换：一座随你远行的衣橱。

页面位置：卡片 01 标题  
英文原文：Your closet, learned  
中文替换：越懂衣橱，越懂你

页面位置：卡片 01 说明  
英文原文：Clothes you love become anchors — we learn how each brand runs on you.  
中文替换：你钟爱的衣服会成为合身的锚点，让 Fit Passport 慢慢读懂每个品牌在你身上的尺度。

页面位置：卡片 02 标题  
英文原文：Compose the look  
中文替换：搭出你的风格

页面位置：卡片 02 说明  
英文原文：Build outfits on a mannequin shaped like you, then share them.  
中文替换：在贴近你身形的模型上自由搭配，再把喜欢的造型分享出去。

页面位置：卡片 03 标题  
英文原文：Earn your taste  
中文替换：品味，自有勋章

页面位置：卡片 03 说明  
英文原文：Struck-metal badges for a curated closet and admired looks.  
中文替换：用金属质感徽章，记录精心经营的衣橱与令人心动的搭配。

本区块排版要求（给 Claude Code）  
1\. 保留英文版三张卡片的尺寸、间距、圆角和图片区域高度。  
2\. 中文卡片标题允许自然换行，但三张卡片的正文起始位置与底部应保持对齐。  
3\. 不要缩小中文正文；必要时微调卡片正文行高，并保持整体高度一致。  
4\. 品牌名、服装尺码和徽章视觉保持不变。

### 

### 01.4 用户所有的合身身份

页面位置：区块标签  
英文原文：CONSUMER-OWNED  
中文替换：真正属于你

页面位置：区块大标题  
英文原文：You keep the profile. It works at every store.  
中文替换：身份归你，走到哪里都合身。  
桌面端建议分为两行：  
身份归你，  
走到哪里都合身。

页面位置：区块说明文字  
英文原文：Fit was never a picture problem. It’s a memory problem — and the memory is already hanging in your closet.  
中文替换：合身，不在镜头里，而在一次次穿着中沉淀。属于你的答案，早已藏在衣橱里。

本区块排版要求（给 Claude Code）  
1\. 保留英文版深色背景、中央对齐和大面积留白。  
2\. 中文主标题保持两行，不要因字符较少而缩小整个文本区域。  
3\. 区块标签继续使用蓝色字距样式；正文保持较低对比度，但不能影响阅读。

### 

### 01.5 社区价值

页面位置：区块标签  
英文原文：MORE THAN A SIZE CALCULATOR  
中文替换：不止于尺码

页面位置：区块大标题  
英文原文：A community that dresses better together.  
中文替换：衣着为媒，品味共生  
桌面端建议分为两行：  
衣着为媒，  
品味共生。

页面位置：区块说明文字  
英文原文：Sizing is the tool. The reason people stay is each other — seeing what fits real bodies, sharing taste, and getting better at buying clothes.  
中文替换：尺码是起点，彼此的启发让品味生长。看见真实的合身选择，分享所穿所爱，也在交流中懂时尚。

页面位置：卡片 01 标题  
英文原文：Fit intelligence from real bodies  
中文替换：真实身形，自有合身答案

页面位置：卡片 01 说明  
英文原文：See which brands and sizes actually worked for people built like you — not a model in a studio.  
中文替换：参考与你身形相近的人，找到真正合适的品牌与尺码，让每一次选择都有迹可循。

页面位置：卡片 01 按钮  
英文原文：Browse the directory  
中文替换：浏览社区名录

页面位置：卡片 02 标题  
英文原文：Share your taste, build a reputation  
中文替换：分享品味，让风格被看见

页面位置：卡片 02 说明  
英文原文：Post outfits from your own closet and earn struck-metal badges as your archive grows.  
中文替换：分享衣橱里的搭配；随着你的风格记录不断丰富，解锁专属徽章。

页面位置：卡片 02 按钮  
英文原文：Compose a look  
中文替换：创建一套搭配

页面位置：卡片 03 标题  
英文原文：Learn what to buy next  
中文替换：下一件，更懂怎么选

页面位置：卡片 03 说明  
英文原文：Every look shows its pieces and sizes — so one you like is one you can actually find and fit.  
中文替换：单品与尺码清晰可寻，让每一次心动，都能真正穿上身。

页面位置：卡片 03 按钮  
英文原文：See the badge ladder  
中文替换：探索徽章之路

页面位置：区块隐私说明  
英文原文：Everything social is opt-in: you choose to be listed, and precise measurements are never shared — only coarse, useful signals.  
中文替换：是否加入社区、是否公开展示，都由你决定。精确身形数据只属于你；他人看到的，仅是经过概括且有用的合身线索。

本区块排版要求（给 Claude Code）  
1\. 大标题继续保留黑色与蓝色斜体的视觉分层，建议将“品味共生”作为蓝色斜体强调部分。  
2\. 三张卡片保持相同高度和列宽；中文标题允许两行，但不能挤压按钮位置。  
3\. 保持卡片底部按钮与箭头对齐，按钮文案不要换行。  
4\. 隐私说明继续使用较小字号，但需保持可读性。

### 

### 01.6 最终行动区与页脚

页面位置：首页最终行动区主标题  
英文原文：Start your fit passport.  
中文替换：开启你的合身护照。

页面位置：主要按钮  
英文原文：Create your passport  
中文替换：创建合身护照

页面位置：次要按钮  
英文原文：Get the extension  
中文替换：获取浏览器插件

页面位置：示例入口  
英文原文：Just exploring? Try a demo closet  
中文替换：想先看看？体验示例衣橱

页面位置：页脚品牌说明  
英文原文：One body. One fit identity. Any store. A consumer-owned fit layer — you keep the profile, it works wherever you shop.  
中文替换：一身一证，通行每一家店。你的合身身份由你掌握，去往哪里，都能被读懂。

页面位置：页脚隐私说明  
英文原文：Precise measurements never leave your account.  
中文替换：精确身形数据，只留在你的账户中。

页面位置：页脚栏目  
英文原文：PRODUCT  
中文替换：产品

英文原文：Check a size  
中文替换：查找尺码

英文原文：Browser extension  
中文替换：浏览器插件

英文原文：Your closet  
中文替换：我的衣橱

英文原文：Passport  
中文替换：合身护照

英文原文：Outfits  
中文替换：穿搭

英文原文：COMMUNITY  
中文替换：社区

英文原文：Directory  
中文替换：社区名录

英文原文：Badges  
中文替换：徽章

英文原文：Help & guide  
中文替换：帮助与指南

英文原文：ACCOUNT  
中文替换：账户

英文原文：Your account  
中文替换：我的账户

英文原文：Log in  
中文替换：登录

英文原文：Reset password  
中文替换：重置密码

页面位置：页脚原型说明  
英文原文：A working prototype. Recommendations are explained, never guessed at silently.  
中文替换：可用的产品原型。每一次推荐，都有据可循。

本区块排版要求（给 Claude Code）  
1\. 主标题继续保留英文版黑色与蓝色斜体的视觉分层，建议将“合身护照”作为蓝色强调部分。  
2\. 保持两个按钮的尺寸、顺序和图标位置，不要因中文字符较少而缩窄按钮。  
3\. 页脚继续使用原有三列结构；创作者姓名和年份保持不变。  
4\. 中文栏目标题延续英文版的大写标签感，可通过字距与字重实现，不要在文本中手动加入空格。

## 

## 

### 01.7 首屏补充状态

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.eyebrow  
英文原文：One body · one fit identity · any store  
中文替换：一身一证 · 合身身份 · 通行每一家店

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.cta  
英文原文：Add Fit Passport to Chrome  
中文替换：添加到 Chrome

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.noteZip  
英文原文：Free · {size} KB · reads only the page you click it on  
中文替换：免费 · {size} KB · 仅在你点击时读取当前页面

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.noteStore  
英文原文：Free · reads only the page you click it on  
中文替换：免费 · 仅在你点击时读取当前页面

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.pasteLink  
英文原文：Or paste a product link  
中文替换：也可粘贴商品链接

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.placeholder  
英文原文：Paste a product URL…  
中文替换：粘贴商品链接……

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.linkLabel  
英文原文：Product link  
中文替换：商品链接

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.submit  
英文原文：Get my size  
中文替换：查看推荐

页面位置：首页 → 首屏补充状态；代码定位：app-web/src/i18n/messages/en.ts → home.hero.pasteNote  
英文原文：Works on some stores. Many large ones block our servers from reading their pages — the extension reads the page in your own browser instead.  
中文替换：部分商店支持链接查询。许多大型商店会限制服务器读取页面，浏览器插件可直接读取你正在浏览的商品页。

### 01.8 已登录首页与任务进度

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.yourPassport  
英文原文：Your passport  
中文替换：我的合身护照

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.badgesEarned.one  
英文原文：{n} badge earned  
中文替换：已获得 {n} 枚徽章

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.badgesEarned.other  
英文原文：{n} badges earned  
中文替换：已获得 {n} 枚徽章

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.viewPassport  
英文原文：View your fit passport  
中文替换：查看合身护照

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.profileTitle  
英文原文：Your fit profile  
中文替换：我的合身身份

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.accuracyHigh  
英文原文：You've given the engine strong signals — recommendations should be sharp.  
中文替换：合身依据已经充分，推荐会更贴近你。

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.accuracyMedium  
英文原文：Good start. Add more known-good items to raise accuracy.  
中文替换：已有不错的基础，再添加几件合身衣物，让推荐更可靠。

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.accuracyLow  
英文原文：Add your fit preference and a few clothes to unlock accurate sizing.  
中文替换：填写版型偏好，再添加几件衣物，开启更可靠的尺码推荐。

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.setUp  
英文原文：set up  
中文替换：已设置

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.doIt  
英文原文：Do it  
中文替换：去完成

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.lastRecommendation  
英文原文：Last recommendation  
中文替换：最近一次推荐

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.lastLine  
英文原文：\<b\>{size}\</b\> for {product} · {pct}% confidence  
中文替换：{product} 推荐 \<b\>{size}\</b\> · 可信度 {pct}%

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.recordFit  
英文原文：Record fit  
中文替换：记录穿着感受

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.steps.profile  
英文原文：Set your fit preference  
中文替换：设置版型偏好

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.steps.closet  
英文原文：Add 3 items that fit you well  
中文替换：添加 3 件合身衣物

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.steps.check  
英文原文：Check your first product  
中文替换：查询第一件商品

页面位置：首页 → 已登录首页与任务进度；代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.steps.outcome  
英文原文：Record how it fit  
中文替换：记录实际穿着感受

### 01.9 既有确认文案的源码定位

代码定位：app-web/src/i18n/messages/en.ts → home.hero.title。沿用 01.1 首屏 Hero 中英文原文“Know what fits, anywhere.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.hero.lede。沿用 01.1 首屏 Hero 中英文原文“Check your size on any product page. We weigh it against the clothes you already own — and show our working.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.eyebrow。沿用 01.2 “理念”与三步流程 中英文原文“THE IDEA”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.title。沿用 01.2 “理念”与三步流程 中英文原文“Your fit, carried between stores.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.body。沿用 01.2 “理念”与三步流程 中英文原文“Sizes never agree across brands. Fit Passport holds one portable profile and translates it anywhere you shop — no retailer integration, no guessing.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.cta。沿用 01.2 “理念”与三步流程 中英文原文“Build your passport”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.open.title。沿用 01.2 “理念”与三步流程 中英文原文“Open a product page”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.open.body。沿用 01.2 “理念”与三步流程 中英文原文“Click Fit Passport on any store's product page. It reads the brand, the garment and the size chart from the page you're looking at.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.weigh.title。沿用 01.2 “理念”与三步流程 中英文原文“We weigh it against you”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.weigh.body。沿用 01.2 “理念”与三步流程 中英文原文“Your measurements, your preferred fit, and the clothes you already own and love — all considered.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.answer.title。沿用 01.2 “理念”与三步流程 中英文原文“A size, and the reason”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.how.steps.answer.body。沿用 01.2 “理念”与三步流程 中英文原文“Not a guess. Every recommendation shows its work, so you can trust it — or overrule it.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.eyebrow。沿用 01.3 随身衣橱与核心功能 中英文原文“WHAT YOU GET”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.title。沿用 01.3 随身衣橱与核心功能 中英文原文“A wardrobe that travels.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.closet.title。沿用 01.3 随身衣橱与核心功能 中英文原文“Your closet, learned”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.closet.line。沿用 01.3 随身衣橱与核心功能 中英文原文“Clothes you love become anchors — we learn how each brand runs on you.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.outfit.title。沿用 01.3 随身衣橱与核心功能 中英文原文“Compose the look”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.outfit.line。沿用 01.3 随身衣橱与核心功能 中英文原文“Build outfits on a mannequin shaped like you, then share them.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.badge.title。沿用 01.3 随身衣橱与核心功能 中英文原文“Earn your taste”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.get.badge.line。沿用 01.3 随身衣橱与核心功能 中英文原文“Struck-metal badges for a curated closet and admired looks.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.parallax.eyebrow。沿用 01.4 用户所有的合身身份 中英文原文“CONSUMER-OWNED”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.parallax.title。沿用 01.4 用户所有的合身身份 中英文原文“You keep the profile. It works at every store.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.parallax.body。沿用 01.4 用户所有的合身身份 中英文原文“Fit was never a picture problem. It’s a memory problem — and the memory is already hanging in your closet.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.eyebrow。沿用 01.5 社区价值 中英文原文“MORE THAN A SIZE CALCULATOR”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.title。沿用 01.5 社区价值 中英文原文“A community that dresses better together.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.body。沿用 01.5 社区价值 中英文原文“Sizing is the tool. The reason people stay is each other — seeing what fits real bodies, sharing taste, and getting better at buying clothes.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.bodies.title。沿用 01.5 社区价值 中英文原文“Fit intelligence from real bodies”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.bodies.body。沿用 01.5 社区价值 中英文原文“See which brands and sizes actually worked for people built like you — not a model in a studio.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.bodies.cta。沿用 01.5 社区价值 中英文原文“Browse the directory”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.taste.title。沿用 01.5 社区价值 中英文原文“Share your taste, build a reputation”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.taste.body。沿用 01.5 社区价值 中英文原文“Post outfits from your own closet and earn struck-metal badges as your archive grows.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.taste.cta。沿用 01.5 社区价值 中英文原文“Compose a look”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.next.title。沿用 01.5 社区价值 中英文原文“Learn what to buy next”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.next.body。沿用 01.5 社区价值 中英文原文“Every look shows its pieces and sizes — so one you like is one you can actually find and fit.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.cards.next.cta。沿用 01.5 社区价值 中英文原文“See the badge ladder”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.community.footnote。沿用 01.5 社区价值 中英文原文“Everything social is opt-in: you choose to be listed, and precise measurements are never shared — only coarse, useful signals.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.closing.title。沿用 01.6 最终行动区与页脚 中英文原文“Start your fit passport.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.closing.create。沿用 01.6 最终行动区与页脚 中英文原文“Create your passport”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.closing.extension。沿用 01.6 最终行动区与页脚 中英文原文“Get the extension”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.closing.demo。沿用 01.6 最终行动区与页脚 中英文原文“Just exploring? Try a demo closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → home.dashboard.badges。沿用 01.6 最终行动区与页脚 中英文原文“Badges”对应的已确认中文。

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 首屏桌面端固定为两行：第一行“「穿」越时空，”；第二行“合身随行。”。第二行沿用原 accent 颜色，不额外添加中文斜体。移动端同样保留这两行，随容器调整中文标题字号。  
9\. 已登录首页的任务卡保留原有顺序；动态数量和推荐尺码独立显示，不将标题与数量写成固定字符串。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 02｜尺码

### 02.1 首屏尺码查询

页面位置：页面标签  
英文原文：SIZE CHECK  
中文替换：尺码查询

页面位置：首屏大标题  
英文原文：What size should I buy?  
中文替换：选多大，才合身？

页面位置：首屏说明文字  
英文原文：Paste a product URL. We'll read the page, extract its sizing, and recommend a size — with the reasons, so you can see exactly what it's based on.  
中文替换：粘贴商品链接，Fit Passport 会读取页面尺码信息，结合你的合身档案给出推荐，并告诉你每一条判断的依据。

页面位置：输入框  
英文原文：Paste a product URL...  
中文替换：粘贴商品链接…

页面位置：主要按钮  
英文原文：Get my size  
中文替换：查看推荐

页面位置：示例入口  
英文原文：Try:  
中文替换：试试看：

本页面用词规则  
1\. “尺码”作为完整词可以正常使用。  
2\. 问句、短标题和按钮中避免单独使用“码”，防止产生谐音或歧义。  
3\. 标题保持简短自然，不使用“哪一码”一类表达。

### 02.2 尺码换算

页面位置：区块标签  
英文原文：SIZE CONVERTER  
中文替换：尺码换算

页面位置：区块标题  
英文原文：Know your size in every system  
中文替换：不同标准，合身如一

页面位置：输入字段  
英文原文：Size you wear  
中文替换：你常穿的尺码

英文原文：In system  
中文替换：当前尺码体系

页面位置：服装分类  
英文原文：Tops  
中文替换：上装

英文原文：Bottoms  
中文替换：下装

英文原文：Shoes  
中文替换：鞋履

页面位置：换算结果标签  
英文原文：S / M / L  
中文替换：字母尺码

英文原文：EU NUMBER  
中文替换：欧码

页面位置：换算说明  
英文原文：Indicative conversions only — brands differ. Paste a product link above for a recommendation that also weighs your body and the clothes you already own.  
中文替换：换算结果仅供参考，品牌版型各有不同。粘贴商品链接后，我们会结合你的身形与衣橱记录，给出更适合你的建议。

### 02.3 推荐前的信息提示

页面位置：区块标签  
英文原文：BEFORE YOU PASTE A LINK  
中文替换：粘贴链接前

页面位置：区块标题  
英文原文：Right now we'd be guessing.  
中文替换：现在给答案，还少一点依据。

页面位置：区块说明  
英文原文：We can read any product page, but with nothing about you we can only fall back on the brand's own chart. Two minutes of setup changes the answer completely.  
中文替换：我们可以读取商品页面；但在不了解你的情况下，只能参考品牌提供的尺码表。花两分钟完成设置，答案会更贴近你。

页面位置：任务 01 标题  
英文原文：Add your measurements  
中文替换：添加身形数据

页面位置：任务 01 说明  
英文原文：Lets us compare you to the product's actual size chart — worth up to \+35 points of confidence when the chart states a chest.  
中文替换：让商品尺码表与你的身形数据逐项对应；当页面提供胸围数据时，推荐可信度最高可提升 35 分。

页面位置：任务 01 按钮  
英文原文：Add measurements  
中文替换：添加数据

页面位置：任务 02 标题  
英文原文：Add 3 clothes that fit you well  
中文替换：添加 3 件真正合身的衣服

页面位置：任务 02 说明  
英文原文：The strongest signal there is — we learn how each brand runs on you. One garment of the same type is worth up to \+25 points.  
中文替换：衣橱是最可靠的合身线索。我们会从中了解不同品牌在你身上的版型差异；一件同类型的合身衣服，最高可为推荐增加 25 分。

页面位置：任务 02 按钮  
英文原文：Add to closet  
中文替换：添加到衣橱

页面位置：任务 03 标题  
英文原文：Create an account  
中文替换：创建账户

页面位置：任务 03 说明  
英文原文：Keeps your profile, badges and closet — and lets you share a passport.  
中文替换：保存你的合身身份、徽章与衣橱，并可分享你的合身护照。

页面位置：任务 03 按钮  
英文原文：Claim account  
中文替换：认领账户

### 02.4 合身示意图与可访问性

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.aria  
英文原文：{label}: garment chest {garment} cm against your {body} cm, {ease} of room  
中文替换：{label}：衣物胸围 {garment} cm，你的胸围 {body} cm，余量为{ease}

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.roomInChest  
英文原文：Room in the chest  
中文替换：胸部余量

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.measures  
英文原文：{label} measures \<b\>{garment} cm\</b\> around the chest. Yours is \<b\>{body} cm\</b\>.  
中文替换：{label} 的衣物胸围为 \<b\>{garment} cm\</b\>，你的胸围为 \<b\>{body} cm\</b\>。

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.measuresEstimated  
英文原文：{label} measures \<b\>{garment} cm\</b\> around the chest. Estimated body is \<b\>{body} cm\</b\>.  
中文替换：{label} 的衣物胸围为 \<b\>{garment} cm\</b\>，参考身形的估算胸围为 \<b\>{body} cm\</b\>。

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.shoulders  
英文原文：Shoulders: {ease} ({garment} cm vs {body} cm).  
中文替换：肩部余量：{ease}（衣物 {garment} cm，身形 {body} cm）。

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.estimatedNote  
英文原文：Your body numbers are a regional estimate, so this drawing is too. Add your measurements to make it real.  
中文替换：身形数据采用地区估算值，图示也据此绘制。补充你的身形数据后，图示会更贴近实际。

页面位置：尺码 → 合身示意图与可访问性；代码定位：app-web/src/i18n/messages/en.ts → fitFigure.tapToCompare  
英文原文：Tap a size to compare. Drawn to scale — the outline is the garment, the solid shape is you. Not a preview of how it will look.  
中文替换：点击尺码即可比较。图示按比例绘制，外轮廓代表衣物，实心部分代表身形，仅用于比较尺寸与余量，无法呈现实际穿着效果。

### 02.5 查询状态与输入反馈

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.betaNote  
英文原文：Links work on some stores; many large ones block our servers. \<link\>The browser extension\</link\> reads the page in your own browser instead.  
中文替换：部分商店支持链接查询；许多大型商店会限制服务器读取页面。\<link\>浏览器插件\</link\>可直接读取你正在浏览的商品页。

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.reading  
英文原文：Reading…  
中文替换：读取中……

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.checkFailed  
英文原文：check failed  
中文替换：尺码查询失败，请重试

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.notFound  
英文原文：We couldn't find that check. It belongs to the Fit Passport session in the browser that ran it.  
中文替换：未找到这次查询。请使用当时发起查询的浏览器及 Fit Passport 会话打开。

页面位置：尺码 → 查询状态与输入反馈；代码定位：app-web/src/i18n/messages/en.ts → check.reopenFailed  
英文原文：We couldn't reopen that check.  
中文替换：无法重新打开这次查询。

### 02.6 尺码换算补充

页面位置：尺码 → 尺码换算补充；代码定位：app-web/src/i18n/messages/en.ts → check.converter.kindLabel  
英文原文：Garment kind  
中文替换：服装类型

页面位置：尺码 → 尺码换算补充；代码定位：app-web/src/i18n/messages/en.ts → check.converter.auto  
英文原文：Auto-detect  
中文替换：自动识别

### 02.7 信息完善与推荐可信度

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.upTo  
英文原文：up to \+{n} points  
中文替换：最高提升 {n} 分

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.chestLabelMore  
英文原文：Add your chest measurement  
中文替换：添加胸围数据

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.chestWhy  
英文原文：Lets us compare you to the product's actual size chart — worth {pts} of confidence when the chart states a chest.  
中文替换：让商品尺码表与你的身形数据逐项对应；当页面提供胸围数据时，推荐可信度{pts}。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.chestCtaMore  
英文原文：Add chest  
中文替换：添加胸围

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.closetWhy  
英文原文：The strongest signal there is — we learn how each brand runs on you. One garment of the same type is worth {pts}.  
中文替换：衣橱是最可靠的合身线索。我们会从中了解不同品牌在你身上的版型差异；有一件同类型的合身衣物作参照，推荐可信度{pts}。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.closetProgress  
英文原文：{n}/3 added  
中文替换：已添加 {n}／3 件

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.eyebrowUndetermined  
英文原文：Why there's no answer yet  
中文替换：还缺哪些依据

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.eyebrowResult  
英文原文：How to sharpen this recommendation  
中文替换：让推荐更可靠

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.titleUndetermined  
英文原文：Every size scored the same.  
中文替换：每个尺码，得分相同。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.titleConfidence  
英文原文：That answer is {pct}% confident.  
中文替换：这份推荐，可信度为 {pct}%。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.titleMissing  
英文原文：Good start — here's what's still missing.  
中文替换：已有基础，再补几份依据。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.bodyUndetermined  
英文原文：That isn't a low score, it's a tie — we had nothing about you to break it with. Either of the first two below turns this into a real recommendation.  
中文替换：所有尺码得分持平，现有信息还不足以分辨哪个更适合你。完成下方前两项中的任意一项，即可为推荐补上判断依据。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.bodyConfidence  
英文原文：Confidence is arithmetic here, not a feeling: it starts at {floor} and rises with each piece of evidence we actually have. Here's what's still on the table.  
中文替换：可信度从 {floor} 起，随已有依据逐项增加。你可以继续补充以下信息。

页面位置：尺码 → 信息完善与推荐可信度；代码定位：app-web/src/i18n/messages/en.ts → check.guide.bodyMissing  
英文原文：Each of these makes the engine measurably more confident — and every recommendation still shows its reasoning.  
中文替换：每项补充都能提升推荐可信度，每次推荐也始终展示判断依据。

### 02.8 推荐结果与后续动作

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.lowConfidence  
英文原文：Low-confidence recommendation  
中文替换：依据较少的推荐

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.whyLower  
英文原文：Why confidence is lower here  
中文替换：这次可信度为何较低

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.noRecommendation  
英文原文：No recommendation  
中文替换：暂时无法推荐

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.allSame  
英文原文：All {n} sizes scored the same.  
中文替换：全部 {n} 个尺码得分相同。

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.breakTie  
英文原文：Here's what would break the tie.  
中文替换：补充这些信息，可帮助区分。

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.recommended  
英文原文：Recommended size  
中文替换：推荐尺码

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.holds  
英文原文：Holds for a chest of {lo}–{hi} cm  
中文替换：胸围在 {lo}–{hi} cm 时，推荐保持不变

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.confidence  
英文原文：confidence  
中文替换：可信度

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.previewAs  
英文原文：Preview as  
中文替换：预览版型

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.fitPrefLabel  
英文原文：Fit preference  
中文替换：版型偏好

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.fullWorking  
英文原文：The full working  
中文替换：完整推荐依据

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.recordNote  
英文原文：Recording how it fit makes the next recommendation smarter.  
中文替换：记下实际穿着感受，让下一次推荐更懂你。

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.recordCta  
英文原文：I bought it — record the fit  
中文替换：已购买，记录感受

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.figureTitle  
英文原文：What the numbers look like  
中文替换：合身依据，看得见

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.figureSub  
英文原文：The room each size leaves you through the chest.  
中文替换：看看每个尺码为胸部留了多少余量。

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.rankedTitle  
英文原文：Every size, ranked  
中文替换：每个尺码，都有依据

页面位置：尺码 → 推荐结果与后续动作；代码定位：app-web/src/i18n/messages/en.ts → check.result.rankedSub  
英文原文：Tap a size to see what its score is based on.  
中文替换：点击尺码，查看排名与得分依据。

### 02.9 商品识别与数据来源

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.identified  
英文原文：Identified from the link  
中文替换：从商品链接识别

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.readInBrowser  
英文原文：Read in your browser from {host}  
中文替换：在你的浏览器中读取自 {host}

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.readFrom  
英文原文：Read from {host}  
中文替换：读取自 {host}

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.thePage  
英文原文：the page  
中文替换：当前页面

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.brandGuide  
英文原文：{brand}’s published size guide  
中文替换：{brand} 公开的尺码指南

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.brandGuideTitle  
英文原文：These are the brand's own published size-guide measurements, not this product page's. We couldn't read the page itself, so we can't confirm which sizes this item comes in or whether it's a slim or relaxed cut.  
中文替换：这些数据来自品牌公开的尺码指南。当前商品页未能读取，因此无法确认该商品的可选尺码及修身、宽松等具体版型。

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.estimated  
英文原文：Sizes estimated — confirm the chart  
中文替换：尺码为估算值，请核对尺码表

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.estimatedTitle  
英文原文：We couldn't find a real size chart on the page, so these measurements are estimated from the brand and category. Check them against the retailer's chart, or add the real numbers.  
中文替换：页面中未找到可用尺码表，当前数据依据品牌与服装类型估算。请与商店尺码表核对，或补充实际数据。

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.sizesRead  
英文原文：Sizes read from the page  
中文替换：尺码读取自商品页面

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.sizesAiText  
英文原文：Sizes read by AI from the page's text  
中文替换：AI 从页面文字中读取的尺码

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.sizesAiImage  
英文原文：Sizes read by AI from a chart image  
中文替换：AI 从尺码表图片中读取的尺码

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.brandBody  
英文原文：Body measurements — the chest each size is cut to fit, as the brand states them.  
中文替换：身形尺寸：品牌标明的各尺码适用胸围。

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.brandGarment  
英文原文：The garment's flat measurements, as the brand states them.  
中文替换：衣物平铺尺寸：以品牌标注为准。

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.checkGuide  
英文原文：Check the brand’s size guide  
中文替换：查看品牌尺码指南

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.readOn  
英文原文：· read {date}  
中文替换：· 读取于 {date}

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.productDetails  
英文原文：Product details  
中文替换：商品详情

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.retailer  
英文原文：Retailer  
中文替换：商店

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.brand  
英文原文：Brand  
中文替换：品牌

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.category  
英文原文：Category  
中文替换：服装类型

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.material  
英文原文：Material  
中文替换：材质

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.sizesFound  
英文原文：Sizes found  
中文替换：已识别尺码

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.sizesFoundValue  
英文原文：{n} options  
中文替换：{n} 个选项

页面位置：尺码 → 商品识别与数据来源；代码定位：app-web/src/i18n/messages/en.ts → check.source.fitNote  
英文原文：Fit note  
中文替换：版型说明

### 02.10 尺码表尺寸与来源说明

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.estimated  
英文原文：Measurements estimated — not from the page  
中文替换：尺寸为估算值，未读取自商品页面

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.wherePage  
英文原文：the page  
中文替换：商品页面

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.whereBrand  
英文原文：the brand's size guide  
中文替换：品牌尺码指南

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.readerText  
英文原文： (read by AI from its text)  
中文替换：（由 AI 读取文字）

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.readerImage  
英文原文： (read by AI from a chart image)  
中文替换：（由 AI 读取尺码表图片）

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.body  
英文原文：Body measurements from {where}{reader}  
中文替换：身形尺寸，来源：{where}{reader}

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.garment  
英文原文：Garment measurements from {where}{reader}  
中文替换：衣物尺寸，来源：{where}{reader}

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.unknown  
英文原文：Measurements from {where}{reader} — it didn't say body or flat  
中文替换：尺寸来源：{where}{reader}，未注明身形或平铺尺寸

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.chest  
英文原文：chest {n}cm  
中文替换：胸围 {n} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.shoulder  
英文原文：shoulder {n}cm  
中文替换：肩宽 {n} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.sleeve  
英文原文：sleeve {n}cm  
中文替换：袖长 {n} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.length  
英文原文：length {n}cm  
中文替换：衣长 {n} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.waist  
英文原文：waist {n}cm  
中文替换：腰围 {n} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.bodyChest  
英文原文：fits body chest {lo}–{hi}cm  
中文替换：适用胸围 {lo}–{hi} cm

页面位置：尺码 → 尺码表尺寸与来源说明；代码定位：app-web/src/i18n/messages/en.ts → check.measure.bodyWaist  
英文原文：fits body waist {lo}–{hi}cm  
中文替换：适用腰围 {lo}–{hi} cm

### 02.11 尺码排序与依据

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.pick  
英文原文：pick  
中文替换：推荐

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.basedOn  
英文原文：What this is based on  
中文替换：判断依据

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.noSignal  
英文原文：No qualifying signal for this size — its score reflects the missing-data floor.  
中文替换：此尺码暂无可用的匹配依据，得分采用缺少数据时的基础值。

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.onlyLabel  
英文原文：Only a size label was published.  
中文替换：页面仅提供尺码标签。

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.matchScore  
英文原文：match score \<b\>{n}\</b\>/100  
中文替换：匹配分 \<b\>{n}\</b\>/100

页面位置：尺码 → 尺码排序与依据；代码定位：app-web/src/i18n/messages/en.ts → check.row.confidence  
英文原文：confidence \<b\>{pct}%\</b\>  
中文替换：可信度 \<b\>{pct}%\</b\>

### 02.12 三维合身预览

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.open  
英文原文：See it around your shape in 3D  
中文替换：查看三维余量

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.cantStart  
英文原文：The 3D view couldn't start on this device — the diagram above is unaffected.  
中文替换：此设备暂时无法打开三维视图，上方示意图仍可查看。

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.room  
英文原文：of room through the chest, over your own measurement.  
中文替换：胸部余量，相对于你的实际胸围。

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.smaller  
英文原文：— this size measures smaller than you do through the chest.  
中文替换：——此尺码的衣物胸围小于你的胸围。

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.shellBlue  
英文原文：The blue shell is drawn at \<b\>{label}\</b\>'s stated chest{shoulder}. Below the chest it holds that circumference straight down, because a size chart states a length but never a waist — that part is an assumption, not a measurement. No collar, no sleeves, no fabric: this is the ease, not a preview of how it will look.  
中文替换：蓝色外轮廓按 \<b\>{label}\</b\> 标注的胸围{shoulder}绘制。胸部以下沿用相同围度，因为尺码表提供衣长却未提供腰围，这部分采用绘图假设。图中未呈现领口、袖子或面料，仅展示尺寸余量，无法呈现实际穿着效果。

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.shellAmber  
英文原文：The amber shell is drawn at \<b\>{label}\</b\>'s stated chest{shoulder}. Below the chest it holds that circumference straight down, because a size chart states a length but never a waist — that part is an assumption, not a measurement. No collar, no sleeves, no fabric: this is the ease, not a preview of how it will look.  
中文替换：琥珀色外轮廓按 \<b\>{label}\</b\> 标注的胸围{shoulder}绘制。胸部以下沿用相同围度，因为尺码表提供衣长却未提供腰围，这部分采用绘图假设。图中未呈现领口、袖子或面料，仅展示尺寸余量，无法呈现实际穿着效果。

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.andShoulder  
英文原文： and shoulder  
中文替换：与肩宽

页面位置：尺码 → 三维合身预览；代码定位：app-web/src/i18n/messages/en.ts → check.threeD.estimated  
英文原文： Your own figure here is from regional averages — add your chest to make it yours.  
中文替换：此处身形采用地区平均值，补充胸围后可按你的数据绘制。

### 02.13 购买后的穿着结果记录

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.title  
英文原文：Fit history  
中文替换：穿过之后，记下合身。

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.lede  
英文原文：Record what actually happened. Every keep, return, or exchange becomes ground truth that sharpens your future recommendations.  
中文替换：留下、退回或换货，每一次真实结果，都会成为下一次推荐的依据。

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.emptyTitle  
英文原文：Nothing to record yet  
中文替换：第一份穿着记录，待你留下。

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.emptyBody  
英文原文：Check a product first — then come back here to log whether the recommended size actually fit.  
中文替换：先查询一件商品，购买后再回来记录推荐尺码是否合身。

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.emptyCta  
英文原文：Check a product  
中文替换：查询商品

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.product  
英文原文：Product  
中文替换：商品

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.pickProduct  
英文原文：Pick a product you checked…  
中文替换：选择查询过的商品……

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.sizePurchased  
英文原文：Size purchased  
中文替换：购买尺码

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.decision  
英文原文：Decision  
中文替换：购买结果

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.kept  
英文原文：Kept  
中文替换：留下

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.returned  
英文原文：Returned  
中文替换：退回

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.exchanged  
英文原文：Exchanged  
中文替换：换货

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.exchangedFor  
英文原文：Exchanged for  
中文替换：换成的尺码

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.howFit  
英文原文：How did it fit?  
中文替换：穿起来，松紧如何？

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.chooseOne  
英文原文：— choose one, so we know which way to adjust  
中文替换：请选择一项，帮助我们判断调整方向

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaIssues  
英文原文：Area issues (optional)  
中文替换：局部穿着感受（选填）

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.area.shoulders  
英文原文：shoulders  
中文替换：肩部

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.area.chest  
英文原文：chest  
中文替换：胸部

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.area.sleeve  
英文原文：sleeve  
中文替换：袖长

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.area.length  
英文原文：length  
中文替换：衣长

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaValue.tight  
英文原文：tight  
中文替换：紧

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaValue.ok  
英文原文：ok  
中文替换：合适

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaValue.loose  
英文原文：loose  
中文替换：松

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaValue.short  
英文原文：short  
中文替换：短

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.areaValue.long  
英文原文：long  
中文替换：长

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.notes  
英文原文：Notes  
中文替换：备注

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.notesPlaceholder  
英文原文：Anything the size labels can't capture.  
中文替换：记下尺码标签之外的穿着感受。

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.submit  
英文原文：Record outcome  
中文替换：记录结果

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.recorded  
英文原文：Recorded outcomes  
中文替换：已有记录

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.sizeLine  
英文原文：{product} · size {size}  
中文替换：{product} · 尺码 {size}

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.decisionKeep  
英文原文：keep  
中文替换：留下

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.decisionReturn  
英文原文：return  
中文替换：退回

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.decisionExchange  
英文原文：exchange  
中文替换：换货

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.forSize  
英文原文：{decision} for {size}  
中文替换：{decision}，尺码 {size}

页面位置：尺码 → 购买后的穿着结果记录；代码定位：app-web/src/i18n/messages/en.ts → history.fitLine  
英文原文：Fit: {fit}  
中文替换：松紧感：{fit}

### 02.14 推荐依据、数据限制与无法推荐状态

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.matchesFit  
英文原文：(pref, dims, est) \=\> \`Matches a \${pref} fit for \${dims.join(" \+ ")}\${est ? " (regional averages — add yours for accuracy)" : ""}\`  
中文替换：{dims}符合你偏好的{pref}版型。{estimatedNote}

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.bindingDimension  
英文原文：(dim, cm, roomy) \=\> \`Chest works, but the \${dim} runs \${cm}cm \${roomy ? "roomy" : "narrow"}\`  
中文替换：胸围合适，{dim}则{direction} {cm} cm。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.versusTarget  
英文原文：(dim, cm, larger, pref) \=\> \`\${dim.charAt(0).toUpperCase() \+ dim.slice(1)} \${cm}cm \${larger ? "larger" : "smaller"} than your \${pref} target\`  
中文替换：相较你偏好的{pref}版型，{dim}{direction} {cm} cm。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorRunsHere  
英文原文：(label, dir) \=\> \`Your \${label} runs \${EN\_DIRECTION\[dir\]}, so this is the size that should sit right\`  
中文替换：你已有的 {label} 穿着{dir}，据此推荐这个尺码。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorRunsSteps  
英文原文：(steps, plural, label, dir) \=\> \`\${steps} step\${plural ? "s" : ""} from your \${label}, which runs \${EN\_DIRECTION\[dir\]}\`  
中文替换：与你已有的 {label} 相差 {steps} 个尺码等级；那件衣物穿着{dir}。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorShifted  
英文原文：(up, label, pref) \=\> \`Sized \${up ? "up" : "down"} from your \${label} for a \${pref} fit\`  
中文替换：以你已有的 {label} 为参照，{direction}一个尺码等级，以贴近{pref}版型。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorAdjustedSteps  
英文原文：(steps, label, pref) \=\> \`\${steps} step\${steps \> 1 ? "s" : ""} from your \${pref}-adjusted \${label}\`  
中文替换：按{pref}版型调整后，与已有的 {label} 相差 {steps} 个尺码等级。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorMatches  
英文原文：(label, category) \=\> \`Matches your \${label} (\${category})\`  
中文替换：与已有的 {label}（{category}）尺码相符。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.anchorSteps  
英文原文：(steps, label) \=\> \`\${steps} step\${steps \> 1 ? "s" : ""} from your \${label}\`  
中文替换：与已有的 {label} 相差 {steps} 个尺码等级。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.exchanged  
英文原文：(from, to, brand) \=\> \`You exchanged a \${from} for a \${to} in \${brand ?? "similar"}\`  
中文替换：你曾将{brandText}的 {from} 换成 {to}。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.returned  
英文原文：(size, brand, how) \=\> \`You returned a \${size} in \${brand ?? "similar"} (\${how \=== "tight" ? "too tight" : how \=== "loose" ? "too loose" : "fit issue"})\`  
中文替换：你曾退回{brandText}的 {size}，原因是{how}。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.kept  
英文原文：(size, brand) \=\> \`You kept a \${size} in \${brand ?? "similar"} with a good fit\`  
中文替换：你曾留下{brandText}的 {size}，穿着合身。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.implausible  
英文原文：(issues) \=\> \`Your measurements look unusual together (\${issues.join("; ")}). If one is a \` \+ \`typo, fixing it on your passport will sharpen this.\`  
中文替换：这些身形数据放在一起，可能需要核对（{issues}）。若有输入错误，请在合身护照中更正，让推荐更有依据。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.implausibleChestWaist  
英文原文：(c, w) \=\> \`chest \${c} cm with waist \${w} cm\`  
中文替换：胸围 {c} cm，腰围 {w} cm

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.implausibleShoulderChest  
英文原文：(sh, c) \=\> \`shoulder \${sh} cm with chest \${c} cm\`  
中文替换：肩宽 {sh} cm，胸围 {c} cm

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.fragile  
英文原文：(lo, hi, noise) \=\> \`This one is close: it holds for a chest between \${lo} and \${hi} cm, and a \` \+ \`\${noise} cm difference in how you measure could change it — \` \+ \`measuring again is worth it.\`  
中文替换：这次推荐接近尺码分界：胸围在 {lo}–{hi} cm 时成立，测量相差 {noise} cm 就可能影响结果。建议重新测量一次。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.disagree  
英文原文：(signal, picked, best) \=\> \`Your signals disagree — by \${EN\_SIGNAL\[signal\]}, \${picked}; by the strongest overall evidence, \${best}.\`  
中文替换：不同依据指向不同尺码：按{signal}，应选 {picked}；综合最有力的依据，推荐 {best}。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.verdictOff  
英文原文：(label, verdict) \=\> \`On your measurements alone \${label} reads "\${verdict}" — \` \+ \`we're recommending it on other evidence, so treat this as a starting point \` \+ \`and check the chart.\`  
中文替换：仅按身形数据判断，{label} 显示为“{verdict}”。当前推荐还参考了其他依据，请以此为起点，再核对尺码表。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.closetScattered  
英文原文："Your closet reports disagree with each other — some of these run tight for you and " \+ "some run loose — so we're less sure which you want here."  
中文替换：衣橱里的穿着评价存在差异：有些偏紧，有些偏松，因此这次还难以确定你想要的松紧程度。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.largestSize  
英文原文：(pref) \=\> \`This is the largest size offered — for \${art(pref)} \${pref} fit you're at the top of the range.\`  
中文替换：这是商品提供的最大尺码。按{pref}版型选择，已到可选范围的上限。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.smallestSize  
英文原文：(pref) \=\> \`This is the smallest size offered — for \${art(pref)} \${pref} fit you're at the bottom of the range.\`  
中文替换：这是商品提供的最小尺码。按{pref}版型选择，已到可选范围的下限。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.alternative  
英文原文：(label, pref) \=\> \`Alternative: \${label} is close — consider it if you prefer \${pref \=== "slim" ? "extra room" : "a snugger fit"}.\`  
中文替换：备选：{label} 也较接近。若你希望{roomText}，可以考虑。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.undeterminedHelp  
英文原文："Add your chest measurement, or one garment of this type that fits you well — " \+ "either one turns this into a real answer."  
中文替换：补充胸围，或添加一件同类型且合身的衣物，即可让这次推荐有据可依。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.limitedData  
英文原文："Limited product data — recommendation based on your closet and preference."  
中文替换：商品信息有限，当前推荐依据你的衣橱和版型偏好。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.crossDomain  
英文原文：(closet, product) \=\> \`Your closet is \${closet.map((d) \=\> EN\_DOMAIN\_ONE\[d\]).join(" & ")}, but this is a \${EN\_DOMAIN\_ONE\[product\]} item. \` \+ \`Sizing across garment types is unreliable — we're going mostly on your \` \+ \`measurements and preference. Add a \${EN\_DOMAIN\_ONE\[product\]} you own for a real recommendation.\`  
中文替换：衣橱中已有{closet}，当前商品属于{product}。不同品类的尺码难以直接参照，本次主要依据身形数据和版型偏好。添加一件你已有的{product}，可让推荐更有依据。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.easeContradiction  
英文原文：(n, pref) \=\> \`Your fit reports on \${n} measured garments contradict each other — \` \+ \`some say you want more room than others give you — so we used your stated \` \+ \`\${pref} fit instead of learning from them. Re-rating one or two would settle it.\`  
中文替换：这 {n} 件已有尺寸信息的衣物，穿着评价存在差异，难以形成一致的松紧偏好。本次采用你填写的{pref}版型。重新评价其中一两件，即可帮助厘清偏好。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.easeAdjusted  
英文原文：({ more, garments, targetCm, statedCm, pref, excluded }) \=\> \`Adjusted to the \${more ? "more room" : "less room"} you actually wear — from \${garments} \` \+ \`garment\${s(garments)} in your closet whose own \` \+ \`measurements we have (\${targetCm}cm target vs \${statedCm}cm for \${pref})\` \+ (excluded \> 0 ? \`; \${excluded} garment\${s(excluded)} left out because \` \+ \`\${excluded \=== 1 ? "its report contradicts" : "their reports contradict"} the others \` \+ \`or \${excluded \=== 1 ? "its measurements look" : "their measurements look"} wrong.\` : ".")  
中文替换：依据衣橱中 {garments} 件已有尺寸信息的衣物，调整到你实际穿着时偏好的{roomText}。目标余量为 {targetCm} cm，你填写的{pref}版型对应 {statedCm} cm。{excludedNote}

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.brandRuns  
英文原文：(big, n, brand) \=\> \`You've reported \${n} \${brand} item\${s(n)} running \${big ? "big — sized down one" : "small — sized up one"}.\`  
中文替换：你曾记录 {n} 件 {brand} 单品{direction}，因此本次{sizeAction}一个尺码等级。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.refuseUnreadable  
英文原文："We couldn't read that page — the retailer didn't serve it to us, so we have no size chart. " \+ "Anything we showed you here would be our guess rather than their numbers."  
中文替换：商店未向我们提供可读取的页面，因此没有可用的尺码表。取得商品尺码数据后，才能给出有依据的推荐。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.refuseNotApparel  
英文原文："We couldn't find a clothing item on that page. Paste a link to a specific garment — a product page for a shirt, jacket, trousers and so on."  
中文替换：未在此页面找到服装商品。请粘贴某件具体衣物的商品页链接，如衬衫、外套或长裤。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.refuseUnsupported  
英文原文：(domain) \=\> \`We don't size \${EN\_DOMAIN\_PLURAL\[domain\]} yet. The engine works by comparing your \` \+ \`measurements to the garment's, and we don't hold the measurement that would \` \+ \`need — so anything we told you here would be a guess dressed up as an answer. \` \+ \`Tops and bottoms work today.\`  
中文替换：目前支持上装和下装，暂不支持{domain}。推荐需要将身形数据与商品尺寸对应，而当前缺少这一品类所需的数据，因此无法给出可靠的推荐。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.refuseNoChartExtension  
英文原文："We didn't find a size chart on this page, so any sizes we showed you would be made up " \+ "rather than the retailer's. If the page has a \\"Size guide\\" or \\"Size chart\\" link, " \+ "open it and check again — the chart often only loads once it's opened."  
中文替换：当前页面未找到尺码表，暂时无法依据商店数据推荐尺码。若页面有“尺码指南”或“尺码表”入口，请打开后重新查询。尺码表通常会在打开后才加载。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.refuseNoChartServer  
英文原文："We found the garment on this page but no size chart we could read, so any sizes we " \+ "showed you would be made up rather than the retailer's. Many stores only load the chart " \+ "when you open their size guide — the Fit Passport browser extension can read it once " \+ "it's open."  
中文替换：已找到服装商品，但没有可读取的尺码表，暂时无法依据商店数据推荐尺码。许多商店在打开尺码指南后才加载尺码表；使用 Fit Passport 浏览器插件，可在打开后读取。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.notConnected  
英文原文："This browser isn't connected to your Fit Passport yet. Open Fit Passport once in this " \+ "browser (that's where your measurements and closet live), then check again. If you block " \+ "third-party cookies, the extension can't see your Fit Passport session."  
中文替换：当前浏览器尚未连接你的 Fit Passport。请在同一浏览器中打开一次 Fit Passport，让插件连接到你的身形数据和衣橱，再重新查询。若屏蔽了第三方 Cookie，插件将无法识别登录状态。

页面位置：尺码 → 推荐依据、数据限制与无法推荐状态；代码定位：app-web/src/lib/engineText.ts → EN\_TEXT.verdictName  
英文原文：(v) \=\> v  
中文替换：按 fit.verdict 中的中文对应显示，函数传入的枚举值保持原样。

### 02.15 推荐依据：条件分支与动态词汇

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → estimatedNote  
英文原文：regional averages — add yours for accuracy  
中文替换：（采用地区平均数据；补充你的身形数据，可提高推荐准确度。）

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → bindingDimension.direction  
英文原文：roomy / narrow  
中文替换：roomy＝偏宽；narrow＝偏窄。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → versusTarget.direction  
英文原文：larger / smaller  
中文替换：larger＝多；smaller＝少。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → anchorShifted.direction  
英文原文：up / down  
中文替换：up＝上调；down＝下调。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → brandText  
英文原文：brand ?? "similar"  
中文替换：有品牌名时使用原名；brand 为空时使用“相似品牌”。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → returned.how  
英文原文：too tight / too loose / fit issue  
中文替换：tight＝太紧；loose＝太松；unknown＝合身度不合适。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → alternative.roomText  
英文原文：extra room / a snugger fit  
中文替换：pref 为 slim 时用“更宽松一些”；其他偏好用“更贴身一些”。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → easeAdjusted.roomText  
英文原文：more room / less room  
中文替换：more 为 true 时用“更大余量”；否则用“更小余量”。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → easeAdjusted.excludedNote  
英文原文：{excluded} garment(s) left out because its/their report(s) contradict(s) the others or its/their measurements look wrong.  
中文替换：excluded 大于 0 时：另有 {excluded} 件衣物因评价与其他记录矛盾，或尺寸数据异常，未纳入本次参考。等于 0 时不显示此句。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → brandRuns.direction  
英文原文：big — sized down one / small — sized up one  
中文替换：big 为 true 时用“偏大”，sizeAction 用“下调”；否则用“偏小”，sizeAction 用“上调”。

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.measurement-fit  
英文原文：your measurements  
中文替换：你的身形数据

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.known-good  
英文原文：a garment you already own  
中文替换：你已有的衣物

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.outcome  
英文原文：what you kept or returned before  
中文替换：你曾留下或退回的衣物

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.brand-bias  
英文原文：how this brand has run for you  
中文替换：这个品牌在你身上的版型表现

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.preference  
英文原文：preference  
中文替换：版型偏好

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → signal.completeness  
英文原文：completeness  
中文替换：信息完整度

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → domain.top  
英文原文：top / tops  
中文替换：上装

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → domain.bottom  
英文原文：bottoms  
中文替换：下装

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → domain.shoe  
英文原文：footwear  
中文替换：鞋履

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → domain.sock  
英文原文：socks  
中文替换：袜子

页面位置：尺码 → 推荐依据：条件分支与动态词汇；代码定位：app-web/src/lib/engineText.ts → domain.accessory  
英文原文：accessory / accessories  
中文替换：配饰

### 02.16 既有确认文案的源码定位

代码定位：app-web/src/i18n/messages/en.ts → check.eyebrow。沿用 02.1 首屏尺码查询 中英文原文“SIZE CHECK”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.title。沿用 02.1 首屏尺码查询 中英文原文“What size should I buy?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.lede。沿用 02.1 首屏尺码查询 中英文原文“Paste a product URL. We'll read the page, extract its sizing, and recommend a size — with the reasons, so you can see exactly what it's based on.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.placeholder。沿用 02.1 首屏尺码查询 中英文原文“Paste a product URL...”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.submit。沿用 02.1 首屏尺码查询 中英文原文“Get my size”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.try。沿用 02.1 首屏尺码查询 中英文原文“Try:”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.eyebrow。沿用 02.2 尺码换算 中英文原文“SIZE CONVERTER”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.title。沿用 02.2 尺码换算 中英文原文“Know your size in every system”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.tops。沿用 02.2 尺码换算 中英文原文“Tops”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.bottoms。沿用 02.2 尺码换算 中英文原文“Bottoms”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.shoes。沿用 02.2 尺码换算 中英文原文“Shoes”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.youWear。沿用 02.2 尺码换算 中英文原文“Size you wear”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.inSystem。沿用 02.2 尺码换算 中英文原文“In system”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.converter.note。沿用 02.2 尺码换算 中英文原文“Indicative conversions only — brands differ. Paste a product link above for a recommendation that also weighs your body and the clothes you already own.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.chestLabelAll。沿用 02.3 推荐前的信息提示 中英文原文“Add your measurements”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.chestCtaAll。沿用 02.3 推荐前的信息提示 中英文原文“Add measurements”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.closetLabel。沿用 02.3 推荐前的信息提示 中英文原文“Add 3 clothes that fit you well”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.closetCta。沿用 02.3 推荐前的信息提示 中英文原文“Add to closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.accountLabel。沿用 02.3 推荐前的信息提示 中英文原文“Create an account”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.accountWhy。沿用 02.3 推荐前的信息提示 中英文原文“Keeps your profile, badges and closet — and lets you share a passport.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.accountCta。沿用 02.3 推荐前的信息提示 中英文原文“Claim account”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.eyebrowBefore。沿用 02.3 推荐前的信息提示 中英文原文“BEFORE YOU PASTE A LINK”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.titleGuessing。沿用 02.3 推荐前的信息提示 中英文原文“Right now we'd be guessing.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → check.guide.bodyGuessing。沿用 02.3 推荐前的信息提示 中英文原文“We can read any product page, but with nothing about you we can only fall back on the brand's own chart. Two minutes of setup changes the answer completely.”对应的已确认中文。

### 源码补充区域排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 查询页主标题“选多大，才合身？”优先一行；小屏允许自然换行。输入框及查询按钮桌面端保持原尺寸，移动端沿用原有堆叠结构。  
9\. 推荐尺码保持最强视觉层级；“推荐可信度”“匹配评分”分别保留各自字段和数值，不混用。来源说明和数据限制放在现有说明区域，不遮挡推荐尺码。  
10\. 尺码排序表保留各列对齐与原排序；小屏沿用原横向滚动或卡片布局。cm、kg、US、UK、EU、CN、JP 及商品尺码标签保留原样。  
11\. 购买结果记录中的胸围、腰围、肩宽等问题字段按原控件排列；交换后的尺码输入只在原条件满足时出现。  
12\. 三维预览说明采用普通正文换行；模型颜色、测量环、缩放和交互行为保持原样。  
动态模板说明：{dims} 以“、”连接；{issues} 以“；”连接；{closet} 以“、”连接；pref、dir、verdict、signal、domain、category 的自有显示词使用对应中文，不翻译内部枚举。布尔分支、缺失值、英语单复数判断与数值计算保持原逻辑。中文无需添加英语单复数词尾。  
本页面排版要求（给 Claude Code）  
1\. 保留英文版的首屏留白、输入框宽度、按钮尺寸和居中结构，不因中文字符较少而压缩布局。  
2\. 首屏标题在桌面端保持两行以内；不要缩小字号，移动端允许自然换行。  
3\. 尺码换算区继续保持字段、分类切换和结果卡片的原有对齐关系。  
4\. 信息提示区的三个任务保持同高行距、分隔线和右侧按钮对齐；中文说明可以换行，但不得挤压按钮。  
5\. 所有数值、品牌名、示例商品名与尺码体系保持不变。  
6\. “尺码”作为完整词可以使用；问句、短标题和按钮中避免单独使用“码”。

状态：本页面文案已完整确认。

## 模块 03｜插件

### 03.1 首屏

页面位置：页面标签  
英文原文：BROWSER EXTENSION  
中文替换：浏览器插件

页面位置：首屏大标题  
英文原文：Check your size on the page you're already on  
中文替换：合身答案，就在眼前。

页面位置：首屏说明  
英文原文：Open any product page, click Fit Passport, and get the size — with the reasons and where every number came from.  
中文替换：打开任意商品页面，点击 Fit Passport，即可查看推荐尺码、判断依据，以及每项数据的来源。

页面位置：插件名称  
英文原文：Fit Passport for Chrome  
中文替换：Fit Passport Chrome 插件

页面位置：版本信息  
英文原文：Version 0.3.0 · 80 KB · free  
中文替换：版本 0.3.0 · 80 KB · 免费

页面位置：下载按钮  
英文原文：Download the extension  
中文替换：下载插件

### 03.2 下载提示

英文原文：It isn’t in the Chrome Web Store yet, so for now you add it yourself — four steps, about a minute. It’s the same extension either way. Tested in Chrome; other Chromium browsers (Edge, Brave, Arc) accept the same steps, but we haven’t tested them.  
中文替换：插件暂未上架 Chrome 应用商店，目前需要手动安装——四个步骤，大约一分钟。我们已在 Chrome 中完成测试；Edge、Brave 和 Arc 等 Chromium 浏览器也支持相同的安装方式。

### 03.3 安装步骤

页面位置：区块标题  
英文原文：Install it  
中文替换：安装插件

页面位置：步骤 01  
英文原文：Download the file above and unzip it. Keep the folder somewhere it won’t be deleted — Chrome loads the extension from it.  
中文替换：下载上方文件并解压，将文件夹保存在不会被删除的位置——Chrome 会从这里加载插件。

页面位置：步骤 02  
英文原文：In Chrome, go to chrome://extensions and turn on Developer mode (top right).  
中文替换：在 Chrome 中打开 chrome://extensions，然后开启右上角的“开发者模式”。

页面位置：步骤 03  
英文原文：Click Load unpacked and choose the folder you unzipped.  
中文替换：点击“加载已解压的扩展程序”，选择刚刚解压的文件夹。

页面位置：步骤 04  
英文原文：Open Fit Passport once in the same browser. That connects the extension to your passport — without it, the extension will ask you to connect first rather than check against an empty profile.  
中文替换：在同一浏览器中打开一次 Fit Passport，完成插件与合身护照的连接。连接前，插件会先提示你完成这一步，不会使用空白档案进行判断。

页面位置：安装提示  
英文原文：Tip: click the puzzle-piece icon in Chrome’s toolbar and pin Fit Passport, so it’s one click away.  
中文替换：提示：点击 Chrome 工具栏中的拼图图标，将 Fit Passport 固定在工具栏，之后一键即可打开。

### 03.4 使用方法

页面位置：区块标题  
英文原文：Using it  
中文替换：使用插件

页面位置：使用说明 01  
英文原文：Open a product page and click the Fit Passport icon. You’ll see what it found on the page before anything is sent; press Check my size to get the answer.  
中文替换：打开商品页面并点击 Fit Passport 图标。提交前，你可以先查看插件从页面读取到的信息；点击“查看推荐”，即可获得结果。

页面位置：使用说明 02  
英文原文：Many stores only load their size chart when you open their “Size guide”. If the extension says it found no chart, open the size guide on the page, then press Re-scan. It never clicks anything on the page for you.  
中文替换：许多商店只有在打开“尺码指南”后才会加载尺码表。如果插件未找到尺码表，请先在商品页中打开尺码指南，再点击“重新扫描”。插件不会替你点击页面中的任何内容。

### 03.5 数据读取与插件作用

页面位置：卡片 01 标题  
英文原文：What it reads  
中文替换：只读取必要信息

页面位置：卡片 01 说明  
英文原文：Only the page you click it on, only when you click. It builds a small copy of the product parts — name, size chart, size options — and leaves everything else behind: your cart, your account, your address, forms. On a real product page that’s 11 KB out of 1.78 MB.  
中文替换：插件只会在你主动点击时读取当前页面，并仅复制商品名称、尺码表和可选尺码等必要信息。购物车、账户、地址和表单内容都会被排除。以真实商品页为例，插件只读取了 1.78 MB 页面中的 11 KB 数据。

页面位置：卡片 02 标题  
英文原文：Why an extension  
中文替换：为什么需要插件

页面位置：卡片 02 说明  
英文原文：Many large stores block our servers from reading their pages — pasting a link works on some stores and not others. The extension reads the page in your own browser instead, the page you’re already looking at, so it works where a link can’t.  
中文替换：许多大型商店会阻止服务器读取商品页面，因此直接粘贴链接并非始终有效。浏览器插件会在你正在浏览的页面中读取信息，能够处理普通链接无法读取的页面。

### 03.6 常见问题

页面位置：区块标题  
英文原文：If something goes wrong  
中文替换：如果遇到问题

页面位置：问题 01 标题  
英文原文：It says “connect Fit Passport first”  
中文替换：提示“请先连接 Fit Passport”

页面位置：问题 01 说明  
英文原文：Open Fit Passport once in this browser, then try again. If you block third-party cookies, the extension can't see that you're signed in — it asks you to connect rather than quietly checking against an empty profile.  
中文替换：请先在当前浏览器中打开一次 Fit Passport，然后重试。如果浏览器屏蔽了第三方 Cookie，插件可能无法确认你的登录状态，因此会要求你主动连接，而不会使用空白档案进行判断。

页面位置：问题 02 标题  
英文原文：It found no size chart  
中文替换：没有找到尺码表

页面位置：问题 02 说明  
英文原文：Open the store's size guide on the page, then press Re-scan. Some stores keep the chart on a separate page; for brands we've curated, Fit Passport falls back to the brand's published chart and says so.  
中文替换：请先在商品页面中打开商店的尺码指南，然后点击“重新扫描”。部分商店会将尺码表放在单独页面；对于我们已整理的品牌，Fit Passport 会改用品牌公开的尺码表，并明确说明数据来源。

页面位置：问题 03 标题  
英文原文：On Taobao or Tmall.  
中文替换：在淘宝或天猫使用

页面位置：问题 03 说明  
英文原文：Tmall may ask you to log in before it shows the product — do that in the same browser first. The extension reads the brand and gender from the page's 参数信息 list and the chart from 尺码信息; if it finds no chart, scroll to 尺码信息 so it loads, then press Re-scan. The size profile Taobao shows you there (我的档案) is never sent.  
中文替换：淘宝或天猫可能会要求你登录后才显示商品，请先在同一浏览器中完成登录。插件会从页面的“参数信息”中读取品牌与性别，并从“尺码信息”中读取尺码表。如果尺码表尚未加载，请滚动到“尺码信息”区域，再点击“重新扫描”。淘宝页面中的“我的档案”信息不会被发送。

页面位置：问题 04 标题  
英文原文：Chrome mentions a developer-mode extension.  
中文替换：Chrome 提示“开发者模式扩展程序”

页面位置：问题 04 说明  
英文原文：That can happen with extensions added this way. It goes away once Fit Passport is in the Chrome Web Store.  
中文替换：手动安装的插件可能会出现这一提示。Fit Passport 上架 Chrome 应用商店后，该提示将不再出现。

### 03.7 插件页面动态信息与元信息

页面位置：插件 → 插件页面动态信息与元信息；代码定位：app-web/src/i18n/messages/en.ts → extension.metaTitle  
英文原文：Browser extension · Fit Passport  
中文替换：浏览器插件 · Fit Passport

页面位置：插件 → 插件页面动态信息与元信息；代码定位：app-web/src/i18n/messages/en.ts → extension.metaDescription  
英文原文：Check your size on the product page you're already looking at.  
中文替换：在正在浏览的商品页，查看你的推荐尺码。

页面位置：插件 → 插件页面动态信息与元信息；代码定位：app-web/src/i18n/messages/en.ts → extension.versionZip  
英文原文：Version {version} · {size} KB · free  
中文替换：版本 {version} · {size} KB · 免费

页面位置：插件 → 插件页面动态信息与元信息；代码定位：app-web/src/i18n/messages/en.ts → extension.versionStore  
英文原文：Version {version} · free  
中文替换：版本 {version} · 免费

页面位置：插件 → 插件页面动态信息与元信息；代码定位：app-web/src/i18n/messages/en.ts → extension.addToChrome  
英文原文：Add to Chrome  
中文替换：添加到 Chrome

### 03.8 既有确认文案的源码定位

代码定位：app-web/src/i18n/messages/en.ts → extension.eyebrow。沿用 03.1 首屏 中英文原文“BROWSER EXTENSION”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.title。沿用 03.1 首屏 中英文原文“Check your size on the page you're already on”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.lede。沿用 03.1 首屏 中英文原文“Open any product page, click Fit Passport, and get the size — with the reasons and where every number came from.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.cardName。沿用 03.1 首屏 中英文原文“Fit Passport for Chrome”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.download。沿用 03.1 首屏 中英文原文“Download the extension”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.notInStore。沿用 03.2 下载提示 中英文原文“It isn’t in the Chrome Web Store yet, so for now you add it yourself — four steps, about a minute. It’s the same extension either way. Tested in Chrome; other Chromium browsers (Edge, Brave, Arc) accept the same steps, but we haven’t tested them.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.installTitle。沿用 03.3 安装步骤 中英文原文“Install it”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.install.unzip。沿用 03.3 安装步骤 中英文原文“Download the file above and unzip it. Keep the folder somewhere it won’t be deleted — Chrome loads the extension from it.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.install.devMode。沿用 03.3 安装步骤 中英文原文“In Chrome, go to chrome://extensions and turn on Developer mode (top right).”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.install.load。沿用 03.3 安装步骤 中英文原文“Click Load unpacked and choose the folder you unzipped.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.install.connect。沿用 03.3 安装步骤 中英文原文“Open Fit Passport once in the same browser. That connects the extension to your passport — without it, the extension will ask you to connect first rather than check against an empty profile.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.pinTip。沿用 03.3 安装步骤 中英文原文“Tip: click the puzzle-piece icon in Chrome’s toolbar and pin Fit Passport, so it’s one click away.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.usingTitle。沿用 03.4 使用方法 中英文原文“Using it”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.using1。沿用 03.4 使用方法 中英文原文“Open a product page and click the Fit Passport icon. You’ll see what it found on the page before anything is sent; press Check my size to get the answer.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.using2。沿用 03.4 使用方法 中英文原文“Many stores only load their size chart when you open their “Size guide”. If the extension says it found no chart, open the size guide on the page, then press Re-scan. It never clicks anything on the page for you.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.readsTitle。沿用 03.5 数据读取与插件作用 中英文原文“What it reads”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.readsBody。沿用 03.5 数据读取与插件作用 中英文原文“Only the page you click it on, only when you click. It builds a small copy of the product parts — name, size chart, size options — and leaves everything else behind: your cart, your account, your address, forms. On a real product page that’s 11 KB out of 1.78 MB.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.whyTitle。沿用 03.5 数据读取与插件作用 中英文原文“Why an extension”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.whyBody。沿用 03.5 数据读取与插件作用 中英文原文“Many large stores block our servers from reading their pages — pasting a link works on some stores and not others. The extension reads the page in your own browser instead, the page you’re already looking at, so it works where a link can’t.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.troubleTitle。沿用 03.6 常见问题 中英文原文“If something goes wrong”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.connectQ。沿用 03.6 常见问题 中英文原文“It says “connect Fit Passport first””对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.connectA。沿用 03.6 常见问题 中英文原文“Open Fit Passport once in this browser, then try again. If you block third-party cookies, the extension can't see that you're signed in — it asks you to connect rather than quietly checking against an empty profile.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.noChartQ。沿用 03.6 常见问题 中英文原文“It found no size chart”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.noChartA。沿用 03.6 常见问题 中英文原文“Open the store's size guide on the page, then press Re-scan. Some stores keep the chart on a separate page; for brands we've curated, Fit Passport falls back to the brand's published chart and says so.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.marketQ。沿用 03.6 常见问题 中英文原文“On Taobao or Tmall.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.marketA。沿用 03.6 常见问题 中英文原文“Tmall may ask you to log in before it shows the product — do that in the same browser first. The extension reads the brand and gender from the page's 参数信息 list and the chart from 尺码信息; if it finds no chart, scroll to 尺码信息 so it loads, then press Re-scan. The size profile Taobao shows you there (我的档案) is never sent.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.devModeQ。沿用 03.6 常见问题 中英文原文“Chrome mentions a developer-mode extension.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → extension.trouble.devModeA。沿用 03.6 常见问题 中英文原文“That can happen with extensions added this way. It goes away once Fit Passport is in the Chrome Web Store.”对应的已确认中文。

### 源码补充区域排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. “合身答案，就在眼前。”桌面端保持一行；移动端在逗号后分成两行。版本和文件大小保持动态变量，KB 原样保留。  
9\. 安装步骤维持原编号与顺序；chrome://extensions 作为完整技术字符串显示，可在所在文本容器中独立换行。Chrome 按钮使用“开发者模式”“加载已解压的扩展程序”。  
本页面排版要求（给 Claude Code）  
1\. 首屏大标题保持英文版的两行高度与大面积留白。  
2\. 安装步骤中的按钮名称采用 Chrome 中文界面的准确名称，并使用引号区分。  
3\. chrome://extensions、版本号、文件大小、数据量、品牌名与浏览器名称保持原样。  
4\. 安装步骤的编号、缩进和段落间距保持英文版结构。  
5\. 两张说明卡片保持相同高度。  
6\. 常见问题的四组标题、分隔线和正文起始位置保持统一。  
7\. 按钮统一使用简短动词：下载插件、查看推荐、重新扫描。  
8\. 中文正文允许自然换行，但不得挤压按钮、图标或卡片边界。

状态：本页面文案已完整确认。

## 模块 04｜衣橱

### 04.1 首屏

页面位置：首屏大标题上方  
英文原文：CLOSET  
中文替换：衣橱

页面位置：首屏大标题  
英文原文：Your closet  
中文替换：所穿所爱，合身有迹。

页面位置：首屏标题下方  
英文原文：Clothes you own that fit well. Each piece teaches the size engine how a brand runs on your body.  
中文替换：把你已有且真正合身的衣服记在这里。每一件，都是一份合身依据，让 Fit Passport 更懂不同品牌穿在你身上的差异。

### 04.2 入门提示卡片

页面位置：右侧提示卡片顶部  
英文原文：GETTING STARTED  
中文替换：从三件开始

页面位置：卡片中的衣物数量  
英文原文：0 of 3 pieces  
中文替换：已添加 0／3 件

页面位置：进度条下方  
英文原文：Three pieces you own that fit well are enough for accurate sizing. Pick different brands — how sizes differ between them is what the engine learns.  
中文替换：3 件你已有且真正合身的衣服，就能为尺码推荐提供可靠依据。请选择不同品牌，让 Fit Passport 了解它们在你身上的尺码差异。

页面位置：卡片底部分隔线下方  
英文原文：Just looking around?  
中文替换：想先看看？

页面位置：卡片底部按钮  
英文原文：Try a demo closet  
中文替换：体验示例衣橱

### 04.3 添加衣物｜第一步：品牌

页面位置：添加卡片顶部  
英文原文：ADD AN ITEM · 1 OF 4  
中文替换：添加衣物 · 第 1／4 步

页面位置：虚线框顶部  
英文原文：HAVE A LINK? SKIP AHEAD  
中文替换：有商品链接？直接填写

页面位置：商品链接输入框  
英文原文：Paste a product URL...  
中文替换：粘贴商品链接…

页面位置：链接输入框右侧  
英文原文：Auto-fill  
中文替换：自动填写

页面位置：品牌输入框上方  
英文原文：What brand is it?  
中文替换：是什么品牌？

页面位置：品牌问题下方  
英文原文：Sizing varies more between brands than between sizes — this is the most useful thing you can tell us.  
中文替换：尺码各有标准，品牌尤为关键。告诉我们品牌，是判断合身最有用的线索。

页面位置：第一至第三步的主要按钮  
英文原文：Continue  
中文替换：下一步

### 04.4 添加衣物｜第二步：类型

页面位置：添加卡片顶部  
英文原文：ADD AN ITEM · 2 OF 4  
中文替换：添加衣物 · 第 2／4 步

页面位置：类型选择框上方  
英文原文：What kind of garment?  
中文替换：是哪类衣物？

页面位置：类型问题下方  
英文原文：A shirt and a coat are cut with different amounts of room.  
中文替换：衬衫与外套，剪裁预留的宽松量各不相同。

页面位置：类型下拉框，以及后续步骤顶部的衣物摘要  
英文原文：T-shirt  
中文替换：T恤

页面位置：第二至第四步的次要按钮  
英文原文：Back  
中文替换：上一步

### 04.5 添加衣物｜第三步：尺码

页面位置：添加卡片顶部  
英文原文：ADD AN ITEM · 3 OF 4  
中文替换：添加衣物 · 第 3／4 步

页面位置：尺码选项上方  
英文原文：What size is on the label?  
中文替换：标签上写的是什么尺码？

页面位置：尺码问题下方  
英文原文：Whatever the label says. Region conversions are handled for you.  
中文替换：按衣物标签填写即可，不同地区的尺码换算交给我们。

页面位置：尺码输入框上方  
英文原文：XXS / XS / S / M / L / XL / XXL / XXXL  
中文替换：XXS / XS / S / M / L / XL / XXL / XXXL

页面位置：尺码输入框下方  
英文原文：alpha or EU (e.g. M, EU 48\)  
中文替换：字母尺码或欧码（如 M、EU 48）

页面位置：输入格式提示下方的文字链接  
英文原文：Know it in another scale (EU / US / UK / cm)? Convert →  
中文替换：知道其他体系的尺码（EU / US / UK / cm）？查看换算 →

### 04.6 添加衣物｜第四步：松紧评价

页面位置：添加卡片顶部  
英文原文：ADD AN ITEM · 4 OF 4  
中文替换：添加衣物 · 第 4／4 步

页面位置：松紧评价控件上方  
英文原文：How does it sit on you?  
中文替换：穿起来，松紧如何？

页面位置：评价问题下方  
英文原文：This is what moves a recommendation up or down a size for this brand.  
中文替换：你的穿着感受，会帮助我们调整这个品牌的推荐尺码，判断该选大一些还是小一些。

页面位置：第四步主要按钮  
英文原文：Add to closet  
中文替换：添加到衣橱

页面位置：数值输入方式：松紧滑条左侧  
英文原文：Too tight  
中文替换：太紧

页面位置：数值输入方式：松紧滑条右侧  
英文原文：Too loose  
中文替换：太松

页面位置：数值输入方式：松紧滑条下方  
英文原文：Tap the line, or use the arrow keys. 0 \= just right.  
中文替换：点击滑条或使用方向键调整。0 表示刚好。

页面位置：数值输入方式：滑条操作提示下方  
英文原文：Use words instead  
中文替换：改用文字评价

页面位置：文字输入方式：第一个选项  
英文原文：Too tight  
中文替换：太紧

页面位置：文字输入方式：第二个选项  
英文原文：A bit snug  
中文替换：稍紧

页面位置：文字输入方式：第三个选项  
英文原文：Just right  
中文替换：刚好

页面位置：文字输入方式：第四个选项  
英文原文：A bit roomy  
中文替换：稍松

页面位置：文字输入方式：第五个选项  
英文原文：Too loose  
中文替换：太松

页面位置：文字输入方式：选中“Just right”后，选项下方显示的说明  
英文原文：How it should feel  
中文替换：理想的松紧感

页面位置：文字输入方式：文字评价说明下方  
英文原文：Use a number instead  
中文替换：改用数值评价

### 04.7 衣物详情｜选填信息

页面位置：第四步底部分隔线下方  
英文原文：Hide details  
中文替换：收起详情

页面位置：详情展开区域顶部  
英文原文：Photo, name, colour, notes. The fit engine doesn't read these — you can add them any time by editing the item.  
中文替换：照片、名称、颜色和备注不参与尺码推荐。你可以随时编辑衣物，补充这些信息。

页面位置：上传区域标题  
英文原文：Photo  
中文替换：照片

页面位置：照片标题右侧  
英文原文：optional · your own photo  
中文替换：选填 · 自己拍摄的照片

页面位置：上传图标右侧  
英文原文：Click to upload a picture of this item.  
中文替换：点击上传这件衣物的照片。

页面位置：名称输入框上方  
英文原文：Name  
中文替换：名称

页面位置：名称输入框占位提示  
英文原文：e.g. Blue Oxford  
中文替换：如：蓝色牛津纺衬衫

页面位置：名称右侧的下拉框标签  
英文原文：Line  
中文替换：系列

页面位置：名称、系列、颜色、穿着备注的标签右侧  
英文原文：optional  
中文替换：选填

页面位置：颜色选择区域上方  
英文原文：Color  
中文替换：颜色

页面位置：色板下方的输入框  
英文原文：or type a color...  
中文替换：也可输入颜色…

页面位置：颜色右侧的备注输入框上方  
英文原文：Fit notes  
中文替换：穿着备注

页面位置：备注输入框占位提示  
英文原文：e.g. shoulders perfect, sleeves long  
中文替换：如：肩部合适，袖子偏长

页面位置：详情区域底部复选框  
英文原文：In-store only (not available online)  
中文替换：仅在实体店有售（线上无售）

### 04.8 动态内容与截图覆盖检查

页面位置：第二至第四步卡片右上角  
英文原文：some / some · T-shirt / some · T-shirt · L  
中文替换：some / some · T恤 / some · T恤 · L

页面位置：系列下拉框  
英文原文：—  
中文替换：—

备注：尺码快捷选项是实际尺码值，保持原样。衣物摘要只本地化衣物类型；some 是本次输入的品牌名称，保持用户输入原样；L 是尺码值，保持原样。实际品牌、衣物名称、颜色和备注均不得当作界面文案翻译。系列下拉框保留“—”占位符，不改成新的选项。

覆盖范围：保留六张截图中已确认的文案。本次依据英文仓库补齐衣橱列表、类型与系列选项、分组管理、照片、衣物对比、错误提示、提交状态和合身更新；新增源码定位与替换文本见 04.9 及后续区块。

### 04.9 衣物类型

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.tshirt  
英文原文：T-shirt  
中文替换：T 恤

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.shirt  
英文原文：Shirt  
中文替换：衬衫

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.polo  
英文原文：Polo  
中文替换：Polo 衫

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.sweater  
英文原文：Sweater  
中文替换：毛衣

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.hoodie  
英文原文：Hoodie  
中文替换：连帽衫

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.jacket  
英文原文：Jacket / Coat  
中文替换：夹克／外套

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.pants  
英文原文：Pants  
中文替换：长裤

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.jeans  
英文原文：Jeans  
中文替换：牛仔裤

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.shorts  
英文原文：Shorts  
中文替换：短裤

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.skirt  
英文原文：Skirt  
中文替换：裙装

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.shoes  
英文原文：Shoes  
中文替换：鞋履

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.sneakers  
英文原文：Sneakers  
中文替换：运动鞋

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.boots  
英文原文：Boots  
中文替换：靴子

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.socks  
英文原文：Socks  
中文替换：袜子

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.hat  
英文原文：Hat  
中文替换：帽子

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.belt  
英文原文：Belt  
中文替换：腰带

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.scarf  
英文原文：Scarf  
中文替换：围巾

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.accessory  
英文原文：Other accessory  
中文替换：其他配饰

页面位置：衣橱 → 衣物类型；代码定位：app-web/src/i18n/messages/en.ts → garment.cat.other  
英文原文：Other  
中文替换：其他

### 04.10 衣物大类

页面位置：衣橱 → 衣物大类；代码定位：app-web/src/i18n/messages/en.ts → garment.section.Tops  
英文原文：Tops  
中文替换：上装

页面位置：衣橱 → 衣物大类；代码定位：app-web/src/i18n/messages/en.ts → garment.section.Bottoms  
英文原文：Bottoms  
中文替换：下装

页面位置：衣橱 → 衣物大类；代码定位：app-web/src/i18n/messages/en.ts → garment.section.Footwear  
英文原文：Footwear  
中文替换：鞋履

页面位置：衣橱 → 衣物大类；代码定位：app-web/src/i18n/messages/en.ts → garment.section.Accessories  
英文原文：Accessories  
中文替换：配饰

### 04.11 默认文件夹名称

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.T-Shirts  
英文原文：T-Shirts  
中文替换：T 恤

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Shirts  
英文原文：Shirts  
中文替换：衬衫

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Sweaters  
英文原文：Sweaters  
中文替换：毛衣

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Jackets  
英文原文：Jackets  
中文替换：外套

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Bottoms  
英文原文：Bottoms  
中文替换：下装

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Footwear  
英文原文：Footwear  
中文替换：鞋履

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Accessories  
英文原文：Accessories  
中文替换：配饰

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Other  
英文原文：Other  
中文替换：其他

页面位置：衣橱 → 默认文件夹名称；代码定位：app-web/src/i18n/messages/en.ts → garment.folder.Uncategorized  
英文原文：Uncategorized  
中文替换：未分类

### 04.12 服装系列

页面位置：衣橱 → 服装系列；代码定位：app-web/src/i18n/messages/en.ts → garment.line.none  
英文原文：—  
中文替换：—

页面位置：衣橱 → 服装系列；代码定位：app-web/src/i18n/messages/en.ts → garment.line.mens  
英文原文：Men's  
中文替换：男装

页面位置：衣橱 → 服装系列；代码定位：app-web/src/i18n/messages/en.ts → garment.line.womens  
英文原文：Women's  
中文替换：女装

页面位置：衣橱 → 服装系列；代码定位：app-web/src/i18n/messages/en.ts → garment.line.unisex  
英文原文：Unisex  
中文替换：中性

### 04.13 服装系列缩写

页面位置：衣橱 → 服装系列缩写；代码定位：app-web/src/i18n/messages/en.ts → garment.lineShort.mens  
英文原文：M  
中文替换：M

页面位置：衣橱 → 服装系列缩写；代码定位：app-web/src/i18n/messages/en.ts → garment.lineShort.womens  
英文原文：W  
中文替换：W

页面位置：衣橱 → 服装系列缩写；代码定位：app-web/src/i18n/messages/en.ts → garment.lineShort.unisex  
英文原文：U  
中文替换：U

### 04.14 颜色名称

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.black  
英文原文：black  
中文替换：黑色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.white  
英文原文：white  
中文替换：白色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.grey  
英文原文：grey  
中文替换：灰色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.charcoal  
英文原文：charcoal  
中文替换：炭灰色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.navy  
英文原文：navy  
中文替换：藏蓝色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.blue  
英文原文：blue  
中文替换：蓝色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.denim  
英文原文：denim  
中文替换：牛仔蓝

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.beige  
英文原文：beige  
中文替换：米色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.cream  
英文原文：cream  
中文替换：奶油色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.brown  
英文原文：brown  
中文替换：棕色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.olive  
英文原文：olive  
中文替换：橄榄绿

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.green  
英文原文：green  
中文替换：绿色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.sage  
英文原文：sage  
中文替换：鼠尾草绿

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.teal  
英文原文：teal  
中文替换：蓝绿色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.burgundy  
英文原文：burgundy  
中文替换：酒红色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.red  
英文原文：red  
中文替换：红色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.rust  
英文原文：rust  
中文替换：铁锈红

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.mustard  
英文原文：mustard  
中文替换：芥末黄

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.pink  
英文原文：pink  
中文替换：粉色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.purple  
英文原文：purple  
中文替换：紫色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.amber  
英文原文：amber  
中文替换：琥珀色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.sky  
英文原文：sky  
中文替换：天蓝色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.emerald  
英文原文：emerald  
中文替换：祖母绿

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.rose  
英文原文：rose  
中文替换：玫瑰粉

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.violet  
英文原文：violet  
中文替换：紫罗兰色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.orange  
英文原文：orange  
中文替换：橙色

页面位置：衣橱 → 颜色名称；代码定位：app-web/src/i18n/messages/en.ts → garment.color.slate  
英文原文：slate  
中文替换：石板灰

### 04.15 合身更新页面

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.closet  
英文原文：Closet  
中文替换：衣橱

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.title  
英文原文：Fit refresh  
中文替换：合身感，随你更新。

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.lede  
英文原文：Pick what to re-rate. As your body changes, clothes fit differently — a quick refresh keeps your recommendations honest.  
中文替换：选出想重新评价的衣物。身形在变，穿着感受也会变化；一次简短更新，让推荐贴近现在的你。

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.everything  
英文原文：Everything  
中文替换：全部衣物

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.items.one  
英文原文：{n} item  
中文替换：{n} 件衣物

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.items.other  
英文原文：{n} items  
中文替换：{n} 件衣物

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.start.one  
英文原文：Start refresh · {n} item  
中文替换：开始更新 · {n} 件

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.start.other  
英文原文：Start refresh · {n} items  
中文替换：开始更新 · {n} 件

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.pickSomething  
英文原文：Pick something to refresh  
中文替换：请选择要更新的衣物

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.nothingTitle  
英文原文：Nothing to refresh  
中文替换：暂时没有可更新的衣物

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.nothingBody  
英文原文：No clothes in the selection you picked. Add some to your closet, or choose another collection.  
中文替换：所选范围内还没有衣物。可以先添加到衣橱，或选择其他分组。

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.changeSelection  
英文原文：Change selection  
中文替换：重新选择

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.completeTitle  
英文原文：Fit refresh complete  
中文替换：合身评价已更新

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.completeBody  
英文原文：Updated {saved} · skipped {skipped}. Your closet reflects how things feel today.  
中文替换：已更新 {saved} 件，跳过 {skipped} 件。衣橱已记下你今天的穿着感受。

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.backToCloset  
英文原文：Back to closet  
中文替换：返回衣橱

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.checkProduct  
英文原文：Check a product  
中文替换：查询商品

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.skip  
英文原文：Skip  
中文替换：跳过

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.save  
英文原文：Save  
中文替换：保存

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.sizeLine  
英文原文：{category} · size {size}  
中文替换：{category} · 尺码 {size}

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.howNow  
英文原文：How does it sit now?  
中文替换：现在穿起来，松紧如何？

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.changed  
英文原文：Changed from {from} to {to}  
中文替换：从{from}调整为{to}

页面位置：衣橱 → 合身更新页面；代码定位：app-web/src/i18n/messages/en.ts → refresh.help  
英文原文：Swipe or flick the card, use the buttons, or press the arrow keys · number keys 1–5 pick tight to loose  
中文替换：滑动卡片、点击按钮或使用方向键操作；数字键 1–5 对应从紧到松的五档评价

### 04.16 尺码输入与格式提示

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.brandUnlisted  
英文原文：Not listed? Just type it — any brand works.  
中文替换：没有找到品牌？直接输入即可，任何品牌都可以填写。

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hint.top  
英文原文：alpha or EU (e.g. M, EU 48\)  
中文替换：字母尺码或欧码（如 M、EU 48）

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hint.bottom  
英文原文：waist or W×L (e.g. 32, 32×32)  
中文替换：腰围或 W×L（如 32、32×32）

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hint.shoe  
英文原文：US / EU / cm (e.g. 9, EU 42\)  
中文替换：US / EU / cm（如 9、EU 42）

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hint.sock  
英文原文：S–XL or shoe size  
中文替换：S–XL 或鞋履尺码

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hint.accessory  
英文原文：S–XL or One size  
中文替换：S–XL 或 One size

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.invalid  
英文原文：Not a recognized size — try {hint}.  
中文替换：未识别此尺码，请尝试{hint}。

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.hide  
英文原文：hide  
中文替换：收起

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.whatMean  
英文原文：what do these mean?  
中文替换：这些尺码怎么读？

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.explainBottom  
英文原文：Pants sizes are in inches. A single number is your waist — e.g. 32 means a 32-inch waist (≈ 81 cm). A pair like 32 × 34 means waist 32 in × inseam 34 in, where the inseam is the inner-leg length from crotch to hem.  
中文替换：裤装尺码以英寸表示。单个数字代表腰围，例如 32 表示腰围 32 英寸（约 81 cm）。32 × 34 表示腰围 32 英寸、内侧裤长 34 英寸；内侧裤长从裆部沿裤腿内侧量至裤脚。

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.brandPlaceholder  
英文原文：Brand (e.g. Uniqlo)  
中文替换：品牌（如 Uniqlo）

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.convertOpen  
英文原文：Know it in another scale (EU / US / UK / cm)? Convert  
中文替换：知道其他体系的尺码（EU / US / UK / cm）？查看换算

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.converter  
英文原文：Size converter  
中文替换：尺码换算

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.close  
英文原文：Close  
中文替换：关闭

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.steps  
英文原文：1. Choose the scale you know your size in · 2\. Type it  
中文替换：1. 选择已知尺码的体系 · 2\. 输入尺码

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.example  
英文原文：e.g. {example}  
中文替换：如：{example}

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.unreadable  
英文原文：Couldn't read “{raw}” as a {scale} size. Example: {example}.  
中文替换：无法将“{raw}”识别为 {scale} 尺码。示例：{example}。

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.thatsAbout  
英文原文：That's about · tap to use  
中文替换：大约对应以下尺码，点击即可使用

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.use  
英文原文：Use {value}  
中文替换：使用 {value}

页面位置：衣橱 → 尺码输入与格式提示；代码定位：app-web/src/i18n/messages/en.ts → sizeInput.approx  
英文原文：≈ approximate — brands vary. Pick the one matching how this product is labeled.  
中文替换：≈ 换算仅供参考，品牌各有差异。请选择与商品标签一致的尺码。

### 04.17 衣橱视图、排序、合并与空状态

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.checkProduct  
英文原文：Check a product  
中文替换：查询商品

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.addPiece  
英文原文：\<b\>Add a piece\</b\> — four quick questions, or paste a link.  
中文替换：\<b\>添加一件衣物\</b\>，回答四个简短问题，或直接粘贴商品链接。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.viewLabel  
英文原文：Closet view  
中文替换：衣橱视图

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.views.gallery  
英文原文：Gallery  
中文替换：画廊

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.views.list  
英文原文：List  
中文替换：列表

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.views.folder  
英文原文：Folders  
中文替换：文件夹

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.done  
英文原文：Done  
中文替换：完成

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.reorder  
英文原文：Reorder  
中文替换：调整顺序

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.merge  
英文原文：Merge duplicates  
中文替换：合并同款

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.refreshFit  
英文原文：Refresh fit  
中文替换：更新松紧评价

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.mergeHelp  
英文原文：Select pieces that are the \<b\>same garment\</b\> in a different size or colour, then merge.  
中文替换：选择不同尺码或颜色的\<b\>同款衣物\</b\>，再进行合并。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.selected  
英文原文：{n} selected  
中文替换：已选择 {n} 件

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.mergeButton  
英文原文：Merge  
中文替换：合并

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.mergeButtonN  
英文原文：Merge ({n})  
中文替换：合并（{n}）

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.reorderHelp  
英文原文：Move collections with the arrows beside their names, and pieces with the arrows on each one. Tap \<b\>Done\</b\> when finished.  
中文替换：点击分组名称旁的箭头调整分组顺序，点击衣物上的箭头调整单品顺序。完成后点击\<b\>完成\</b\>。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.emptyForNow  
英文原文：Empty for now: {names}. New pieces file here by type — rename or delete these in the list view.  
中文替换：这些分组暂时为空：{names}。新增衣物会按类型归入对应分组，你也可在列表视图中重命名或删除分组。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.piecesOf3  
英文原文：{n} of 3 pieces  
中文替换：已添加 {n}／3 件

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.piecesAdded  
英文原文：{n} of 3 pieces added  
中文替换：已添加 {n}／3 件

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.deleteConfirm  
英文原文：Delete "{name}"? Items move to Uncategorized.  
中文替换：删除“{name}”分组？其中衣物将移至“未分类”。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.save  
英文原文：Save  
中文替换：保存

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.refresh  
英文原文：Refresh  
中文替换：更新评价

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.refreshTitle  
英文原文：Re-rate how these pieces fit right now — bodies change, so this keeps your fit data current.  
中文替换：重新评价这些衣物现在的松紧感，让合身记录跟上身形变化。

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.nSizes  
英文原文：{n} sizes  
中文替换：{n} 个尺码

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.nVariants  
英文原文：{n} variants  
中文替换：{n} 个款式选项

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.open  
英文原文：Open {brand} {name}, size {size}  
中文替换：打开 {brand} {name}，尺码 {size}

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.select  
英文原文：Select {brand} {name}, size {size}  
中文替换：选择 {brand} {name}，尺码 {size}

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.deselect  
英文原文：Deselect {brand} {name}, size {size}  
中文替换：取消选择 {brand} {name}，尺码 {size}

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.moveEarlier  
英文原文：Move earlier  
中文替换：向前移动

页面位置：衣橱 → 衣橱视图、排序、合并与空状态；代码定位：app-web/src/i18n/messages/en.ts → closet.moveLater  
英文原文：Move later  
中文替换：向后移动

### 04.18 分组创建与管理

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.newCollection  
英文原文：New collection  
中文替换：创建分组

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.collectionName  
英文原文：Collection name  
中文替换：分组名称

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.collectionPlaceholder  
英文原文：e.g. Formal, Gym, Winter  
中文替换：如：正装、运动、冬日

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.folderColor  
英文原文：Folder color  
中文替换：文件夹颜色

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.addCollection  
英文原文：Add collection  
中文替换：添加分组

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.cancel  
英文原文：Cancel  
中文替换：取消

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.all  
英文原文：All  
中文替换：全部

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.moveCollectionUp  
英文原文：Move collection up  
中文替换：上移分组

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.moveCollectionDown  
英文原文：Move collection down  
中文替换：下移分组

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.rename  
英文原文：Rename  
中文替换：重命名

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.delete  
英文原文：Delete  
中文替换：删除

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.emptySection  
英文原文：Empty — items of this type will file here automatically.  
中文替换：此分组暂时为空，同类型衣物会自动归入这里。

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.folderNamed  
英文原文：{color} folder  
中文替换：{color}文件夹

页面位置：衣橱 → 分组创建与管理；代码定位：app-web/src/i18n/messages/en.ts → closet.emptyFolder  
英文原文：Empty folder — items of this type file here automatically.  
中文替换：文件夹暂时为空，同类型衣物会自动归入这里。

### 04.19 衣物照片与颜色

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.addPhoto  
英文原文：Add a photo  
中文替换：添加照片

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.replacePhoto  
英文原文：Replace photo  
中文替换：更换照片

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.photoFailed  
英文原文：That photo couldn't be read. Try a JPEG or PNG.  
中文替换：照片无法读取，请尝试 JPEG 或 PNG 格式。

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.removeLower  
英文原文：remove  
中文替换：移除

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.pickColor  
英文原文：Pick any color  
中文替换：选择颜色

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.autoColor  
英文原文：Automatic color  
中文替换：自动配色

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.savingPhoto  
英文原文：Saving photo  
中文替换：照片保存中……

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.yourPhotoAlt  
英文原文：{name}, your photo  
中文替换：{name}，你上传的照片

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.photoFileFailed  
英文原文：That file couldn't be read as a photo. Try a JPEG or PNG.  
中文替换：文件无法作为照片读取，请尝试 JPEG 或 PNG 格式。

页面位置：衣橱 → 衣物照片与颜色；代码定位：app-web/src/i18n/messages/en.ts → closet.photoNote  
英文原文：Your own photo. It's cropped to 4:5 and kept small.  
中文替换：请使用自己拍摄的照片。图片会裁剪为 4:5，并压缩保存。

### 04.20 单品详情、编辑与记录

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.sizeN  
英文原文：size {size}  
中文替换：尺码 {size}

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.edit  
英文原文：Edit  
中文替换：编辑

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.unmerge  
英文原文：Unmerge  
中文替换：取消合并

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.remove  
英文原文：Remove  
中文替换：移除

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.moveUp  
英文原文：Move up  
中文替换：上移

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.moveDown  
英文原文：Move down  
中文替换：下移

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.moveTo  
英文原文：Move to collection  
中文替换：移至分组

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.brand  
英文原文：Brand  
中文替换：品牌

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.type  
英文原文：Type  
中文替换：类型

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.size  
英文原文：Size  
中文替换：尺码

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.collection  
英文原文：Collection  
中文替换：分组

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.saving  
英文原文：Saving…  
中文替换：保存中……

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.saveChanges  
英文原文：Save changes  
中文替换：保存修改

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.details  
英文原文：Details  
中文替换：详情

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.history  
英文原文：History  
中文替换：修改记录

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.created  
英文原文：Created  
中文替换：创建时间

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.lastModified  
英文原文：Last modified  
中文替换：最近修改

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.never  
英文原文：never  
中文替换：暂无

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.nEdits  
英文原文：{n} recorded edits  
中文替换：{n} 次修改记录

页面位置：衣橱 → 单品详情、编辑与记录；代码定位：app-web/src/i18n/messages/en.ts → closet.privateNote  
英文原文：Precise measurements stay private — never shared by code.  
中文替换：精确身形数据保持私密，不会通过账户代码分享。

### 04.21 衣物对比栏

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.setAside  
英文原文：Set aside to compare  
中文替换：加入对比

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.bucket  
英文原文：Bucket  
中文替换：对比栏

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.close  
英文原文：Close  
中文替换：关闭

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.inBucket  
英文原文：In bucket  
中文替换：已加入对比

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.addToBucket  
英文原文：Add to bucket  
中文替换：加入对比

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.comparisonBucket  
英文原文：Comparison bucket  
中文替换：衣物对比栏

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.clear  
英文原文：Clear  
中文替换：清空

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.collapse  
英文原文：Collapse  
中文替换：收起

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.removeFromBucket  
英文原文：Remove from bucket  
中文替换：移出对比

页面位置：衣橱 → 衣物对比栏；代码定位：app-web/src/i18n/messages/en.ts → closet.bucketNote  
英文原文：Held for side-by-side comparison — not a saved list.  
中文替换：暂存于此，方便并排比较；不会保存为清单。

### 04.22 添加衣物补充状态

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.extractFailed  
英文原文：Couldn't read that URL — answer the questions instead.  
中文替换：无法读取这个链接，请直接回答下方问题。

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.extractRead  
英文原文：Read {bits} from {host}.  
中文替换：已从 {host} 读取{bits}。

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.extractDetails  
英文原文：details  
中文替换：商品信息

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.thePage  
英文原文：the page  
中文替换：当前页面

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.added  
英文原文：Added \<b\>{item}\</b\>. Add a photo on its card, or another piece below.  
中文替换：已添加\<b\>{item}\</b\>。可在卡片上补充照片，或继续在下方添加衣物。

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.stepOf  
英文原文：Add an item · {n} of {total}  
中文替换：添加衣物 · 第 {n}／{total} 步

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.reading  
英文原文：Reading…  
中文替换：读取中……

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.adding  
英文原文：Adding…  
中文替换：添加中……

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.addDetails  
英文原文：Add details (optional)  
中文替换：添加详情（选填）

页面位置：衣橱 → 添加衣物补充状态；代码定位：app-web/src/i18n/messages/en.ts → closet.removePhoto  
英文原文：remove photo  
中文替换：移除照片

### 04.23 衣物实测尺寸与估算说明

页面位置：衣橱 → 衣物实测尺寸与估算说明；代码定位：app-web/src/i18n/messages/en.ts → closet.garmentMeasured  
英文原文：garment measured  
中文替换：衣物实测尺寸

页面位置：衣橱 → 衣物实测尺寸与估算说明；代码定位：app-web/src/i18n/messages/en.ts → closet.garmentEstimated  
英文原文：garment estimated  
中文替换：衣物估算尺寸

页面位置：衣橱 → 衣物实测尺寸与估算说明；代码定位：app-web/src/i18n/messages/en.ts → closet.measuredTitle  
英文原文：Read from the retailer's own size chart when you added this.  
中文替换：添加衣物时，从商店提供的尺码表中读取。

页面位置：衣橱 → 衣物实测尺寸与估算说明；代码定位：app-web/src/i18n/messages/en.ts → closet.estimatedTitle  
英文原文：Estimated by the extractor — the page had no chart we could read.  
中文替换：页面未提供可读取的尺码表，此尺寸为提取过程中的估算值。

### 04.24 既有确认文案的源码定位

代码定位：app-web/src/i18n/messages/en.ts → closet.eyebrow。沿用 04.1 首屏 中英文原文“CLOSET”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.title。沿用 04.1 首屏 中英文原文“Your closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.lede。沿用 04.1 首屏 中英文原文“Clothes you own that fit well. Each piece teaches the size engine how a brand runs on your body.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.optional。沿用 04.7 衣物详情｜选填信息 中英文原文“optional”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.listSeparator。沿用 04.8 动态内容与截图覆盖检查 中英文原文“—”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.gettingStarted。沿用 04.2 入门提示卡片 中英文原文“GETTING STARTED”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.whyThree。沿用 04.2 入门提示卡片 中英文原文“Three pieces you own that fit well are enough for accurate sizing. Pick different brands — how sizes differ between them is what the engine learns.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.justLooking。沿用 04.2 入门提示卡片 中英文原文“Just looking around?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.tryDemo。沿用 04.2 入门提示卡片 中英文原文“Try a demo closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.photo。沿用 04.7 衣物详情｜选填信息 中英文原文“Photo”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.name。沿用 04.7 衣物详情｜选填信息 中英文原文“Name”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.namePlaceholder。沿用 04.7 衣物详情｜选填信息 中英文原文“e.g. Blue Oxford”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.lineLabel。沿用 04.7 衣物详情｜选填信息 中英文原文“Line”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.howSits。沿用 04.6 添加衣物｜第四步：松紧评价 中英文原文“How does it sit on you?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.color。沿用 04.7 衣物详情｜选填信息 中英文原文“Color”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.fitNotes。沿用 04.7 衣物详情｜选填信息 中英文原文“Fit notes”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.colorPlaceholder。沿用 04.7 衣物详情｜选填信息 中英文原文“or type a color...”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.brand.q。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“What brand is it?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.brand.why。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“Sizing varies more between brands than between sizes — this is the most useful thing you can tell us.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.category.q。沿用 04.4 添加衣物｜第二步：类型 中英文原文“What kind of garment?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.category.why。沿用 04.4 添加衣物｜第二步：类型 中英文原文“A shirt and a coat are cut with different amounts of room.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.size.q。沿用 04.5 添加衣物｜第三步：尺码 中英文原文“What size is on the label?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.size.why。沿用 04.5 添加衣物｜第三步：尺码 中英文原文“Whatever the label says. Region conversions are handled for you.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.fit.q。沿用 04.6 添加衣物｜第四步：松紧评价 中英文原文“How does it sit on you?”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.step.fit.why。沿用 04.6 添加衣物｜第四步：松紧评价 中英文原文“This is what moves a recommendation up or down a size for this brand.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.haveLink。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“HAVE A LINK? SKIP AHEAD”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.pastePlaceholder。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“Paste a product URL...”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.autofill。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“Auto-fill”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.back。沿用 04.4 添加衣物｜第二步：类型 中英文原文“Back”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.addToCloset。沿用 04.6 添加衣物｜第四步：松紧评价 中英文原文“Add to closet”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.continue。沿用 04.3 添加衣物｜第一步：品牌 中英文原文“Continue”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.hideDetails。沿用 04.7 衣物详情｜选填信息 中英文原文“Hide details”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.detailsNote。沿用 04.7 衣物详情｜选填信息 中英文原文“Photo, name, colour, notes. The fit engine doesn't read these — you can add them any time by editing the item.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.photoHint。沿用 04.7 衣物详情｜选填信息 中英文原文“optional · your own photo”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.uploadHint。沿用 04.7 衣物详情｜选填信息 中英文原文“Click to upload a picture of this item.”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.notesPlaceholder。沿用 04.7 衣物详情｜选填信息 中英文原文“e.g. shoulders perfect, sleeves long”对应的已确认中文。  
代码定位：app-web/src/i18n/messages/en.ts → closet.inStoreOnly。沿用 04.7 衣物详情｜选填信息 中英文原文“In-store only (not available online)”对应的已确认中文。

### 源码补充区域排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 衣橱主标题“所穿所爱，合身有迹。”桌面端保持一行；移动端在逗号后分成两行。已确认首屏与添加流程的文案继续沿用前文。  
9\. 画廊、列表、文件夹三种视图保持原网格与切换方式。卡片图片比例保持原样；标题可占两行，超出部分沿用原截断方式，说明文字由内容撑高。  
10\. 单品详情和照片弹层沿用原最大宽度；表单标签居左。小屏保持原滚动容器，保存按钮不得遮住最后一个输入项。  
11\. 分组名称为用户数据，禁止翻译或重命名现有分组。仅翻译默认文件夹、分类和颜色显示名称，颜色值、系列枚举、尺寸值保持原样。  
12\. 对比栏按原展开、收起和移除动作运行；动态数量不写死。“对比栏仅保留在当前页面”的提示随原显示条件出现。  
13\. 合身更新页面继续使用原滑杆和步骤顺序；“刚好”居中，紧与松的方向保持原样。  
本页面排版要求（给 Claude Code）  
1\. 修改范围：只修改中文 locale 和仅在中文界面生效的布局样式。英文 locale、功能逻辑、接口、数据、验证规则和页面行为保持不变。  
2\. 首屏标题：桌面端显示为一行：“所穿所爱，合身有迹。”保留现有标题字号、字重、颜色和首屏内容宽度，不为中文另加斜体或颜色强调。移动端不插入固定换行，允许自然换行。  
3\. 首屏正文：保留英文版正文容器宽度与标题间距。中文自然换行，不通过缩小字号或压缩容器宽度维持英文行数。  
4\. 页面两栏：桌面端保留添加卡片与右侧提示卡片的现有列宽、间距和顶部对齐。移动端沿用现有断点与堆叠顺序，不将桌面固定宽度带入小屏。  
5\. 步骤与摘要：保留进度条高度、颜色及进度逻辑。步骤标签与右侧摘要桌面端同一行、两端对齐。移动端若宽度不足，摘要移至下一行，不截断用户输入的品牌名称。  
6\. 按钮尺寸：桌面端保留主要按钮现有高度与最小宽度，不因“下一步”等中文较短而缩窄。按钮文字不换行；文字与图标间距沿用原样。“体验示例衣橱”保持单行。  
7\. 链接输入区：桌面端保持输入框与“自动填写”按钮同一行。移动端沿用现有响应式布局，输入框设置 min-width: 0，按钮不被压缩，内容不得溢出虚线框。  
8\. 尺码与换算入口：尺码快捷选项保留现有尺寸和选中样式，小屏允许整组换行。换算入口允许自然换行，“查看换算”与箭头保持在一起。  
9\. 松紧评价：桌面端五个文字选项保持等宽、同高。“太紧／稍紧／刚好／稍松／太松”均保持单行。移动端沿用现有选项布局，不改动滑条范围、数值映射、键盘操作或选中行为。  
10\. 详情表单：桌面端保留“名称／系列”和“颜色／穿着备注”的两列结构，标签与输入框顶部对齐。移动端沿用现有单列布局。选填标记不得覆盖字段标签，色板与上传区域尺寸保持原样。  
11\. 卡片高度与文字间距：保留卡片内边距、字段间距和按钮间距。中文换行增加高度时，卡片随内容增长，不设置会裁切正文的固定高度；不同步骤不强制同高。  
12\. 动态值与技术字符串：Fit Passport、尺码值、EU / US / UK / cm、商品 URL 和用户输入保持原样。只翻译显示标签，不修改表单内部值、枚举键或存储数据。进度数字继续绑定原有动态变量。  
13\. 中文排版：中文字符之间不得手动插入空格。标签的疏朗感用 CSS letter-spacing 实现。中文句子使用全角标点；步骤标签和摘要保留居中点分隔形式。  
14\. 响应式验收：检查桌面端、现有移动端断点，以及 375px、390px 宽度下的显示：无横向溢出、文字裁切、控件重叠或按钮换行；切换中英文后，英文版布局与行为保持原样。

状态：本页面文案已完整确认。

## 模块 05｜合身护照

### 05.1 版型偏好

页面位置：合身护照 → 版型偏好；代码定位：app-web/src/i18n/messages/en.ts → fit.pref.slim  
英文原文：Slim  
中文替换：修身

页面位置：合身护照 → 版型偏好；代码定位：app-web/src/i18n/messages/en.ts → fit.pref.regular  
英文原文：Regular  
中文替换：常规

页面位置：合身护照 → 版型偏好；代码定位：app-web/src/i18n/messages/en.ts → fit.pref.relaxed  
英文原文：Relaxed  
中文替换：宽松

页面位置：合身护照 → 版型偏好；代码定位：app-web/src/i18n/messages/en.ts → fit.pref.oversized  
英文原文：Oversized  
中文替换：超宽松

### 05.2 松紧评价

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.too-tight.label  
英文原文：Too tight  
中文替换：太紧

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.too-tight.hint  
英文原文：You avoid reaching for it  
中文替换：紧到不太想穿

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.snug.label  
英文原文：A bit snug  
中文替换：稍紧

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.snug.hint  
英文原文：Wearable, but you notice it  
中文替换：能穿，但能感觉到紧

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.just-right.label  
英文原文：Just right  
中文替换：刚好

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.just-right.hint  
英文原文：How it should feel  
中文替换：理想的松紧感

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.roomy.label  
英文原文：A bit roomy  
中文替换：稍松

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.roomy.hint  
英文原文：Comfortable, room to spare  
中文替换：舒适，还有些余量

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.too-loose.label  
英文原文：Too loose  
中文替换：太松

页面位置：合身护照 → 松紧评价；代码定位：app-web/src/i18n/messages/en.ts → fit.direction.too-loose.hint  
英文原文：It hangs off you  
中文替换：宽大得有些挂不住

### 05.3 合身判断

页面位置：合身护照 → 合身判断；代码定位：app-web/src/i18n/messages/en.ts → fit.verdict.too small  
英文原文：too small  
中文替换：过小

页面位置：合身护照 → 合身判断；代码定位：app-web/src/i18n/messages/en.ts → fit.verdict.snug  
英文原文：snug  
中文替换：略紧

页面位置：合身护照 → 合身判断；代码定位：app-web/src/i18n/messages/en.ts → fit.verdict.true to size  
英文原文：true to size  
中文替换：大小合适

页面位置：合身护照 → 合身判断；代码定位：app-web/src/i18n/messages/en.ts → fit.verdict.relaxed  
英文原文：relaxed  
中文替换：宽松

页面位置：合身护照 → 合身判断；代码定位：app-web/src/i18n/messages/en.ts → fit.verdict.too big  
英文原文：too big  
中文替换：过大

### 05.4 推荐信号

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.measurement-fit  
英文原文：measurement-fit  
中文替换：身形匹配

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.known-good  
英文原文：known-good  
中文替换：合身衣物参照

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.preference  
英文原文：preference  
中文替换：版型偏好

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.outcome  
英文原文：outcome  
中文替换：穿着结果

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.completeness  
英文原文：completeness  
中文替换：信息完整度

页面位置：合身护照 → 推荐信号；代码定位：app-web/src/i18n/messages/en.ts → fit.signal.brand-bias  
英文原文：brand-bias  
中文替换：品牌尺码差异

### 05.5 松紧评价滑杆

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.useNumber  
英文原文：Use a number instead  
中文替换：改用数值评价

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.useWords  
英文原文：Use words instead  
中文替换：改用文字评价

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.groupLabel  
英文原文：How this garment fits  
中文替换：这件衣物的松紧感

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.tooTight  
英文原文：Too tight  
中文替换：太紧

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.tooLoose  
英文原文：Too loose  
中文替换：太松

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.sliderLabel  
英文原文：How this garment fits, from \-10 too tight to \+10 too loose  
中文替换：这件衣物的松紧感，−10 为太紧，＋10 为太松

页面位置：合身护照 → 松紧评价滑杆；代码定位：app-web/src/i18n/messages/en.ts → fitScale.sliderHelp  
英文原文：Tap the line, or use the arrow keys. \<em\>0 \= just right.\</em\>  
中文替换：点击滑条或使用方向键调整。\<em\>0 表示刚好。\</em\>

### 05.6 编辑首屏与合身身份卡片

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.tempBearer  
英文原文：TEMPORARY BEARER  
中文替换：临时持有人

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.unclaimed  
英文原文：UNCLAIMED  
中文替换：未认领

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.backToPassport  
英文原文：Back to my passport  
中文替换：返回我的护照

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.doneEditing  
英文原文：Done editing  
中文替换：完成编辑

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.startingTitle  
英文原文：Starting from nothing?  
中文替换：第一次填写？

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.startingBody  
英文原文：There's a guided version of this — three questions, one at a time, and every measurement optional. Or fill in whatever you know below; the two write to the same passport.  
中文替换：跟随引导，逐一回答三个问题，身形数据均可选填。也可以直接在下方填写你已知的信息，两种方式都会保存到同一份合身护照。

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.takeMe  
英文原文：Take me through it  
中文替换：开始引导填写

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.coverSub  
英文原文：International Sizing Identity  
中文替换：国际合身身份

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.holder  
英文原文：Holder  
中文替换：持有人

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.passportNo  
英文原文：Passport no.  
中文替换：护照编号

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.regionOfIssue  
英文原文：Region of issue  
中文替换：签发地区

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.preferredFit  
英文原文：Preferred fit  
中文替换：版型偏好

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.sizingReference  
英文原文：Sizing reference  
中文替换：尺码参考

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.sex  
英文原文：Sex (biological)  
中文替换：生理性别

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.sexOpt.male  
英文原文：M  
中文替换：男

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.sexOpt.female  
英文原文：F  
中文替换：女

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.sexOpt.unspecified  
英文原文：X  
中文替换：X

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.shopsIn  
英文原文：Shops in  
中文替换：常购服装

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.fitSubtitle  
英文原文：pick up to 3 · first is your default  
中文替换：最多选 3 项 · 首选为默认

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.first  
英文原文：1st  
中文替换：首选

页面位置：合身护照 → 编辑首屏与合身身份卡片；代码定位：app-web/src/i18n/messages/en.ts → passport.fitNote  
英文原文：Your recommendations default to the 1st pick. On the Check page you can preview any of the others.  
中文替换：尺码推荐默认采用你的首选版型。在“尺码”页面，也可预览其他版型的推荐结果。

### 05.7 身形数据、尺码体系与备注

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.regionHelp  
英文原文：Which country's size labels you shop most. It sets the default scale we show (US \= S/M/L, EU \= 46/48…). You can still check products from any region — this just picks the labels shown first.  
中文替换：选择你购物时最常参考的地区尺码，作为默认显示体系（如 US＝S/M/L，EU＝46/48……）。你仍可查询任何地区的商品；此设置仅决定优先显示哪种尺码标签。

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.measurements  
英文原文：Measurements  
中文替换：身形数据

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.allOptional  
英文原文：all optional  
中文替换：均可选填

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.lengths  
英文原文：Lengths  
中文替换：长度单位

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.weight  
英文原文：Weight  
中文替换：重量单位

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.mostUseful  
英文原文：most useful  
中文替换：最有参考价值

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.chest  
英文原文：Chest  
中文替换：胸围

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.waist  
英文原文：Waist  
中文替换：腰围

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.hip  
英文原文：Hip  
中文替换：臀围

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.shoulder  
英文原文：Shoulder  
中文替换：肩宽

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.sleeve  
英文原文：Sleeve  
中文替换：袖长

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.inseam  
英文原文：Inseam  
中文替换：内侧裤长

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.height  
英文原文：Height  
中文替换：身高

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.m.weight  
英文原文：Weight  
中文替换：体重

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.region  
英文原文：Region  
中文替换：尺码体系

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.regionSubtitle  
英文原文：which size labels to show first  
中文替换：优先显示哪个地区的尺码

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.memo  
英文原文：Memo  
中文替换：备注

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.memoSubtitle  
英文原文：a short note about your fit / style  
中文替换：简记合身感与风格偏好

页面位置：合身护照 → 身形数据、尺码体系与备注；代码定位：app-web/src/i18n/messages/en.ts → passport.memoPlaceholder  
英文原文：e.g. long torso, broad shoulders, prefer soft cotton, minimalist style  
中文替换：如：躯干偏长、肩部较宽，偏爱柔软棉质与极简风格

### 05.8 保存、账户归属与合身更新

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.changedTitle  
英文原文：Your measurements changed  
中文替换：身形数据已更新

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.changedBody  
英文原文：Clothes may fit differently now. Do a quick fit refresh to update how they feel.  
中文替换：身形变化，穿着感受也会变化。重新评价衣物的松紧，让推荐跟上现在的你。

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.refresh  
英文原文：Refresh  
中文替换：更新评价

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.dismiss  
英文原文：Dismiss  
中文替换：暂时关闭

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.saving  
英文原文：Saving…  
中文替换：保存中……

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.saveFailed  
英文原文：Save failed — check connection  
中文替换：保存失败，请检查网络连接

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.autosave  
英文原文：Changes save automatically  
中文替换：修改自动保存

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.savedAccount  
英文原文：Edits are saved to your account as you type.  
中文替换：编辑内容会实时保存到你的账户。

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.savedDevice  
英文原文：Saved to this device. Claim an account to keep it safe & shareable.  
中文替换：当前保存在本机。认领账户后，可保存记录并分享合身护照。

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.closet  
英文原文：Closet  
中文替换：前往衣橱

页面位置：合身护照 → 保存、账户归属与合身更新；代码定位：app-web/src/i18n/messages/en.ts → passport.saveClaim  
英文原文：Save — claim account  
中文替换：保存并认领

### 05.9 护照展示、徽章与公开预览

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.exportCard  
英文原文：Export card  
中文替换：导出卡片

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.editPassport  
英文原文：Edit passport  
中文替换：编辑护照

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.issued  
英文原文：Issued 2026  
中文替换：签发于 2026 年

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.region2  
英文原文：Region  
中文替换：地区

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.verification  
英文原文：Verification  
中文替换：身份验证

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.achievements  
英文原文：Achievements  
中文替换：成就

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.tilt  
英文原文：tilt a medallion to catch the light  
中文替换：轻转徽章，让光泽流动

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.earnBadges  
英文原文：Earn badges and pin up to 3 here  
中文替换：解锁徽章，最多可在这里展示 3 枚

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.signatureLook  
英文原文：Signature look  
中文替换：代表穿搭

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.none  
英文原文：None  
中文替换：暂无

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.pickOutfit  
英文原文：Pick one of your outfits above to feature it here.  
中文替换：从上方选择一套搭配，作为你的代表穿搭。

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.composeOutfit  
英文原文：Compose an outfit to feature as your signature look  
中文替换：创建一套搭配，留下你的风格印记

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.bodyType  
英文原文：Body type  
中文替换：体型

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.hidden  
英文原文：Hidden  
中文替换：已隐藏

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.privateNote  
英文原文：Precise measurements stay private — never shared by code.  
中文替换：精确身形数据保持私密，不会通过账户代码分享。

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.hiddenNote  
英文原文：You've hidden your body type from your public view.  
中文替换：你的体型已在公开页面中隐藏。

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.myCloset  
英文原文：My closet  
中文替换：我的衣橱

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.badgeLibrary  
英文原文：Badge library  
中文替换：徽章馆

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.previewPublic  
英文原文：Preview public view  
中文替换：预览公开页面

页面位置：合身护照 → 护照展示、徽章与公开预览；代码定位：app-web/src/i18n/messages/en.ts → passport.claimToSave  
英文原文：Claim account to save & share  
中文替换：认领账户，保存并分享

### 05.10 护照材质与主题

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.finish  
英文原文：Finish  
中文替换：完成

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.autoCurrently  
英文原文：Automatic — currently {theme}  
中文替换：自动选择 · 当前为{theme}

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.autoLapis  
英文原文：Automatic — Lapis Edition  
中文替换：自动选择 · 青金石版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.auto  
英文原文：Auto  
中文替换：自动

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.locked  
英文原文：{theme} — locked, earn a {metal} badge  
中文替换：{theme} · 尚未解锁，获得{metal}徽章后可使用

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.lapis  
英文原文：Lapis Edition  
中文替换：青金石版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.bronze  
英文原文：Bronze Edition  
中文替换：青铜版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.silver  
英文原文：Silver Edition  
中文替换：白银版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.gold  
英文原文：Gold Edition  
中文替换：黄金版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.titanium  
英文原文：Titanium Edition  
中文替换：钛金版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.diamond  
英文原文：Diamond Edition  
中文替换：钻石版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.obsidian  
英文原文：Obsidian Edition  
中文替换：黑曜石版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.amethyst  
英文原文：Amethyst Edition  
中文替换：紫水晶版

页面位置：合身护照 → 护照材质与主题；代码定位：app-web/src/i18n/messages/en.ts → passport.theme.jade  
英文原文：Jade Edition  
中文替换：翡翠版

### 05.11 持有人肖像

页面位置：合身护照 → 持有人肖像；代码定位：app-web/src/i18n/messages/en.ts → passport.portrait  
英文原文：portrait  
中文替换：肖像

页面位置：合身护照 → 持有人肖像；代码定位：app-web/src/i18n/messages/en.ts → passport.change  
英文原文：change  
中文替换：更换

页面位置：合身护照 → 持有人肖像；代码定位：app-web/src/i18n/messages/en.ts → passport.remove  
英文原文：remove  
中文替换：移除

### 05.12 体型识别与三维预览

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.bodySubtitle  
英文原文：derived from your measurements  
中文替换：由身形数据推算

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.addHeightWeight  
英文原文：Add height \+ weight above to derive a body type; add chest \+ waist to refine the build.  
中文替换：填写上方的身高与体重，即可推算体型；补充胸围与腰围，可进一步细化判断。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.addChestWaist  
英文原文：Add chest \+ waist to derive build (tapered / straight / full-waist).  
中文替换：补充胸围与腰围，推算身形轮廓（收腰、直线或腰部丰满）。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.sizingNote  
英文原文：Sizing note:  
中文替换：尺码提示：

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.showBodyType  
英文原文：Show my body type on my passport & public view  
中文替换：在合身护照和公开页面展示我的体型

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.see3d  
英文原文：See it in 3D  
中文替换：查看三维形态

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.cant3d  
英文原文：The 3D view couldn't start on this device — the figure above is unaffected.  
中文替换：此设备暂时无法打开三维视图，上方示意图仍可查看。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.built  
英文原文：Built from your measurements  
中文替换：依照你的身形数据绘制

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.builtBody  
英文原文：Each ring below is drawn at the circumference you entered, so the volume is yours. Drag to turn it.  
中文替换：下方每一圈都按你填写的围度绘制，呈现属于你的身形体量。拖动即可旋转。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.ring.chest  
英文原文：chest  
中文替换：胸围

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.ring.waist  
英文原文：waist  
中文替换：腰围

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.ring.hip  
英文原文：hip  
中文替换：臀围

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.ring.shoulder  
英文原文：shoulder  
中文替换：肩宽

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.inferred  
英文原文：inferred — add it to make this yours  
中文替换：此项为推算值，补充数据后可按你的实际尺寸绘制

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.fromShoulder  
英文原文：from your shoulder width  
中文替换：依据你的肩宽

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.measuredPct  
英文原文：\<b\>{pct}% measured.\</b\> Rings you haven't given us are inferred from the ones you have, and the front-to-back depth is a drawing convention rather than something we know about you. It is a form study of your numbers — not a scan, and not a preview of how clothes will look.  
中文替换：\<b\>{pct}% 来自已填写的数据。\</b\>其余围度由现有数据推算，前后厚度采用绘图约定，尚无你的实际数据。这是身形数据的形态示意，无法等同于扫描结果，也无法呈现衣物实际穿着效果。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.petite  
英文原文：Petite  
中文替换：娇小

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.lean  
英文原文：Lean  
中文替换：纤瘦

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.average  
英文原文：Average  
中文替换：适中

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.solid  
英文原文：Solid  
中文替换：结实

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.broad  
英文原文：Broad  
中文替换：宽厚

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.vol.extended  
英文原文：Extended  
中文替换：大尺码体型

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shape.tapered  
英文原文：tapered  
中文替换：收腰

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shape.straight  
英文原文：straight  
中文替换：直线

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shape.full-waist  
英文原文：full-waist  
中文替换：腰部丰满

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shapeBuild.tapered  
英文原文：Tapered build  
中文替换：收腰身形

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shapeBuild.straight  
英文原文：Straight build  
中文替换：直线身形

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.shapeBuild.full-waist  
英文原文：Full-waist build  
中文替换：腰部丰满身形

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.volShape  
英文原文：{volume} · {shape}  
中文替换：{volume} · {shape}

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.notEnough  
英文原文：Not enough data yet  
中文替换：身形数据待补充

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.scopeExtended  
英文原文：Your measurements sit above the range most standard S–XXL size charts cover. Recommendations may be unreliable for lines that stop at XXL — look for extended-size ranges, and treat any pick here as approximate.  
中文替换：你的身形数据超出多数标准 S–XXL 尺码表的范围。仅提供到 XXL 的系列，推荐可能不够可靠。建议优先查看加大尺码系列，并将这里的推荐作为参考。

页面位置：合身护照 → 体型识别与三维预览；代码定位：app-web/src/i18n/messages/en.ts → passport.scopePetite  
英文原文：Your measurements sit below the range most standard adult size charts cover. Petite or XS-focused ranges will fit far better than a standard S — treat picks here as approximate.  
中文替换：你的身形数据低于多数标准成人尺码表的范围。娇小版型或以 XS 为主的系列通常比标准 S 更适合你；这里的推荐仅供参考。

### 05.13 首次引导填写

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.sex.male  
英文原文：Male  
中文替换：男

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.sex.female  
英文原文：Female  
中文替换：女

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.sex.unspecified  
英文原文：Prefer not to say  
中文替换：不愿透露

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.fitDesc.slim  
英文原文：Close to the body  
中文替换：贴合身形

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.fitDesc.regular  
英文原文：Standard · default  
中文替换：常规松紧 · 默认

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.fitDesc.relaxed  
英文原文：Room to move  
中文替换：活动更自在

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.fitDesc.oversized  
英文原文：Deliberately big  
中文替换：有意穿得宽大

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.chestCm.label  
英文原文：Chest  
中文替换：胸围

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.chestCm.why  
英文原文：The single most useful number — around the fullest part.  
中文替换：最有参考价值的一项，测量胸部最丰满处的围度。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.waistCm.label  
英文原文：Waist  
中文替换：腰围

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.waistCm.why  
英文原文：Where you'd wear a belt, not where trousers sit.  
中文替换：测量腰带所在位置，避开裤腰可能下移的位置。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.shoulderCm.label  
英文原文：Shoulder width  
中文替换：肩宽

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.m.shoulderCm.why  
英文原文：Seam to seam across the back.  
中文替换：从背部测量两侧肩缝之间的距离。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extra.heightCm  
英文原文：Height  
中文替换：身高

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extra.weightKg  
英文原文：Weight  
中文替换：体重

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extra.hipCm  
英文原文：Hip  
中文替换：臀围

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extra.inseamCm  
英文原文：Inseam  
中文替换：内侧裤长

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extra.sleeveCm  
英文原文：Sleeve length  
中文替换：袖长

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.withUnit  
英文原文：{label} ({unit})  
中文替换：{label}（{unit}）

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.title.fit  
英文原文：How do you like clothes to fit?  
中文替换：你喜欢怎样的松紧？

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.title.reference  
英文原文：Which size charts should we read you against?  
中文替换：用哪种尺码表作为参考？

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.title.measurements  
英文原文：Any measurements you know?  
中文替换：有哪些已知的身形数据？

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.stepOf  
英文原文：Your passport · {n} of {total}  
中文替换：你的合身护照 · 第 {n}／{total} 步

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.saved  
英文原文：Saved.  
中文替换：已保存。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.noMeasurements  
英文原文：No measurements yet — checks will lean on regional averages and say so.  
中文替换：尚未填写身形数据，尺码查询将参考地区平均值，并明确说明。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.someMeasurements  
英文原文：{n} of 3 measurements recorded. The more of them we have, the less we have to assume.  
中文替换：已记录 {n}／3 项身形数据。信息越充分，判断越少依赖推算。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.checkSize  
英文原文：Check a size  
中文替换：查看推荐

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.addClothes  
英文原文：Add clothes that fit you  
中文替换：添加合身衣物

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.fitIntro  
英文原文：This shifts how much room we aim for. You can change it on any single check.  
中文替换：偏好决定衣物应留多少余量，每次尺码查询都可以单独调整。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.referenceIntro  
英文原文：Men's and women's charts differ, and so do regional ones. Both are defaulted — this only picks which averages we start from when we don't have your numbers.  
中文替换：男装、女装及不同地区的尺码表各有差异。这里已有默认选项，用于在缺少你的身形数据时，确定参考哪组平均值。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.biologicalSex  
英文原文：Biological sex  
中文替换：生理性别

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.region  
英文原文：Region  
中文替换：地区

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.measurementsIntro  
英文原文：All three are optional. Skip any you don't know — we fall back to regional averages and tell you when we have.  
中文替换：三项均可选填，不知道的可以跳过。缺少数据时，我们会参考地区平均值，并明确说明。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.optional  
英文原文：optional  
中文替换：选填

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.hideExtra  
英文原文：− Hide extra details  
中文替换：− 收起补充信息

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.addExtra  
英文原文：+ Add details (optional)  
中文替换：＋ 添加补充信息（选填）

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.extraIntro  
英文原文：The fit engine does not read any of these. They are here because they are yours, and they can be useful to you.  
中文替换：这些信息不参与尺码推荐。你可以把它们留在自己的护照中，供日后参考。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.shopIn  
英文原文：I shop in  
中文替换：常购服装

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.notes  
英文原文：Notes  
中文替换：备注

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.notesHint  
英文原文：anything the numbers miss  
中文替换：记下数字之外的穿着感受

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.notesPlaceholder  
英文原文：e.g. long torso, broad shoulders, prefer soft cotton  
中文替换：如：躯干偏长、肩部较宽，偏爱柔软棉质

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.back  
英文原文：Back  
中文替换：上一步

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.saving  
英文原文：Saving…  
中文替换：保存中……

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.savePassport  
英文原文：Save passport  
中文替换：保存护照

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.continue  
英文原文：Continue  
中文替换：下一步

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.wentWrong  
英文原文：Something went wrong.  
中文替换：出了点问题，请重试。

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.skip  
英文原文：Skip this — check a size now  
中文替换：先跳过，查看推荐

页面位置：合身护照 → 首次引导填写；代码定位：app-web/src/i18n/messages/en.ts → onboarding.skipNote  
英文原文：You'll get a real answer at lower confidence, and we'll say what would sharpen it.  
中文替换：仍会给出推荐，可信度会较低；我们也会说明补充哪些信息能让判断更可靠。

### 05.14 徽章馆：展示与交互

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.loading  
英文原文：Loading…  
中文替换：正在加载……

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.title  
英文原文：Badges  
中文替换：徽章之路

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.lede  
英文原文：Progress through each track; the Rare Honors sit above them. Pin up to 3 earned badges to show off on your passport.  
中文替换：沿着各条路径积累，迈向珍稀荣誉。已获得的徽章最多可展示 3 枚，随你的合身护照一起亮相。

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.passport  
英文原文：Passport  
中文替换：查看护照

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.earnedOf  
英文原文：\<b\>{n}\</b\> of {total} earned  
中文替换：已获得 \<b\>{n}\</b\>／{total} 枚

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.pinned  
英文原文：{n}/3 pinned  
中文替换：已展示 {n}／3 枚

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.saving  
英文原文： · saving…  
中文替换： · 正在保存……

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.earned  
英文原文：earned  
中文替换：已获得

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.pinnedUnpin  
英文原文：Pinned — click to unpin  
中文替换：已展示，点击取消

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.pinToPassport  
英文原文：Pin to passport  
中文替换：展示在护照上

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.threePinned  
英文原文：3 pinned already  
中文替换：已展示 3 枚

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.clickToInspect  
英文原文：Click to inspect  
中文替换：点击细看

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.titleInspect  
英文原文：{title} — click to inspect  
中文替换：{title}，点击细看

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.hoverHelp  
英文原文：Hover to turn · click to inspect  
中文替换：悬停旋转 · 点击细看

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.closeInspect  
英文原文：Close inspect  
中文替换：关闭预览

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.preparing  
英文原文：Preparing the metal…  
中文替换：正在打磨徽章……

页面位置：合身护照 → 徽章馆：展示与交互；代码定位：app-web/src/i18n/messages/en.ts → badges.dragHelp  
英文原文：Drag to turn · Esc to close  
中文替换：拖动旋转 · 按 Esc 关闭

### 05.15 徽章名称、解锁条件与灵感

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → starter.title  
英文原文：Verified Closet  
中文替换：合身入藏

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → starter.blurb  
英文原文：Added at least 8 known-good garments.  
中文替换：添加至少 8 件已知合身的衣物。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → starter.lore  
英文原文：A plain struck token — every archive begins with a first inventory.  
中文替换：一枚朴素的印记，记下衣橱最初的积累。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → curator.title  
英文原文：Curator  
中文替换：衣橱策展人

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → curator.blurb  
英文原文：20+ items organized across 4+ collections.  
中文替换：将至少 20 件衣物整理到至少 4 个分组。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → curator.lore  
英文原文：The Renaissance 'guardaroba' — the keeper of a well-ordered wardrobe.  
中文替换：灵感来自文艺复兴时期的 guardaroba：悉心照料，让衣橱井然有序。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → archivist.title  
英文原文：Wardrobe Archivist  
中文替换：衣橱典藏家

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → archivist.blurb  
英文原文：45+ items spanning 10+ brands.  
中文替换：衣橱中拥有至少 45 件衣物，涵盖至少 10 个品牌。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → archivist.lore  
英文原文：An imperial silk archive — breadth across houses and eras.  
中文替换：如一座宫廷丝绸典藏，汇集不同世家与时代的衣着。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → grand-wardrobe.title  
英文原文：Grand Wardrobe  
中文替换：衣橱大成

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → grand-wardrobe.blurb  
英文原文：100+ items across 20+ brands, in 6+ collections.  
中文替换：将至少 100 件衣物、20 个品牌，整理到至少 6 个分组。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → grand-wardrobe.lore  
英文原文：A royal wardrobe office — scale that must be administered, not merely owned.  
中文替换：灵感来自皇家衣橱署：藏品渐丰，管理也自成学问。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → truth-teller.title  
英文原文：Truth-Teller  
中文替换：如实记衣

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → truth-teller.blurb  
英文原文：Recorded how 5+ purchases actually fit.  
中文替换：记录至少 5 次购买后的实际合身体验。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → truth-teller.lore  
英文原文：A Roman wax tablet — the honest ledger of what fit and what didn't.  
中文替换：如古罗马蜡板，诚实记下每一次合身与不合身。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → calibrated.title  
英文原文：Calibrated  
中文替换：合身常新

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → calibrated.blurb  
英文原文：Logged 25+ comfort refreshes over time.  
中文替换：累计更新至少 25 次舒适度评价。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → calibrated.lore  
英文原文：The gnomon of a sundial — measurement kept true as the body changes.  
中文替换：如日晷上的晷针，随身形变化，持续校准合身感。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → open-closet.title  
英文原文：Open Closet  
中文替换：敞开衣橱

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → open-closet.blurb  
英文原文：Listed publicly with a substantiated closet (15+ items).  
中文替换：在社区公开展示衣橱，并拥有至少 15 件衣物作为参照。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → open-closet.lore  
英文原文：A cartographer's compass rose — putting your fit on the shared map.  
中文替换：一枚制图师的罗盘玫瑰，让你的合身经验在共同的地图上留下坐标。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-scholar.title  
英文原文：Fit Scholar  
中文替换：合身研习者

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-scholar.blurb  
英文原文：60+ refreshes and 20+ recorded outcomes.  
中文替换：累计至少 60 次合身更新、20 次穿着结果记录。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-scholar.lore  
英文原文：The surveyor's rod — truth accumulated by patient measurement.  
中文替换：灵感来自测量标尺：耐心丈量，让经验逐渐有据。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → first-look.title  
英文原文：First Look  
中文替换：初见风格

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → first-look.blurb  
英文原文：Posted your first outfit.  
中文替换：发布第一套搭配。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → first-look.lore  
英文原文：A bone needle — the oldest tool of dress, 40,000 years old.  
中文替换：一枚骨针，承接约 40,000 年前衣着工艺的起点。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → stylist.title  
英文原文：Stylist  
中文替换：穿搭师

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → stylist.blurb  
英文原文：Posted 6 outfits to the community.  
中文替换：向社区发布 6 套搭配。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → stylist.lore  
英文原文：The tailor's shears — mark of a working atelier.  
中文替换：一把裁缝剪，留下穿搭工坊日常创作的印记。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → couturier.title  
英文原文：Couturier  
中文替换：风格匠人

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → couturier.blurb  
英文原文：Posted 15 outfits and earned 150+ total likes.  
中文替换：发布至少 15 套搭配，累计获得至少 150 次点赞。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → couturier.lore  
英文原文：The Jacquard loom — where pattern becomes craft at scale.  
中文替换：灵感来自提花织机，让纹样化为可延续的工艺。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → atelier-master.title  
英文原文：Atelier Master  
中文替换：工坊主理人

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → atelier-master.blurb  
英文原文：30 outfits and 500+ total likes.  
中文替换：发布 30 套搭配，累计获得至少 500 次点赞。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → atelier-master.lore  
英文原文：A maison's head atelier — output sustained at the highest standard.  
中文替换：如时装屋的工坊主理人，以持续创作，维系一贯水准。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → sounding-board.title  
英文原文：Sounding Board  
中文替换：悉心回应

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → sounding-board.blurb  
英文原文：Answered 3 questions from the community.  
中文替换：回答社区中的 3 个问题。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → sounding-board.lore  
英文原文：A thimble — the humblest tool in the trade, and the one that protects the hand doing the work.  
中文替换：一枚顶针，小而平常，护住每一双付诸实践的手。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → trusted-voice.title  
英文原文：Trusted Voice  
中文替换：可信之声

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → trusted-voice.blurb  
英文原文：10 answers, and 8 of them voted helpful.  
中文替换：完成 10 个回答，并获得 8 次“有帮助”评价。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → trusted-voice.lore  
英文原文：The tailor's tape — advice worth taking is advice that was measured first.  
中文替换：一条裁缝软尺，让建议经得起丈量。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-oracle.title  
英文原文：Fit Oracle  
中文替换：合身知音

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-oracle.blurb  
英文原文：30 answers, 40 helpful votes, and 3 accepted as THE answer.  
中文替换：完成 30 个回答，获得 40 次“有帮助”评价，并有 3 个回答获提问者采纳。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → fit-oracle.lore  
英文原文：A medieval guild mark — the sign a workshop stamped on work it would stand behind.  
中文替换：灵感来自中世纪行会印记：落下印章，也为作品担起信誉。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → community-pillar.title  
英文原文：Community Pillar  
中文替换：社区中坚

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → community-pillar.blurb  
英文原文：80 answers, 150 helpful votes, and 12 accepted answers.  
中文替换：完成 80 个回答，获得 150 次“有帮助”评价，并有 12 个回答获采纳。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → community-pillar.lore  
英文原文：The Roman fibula — the clasp that held the whole garment together.  
中文替换：一枚古罗马衣扣，将整件衣物稳稳相连。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → acclaimed.title  
英文原文：Acclaimed  
中文替换：众望之作

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → acclaimed.blurb  
英文原文：250+ likes on a single look.  
中文替换：单套搭配获得至少 250 次点赞。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → acclaimed.lore  
英文原文：A cut brilliant — one look the whole community admired.  
中文替换：如一颗明亮式切割宝石，一套搭配，汇集社区的欣赏。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → tastemaker.title  
英文原文：Tastemaker  
中文替换：品味引领者

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → tastemaker.blurb  
英文原文：Special honor — 1,500+ total likes across your looks.  
中文替换：特别荣誉：所有搭配累计获得至少 1,500 次点赞。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → tastemaker.lore  
英文原文：Amethyst, once valued with diamond — worn by those who set the taste.  
中文替换：紫水晶曾与钻石同受珍视，映照引领品味的人。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → polymath.title  
英文原文：Polymath  
中文替换：风格通才

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → polymath.blurb  
英文原文：Special honor — mastered all four tracks (gold or above in each).  
中文替换：特别荣誉：四条成长路径均达到黄金等级或以上。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → polymath.lore  
英文原文：Imperial jade with agate veining — breadth, not just depth.  
中文替换：带有玛瑙纹理的帝王翡翠，映照广博而深厚的积累。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → head-designer.title  
英文原文：Head Designer  
中文替换：首席设计师

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → head-designer.blurb  
英文原文：The pinnacle — 4,000+ total likes across your looks.  
中文替换：巅峰荣誉：所有搭配累计获得至少 4,000 次点赞。

页面位置：合身护照 → 徽章名称、解锁条件与灵感；代码定位：app-web/src/lib/badges.ts → head-designer.lore  
英文原文：Obsidian, prized since antiquity — rare, dark, and exacting.  
中文替换：黑曜石自古受人珍视，深邃、稀有，也承载更高的要求。

### 05.16 徽章进度

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → starter.progress  
英文原文：(s) \=\> (s.closetCount \>= 8 ? null : \`\${s.closetCount}/8 items\`)  
中文替换：{closetCount}／8 件衣物

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → curator.progress  
英文原文：(s) \=\> s.closetCount \>= 20 && s.collectionsUsed \>= 4 ? null : \`\${Math.min(s.closetCount, 20)}/20 items · \${Math.min(s.collectionsUsed, 4)}/4 collections\`  
中文替换：{closetCount}／20 件衣物 · {collectionsUsed}／4 个分组

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → archivist.progress  
英文原文：(s) \=\> s.closetCount \>= 45 && s.brandsCount \>= 10 ? null : \`\${Math.min(s.closetCount, 45)}/45 items · \${Math.min(s.brandsCount, 10)}/10 brands\`  
中文替换：{closetCount}／45 件衣物 · {brandsCount}／10 个品牌

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → grand-wardrobe.progress  
英文原文：(s) \=\> s.closetCount \>= 100 && s.brandsCount \>= 20 && s.collectionsUsed \>= 6 ? null : \`\${Math.min(s.closetCount, 100)}/100 items · \${Math.min(s.brandsCount, 20)}/20 brands\`  
中文替换：{closetCount}／100 件衣物 · {brandsCount}／20 个品牌

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → truth-teller.progress  
英文原文：(s) \=\> (s.outcomeCount \>= 5 ? null : \`\${s.outcomeCount}/5 outcomes\`)  
中文替换：{outcomeCount}／5 次穿着结果

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → calibrated.progress  
英文原文：(s) \=\> (s.refreshCount \>= 25 ? null : \`\${s.refreshCount}/25 refreshes\`)  
中文替换：{refreshCount}／25 次合身更新

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → open-closet.progress  
英文原文：(s) \=\> s.communityListed && s.closetCount \>= 15 ? null : s.communityListed ? \`\${Math.min(s.closetCount, 15)}/15 items\` : "List your closet in Community"  
中文替换：{closetCount}／15 件衣物；尚未公开时显示：在社区展示衣橱

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → fit-scholar.progress  
英文原文：(s) \=\> s.refreshCount \>= 60 && s.outcomeCount \>= 20 ? null : \`\${Math.min(s.refreshCount, 60)}/60 refreshes · \${Math.min(s.outcomeCount, 20)}/20 outcomes\`  
中文替换：{refreshCount}／60 次合身更新 · {outcomeCount}／20 次穿着结果

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → first-look.progress  
英文原文：(s) \=\> (s.outfitPosts \>= 1 ? null : "Post 1 outfit")  
中文替换：发布 1 套搭配

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → stylist.progress  
英文原文：(s) \=\> (s.outfitPosts \>= 6 ? null : \`\${s.outfitPosts}/6 outfits posted\`)  
中文替换：{outfitPosts}／6 套已发布搭配

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → couturier.progress  
英文原文：(s) \=\> s.outfitPosts \>= 15 && s.outfitLikes \>= 150 ? null : \`\${Math.min(s.outfitPosts, 15)}/15 posts · \${Math.min(s.outfitLikes, 150)}/150 likes\`  
中文替换：{outfitPosts}／15 次发布 · {outfitLikes}／150 次点赞

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → atelier-master.progress  
英文原文：(s) \=\> s.outfitPosts \>= 30 && s.outfitLikes \>= 500 ? null : \`\${Math.min(s.outfitPosts, 30)}/30 posts · \${Math.min(s.outfitLikes, 500)}/500 likes\`  
中文替换：{outfitPosts}／30 次发布 · {outfitLikes}／500 次点赞

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → sounding-board.progress  
英文原文：(s) \=\> (s.answersGiven \>= 3 ? null : \`\${s.answersGiven}/3 answers\`)  
中文替换：{answersGiven}／3 个回答

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → trusted-voice.progress  
英文原文：(s) \=\> s.answersGiven \>= 10 && s.answerHelpful \>= 8 ? null : \`\${Math.min(s.answersGiven, 10)}/10 answers · \${Math.min(s.answerHelpful, 8)}/8 helpful\`  
中文替换：{answersGiven}／10 个回答 · {answerHelpful}／8 次有帮助

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → fit-oracle.progress  
英文原文：(s) \=\> s.answersGiven \>= 30 && s.answerHelpful \>= 40 && s.answersAccepted \>= 3 ? null : \`\${Math.min(s.answersGiven, 30)}/30 answers · \${Math.min(s.answerHelpful, 40)}/40 helpful · \${Math.min(s.answersAccepted, 3)}/3 accepted\`  
中文替换：{answersGiven}／30 个回答 · {answerHelpful}／40 次有帮助 · {answersAccepted}／3 个已采纳

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → community-pillar.progress  
英文原文：(s) \=\> s.answersGiven \>= 80 && s.answerHelpful \>= 150 && s.answersAccepted \>= 12 ? null : \`\${Math.min(s.answersGiven, 80)}/80 answers · \${Math.min(s.answerHelpful, 150)}/150 helpful · \${Math.min(s.answersAccepted, 12)}/12 accepted\`  
中文替换：{answersGiven}／80 个回答 · {answerHelpful}／150 次有帮助 · {answersAccepted}／12 个已采纳

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → acclaimed.progress  
英文原文：(s) \=\> (s.topOutfitLikes \>= 250 ? null : \`\${s.topOutfitLikes}/250 likes on your best look\`)  
中文替换：最受欢迎的搭配：{topOutfitLikes}／250 次点赞

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → tastemaker.progress  
英文原文：(s) \=\> (s.outfitLikes \>= 1500 ? null : \`\${s.outfitLikes}/1500 total likes\`)  
中文替换：{outfitLikes}／1500 次累计点赞

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → polymath.progress  
英文原文：(s) \=\> { const done \= goldTracksDone(s); return done \=== 4 ? null : \`\${done}/4 tracks at gold\`; }  
中文替换：{done}／4 条路径达到黄金等级或以上

页面位置：合身护照 → 徽章进度；代码定位：app-web/src/lib/badges.ts → head-designer.progress  
英文原文：(s) \=\> (s.outfitLikes \>= 4000 ? null : \`\${s.outfitLikes}/4000 total likes\`)  
中文替换：{outfitLikes}／4000 次累计点赞

### 05.17 徽章路径与材质

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → TRACK\_LABEL.closet  
英文原文：The Wardrobe  
中文替换：衣橱积累

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → TRACK\_LABEL.feedback  
英文原文：The Fit Record  
中文替换：合身记录

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → TRACK\_LABEL.outfits  
英文原文：The Atelier  
中文替换：穿搭工坊

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → TRACK\_LABEL.help  
英文原文：The Counsel  
中文替换：经验相助

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → TRACK\_LABEL.capstone  
英文原文：Rare Honors  
中文替换：珍稀荣誉

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.bronze.label  
英文原文：Bronze  
中文替换：青铜

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.silver.label  
英文原文：Silver  
中文替换：白银

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.gold.label  
英文原文：Gold  
中文替换：黄金

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.titanium.label  
英文原文：Titanium  
中文替换：钛金

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.diamond.label  
英文原文：Diamond  
中文替换：钻石

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.obsidian.label  
英文原文：Obsidian  
中文替换：黑曜石

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.amethyst.label  
英文原文：Amethyst  
中文替换：紫水晶

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.jade.label  
英文原文：Jade  
中文替换：翡翠

页面位置：合身护照 → 徽章路径与材质；代码定位：app-web/src/lib/badges.ts → METAL\_STYLE.amber.label  
英文原文：Amber  
中文替换：琥珀

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 护照页面蓝色页头、金属卡片比例、圆角、阴影和卡片桌面宽度保持原样。“国际合身身份”保持单行，不用手动插空格制造字距。  
9\. 编辑页桌面端保持原四列身形数据网格；移动端沿用原断点列数。胸围字段的“最有参考价值”在空间不足时单独换行，不挤压输入框。  
10\. 首选版型标签沿用 pill 样式并按中文内容撑宽。M、F、X、cm、kg、身高与体重数值保持原样；护照编号、机器可读区与图形编码不得翻译。  
11\. 底部固定操作栏保留原位置和高度逻辑；移动端空间不足时排为两行，并为内容区增加等于操作栏实际高度的底部内边距。  
12\. 徽章馆桌面端沿用原网格列数，小屏沿用原断点。徽章名称允许两行，条件和灵感说明自然撑高；进度数字保留原计算、上限与隐藏条件。  
13\. “首席设计师”等徽章名称使用正常中文字形；材质颜色、3D 旋转、悬停预览、拖动及 Esc 关闭行为保持原样。  
14\. 首次引导填写继续按原步骤运行。公开体型复选框说明允许换行，复选框与首行顶部对齐；不得扩大原公开范围。  
徽章进度变量说明：保留原 progress 回调的 Math.min 上限和 earned 条件；{closetCount}、{brandsCount}、{collectionsUsed} 等表示对应回调算出的显示值。grand-wardrobe 的英文进度只显示衣物和品牌数量，沿用该字段组合；解锁条件仍保留至少 6 个分组。open-closet 的公开状态分支按原逻辑显示。  
状态：本页面文案已完整确认。

## 模块 06｜搭配

### 06.1 穿搭预览与生成状态

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.photoNotSetUp  
英文原文：Photoreal preview isn't set up yet — using the stylized view. (Add an image-gen API key to enable.)  
中文替换：写实预览暂未启用，当前显示风格化预览。（配置图像生成 API 密钥后可启用。）

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.photoFailed  
英文原文：Couldn't generate a photo this time — showing the stylized view.  
中文替换：本次未能生成写实预览，已显示风格化预览。

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.genFailed  
英文原文：Generation failed — showing the stylized view.  
中文替换：生成失败，已显示风格化预览。

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.previewOnBody  
英文原文：Preview on your body  
中文替换：在你的身形上预览

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.photoAlt  
英文原文：photoreal preview  
中文替换：写实穿搭预览

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.generating  
英文原文：Generating…  
中文替换：生成中……

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.regenerate  
英文原文：Regenerate  
中文替换：重新生成

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.photoreal  
英文原文：Photoreal preview  
中文替换：写实预览

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.stylizedView  
英文原文：Stylized view  
中文替换：风格化预览

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.photorealTag  
英文原文：photoreal  
中文替换：写实

页面位置：搭配 → 穿搭预览与生成状态；代码定位：app-web/src/i18n/messages/en.ts → outfits.stylizedTag  
英文原文：stylized preview  
中文替换：风格化预览

### 06.2 我的搭配与删除

页面位置：搭配 → 我的搭配与删除；代码定位：app-web/src/i18n/messages/en.ts → outfits.deleteConfirm  
英文原文：Delete this outfit?  
中文替换：删除这套搭配？

页面位置：搭配 → 我的搭配与删除；代码定位：app-web/src/i18n/messages/en.ts → outfits.myOutfits  
英文原文：My outfits  
中文替换：我的搭配

页面位置：搭配 → 我的搭配与删除；代码定位：app-web/src/i18n/messages/en.ts → outfits.noOutfits  
英文原文：No outfits yet  
中文替换：第一套风格，待你开启。

页面位置：搭配 → 我的搭配与删除；代码定位：app-web/src/i18n/messages/en.ts → outfits.noOutfitsBody  
英文原文：Compose your first look above and post it.  
中文替换：在上方创建一套搭配，分享你的所穿所爱。

### 06.3 创作首屏、单品选择与发布

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.title  
英文原文：Outfits  
中文替换：搭出你的风格。

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.lede  
英文原文：Compose a look, preview it on your body type, and post it to the community. Posting earns the top badges.  
中文替换：组合心仪的单品，在贴近你体型的模型上预览，再分享给社区。发布搭配，也能逐步解锁高阶徽章。

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.feed  
英文原文：Community feed  
中文替换：社区动态

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.titleLabel  
英文原文：Title  
中文替换：标题

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.titlePlaceholder  
英文原文：e.g. Autumn layers  
中文替换：如：秋日叠穿

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.occasion  
英文原文：Occasion  
中文替换：穿着场景

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.optional  
英文原文：optional  
中文替换：选填

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.occasionPlaceholder  
英文原文：Fall, Wedding…  
中文替换：秋日、婚礼……

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.note  
英文原文：Note  
中文替换：说明

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.notePlaceholder  
英文原文：short caption  
中文替换：写一句穿搭心得

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.pieces  
英文原文：Pieces  
中文替换：单品

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.colorPlaceholder  
英文原文：color (e.g. navy)  
中文替换：颜色（如：藏蓝）

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.removePiece  
英文原文：Remove piece  
中文替换：移除单品

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.inStoreOnly  
英文原文：In-store only (not available online)  
中文替换：仅在实体店有售（线上无售）

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.addBlank  
英文原文：+ Add blank piece  
中文替换：＋ 添加空白单品

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.closeCloset  
英文原文：Close closet  
中文替换：收起衣橱

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.addFromCloset  
英文原文：+ Add from my closet  
中文替换：＋ 从衣橱添加

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.searchCloset  
英文原文：Search your closet…  
中文替换：搜索衣橱……

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.closetEmpty  
英文原文：Your closet is empty. \<link\>Add items\</link\>  
中文替换：衣橱里还没有衣物。\<link\>添加衣物\</link\>

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.posting  
英文原文：Posting…  
中文替换：发布中……

页面位置：搭配 → 创作首屏、单品选择与发布；代码定位：app-web/src/i18n/messages/en.ts → outfits.postOutfit  
英文原文：Post outfit  
中文替换：发布搭配

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 主标题“搭出你的风格。”桌面端保持一行；移动端允许自然换行。标题不新增斜体或颜色强调。  
9\. 单品选择列表沿用原排列和可滚动高度；品牌、商品名、用户填写的颜色与说明作为原始数据保留。  
10\. 桌面端创作表单与预览保持现有左右结构；移动端沿用原纵向顺序。预览比例保持原样，状态文案在既有说明区自然换行。  
11\. 发布与生成按钮保持原点击区域与禁用状态。风格化／写实预览、生成失败后的回退以及仅实体店有售选项按原条件显示。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 07｜社区

### 07.1 社区提问、分类与发布

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.HELP.label  
英文原文：Will this fit me?  
中文替换：这件适合我吗？

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.HELP.hint  
英文原文：You found something and want a read from people shaped like you.  
中文替换：遇见心仪单品，听听身形相近的人怎么穿。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.HELP.example  
英文原文：Patagonia down hoody — I'm broad through the shoulders, size up?  
中文替换：Patagonia 羽绒连帽外套——我的肩部较宽，需要选大一些吗？

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.RECOMMEND.label  
英文原文：What should I buy?  
中文替换：下一件，怎么选？

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.RECOMMEND.hint  
英文原文：You know the job you need done, not the garment that does it.  
中文替换：已有穿着需求，想找到合适的单品。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.RECOMMEND.example  
英文原文：White tee that survives 30 washes without going see-through?  
中文替换：有没有洗过 30 次仍然不透的白色 T恤？

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.VERDICT.label  
英文原文：Kept or returned  
中文替换：留下，还是退回？

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.VERDICT.hint  
英文原文：Report back on something you bought — the most useful post there is.  
中文替换：分享购买后的真实感受，为下一位留下依据。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.kind.VERDICT.example  
英文原文：Returned the COS oversized shirt: shoulders sat 4cm too wide.  
中文替换：退了 COS 超宽松衬衫，肩部宽出 4 cm。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.filter.ALL  
英文原文：All  
中文替换：全部

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.filter.HELP  
英文原文：Fit check  
中文替换：合身求助

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.filter.RECOMMEND  
英文原文：What to buy  
中文替换：单品推荐

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.filter.VERDICT  
英文原文：Kept or returned  
中文替换：购买反馈

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.title  
英文原文：Questions  
中文替换：问合身，也问所爱。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.lede  
英文原文：Answers here come with receipts. People can attach a garment they actually own — brand, size, how well it fits, and the build it fits — so you get evidence instead of guesses.  
中文替换：这里的回答，可以附上真实衣物：品牌、尺码、穿着感受，以及适合的体型。每一份经验，都有自己的依据。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.needsAnswerTitle  
英文原文：Questions nobody has answered yet — the fastest way to be useful  
中文替换：这些问题还在等答案，你的经验正好有用。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.needsAnswer  
英文原文：Needs an answer  
中文替换：等待回答

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.allAnswered  
英文原文：Every question here has an answer. Nice.  
中文替换：这里的每个问题，都已有回应。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.noQuestions  
英文原文：No questions yet — ask the first one above.  
中文替换：还没有问题，在上方发起第一个吧。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.goodAnswer  
英文原文：What makes an answer good here  
中文替换：怎样让回答更有参考价值

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.good1  
英文原文：\<b\>Attach a real item.\</b\> Same brand, or the closest thing you own.  
中文替换：\<b\>附上真实衣物。\</b\>选择同品牌，或衣橱里最相近的一件。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.good2  
英文原文：\<b\>Say where it sat wrong\</b\>, not just the size — shoulders, sleeve, rise.  
中文替换：\<b\>说清哪里不合适。\</b\>肩部、袖长、裤裆深度，都比一个尺码更具体。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.good3  
英文原文：Answering earns the \<link\>Counsel\</link\> badges. They're the only ones other people have to give you.  
中文替换：回答问题可解锁\<link\>答疑\</link\>徽章，这条路线的认可来自他人。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.postFailed  
英文原文：Couldn't post that. Check the title and details and try again.  
中文替换：发布失败，请检查标题与详情后重试。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.claimTitle  
英文原文：Ask, and answer, with a name attached  
中文替换：让经验，有你的名字。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.claimBody  
英文原文：Claim an account to post — it's what lets you attach your closet as evidence and earn credit for helping.  
中文替换：认领账户后即可发布问题、附上衣橱作为依据，也能记录帮助他人的贡献。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.claimAccount  
英文原文：Claim account  
中文替换：认领账户

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.askQuestion  
英文原文：Ask a question  
中文替换：提出问题

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.close  
英文原文：Close  
中文替换：关闭

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.question  
英文原文：Question  
中文替换：问题

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.questionHint  
英文原文：Be specific — vague questions get vague answers  
中文替换：描述越具体，回答越有参考价值

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.details  
英文原文：Details  
中文替换：详情

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.detailsHint  
英文原文：Your build, what you normally wear, what worries you  
中文替换：你的体型、常穿衣物，以及拿不准的地方

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.productLink  
英文原文：Product link  
中文替换：商品链接

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.optional  
英文原文：Optional  
中文替换：选填

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.reference  
英文原文：Reference garment  
中文替换：参考衣物

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.referenceHint  
英文原文：— optional, but it's the useful part  
中文替换：选填，能让问题更有依据

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.posting  
英文原文：Posting…  
中文替换：发布中……

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.postQuestion  
英文原文：Post question  
中文替换：发布问题

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.neverAttached  
英文原文：Your precise measurements are never attached.  
中文替换：不会附上你的精确身形数据。

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.answered  
英文原文：Answered  
中文替换：已有回答

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.answers.one  
英文原文：{n} answer  
中文替换：{n} 个回答

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.answers.other  
英文原文：{n} answers  
中文替换：{n} 个回答

页面位置：社区 → 社区提问、分类与发布；代码定位：app-web/src/i18n/messages/en.ts → ask.receiptAttached  
英文原文：Receipt attached:  
中文替换：已附衣物实证：

### 07.2 问题详情、回答与采纳

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.goneTitle  
英文原文：That question is gone  
中文替换：这个问题已不可用

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.goneBody  
英文原文：It may have been deleted, or its author deactivated their account.  
中文替换：问题可能已被删除，或发布者已停用账户。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.backToQuestions  
英文原文：Back to questions  
中文替换：返回问答

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.allQuestions  
英文原文：All questions  
中文替换：全部问题

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.answered  
英文原文：Answered  
中文替换：已有回答

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.delete  
英文原文：Delete  
中文替换：删除

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.theProduct  
英文原文：The product in question  
中文替换：提问中的商品

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.theirReference  
英文原文：Their reference garment  
中文替换：对方的参考衣物

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.noAnswers  
英文原文：No answers yet  
中文替换：还没有回答

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.acceptedByAsker  
英文原文：Accepted by the asker  
中文替换：提问者已采纳

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.fromTheirCloset  
英文原文：From their closet  
中文替换：来自对方的衣橱

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.accepted  
英文原文：Accepted  
中文替换：已采纳

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.markAnswer  
英文原文：Mark as the answer  
中文替换：采纳回答

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.helpful  
英文原文：Helpful  
中文替换：有帮助

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.helpfulQ  
英文原文：Helpful?  
中文替换：对你有帮助吗？

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.foundHelpful  
英文原文：{n} found this helpful  
中文替换：{n} 人认为有帮助

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.savedClaim  
英文原文：Saved. Votes rank answers once you \<link\>claim an account\</link\>.  
中文替换：已保存。\<link\>认领账户\</link\>后，你的投票会计入回答排名。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.hiddenQuestion  
英文原文：Only you can see this question. It was hidden after reports — edit or delete it, or reply to us if you think that was wrong.  
中文替换：此问题因举报已被隐藏，目前仅你可见。你可以编辑或删除；如有异议，也可向我们反馈。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.hiddenAnswer  
英文原文：Only you can see this answer. It was hidden after reports — edit or delete it, or reply to us if you think that was wrong.  
中文替换：此回答因举报已被隐藏，目前仅你可见。你可以编辑或删除；如有异议，也可向我们反馈。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.knowAnswer  
英文原文：\<b\>Know the answer?\</b\> Claim an account to reply — it's what lets you attach a garment you own as proof, and it's how the Counsel badges are earned.  
中文替换：\<b\>你有经验想分享？\</b\>认领账户后即可回答，并附上已有衣物作为依据，逐步解锁答疑徽章。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.claimAccount  
英文原文：Claim account  
中文替换：认领账户

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.answerFailed  
英文原文：Couldn't post that answer. Try again.  
中文替换：回答未能发布，请重试。

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.yourAnswer  
英文原文：Your answer  
中文替换：你的回答

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.whatTell  
英文原文：What would you tell them?  
中文替换：分享你的建议

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.whatTellHint  
英文原文：Where it sat wrong matters more than the size  
中文替换：说清哪里不合适，比只报尺码更有用

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.backItUp  
英文原文：Back it up  
中文替换：附上依据

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.backItUpHint  
英文原文：— attach the garment you're talking about  
中文替换：选择你提到的那件衣物

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.posting  
英文原文：Posting…  
中文替换：发布中……

页面位置：社区 → 问题详情、回答与采纳；代码定位：app-web/src/i18n/messages/en.ts → thread.postAnswer  
英文原文：Post answer  
中文替换：发布回答

### 07.3 公开衣橱与合身身份

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.blockConfirm  
英文原文：Block {name}? Their looks and answers disappear from your feeds, and yours from theirs. They're not told.  
中文替换：屏蔽{name}？你们的动态中将不再显示彼此的搭配和回答，对方不会收到通知。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.notFoundTitle  
英文原文：No closet found for that code  
中文替换：未找到对应衣橱

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.notFoundBody  
英文原文：Double-check the account code. Codes look like FP-XXXX-XXXX-XXXXX.  
中文替换：请核对账户代码，格式为 FP-XXXX-XXXX-XXXXX。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.tryAnother  
英文原文：Try another code  
中文替换：更换账户代码

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.viewing  
英文原文：Viewing {name}'s closet  
中文替换：{name}的衣橱

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.readOnly  
英文原文：read-only  
中文替换：仅供浏览

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.unblock  
英文原文：Unblock  
中文替换：取消屏蔽

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.block  
英文原文：Block  
中文替换：屏蔽

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.sex  
英文原文：Sex (sizing ref): \<b\>{sex}\</b\>  
中文替换：尺码参考性别：\<b\>{sex}\</b\>

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.sexValue.male  
英文原文：male  
中文替换：男

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.sexValue.female  
英文原文：female  
中文替换：女

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.bodyType  
英文原文：Body type: \<b\>{type}\</b\>  
中文替换：体型：\<b\>{type}\</b\>

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.bodyNotShared  
英文原文：Body type not shared  
中文替换：体型未公开

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.shops  
英文原文：Shops: \<b\>{lines}\</b\>  
中文替换：常购服装：\<b\>{lines}\</b\>

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.items  
英文原文：· {n} items  
中文替换：· {n} 件衣物

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.crossDept  
英文原文：Cross-department shopper — useful reference for anyone doing the same.  
中文替换：跨男装、女装选购，值得有相同习惯的人参考。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.privacy  
英文原文：Precise measurements are never shared by code — only the closet and a coarse body type (if the owner opted in).  
中文替换：账户代码仅分享衣橱及用户主动公开的概括体型，精确身形数据保持私密。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.emptyTitle  
英文原文：This closet is empty  
中文替换：这座衣橱，等待第一件。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.emptyBody  
英文原文：Nothing to show yet.  
中文替换：暂时还没有可展示的衣物。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.canExport  
英文原文：{name} lets anyone with the code export this closet.  
中文替换：{name}允许持有账户代码的人导出这座衣橱。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.exportJson  
英文原文：Export as JSON  
中文替换：导出 JSON

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.likeThis  
英文原文：Like this closet? Build your own fit profile and get size recommendations based on what fits {name}.  
中文替换：喜欢这座衣橱？创建自己的合身身份，参考{name}的合身衣物，获取尺码建议。

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.getStarted  
英文原文：Get started  
中文替换：开始体验

页面位置：社区 → 公开衣橱与合身身份；代码定位：app-web/src/i18n/messages/en.ts → profile.backToCommunity  
英文原文：Back to community  
中文替换：返回社区

### 07.4 关注、屏蔽、举报与内容状态

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.evidenceGone  
英文原文：The attached closet item is no longer available.  
中文替换：附上的衣橱单品已不可用。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.unfollowTitle  
英文原文：Unfollow — their looks leave your Following feed  
中文替换：取消关注后，对方的搭配将不再出现在“关注”动态中

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.followTitle  
英文原文：Follow — their looks show up in your Following feed  
中文替换：关注后，对方的搭配将出现在“关注”动态中

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.claimToFollow  
英文原文：Claim an account to follow people  
中文替换：认领账户后即可关注他人

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.following  
英文原文：Following  
中文替换：已关注

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.follow  
英文原文：+ Follow  
中文替换：＋ 关注

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.delete  
英文原文：Delete  
中文替换：删除

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.hiddenAfterReports  
英文原文：Only you can see this — hidden after reports.  
中文替换：此内容因举报已被隐藏，目前仅你可见。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.inStoreOnly  
英文原文：In-store only  
中文替换：实体店有售

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.somePiecesInStore  
英文原文：Some pieces in-store only  
中文替换：部分单品仅在实体店有售

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.receipt  
英文原文：Receipt  
中文替换：衣物实证

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.sizeN  
英文原文：size {size}  
中文替换：尺码 {size}

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.fit  
英文原文：fit  
中文替换：松紧感

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.onBuild  
英文原文：on a {type} build  
中文替换：适用于{type}体型

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.remove  
英文原文：Remove  
中文替换：移除

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.cancel  
英文原文：Cancel  
中文替换：取消

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.attachItem  
英文原文：+ Attach an item from my closet  
中文替换：＋ 附上衣橱单品

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.searchCloset  
英文原文：Search your closet…  
中文替换：搜索衣橱……

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.closetEmpty  
英文原文：Your closet is empty. \<link\>Add items\</link\>  
中文替换：衣橱里还没有衣物。\<link\>添加衣物\</link\>

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.noMatch  
英文原文：Nothing matches “{q}”.  
中文替换：未找到与“{q}”匹配的衣物。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reportFailed  
英文原文：Couldn't send that report.  
中文替换：举报未能提交，请重试。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reportedHidden  
英文原文：Reported — this is now hidden pending review.  
中文替换：举报已提交，内容已隐藏，等待审核。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reported  
英文原文：Reported. Thank you — we look at these.  
中文替换：举报已提交。感谢反馈，我们会进行审核。

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.report  
英文原文：Report  
中文替换：举报

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.whatsWrong  
英文原文：What's wrong with it?  
中文替换：这条内容有什么问题？

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reason.SPAM  
英文原文：Spam or advertising  
中文替换：垃圾信息或广告

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reason.STOLEN\_IMAGE  
英文原文：Not their photo / brand imagery  
中文替换：使用他人照片或品牌图片

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reason.ABUSE  
英文原文：Abusive or harassing  
中文替换：辱骂或骚扰

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reason.MISLEADING  
英文原文：Misleading fit advice  
中文替换：误导性的合身建议

页面位置：社区 → 关注、屏蔽、举报与内容状态；代码定位：app-web/src/i18n/messages/en.ts → social.reason.OTHER  
英文原文：Something else  
中文替换：其他问题

### 07.5 每日推荐榜单

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.title  
英文原文：The board  
中文替换：风格榜

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.windowLabel  
英文原文：Board window  
中文替换：榜单周期

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.today  
英文原文：Today  
中文替换：今日

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.week  
英文原文：This week  
中文替换：本周

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.note  
英文原文：Counted from 00:00 UTC and reset every day — a look posted this morning can top it by tonight.  
中文替换：每日从 UTC 00:00 起统计并重置。早晨发布的搭配，今晚也可能登上榜首。

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.topLooks  
英文原文：Top looks  
中文替换：人气搭配

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.noLikes  
英文原文：No likes yet in this window. Every board starts empty — \<link\>like a look\</link\> to open it.  
中文替换：本周期还没有点赞。\<link\>为喜欢的搭配点赞\</link\>，让榜单从这一刻开始。

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.topStylists  
英文原文：Top stylists  
中文替换：风格人物

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.noStylists  
英文原文：Nobody has earned a place yet. Post a look, or \<link\>answer a question\</link\> — a helpful answer is worth more here than a like.  
中文替换：榜单还在等待第一位。发布搭配，或\<link\>回答一个问题\</link\>；有帮助的回答在这里比点赞更有分量。

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.likes.one  
英文原文：{n} like  
中文替换：{n} 个赞

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.likes.other  
英文原文：{n} likes  
中文替换：{n} 个赞

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.helpful.one  
英文原文：{n} helpful answer  
中文替换：{n} 个有帮助的回答

页面位置：社区 → 每日推荐榜单；代码定位：app-web/src/i18n/messages/en.ts → board.helpful.other  
英文原文：{n} helpful answers  
中文替换：{n} 个有帮助的回答

### 07.6 社区首屏、衣橱展示与动态

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.eyebrow  
英文原文：Community  
中文替换：社区

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.title  
英文原文：Dress with people built like you  
中文替换：身形相近，品味相遇。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.lede  
英文原文：Fit is easier to trust when it comes from someone with your shape. Browse public closets, follow the people whose taste you trust, or enter a friend's code to see theirs.  
中文替换：来自相近身形的穿着经验，让合身更有依据。浏览公开衣橱，关注你欣赏的品味，或输入朋友的账户代码，看看他们的所穿所爱。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.followers.one  
英文原文：{n} follower  
中文替换：{n} 人关注

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.followers.other  
英文原文：{n} followers  
中文替换：{n} 人关注

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.following  
英文原文：{n} following  
中文替换：关注 {n} 人

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.askCommunity  
英文原文：Ask the community about fit  
中文替换：向社区问合身

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.postYourself  
英文原文：Post yourself to the community  
中文替换：让衣橱被看见

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.postBodyClaimed  
英文原文：List your closet publicly so others can find your fit. Coarse info only — precise measurements are never shared. You can unlist anytime.  
中文替换：将衣橱加入公开名录，让他人发现你的合身经验。仅展示概括信息，精确身形数据保持私密。你可以随时退出名录。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.postBodyAnon  
英文原文：Claim an account first, then you can share your closet publicly.  
中文替换：先认领账户，即可公开分享你的衣橱。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.unlist  
英文原文：Unlist  
中文替换：退出名录

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.postMe  
英文原文：Post me  
中文替换：加入名录

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.claimAccount  
英文原文：Claim account  
中文替换：认领账户

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.latestLooks  
英文原文：Latest looks  
中文替换：穿搭动态

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.postOutfit  
英文原文：Post an outfit  
中文替换：发布搭配

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.captionFollowing  
英文原文：Newest first, from the people you follow.  
中文替换：来自你关注的人，按最新发布排序。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.captionEveryone  
英文原文：Most-liked first — what the community rated highest.  
中文替换：按点赞数排序，看看社区最欣赏的搭配。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.codeLabel  
英文原文：Have a code? View a specific closet  
中文替换：有账户代码？看看那座衣橱

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.view  
英文原文：View  
中文替换：查看衣橱

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.publicClosets  
英文原文：Public closets  
中文替换：公开衣橱

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.noClosets  
英文原文：No public closets yet. Be the first — post yourself above\!  
中文替换：还没有公开衣橱。在上方加入名录，让你的衣橱率先被看见。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.howSharing  
英文原文：How sharing works  
中文替换：分享，由你掌握

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.share1  
英文原文：Anyone with your \<b\>account code\</b\> can view your closet — read only.  
中文替换：持有你的\<b\>账户代码\</b\>即可浏览衣橱，仅供查看。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.share2  
英文原文：Editing needs your \<b\>password\</b\>. Your code alone can't change anything.  
中文替换：编辑需要\<b\>密码\</b\>，仅凭账户代码无法修改内容。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.share3  
英文原文：Precise body measurements are \<b\>never\</b\> shared — only a coarse body type, if you opt in.  
中文替换：精确身形数据\<b\>始终保持私密\</b\>；只有你主动选择时，才展示概括体型。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.share4  
英文原文：The public directory is \<b\>strictly opt-in\</b\> — you choose to be listed, and can unlist anytime.  
中文替换：公开名录\<b\>由你自主加入\</b\>，也可随时退出。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.scopeLabel  
英文原文：Whose looks  
中文替换：浏览范围

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.everyone  
英文原文：Everyone  
中文替换：全部

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.followingTab  
英文原文：Following  
中文替换：关注

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.noOutfits  
英文原文：No outfits yet. \<link\>Post the first look\</link\>  
中文替换：还没有搭配。\<link\>发布第一套穿搭\</link\>

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.ownFeedTitle  
英文原文：A feed of your own  
中文替换：你的品味，自成一页。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.ownFeedBody  
英文原文：Claim an account to follow the people whose fit you trust — then this tab becomes their looks only, newest first.  
中文替换：认领账户，关注你信任的合身经验。这里将只展示他们的搭配，最新发布的排在前面。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.notFollowing  
英文原文：You're not following anyone yet. Follow a few closets below and this becomes your feed.  
中文替换：你还没有关注任何人。从下方选择喜欢的衣橱，开启自己的穿搭动态。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.noPostsYet  
英文原文：The people you follow haven't posted a look yet.  
中文替换：你关注的人还没有发布搭配。

页面位置：社区 → 社区首屏、衣橱展示与动态；代码定位：app-web/src/i18n/messages/en.ts → community.items  
英文原文：{n} items  
中文替换：{n} 件衣物

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 社区主标题“身形相近，品味相遇。”桌面端保持一行；移动端在逗号后分成两行。  
9\. 社区卡片保持原图片比例和列数；标题最多两行，公开衣橱数量及点赞数据沿用原数值来源。小屏按原断点改单列。  
10\. 提问分类、筛选标签、关注与举报入口维持原顺序。长分类标签使用内容撑宽，不强制统一英文宽度。  
11\. 回答正文允许自然换行；衣物实证保留原卡片、链接与公开范围。采纳、投票、屏蔽、举报的权限、阈值和状态保持原样。  
12\. 榜单的每日 UTC 00:00 更新时间按英文事实保留；本地时间显示仅沿用现有代码，不自行变更刷新时区。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 08｜帮助

### 08.1 帮助首屏与返回动作

页面位置：帮助 → 帮助首屏与返回动作；代码定位：app-web/src/i18n/messages/en.ts → help.title  
英文原文：Help & guide  
中文替换：合身有据，使用有方。

页面位置：帮助 → 帮助首屏与返回动作；代码定位：app-web/src/i18n/messages/en.ts → help.lede  
英文原文：Everything Fit Passport does, and how to earn every badge.  
中文替换：了解 Fit Passport 的功能与使用方式，沿着每条路线解锁徽章。

页面位置：帮助 → 帮助首屏与返回动作；代码定位：app-web/src/i18n/messages/en.ts → help.back  
英文原文：My passport  
中文替换：我的护照

### 08.2 基础使用说明

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.basics  
英文原文：The basics  
中文替换：从这里开始

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.whatQ  
英文原文：What is Fit Passport?  
中文替换：Fit Passport 是什么？

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.whatA  
英文原文：One portable fit identity. You keep a profile (body info, preferred fit, clothes you own that fit well), then paste any product URL to get a size recommendation — with the reasons, not a black box.  
中文替换：一份随你去往每家店的合身身份。记录身形数据、版型偏好与已有的合身衣物，再粘贴商品链接，即可获取尺码推荐，并查看判断依据。

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.howQ  
英文原文：How is my size decided?  
中文替换：推荐尺码如何得出？

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.howA  
英文原文：A transparent scoring engine compares the product's size chart to your measurements and the clothes you already own, adjusted by your preferred fit. Every recommendation shows exactly what it's based on.  
中文替换：我们将商品尺码表与你的身形数据及已有衣物逐项比较，再结合版型偏好调整。每次推荐都会展示具体依据。

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.showsQ  
英文原文：What does the passport show?  
中文替换：合身护照展示什么？

页面位置：帮助 → 基础使用说明；代码定位：app-web/src/i18n/messages/en.ts → help.showsA  
英文原文：Your holder name, region, preferred fit, an optional portrait, your pinned badges, and a coarse body type (which you can hide). Precise measurements are never shared.  
中文替换：持有人名称、地区、版型偏好、选填的肖像、置顶徽章，以及可自行隐藏的概括体型。精确身形数据不会公开分享。

### 08.3 身份归属与隐私

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.privacy  
英文原文：Privacy & sharing  
中文替换：隐私与分享

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.whoQ  
英文原文：Who can see my stuff?  
中文替换：谁能看到我的信息？

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.whoA  
英文原文：Anyone with your account code can view your closet (read-only) and — only if you opt in — a coarse body type. Precise cm/kg measurements never leave your account.  
中文替换：持有账户代码的人可以浏览你的衣橱，仅供查看；你主动选择后，也会展示概括体型。精确的 cm／kg 身形数据只留在你的账户中。

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.editQ  
英文原文：How do I edit vs view?  
中文替换：浏览与编辑有什么区别？

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.editA  
英文原文：Editing needs your password. Your account code alone can only view. That's the 'capability to read, credential to write' model.  
中文替换：账户代码用于浏览，密码用于编辑。仅凭账户代码无法修改你的内容。

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.directoryQ  
英文原文：The community directory  
中文替换：如何加入社区名录？

页面位置：帮助 → 身份归属与隐私；代码定位：app-web/src/i18n/messages/en.ts → help.directoryA  
英文原文：Strictly opt-in. Toggle 'Post yourself' in Community to be listed; unlist anytime.  
中文替换：是否加入由你决定。在社区点击“加入名录”即可公开列出衣橱，也可随时退出。

### 08.4 搭配与社区常见问题

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.outfits  
英文原文：Outfits & likes  
中文替换：搭配与点赞

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.postingQ  
英文原文：Posting outfits  
中文替换：如何发布搭配？

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.postingA  
英文原文：Compose a look from garment types \+ colors on the Outfits page, preview it on a body-typed mannequin, then post it to the community feed.  
中文替换：在“搭配”页面选择单品类型与颜色，在贴近你体型的模型上预览，然后发布到社区动态。

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.inStoreQ  
英文原文：In-store only pieces  
中文替换：如何标记线下单品？

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.inStoreA  
英文原文：If a piece isn't sold online, tick 'in-store only' — the post shows an In-store tag so others know it's a local/thrift/tailor find.  
中文替换：单品没有在线销售时，勾选“仅在实体店有售”。发布后会显示对应标签，让他人知道它来自本地店铺、二手店或裁缝店。

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.likesQ  
英文原文：Likes  
中文替换：点赞如何计入？

页面位置：帮助 → 搭配与社区常见问题；代码定位：app-web/src/i18n/messages/en.ts → help.likesA  
英文原文：Anyone can like an outfit once. Likes drive the top prestige badges.  
中文替换：每人可为同一套搭配点赞一次。获得的点赞有助于解锁高阶荣誉徽章。

### 08.5 徽章帮助

页面位置：帮助 → 徽章帮助；代码定位：app-web/src/i18n/messages/en.ts → help.badges  
英文原文：Badges — how to earn each  
中文替换：徽章之路

页面位置：帮助 → 徽章帮助；代码定位：app-web/src/i18n/messages/en.ts → help.pinNote  
英文原文：Pin up to 3 earned badges to your passport from the \<link\>badge library\</link\>.  
中文替换：在\<link\>徽章馆\</link\>中，最多可将 3 枚已获得的徽章置顶到合身护照。

页面位置：帮助 → 徽章帮助；代码定位：app-web/src/i18n/messages/en.ts → help.library  
英文原文：Badge library  
中文替换：徽章馆

### 08.6 品牌标志与视觉规范

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.mark  
英文原文：The mark  
中文替换：品牌印记

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.markLine  
英文原文：One thread through the maze of fit.  
中文替换：一线相引，合身可循。

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.markBody  
英文原文：Across brands, sizing becomes a labyrinth. Fit Passport keeps the thread: what you wore, how it felt, and what worked. The mark is a single thread folded into an \<strong\>FP\</strong\> — a personal signet that guides you back to your fit.  
中文替换：品牌之间的尺码如同迷宫。Fit Passport 留住那条线索：穿过什么、感觉如何、哪些真正合身。一根线折成 \<strong\>FP\</strong\>，成为你的专属印记，带你循迹找到熟悉的合身感。

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.myth  
英文原文：The reference is \<strong\>Ariadne's thread\</strong\>. She gives Theseus a thread to unroll into the Labyrinth so he can find his way out — and the useful half of that story is not the monster, it is that \<em\>she gives him the means to navigate without taking over\</em\>. That is the product:  
中文替换：灵感来自\<strong\>阿里阿德涅之线\</strong\>。她交给忒修斯一根线，让他进入迷宫后仍能找到归途。我们借用这份心意：\<em\>把辨认方向的线索交给你，选择始终由你掌握\</em\>。它也对应产品的三个部分：

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step1  
英文原文：The labyrinth  
中文替换：迷宫

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step1Body  
英文原文：Sizes that disagree across brands and regions  
中文替换：不同品牌、不同地区各不相同的尺码

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step2  
英文原文：The thread  
中文替换：线索

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step2Body  
英文原文：Everything you’ve worn and how it actually fit  
中文替换：你穿过的衣物，以及真实的合身感受

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step3  
英文原文：The way back out  
中文替换：归途

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.step3Body  
英文原文：A recommendation that shows its reasoning  
中文替换：一份展示判断依据的推荐

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.notAPicture  
英文原文：Which is why it isn't a picture of a shirt, a hanger or a tape measure. It's the memory that travels through clothing.  
中文替换：这枚印记承载衣着间流动的记忆，因此没有采用衬衫、衣架或软尺的具象图形。

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.floorTitle  
英文原文：Where it stops working  
中文替换：小到哪里，仍可辨认？

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.sizeFull  
英文原文：full mark  
中文替换：完整标识

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.sizeFloor  
英文原文：the floor  
中文替换：辨识下限

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.sizeThick  
英文原文：thickened  
中文替换：加粗版本

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.sizeGivesUp  
英文原文：gives up  
中文替换：难以辨识

页面位置：帮助 → 品牌标志与视觉规范；代码定位：app-web/src/i18n/messages/en.ts → help.floorNote  
英文原文：No claim is made on the myth — it's a lens for reading a modern mark, not a provenance. Drawn as one unbroken path so it survives being stamped small, though not infinitely small: below about 20 pixels the loop fills in, which is why the browser-tab icon is a simpler glyph rather than this one shrunk.  
中文替换：神话为这枚现代标识提供理解的视角，并不代表它的历史出处。标识由一条连续路径绘制，以适应小尺寸压印；缩至约 20 像素以下时，环形细节会闭合。因此，浏览器标签图标采用简化符号，保留小尺寸下的辨识度。

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. “合身有据，使用有方。”桌面端保持一行；移动端在逗号后分成两行。  
9\. 问答标题与正文保留现有分组及顺序，正文自然撑高。桌面端与移动端均保持原容器宽度，不用缩小字号容纳中文。  
10\. 标志尺寸规范保留英文原数值和单位；示意图、最小尺寸及线宽的对应关系保持原样。中文图注换行时不与示意图重叠。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 09｜账户

### 09.1 找回账户与重置密码

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.recoverTitle  
英文原文：Reset your password  
中文替换：重置密码

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.recoverLede  
英文原文：Enter your username, email, or account code. We'll email a reset link to the address on file.  
中文替换：输入用户名、邮箱或账户代码。我们会向已绑定的邮箱发送重置链接。

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.recoverBusy  
英文原文：Sending…  
中文替换：发送中……

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.recoverSubmit  
英文原文：Send reset link  
中文替换：发送重置链接

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.requestFailed  
英文原文：request failed  
中文替换：请求失败，请重试

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.noEmail  
英文原文：No recovery email on file? Unfortunately there's no way to reset without one. \<link\>Back to login\</link\>  
中文替换：未绑定找回邮箱时，无法重置密码。\<link\>返回登录\</link\>

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.sentTitle  
英文原文：Check your email  
中文替换：请查收邮件

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.sentBody  
英文原文：If an account matches that, we've sent a password-reset link to the email on file. It expires in 30 minutes.  
中文替换：如果存在匹配的账户，我们已向其绑定邮箱发送密码重置链接，链接将在 30 分钟后失效。

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.devNoEmail  
英文原文：Email isn't configured (dev/beta)  
中文替换：邮件服务尚未配置（开发／测试环境）

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.devUseLink  
英文原文：Use this link to reset directly:  
中文替换：使用以下链接直接重置：

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.backToLogin  
英文原文：Back to login  
中文替换：返回登录

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.resetTitle  
英文原文：Set a new password  
中文替换：设置新密码

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.resetMissing  
英文原文：This reset link is missing information. Request a new one from \<link\>the reset page\</link\>.  
中文替换：此重置链接缺少必要信息，请前往\<link\>密码重置页面\</link\>重新申请。

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.codeStays  
英文原文：Your account code stays the same — only the password changes.  
中文替换：账户代码保持不变，仅更新密码。

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.newPassword  
英文原文：New password  
中文替换：新密码

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.atLeast6  
英文原文：at least 6 characters  
中文替换：至少 6 个字符

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.saving  
英文原文：Saving…  
中文替换：保存中……

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.resetSubmit  
英文原文：Set password & sign in  
中文替换：设置密码并登录

页面位置：账户 → 找回账户与重置密码；代码定位：app-web/src/i18n/messages/en.ts → auth.resetFailed  
英文原文：reset failed  
中文替换：密码重置失败，请重试

### 09.2 登录账户

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.identifierLabel  
英文原文：Username, email, or account code  
中文替换：用户名、邮箱或账户代码

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.passwordLabel  
英文原文：Password  
中文替换：密码

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.loginTitle  
英文原文：Log in  
中文替换：登录账户

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.loginLede  
英文原文：Sign in with your username, email, or account code to edit your closet.  
中文替换：使用用户名、邮箱或账户代码登录，继续编辑你的衣橱。

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.loginBusy  
英文原文：Logging in…  
中文替换：登录中……

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.loginSubmit  
英文原文：Log in  
中文替换：登录

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.loginFailed  
英文原文：login failed  
中文替换：登录失败，请检查登录信息

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.forgot  
英文原文：Forgot your password? \<link\>Reset it with your recovery email\</link\>  
中文替换：忘记密码？\<link\>通过找回邮箱重置\</link\>

页面位置：账户 → 登录账户；代码定位：app-web/src/i18n/messages/en.ts → auth.peek  
英文原文：Just want to peek at a closet? \<link\>View one by code\</link\>  
中文替换：想先看看衣橱？\<link\>输入账户代码浏览\</link\>

### 09.3 账户首页、代码与归属状态

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.loading  
英文原文：Loading…  
中文替换：加载中……

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.readyTitle  
英文原文：Your account is ready  
中文替换：合身身份，已有归属。

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.readyLede  
英文原文：You can log in later with your \<b\>username\</b\> or your \<b\>account code\</b\>, plus your password.  
中文替换：下次使用\<b\>用户名\</b\>或\<b\>账户代码\</b\>，加上密码，即可登录。

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.codeLabel  
英文原文：Account code (shareable)  
中文替换：账户代码（可分享）

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.copied  
英文原文：Copied  
中文替换：已复制

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.copy  
英文原文：Copy  
中文替换：复制

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.codeNote  
英文原文：Anyone with your code can view your closet (read-only). Give it to friends who want to browse.  
中文替换：持有账户代码的人可以浏览你的衣橱，仅供查看。可以分享给想逛逛衣橱的朋友。

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.noEmailTitle  
英文原文：You didn't add a recovery email  
中文替换：尚未添加找回邮箱

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.noEmailBody  
英文原文：Without one, there's \<b\>no way\</b\> to reset your password if you forget it. You'd permanently lose editing access to this account. Consider adding an email later from your account page.  
中文替换：没有找回邮箱，忘记密码后将\<b\>无法重置\</b\>，也会永久失去此账户的编辑权限。建议稍后在账户页面添加邮箱。

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.viewPassport  
英文原文：View my passport  
中文替换：查看我的护照

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.myCloset  
英文原文：My closet  
中文替换：我的衣橱

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.previewPublic  
英文原文：Preview public view  
中文替换：预览公开页面

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.title  
英文原文：Account  
中文替换：我的账户

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.username  
英文原文：Username  
中文替换：用户名

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.accountCode  
英文原文：Account code  
中文替换：账户代码

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.recoveryEmail  
英文原文：Recovery email  
中文替换：找回邮箱

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.noEmailValue  
英文原文：none — can't reset password  
中文替换：未设置，无法重置密码

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.bodyTypeShared  
英文原文：Body type shared  
中文替换：已公开的体型

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.notShared  
英文原文：not shared  
中文替换：未公开

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.exportByCode  
英文原文：Export by code  
中文替换：通过账户代码导出

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.exportAnyone  
英文原文：anyone with code  
中文替换：持有代码的人

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.exportOnlyMe  
英文原文：only me  
中文替换：仅自己

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.viewPublicCloset  
英文原文：View my public closet  
中文替换：查看公开衣橱

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.logOut  
英文原文：Log out  
中文替换：退出登录

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.publicNote  
英文原文：Anyone with your code can view your closet and body type (if shared), but only someone with your password can edit it. \<link\>See the community\</link\>  
中文替换：持有账户代码的人可以浏览你的衣橱，以及你主动公开的体型。编辑需要密码。\<link\>前往社区\</link\>

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.editPassport  
英文原文：Edit my passport  
中文替换：编辑我的护照

页面位置：账户 → 账户首页、代码与归属状态；代码定位：app-web/src/i18n/messages/en.ts → account.editCloset  
英文原文：Edit my closet  
中文替换：编辑我的衣橱

### 09.4 公开体型标签

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.none  
英文原文：Prefer not to say  
中文替换：不愿透露

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.petite  
英文原文：Petite  
中文替换：娇小

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.slim  
英文原文：Slim  
中文替换：纤细

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.lean  
英文原文：Lean  
中文替换：纤瘦

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.average  
英文原文：Average  
中文替换：适中

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.athletic  
英文原文：Athletic  
中文替换：健壮

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.curvy  
英文原文：Curvy  
中文替换：曲线丰满

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.broad  
英文原文：Broad  
中文替换：宽厚

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.tall  
英文原文：Tall  
中文替换：高挑

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyType.plus  
英文原文：Plus  
中文替换：大尺码体型

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyTypeLabel  
英文原文：Body type  
中文替换：体型

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.bodyTypeHint  
英文原文：coarse only — precise measurements never shared  
中文替换：仅展示概括体型，精确身形数据保持私密

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.chooseOne  
英文原文：Choose one…  
中文替换：请选择……

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.showBodyType  
英文原文：Show my body type on my public view (you can change this later)  
中文替换：在公开页面展示我的体型（之后可修改）

页面位置：账户 → 公开体型标签；代码定位：app-web/src/i18n/messages/en.ts → account.pickBodyType  
英文原文：Pick a body type (or “Prefer not to say”) to continue.  
中文替换：请选择体型，也可选择“不愿透露”，然后继续。

### 09.5 认领账户与权限设置

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.claimTitle  
英文原文：Claim your account  
中文替换：认领你的合身身份。

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.claimLede  
英文原文：You've been using a private, temporary account. Claim it to get a shareable \<b\>account code\</b\> and lock editing behind a password. Your passport and closet are already filled in — you can go back and tweak them first; nothing is locked until you press claim.  
中文替换：目前，你使用的是私密的临时账户。认领后可获得用于分享的\<b\>账户代码\</b\>，编辑权限将由密码保护。已有的护照与衣橱记录会保留，也可先返回调整；点击认领前，编辑权限尚未锁定。

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.usernameHint  
英文原文：shown to people who view your closet  
中文替换：浏览你衣橱的人会看到这个名字

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.usernamePlaceholder  
英文原文：e.g. alex\_fits  
中文替换：如：alex\_fits

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.passwordLabel  
英文原文：Password  
中文替换：密码

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.passwordHint  
英文原文：needed to edit — this is your key  
中文替换：用于编辑，请妥善保管

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.atLeast6  
英文原文：at least 6 characters  
中文替换：至少 6 个字符

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.emailHint  
英文原文：optional but strongly recommended  
中文替换：选填，建议添加

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.emailPlaceholder  
英文原文：you@example.com — so you can reset your password  
中文替换：you@example.com，用于找回密码

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.exportLabel  
英文原文：Who can export your closet by code?  
中文替换：谁可以通过账户代码导出你的衣橱？

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.exportOwner  
英文原文：Only me (recommended)  
中文替换：仅自己（推荐）

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.exportAnyoneOption  
英文原文：Anyone with my code  
中文替换：持有我账户代码的人

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.creating  
英文原文：Creating…  
中文替换：创建中……

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.claimSubmit  
英文原文：Claim my account code  
中文替换：认领账户

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.haveCode  
英文原文：Already have a code? \<link\>Log in\</link\>  
中文替换：已有账户代码？\<link\>登录\</link\>

页面位置：账户 → 认领账户与权限设置；代码定位：app-web/src/i18n/messages/en.ts → account.couldNotCreate  
英文原文：could not create account  
中文替换：账户创建失败，请重试

### 09.6 修改密码

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.changePassword  
英文原文：Change password  
中文替换：修改密码

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.currentPassword  
英文原文：Current password  
中文替换：当前密码

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.newPassword  
英文原文：New password  
中文替换：新密码

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.passwordUpdated  
英文原文：Password updated.  
中文替换：密码已更新。

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.couldNotUpdate  
英文原文：couldn't update password  
中文替换：密码更新失败，请重试

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.saving  
英文原文：Saving…  
中文替换：保存中……

页面位置：账户 → 修改密码；代码定位：app-web/src/i18n/messages/en.ts → account.updatePassword  
英文原文：Update password  
中文替换：更新密码

### 09.7 停用账户

页面位置：账户 → 停用账户；代码定位：app-web/src/i18n/messages/en.ts → account.deactivateTitle  
英文原文：Deactivate account  
中文替换：停用账户

页面位置：账户 → 停用账户；代码定位：app-web/src/i18n/messages/en.ts → account.deactivateConfirm  
英文原文：Deactivate your account? It will be hidden from everyone (public view, community, login). Your data is kept and support can restore it later.  
中文替换：停用账户？停用后，公开页面、社区展示和登录均将不可用。数据会保留，之后可联系支持恢复。

页面位置：账户 → 停用账户；代码定位：app-web/src/i18n/messages/en.ts → account.deactivateBody  
英文原文：Hides your account from everyone external — public view, community, and login all stop working. Your data isn't deleted; support can reactivate it. Confirm with your password.  
中文替换：停用后，公开页面、社区展示和登录均将不可用。数据会保留，联系支持团队可恢复账户。请输入密码确认。

页面位置：账户 → 停用账户；代码定位：app-web/src/i18n/messages/en.ts → account.couldNotDeactivate  
英文原文：couldn't deactivate  
中文替换：账户停用失败，请重试

页面位置：账户 → 停用账户；代码定位：app-web/src/i18n/messages/en.ts → account.deactivateSubmit  
英文原文：Deactivate my account  
中文替换：停用我的账户

### 09.8 接口返回的可见错误与权限提示

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → Too many requests — slow down and try again shortly.  
英文原文：Too many requests — slow down and try again shortly.  
中文替换：请求较频繁，请稍后再试。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → invalid request  
英文原文：invalid request  
中文替换：请求无效。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → invalid or expired reset link  
英文原文：invalid or expired reset link  
中文替换：重置链接无效或已过期。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → not allowed  
英文原文：not allowed  
中文替换：当前操作未获授权。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → current password is incorrect  
英文原文：current password is incorrect  
中文替换：当前密码不正确。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → invalid username/code or password  
英文原文：invalid username/code or password  
中文替换：用户名、账户代码或密码不正确。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → we couldn't verify that account and email combination  
英文原文：we couldn't verify that account and email combination  
中文替换：账户信息与邮箱不匹配，请核对后重试。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → password required  
英文原文：password required  
中文替换：请输入密码。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → password is incorrect  
英文原文：password is incorrect  
中文替换：密码不正确。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → account already claimed  
英文原文：account already claimed  
中文替换：该账户已被认领。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → username taken  
英文原文：username taken  
中文替换：该用户名已被使用。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → email already in use  
英文原文：email already in use  
中文替换：该邮箱已被使用。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → username: 2–30 characters — letters, numbers, and . \_ \- only, and not an email address  
英文原文：username: 2–30 characters — letters, numbers, and . \_ \- only, and not an email address  
中文替换：用户名需为 2–30 个字符，仅可包含字母、数字及 . \_ \-，不能使用邮箱地址。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → password: at least 6 characters  
英文原文：password: at least 6 characters  
中文替换：密码至少需要 6 个字符。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → email: that doesn't look like an email address  
英文原文：email: that doesn't look like an email address  
中文替换：邮箱格式不正确，请核对。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → not found  
英文原文：not found  
中文替换：未找到相关内容。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → bad request  
英文原文：bad request  
中文替换：请求无效。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → only the asker can accept an answer  
英文原文：only the asker can accept an answer  
中文替换：只有提问者可以采纳回答。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → no such answer  
英文原文：no such answer  
中文替换：未找到该回答。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → Claim an account to ask the community.  
英文原文：Claim an account to ask the community.  
中文替换：认领账户后，即可向社区提问。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → unknown post kind  
英文原文：unknown post kind  
中文替换：无法识别这类帖子。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → that item isn't in your closet  
英文原文：that item isn't in your closet  
中文替换：这件衣物不在你的衣橱中。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → Claim an account to answer.  
英文原文：Claim an account to answer.  
中文替换：认领账户后，即可回答问题。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → id required  
英文原文：id required  
中文替换：缺少内容编号。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → you can't vote for your own answer  
英文原文：you can't vote for your own answer  
中文替换：无法为自己的回答投票。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → Claim an account to follow people.  
英文原文：Claim an account to follow people.  
中文替换：认领账户后，即可关注他人。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → cannot follow yourself  
英文原文：cannot follow yourself  
中文替换：无法关注自己。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → read-only — password required to edit  
英文原文：read-only — password required to edit  
中文替换：当前为只读状态，输入密码后即可编辑。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → you can't like your own look  
英文原文：you can't like your own look  
中文替换：无法为自己的搭配点赞。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → read-only — password required  
英文原文：read-only — password required  
中文替换：当前为只读状态，请输入密码。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → unknown kind or reason  
英文原文：unknown kind or reason  
中文替换：无法识别内容类型或举报理由。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → that's your own content — delete it instead  
英文原文：that's your own content — delete it instead  
中文替换：这是你发布的内容，可直接删除。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → Claim an account to block people.  
英文原文：Claim an account to block people.  
中文替换：认领账户后，即可屏蔽他人。

页面位置：账户 → 接口返回的可见错误与权限提示；代码定位：app-web/src/lib/apiText.ts → 英文消息索引 → you can't block yourself  
英文原文：you can't block yourself  
中文替换：无法屏蔽自己。

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 账户页标题与认领页标题分别使用各自文本；账户代码独立显示，使用原等宽字形，并保留复制按钮和 FP-XXXX-XXXX-XXXXX 格式。  
9\. 登录、找回、重置和改密表单沿用原宽度；错误提示在现有输入项或表单提示区显示，内容自然撑高，不覆盖按钮。  
10\. 用户名 2–30 个字符、密码至少 6 个字符等限制按原规则保留。输入值、密码、邮箱、账户代码不翻译。  
11\. 公开体型、按代码导出和停用账户的权限与恢复说明按原条件显示。停用确认按钮保持原危险操作样式，确认弹窗动作顺序不变。  
12\. API\_ZH 仅更新中文返回文案；英文错误键、say 调用、状态码、鉴权和请求参数保持原样。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。

## 模块 10｜内容审核

### 10.1 审核队列、状态与处理动作

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 1  
英文原文：Delete this permanently? This can't be undone.  
中文替换：永久删除此内容？删除后无法恢复。

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 2  
英文原文：No such page  
中文替换：页面不存在

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 3  
英文原文：Nothing to see here.  
中文替换：当前页面没有可查看的内容。

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 4  
英文原文：Go home  
中文替换：返回首页

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 5  
英文原文：Loading…  
中文替换：正在加载……

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 6  
英文原文：Review queue  
中文替换：内容审核

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 7  
英文原文：Signed in as {username}. Content auto-hides at {threshold} distinct reports — that's a blunt rule, and this page is where a person overrides it.  
中文替换：当前登录：{username}。内容被 {threshold} 位不同用户举报后会自动隐藏，可在此审核并调整处理结果。

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 8  
英文原文：Restoring clears the reports on an item, so the same three can't re-hide it. Nothing here exposes anyone's measurements — that isn't a permission, it's a property of the data model.  
中文替换：恢复内容时会清除其举报记录，避免同一批举报再次触发隐藏。此页面的数据结构不包含任何人的身形数据。

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 9  
英文原文：Nothing reported. Quiet is good.  
中文替换：暂无举报，社区平静如常。

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 10  
英文原文：{count} report(s)  
中文替换：{count} 次举报

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 11  
英文原文：Hidden  
中文替换：已隐藏

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 12  
英文原文：Reporter notes: {notes}  
中文替换：举报说明：{notes}

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 13  
英文原文：by {username}  
中文替换：发布者：{username}

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 14  
英文原文：No. {memberNo}  
中文替换：编号：{memberNo}

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 15  
英文原文：Open thread  
中文替换：查看讨论

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 16  
英文原文：Restore  
中文替换：恢复展示

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 17  
英文原文：Hide  
中文替换：隐藏内容

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 18  
英文原文：Delete permanently  
中文替换：永久删除

页面位置：内容审核 → 审核队列、状态与处理动作；代码定位：app-web/src/app/admin/page.tsx → 19  
英文原文：POST / ANSWER / OUTFIT  
中文替换：问题／回答／搭配（仅翻译显示标签，数据枚举保持原样。）

### 本页面排版要求（给 Claude Code）

1\. 只修改中文 locale、中文显示文案和中文布局适配。英文 locale、功能逻辑、接口协议、数据库、枚举值、数据与页面行为保持不变。  
2\. 中文字符之间不得手动插入空格。原有字距效果使用 CSS letter-spacing；中文正文不沿用英文大写标签的宽字距。  
3\. 保留所有插值变量的名称、数量和用途，保留原有富文本标签及其组件映射。英文原文中的代码表达式仅作定位；中文模板中的条件词按本模块分支说明组合，不得作为静态说明文字显示。  
4\. 原有 accent、strong、b、em 的强调位置和颜色映射保持原样；普通中文标题不新增斜体。中文强调使用原字重或颜色，避免倾斜导致笔画拥挤。  
5\. 品牌名、浏览器名、单位、版本号、文件大小、URL、路径、账户代码、尺码体系与尺码标签保持准确。变量来自用户输入、商品页或品牌时保留原值，只有界面自有标签翻译。  
6\. 桌面端沿用英文版容器宽度、网格列数和主要对齐关系；正文采用内容自然撑高，禁止固定高度裁切中文。同行按钮保持原有高度与最小宽度，中文超出时增加水平内边距，不压缩字号。  
7\. 移动端正文允许自然换行，标签与数值作为一个阅读单元；按钮组在空间不足时按原顺序换行。保留原有断点、可点击区域、滚动行为与焦点顺序，中文变化后不得破坏响应式布局。  
8\. 仅为中文界面添加对应显示文案；英文审核页维持原文。无权限时仍显示原空页面状态，不改变访问控制或泄露审核队列。  
9\. 桌面端沿用原卡片宽度；移动端标签与操作按钮按原顺序换行。举报数量、阈值、内容正文、账号信息及审核动作的数据保持原样。  
10\. POST、ANSWER、OUTFIT 只转换显示标签，提交值与接口字段保持原枚举。恢复、隐藏、永久删除的确认和效果保持原样。  
状态：本页面文案已完整整理并定稿（依据本次授权写入）。  
