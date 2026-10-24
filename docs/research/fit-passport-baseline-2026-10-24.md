# Fit Passport：竞品研究所用的项目现状基线

核查日期：2026-10-24。固定基线：`main`，提交 `aa74c46a93034cfdf24c171d591963a002c9d765`（2026-10-24 07:57:37 UTC）。

## 1. 方法、来源与适用边界

本文将本轮研究提供的只读 GitHub 源码和文档检查结果整理为中文，供竞品功能矩阵和需求优先级判断使用。整理工作区已核对到同一提交。研究来源包括完整文档、相关路由与关键源文件；没有执行整个仓库，没有使用线上账户，也没有验证部署配置或真实用户体验。本文的“有”表示在该提交中有实现或明确实现记录，**不等于线上可用、质量达标或效果已经验证**。

“没有（所查范围未见）”指在已检查路由、schema 中未发现，且相关笔记将其列为提议或停放项；不是对仓库每个字节的穷尽证明。所有“现状”均以此提交和检查范围为界。

本轮 GitHub API 返回仓库为公开；旧 RESUME 仍写私有。旧描述不能用于判断当前可见性。本轮研究未改代码、部署或外部通信；本文仅新增研究文档。

已有 [初步竞品扫描](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/research/competitor-scan-2026-10-24.md) 已全文阅读，涉及穿啥、Outfity、WearWow、搭搭、Acloset、多个 Mira、Libre Closet、zebangeth/ai-closet、wardrowbe、Leffa、CatVTON、IDM-VTON、OOTDiffusion、FitDiT、RMBG-2.0 与 Open-Meteo。该文明确声明依据搜索摘要和厂商自述，**不是亲自试用，也不是独立评测**。

## 2. 定位与研究应回答的问题

[项目总览](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/memory/project-fit-passport.md) 的核心定位是消费者拥有、可携带的合身档案：身体信息、合身偏好、已知合身衣物，以及保留／退货／换码结果共同支持可解释的尺码判断。它明确将 True Fit / Sizebay 作为零售商嵌入式对照，3DLOOK / Bold Metrics 作为测量对照，Google Doppl 作为视觉对照。尺码推荐与视觉试穿须分开。

该总览仍包含 Session 01/22 的历史技术栈和私有仓库描述；[README](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/README.md) 与 [RESUME](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/RESUME.md) 也明显落后于较新实现。不能只读这些文件，就把已有功能写成缺失。

本轮更有价值的问题是：**低操作成本的日常穿着记录，能否改善合身证据和购买后的反馈闭环，同时不加重现有界面负担？** “新增衣橱”“新增 3D 人台”“新增试穿按钮”本身已不是准确的新需求描述。

## 3. 已有能力及精确范围

| 能力 | 仓库证据与边界 |
|---|---|
| 可携带档案、双语界面、插件检查入口 | [README](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/README.md)、[RESUME](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/RESUME.md) 描述活动标签页内容精简、商品／尺码表解析、不可读或登录阻塞时明确拒绝；网站 URL 输入为 beta。Chrome 上架状态仅是仓库陈述，本轮未独立核验。 |
| 可解释尺码排序 | 规则与权重决定尺码，不是让 LLM 决定尺码；区分身体与衣物尺寸，保留来源，限制估计数据置信度，使用从紧到松的带方向反馈。已有二手单品判断是单件合身判断，不等于多尺码排序。 |
| 衣橱 | 照片图库、收藏／文件夹、变体分组、URL 添加、上传／粘贴／相机／裁剪、批量添加、撤销删除、衣物命名与松紧方向已有记录。见 [README](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/README.md)、[Session 88 起的较新记录](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/memory/project-fit-passport-next-steps.md)、[schema](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/prisma/schema.prisma)。 |
| 待购与已拥有分离 | `SavedItem` 单独建模，不应算作已拥有衣物、训练引擎或获得徽章。购买转化会询问合身情况；检查过的待购商品可创建 kept 结果。见 [schema](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/prisma/schema.prisma)、[pilot 指南](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/pilot-guide.md)。 |
| 持续合身反馈 | `ComfortCheck` 保存衣物、用户、松紧方向、可选笔记、原因与时间；`KnownGoodItem` 反映最新反馈。`FitOutcome` 保存购买尺码、保留／退货／换码、目标尺码和方向。它们不是穿搭日历。见 [schema](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/prisma/schema.prisma)。 |
| 搭配编辑 | [outfits 页面源码](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/app/outfits/page.tsx) 包含手动单品、品类／颜色、自有衣橱选择、标题／描述／场合、社区发布、风格化 SVG、延迟加载的 3D 页签及可选写实图页签。不是精确衣物物理仿真。 |
| 3D 身体与合身可视化 | 衣架式人台、Anny 写实身体、`/body` 选择、`/check` 人台／写实切换和区域着色、`/outfits` 3D 已在截至 Session 100 的[较新记录](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/memory/project-fit-passport-next-steps.md)中记为交付。[旧 3D 设计](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/design/3d-body-and-tryon.md) 顶部“只完成第 1 步”已被其底部和后续记录更新。 |
| 可选通用生成图 | [tryonImage.ts](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/lib/tryonImage.ts) 接收品类／颜色列表、粗粒度体型和场合，向配置的提供商／FLUX schnell 发送文本提示；没有参考人物或衣物图片。无密钥时关闭，可返回 null。**不是保留本人身份与精确商品的 VTON**；未检查生产密钥配置。 |
| 社区与激励 | 关注、搭配流、点赞、含证据问答、每日榜、徽章／卡片、审核与屏蔽已有文档描述及模型，不能作为全新差异化提议。 |
| 标准与品牌校准 | 国家尺码标准、分市场品牌偏移、要求足够品牌证据的美码字母共识、下装腰围支持。见 [尺码校准设计](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/design/size-calibration.md) 及 Session 101–103 记录。 |
| 用衣物证据收窄身体估计 | [bodyEstimate.ts](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/lib/bodyEstimate.ts) 从合身衣物与保留／退货／换码记录建立胸／腰／臀／身高约束交集，优先较强证据并指出矛盾。属于规则估计，不是照片身体扫描；证据强弱排序和中点边界仍需验证。 |
| pilot 遥测与反馈 | `Event`、`Feedback` 模型、`/admin` pilot 面板与真实购买结果准确率视图见 [pilot 指南](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/pilot-guide.md)。界面／模型存在不代表已有足量真实购买证据。 |

## 4. 新增、改进与已存在：需求判定表

| 想法 | 判定 | Fit Passport 下一步应验证什么 |
|---|---|---|
| 照片衣橱、文件夹、批量导入、撤销 | 已有 | 测量完成与修正成本，借鉴更好的交互细节。 |
| 照片自动品类／颜色识别与抠图 | 新增或当前源码未证实 | 所查路径未见；商品标题分类器不等于照片识别。验证可选建议与修正，不能从像素推断可靠衣物尺寸。 |
| 穿搭日历：计划与实际穿着 | 新增 | 穿着事件引用已拥有衣物 ID；不挤占购买结果 `FitOutcome`，不把计划算成已穿。可选“还合身吗”可追加 `ComfortCheck`。 |
| 穿着次数、单次穿着成本、衣橱价值 | 新增 | 所查 schema 无价格／穿着次数字段。先验证价值是否足以抵消录入负担；成本需统一购入价与实际穿着语义。 |
| 天气、旅行、胶囊衣橱规划 | 新增 | 场合自由文本已存在，但未见天气／定位／预报或打包流程。保暖、防雨适配与尺码置信度分开。 |
| 考虑合身的随机搭配 | 新增 | 可复用编辑器，但缺少近期穿着／季节前提。“当前合身”需考虑反馈时间和未知状态。 |
| 正侧背视角、与熟悉衣物并排比较 | 已有 3D 的改进 | 验证固定视角是否改善理解；不暗示测量过布料垂坠或不可见背面几何。 |
| 写实人台 | 已有 | 头部与质量属于改进；当前待办仍有需人工提供的 MetaHuman 导出脸部资源。 |
| 保留本人／精确商品的图片或视频 VTON | 新增或替换子系统 | 现有写实页签只表达文字。真实 VTON 需图像同意、身份／商品保真验证、完整许可链与成本控制，不作为尺码证据。 |
| 手机分享入口、PWA、离线 | 停放／新增 | [移动端决策](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/todo/decisions/06-mobile-app.md) 明确尚未构建，先判断需求与入口。桌面插件不能读取购物原生 App；尺码表截图流程不等于原生分享扩展。 |
| 购买后反馈 | 已有 | 改善完成率、提醒与用户控制；缺的是 pilot 结果，不是捕获模型。 |
| 品牌知识聚合 | 部分已有，需区分 | 官方尺码表／分市场校准已存在；跨用户行为合身聚合是另一项已设计但未构建的能力。 |

## 5. 初步扫描中必须复核或收窄的说法

以下是旧扫描或旧研究中的说法，**不是本文认可的结论**。

- “穿啥不做尺码”是从商店描述作出的绝对否定。应改为“所查描述未提供尺码功能证据”，继续核查版本、页面和明确产品说明。
- “只有下架 Mira 尝试尺码”“我们的插件＋引擎＋评测是别人没有的”缺少独占性证据，并与项目既有 True Fit 等研究冲突。保留更窄定位：购物入口处、消费者拥有且透明的合身证据。
- 多个 Mira 必须按域名、开发者、扩展 ID 与商店状态分开；第三方下架记录不是当前官方状态。
- 本地处理、任意购物站点、3D 建模、布料垂坠准确度都需明确标为厂商宣称，不能当作独立验证结果。
- WearWow／Outfity／搭搭功能、“200 万用户”、价格和点数额度需附地区、版本与日期。“天气／日历／抠图是标配”不等于每款都有，也不能证明用户重视。
- AGPL “不能复制／感染私有代码”过于简化。需描述实际许可证，以及复制、修改、链接和部署方式对应的义务，不给笼统法律结论。
- Leffa “唯一商用候选”需重新核查生态，并分开代码、权重、底模、解析／分割组件和数据条款。
- CatVTON、IDM-VTON、OOTDiffusion、FitDiT、RMBG 与 Open-Meteo 的笼统许可结论，需以各自上游许可证、模型卡和官方服务条款重核。
- “只有我们知道现在合身”不是已证明的壁垒。项目掌握的是带时间的用户反馈；其他系统也可能采集合身／舒适度信号。
- “AI 图片永远好看、看不出紧松”过于绝对。更准确的是：单靠外观生成，不能形成已经验证的测量型合身证据。
- 旧 3D 研究中的照片测量 MAE 搜索摘要和“照片不能代替软尺”等普遍结论，需回到原始论文、方法、数据集与具体任务不确定性核验。

## 6. 验证证据：现有结果不等于真实穿着准确率

以下均为固定提交中的历史报告结果，本文没有重跑测试。

| 证据 | 报告记录与解释边界 |
|---|---|
| [2026-10-24 扩展报告](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/review/extension-test-2026-10-24.md) | 旧离线回放：11 个 case、9 个捕获、11 条 truth；S5 回答 6／拒绝 3，正确回答 4、正确拒绝 2、错误回答 2、错误拒绝 1。推荐检查 12/15，防护 12/12；测试工具通过不等于每条推荐正确。不可继续写“truth 0/11”或“捕获只在本地”。 |
| 同一扩展报告的环境 | 本轮无 live 数据库，捕获到缺失 `DATABASE_URL` 后使用 fallback。真实扩展 UI：通过 0、观察到产品失败 0、工具阻塞 8；原因是支持的浏览器途径无法访问 `chrome://extensions`，且原生控制不可用。没有新增 H&M／REI／eBay 扩展捕获。**阻塞不是通过，也不是已证实的产品失败。** |
| [2026-10-24 验证报告](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/review/validation-2026-10-24.md) | 报告记录 1,554 tests、build 通过，66 个 guide 文件／27 等待／18 计入已审查身体尺码指南。引用此具体运行，不能沿用 README 约 730 或 RESUME 不一致总数，也不能说是永恒当前值。 |
| [评测设计](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/eval/README.md) | 使用合成人体与尺码表推导答案；衣物表准确率在选定独立松量真值前不评分。图表／persona 证据不是实际穿着者准确率。 |
| [pilot 指南](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/pilot-guide.md) | 计划 10–20 人、3–4 周、收集真实保留／退货／换码结果；少于约 20 笔可判定购买明确不足以对外报准确率。 |
| [当前工程待办](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/todo/engineering/00-ORDER.md) | 真实非表格尺码图捕获、淘宝详情图验证、卖家测量噪声校准、写实脸导出、弹窗 unavailable／estimate 文案仍开放。 |
| [合成校准设计](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/docs/design/size-calibration.md) | 文档正确标为合成测试。把松紧标签解释为中点单边界、证据强度顺序、个人松量默认值、阈值和混合证据置信度，仍是设计假设，不是已确立的真人准确率。 |

## 7. 界面研究连续性：避免重复劳动

[信息架构研究](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/coursework/startup/product-design/information-architecture.md) 已指出表单过载和以数据模型／名词组织导航的问题。四问入橱流程已交付；历史配对审计记录控件 28→15、点击 127→84、屏幕 5.5→4.5。这些是当时测量，引用前须说明历史范围；不能直接当成当前界面数值。

已有建议包括先展示收益再逐步展开、按用户意图提供入口；`/refresh` 的“一件衣物、一个问题”是内部参考。约束包括不用合身拖动滑块、低于桌面断点使用移动导航、为性能延迟加载 3D／默认平面徽章、保留来源与精度隐私边界。

竞品比较应检验：首次得到有用衣橱的耗时、错误修正负担、一键记录穿着、计划与已穿区分、空状态、失败／未知状态披露、购买后返回反馈流程。单纯堆功能清单不足以回答这些问题。

## 8. 供总报告引用的状态矩阵

| 功能 | 状态 | 边界 |
|---|---|---|
| 消费者档案、透明尺码推荐、插件入口 | 有 | 有源码／文档，本次未运行线上端到端。 |
| 衣橱、照片／批量、待购、买后反馈、合身刷新 | 有 | 不包括日历或穿着次数。 |
| 搭配编辑、社区、SVG／3D 预览 | 有 | 非真实布料仿真。 |
| 身体估计、标准／品牌尺寸证据 | 有 | 推断不能等同真实用户准确率。 |
| 生成图“试穿” | 部分 | 文字驱动通用人台图，没有精确保留本人和商品的 VTON。 |
| 穿搭日历／计划与实际穿着、天气、旅行行李 | 没有（所查范围未见） | 需单独事件数据和流程。 |
| 穿着次数／单次穿着成本 | 没有（所查范围未见） | 当前所查 schema 无价格／次数模型。 |
| 原生 App／手机分享入口／离线衣橱 | 没有（文档明确停放） | 响应式网页不等于原生或离线能力。 |
| 照片自动抠图／识别入橱 | 没有（所查范围未见） | 商品标题分类器不算照片分类。 |
| 真实衣物物理下垂／实物贴合预测 | 没有（所查实现未见） | 3D fit map 是尺寸解释，不是 cloth simulation。 |
| 评测闭环 | 部分 | 离线图表／合成人体评测有；真实购买准确率待 pilot；扩展真实 UI 检查仍被工具阻塞。 |

## 9. 检索与后续取证记录

本轮只读研究检索部分已知术语返回空结果，期间短暂出现 429；完整且未截断的递归目录树定位了研究文件。已全文阅读 README、RESUME、初步竞品扫描、项目计划、记忆索引／后续步骤、项目总览、3D 设计、校准、评测指南、pilot 指南、移动端决策、验证／扩展报告、信息架构研究，以及相关 schema、搭配页、生成图和身体估计源码。固定提交链接用于复现来源。

本文没有竞品亲自试用结论或新增截图。后续竞品截图只能证明所显示页面，不自动证明完整功能可用；不足三个独立好评或抱怨主题时应写明证据不足。登录、验证码或其他访问限制必须记录，不能用猜测填补。

## 10. 导出与账号控制的精确源码边界

本轮补查同一固定提交的 [导出路由](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/app/api/view/%5Bcode%5D/export/route.ts) 与 [公开资料页按钮](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/app/u/%5Bcode%5D/page.tsx)：仅对已认领、未停用且 exportPolicy 为 anyone 的账号提供限流 JSON。内容是账号代码、公开资料、可选体型、collection 名称及衣物品牌／品类／标签码等选定元数据；不包含原始图片、完整身体测量、反馈结果或完整关系包。故状态为「部分：受策略控制的元数据导出」，未建立完整备份或往返恢复能力。

[停用路由](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/app/api/auth/deactivate/route.ts) 验证密码后软停用账号、取消社区展示并清除会话，明确保留数据，不是硬删除。[改密码路由](https://github.com/Kpewww/fit-passport/blob/aa74c46a93034cfdf24c171d591963a002c9d765/app-web/src/app/api/auth/change-password/route.ts) 验证旧密码并更新哈希。这里只确认静态实现，未执行导出、停用或恢复。
