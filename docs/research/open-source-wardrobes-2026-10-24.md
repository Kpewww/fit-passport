# 开源衣橱与合身数据方案

核查2026-10-24 UTC。读取README、API元数据、许可证、选定源码和发布记录；未安装、启动、提交任务或运行测试。截图是上游展示，不是本研究交互。星数只作发现线索。以下“较优参考”是筛选集合内研究判断，不是质量竞赛结果。

## 1. 链接辨认与研究边界

| 原链接 | 结果 |
|---|---|
| [一亩三分地1106256](https://www.1point3acres.com/bbs/thread-1106256-1-1.html) | 公开正文明确zebangeth/ai-closet，与[ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fzebangeth%2Fai-closet)是同项目，不是第四款。2025-01历史介绍，附件需登录未访问。ecosyste.ms缓存未命中，身份由论坛／GitHub确认。 |
| [dungeontools](https://dungeontools.duckdns.org/) | 网页工具不可达，无精确域索引；不能证明运行Lazztech Libre Closet或部署版本。 |
| [SourcePulse29145999](https://www.sourcepulse.org/projects/29145999) | 不可达，精确编号未解出；Anyesh/wardrowbe为独立确认的上游，不能保证就是原目录记录。 |

Lazztech/Libre-Closet不是101Viper777/libre-closet；Anyesh/wardrowbe不是indieagentic/DStyle-wardrowbe。wardrobe-hq、tandpfun、dannybarr、bek-sam是不同仓库；后两者文档有tandpfun式脉络，API fork:false不证明原创。

## 2. Anyesh/wardrowbe

### 定位、平台、价格与成熟度

[仓库](https://github.com/Anyesh/wardrowbe)自托管AI衣橱，网页／README链接移动商店，未核实移动源码对等；源码免费、服务器／模型另计，未核实托管或移动收费。MIT实际文本已读，[LICENSE](https://github.com/Anyesh/wardrowbe/blob/main/LICENSE)。快照797 stars、未archive、main `0bbca3a4d92b9d3cec64a5a09ffdacce41f04d04`（2026-10-23），487 commits；[release](https://github.com/Anyesh/wardrowbe/releases)最新wardrowbe-v1.12.0／2026-10-22。活跃不等于可靠。

### 功能、源码证据（全部未运行）

README称照片分类／自动标签、天气场合建议、家庭衣橱、wear／wash、历史日历、统计、配对、ntfy／Mattermost／邮件定时建议及多语言。以下为静态源码而非仅宣传：

- [item.py](https://github.com/Anyesh/wardrowbe/blob/main/backend/app/models/item.py)：UUID、每用户上传幂等键、原图／中图／缩略图、感知hash、处理／标签状态与时间、AI原响应／confidence、ItemHistory／WashHistory、派生次数和最近时间、购买价、归档。
- [item_scorer.py](https://github.com/Anyesh/wardrowbe/blob/main/backend/app/services/item_scorer.py)：AI前的天气／正式度／季节／近期／偏好评分，南北半球、个人冷热阈值、预报范围和必要搭配角色。函数中的fit是风格适用，不是物理合身。
- [background_removal.py](https://github.com/Anyesh/wardrowbe/blob/main/backend/app/services/background_removal.py)：延迟本地rembg或HTTP服务，后者传图外部。
- [测试目录](https://github.com/Anyesh/wardrowbe/tree/main/backend/tests)：安全、图片限制、签名URL、批量幂等、标签持久／恢复、wear/wash、推荐、OIDC、迁移；前端有上传队列、日历、studio、auth／query测试。**没有运行，不报覆盖率或通过率。**

### 尺码、截图与口碑

没有核实物理尺码引擎，天气／风格推荐不可代替。[历史图](screenshots/wardrowbe-history.png)显示场合／状态筛选、月历、日期建议与Rate；不能说明每条实际穿过。[上游图目录](https://github.com/Anyesh/wardrowbe/tree/main/screenshots)另含洗涤／配对／分析。**独立重复好评和抱怨均不足3主题**；工程优点不冒充口碑。

### 栈、隐私、导出与商用

Next.js／TanStack Query、FastAPI／async SQLAlchemy／Pydantic、Postgres、Redis/arq、Docker／Compose／Kubernetes。图片文件原／衍生路径；OIDC／forward-auth，开发默认登录不是安全公网配置。OpenAI／Ollama／LocalAI分别配置视觉和文本，可关AI；本地模型仍可能需天气／auth／通知外网，未证完全离线。README的pg_dump＋图片卷是运维恢复，不是用户可携协议。MIT需保留通知并逐项依赖审计。**建议借事件账本和可靠上传，不替换FitPassport现有架构。**

## 3. Lazztech/Libre-Closet

### 定位、平台、价格与成熟度

[仓库](https://github.com/Lazztech/Libre-Closet)简洁自托管衣橱／PWA，源码免费、自己托管，公开demo需账号未创建。[AGPL-3.0实际许可](https://github.com/Lazztech/Libre-Closet/blob/main/LICENSE)已读；372 stars，main `08f66dd9fe071e3b62e529d0ca4050169d31532d`／2026-10-11，约133 commits。[v0.6.0](https://github.com/Lazztech/Libre-Closet/releases)发布2026-10-15，README功能日期Oct5不同口径。

### 功能与实现证据

M：名字／类别／品牌／size／颜色／笔记／图、自定义类别、按行搭配、天气日历、邀请view/edit、归档／克隆／购入／洗涤。NestJS+Fastify、MikroORM、Handlebars/HTMX、Tailwind、Workbox，单容器SQLite／本地文件，也支持Postgres／S3，可选JWT账户默认关。[package](https://github.com/Lazztech/Libre-Closet/blob/main/package.json)有Jest、Playwright、负载、lint、Lighthouse，未运行。

[抠图源码](https://github.com/Lazztech/Libre-Closet/blob/main/public/js/background-removal.js)为worker中IMG.LY ONNX/WASM/WebGPU、同主机模型、方形padding、可改mask，失败回原上传／服务端，不是计费云生成。[service worker](https://github.com/Lazztech/Libre-Closet/blob/main/views/assets/src-sw.ts)NetworkFirst、SSE／file NetworkOnly、缓存模型；未见离线修改同步队列，只能称**加载过资产的缓存离线访问**，非验证过离线优先编辑。

### 尺码、截图、评论

[garment service](https://github.com/Lazztech/Libre-Closet/blob/main/src/wardrobe/garment.service.ts)规范字母码供查找，[entity](https://github.com/Lazztech/Libre-Closet/blob/main/src/dal/entity/garment.entity.ts)为库存，不是身体passport。[日历](screenshots/libre-calendar.webp)有Worn按钮，[移动builder](screenshots/libre-builder.webp)是类别行左右选择、排序删除，非自由画布。[原截图](https://github.com/Lazztech/Libre-Closet/tree/main/public/assets/screenshots)。独立3＋3评论不足，未交互。

### 隐私／导出／商用

本地或自选S3，依赖与模型另审；自助可携导出未核实。AGPL**允许商用，并非不能复制**，但覆盖的软件修改／网络服务等可能有相应源码义务，组合作品边界需具体审查。私有FitPassport宜独立实现交互思想或另获许可，不随手复制代码。不是法律结论。

## 4. zebangeth/ai-closet

### 定位、平台、价格与状态

[README](https://github.com/zebangeth/ai-closet) Expo／React Native／TypeScript移动原型；[MIT](https://github.com/zebangeth/ai-closet/blob/main/LICENSE)已读，293 stars，main `bff94bb050add8d579dbe76bd0259b8fb50b23ca`／2025-11-10，无GitHub release。源码免费，云AI付费；旧估算抠图$0.002、分类$0.002、试穿$0.10是项目历史估算，不是现价。

### 功能／实现与尺码

Context、AsyncStorage元数据、expo-file-system照片；相机／相册、类别颜色季节场合、自由拖动canvas与衣物关联、近似试穿／历史。**云后端、导出社交、批量／日历／统计属roadmap**，不是架构图画出来就实现。

[BackgroundRemoval](https://github.com/zebangeth/ai-closet/blob/main/src/services/BackgroundRemoval.ts)base64去fal.ai BiRefNet、200ms轮询未核总超时；[Categorization](https://github.com/zebangeth/ai-closet/blob/main/src/services/ClothingCategorization.ts)图送gpt-4o结构化分类；[VTON](https://github.com/zebangeth/ai-closet/blob/main/src/services/VirtualTryOn.ts)客户端以`EXPO_PUBLIC_KWAI_SECRET_KEY`签JWT，送人＋衣图到Kling，有界轮询并下载。只验证源码含变量名，**未读取／输出凭据**。没有验证尺码／舒适推断。

### 截图、评论、隐私与借鉴

[画布](screenshots/ai-closet-canvas.png)可见选择框／删除、Add Items/Save、底部衣橱／搭配／试穿；[原图目录](https://github.com/zebangeth/ai-closet/tree/main/release_assets)。3＋3不足，论坛鼓励不是持续使用评测。**公开客户端provider key模式不能进生产**；README将代理／限流／credits列将来工作。照片本地存不等于AI本地；脚本无test/lint、检查树未见测试。可借canvas，不能作为已安全生产底座。

## 5. 更多参考：逐项目决策卡

以下都未运行。每项独立评论均不足三个重复好评／三个抱怨；没有截图的项目明确写缺，不拿工程判断填口碑。

### Agio Fit：数据契约而非衣橱App

[repo](https://github.com/agiofit/agiofit)，1 star，main `3516aee27d6135a5dfd5b5ee8a83578a1f2cd117`，Oct23；v0.1个人草案，不是行业标准。免费Python reference／浏览器指南；[许可分层](https://github.com/agiofit/agiofit/blob/main/LICENSING.md)：实现Apache-2.0，spec/schema/examples CC BY4.0。[schema](https://github.com/agiofit/agiofit/blob/main/schemas/fit-profile.schema.json)区分人／garment／match，单位、日期、来源，身体可选、容差confidence、可轮换假名，kept/returned及容忍缺点。[matcher](https://github.com/agiofit/agiofit/blob/main/reference/agiofit/match.py)规则ease/stretch/tolerance，信任权重、年漂移、0.40冷启动上限是选定启发式，不是概率；loader成功不等于schema有效。低披露serializer删数值ease，避免衣宽减ease反推身体，拒未知级别。[tests](https://github.com/agiofit/agiofit/blob/main/reference/tests/test_match.py)有单位／版本／缺数据／隐私，未运行。无照片／捕获／库存／身份vault，未见采用或准确率验证；无截图保留。可做版本化导出adapter试验，不绑定生产schema。

### SRG-Cy/StyleCast：可读规则

[repo](https://github.com/SRG-Cy/StyleCast)，MIT，0star、Oct19 push，Oct14–18 hackathon；静态PWA／IndexedDB图片／Transformers.js本地CLIP，可选浏览器Gemma聊天、Open-Meteo、Node/Render→SerpApi购物。免费demo，€2–3是商业设想非checkout；Gemma许可独立。作者仅两位Android朋友测试、Safari未测、手机约300MB模型、272图accuracy为自报。[rules](https://github.com/SRG-Cy/StyleCast/blob/main/js/outfit.js)天气保暖／防水／品类／场合／近期／洗涤规则，无需LLM；[store](https://github.com/SRG-Cy/StyleCast/blob/main/js/store.js)仅lastWorn非事件账本，图片缩512px JPEG，清理／驱逐风险，无可携备份验证。[tests](https://github.com/SRG-Cy/StyleCast/tree/main/tests)未跑。[今日图](screenshots/stylecast-today.png)天气、场合、示例插图、实际穿按钮；不是抠图证明。无物理尺码／抠图证据。

### tandpfun/wardrobe：分阶段图片导入

[repo](https://github.com/tandpfun/wardrobe)，MIT、2246 stars、July16，main `f44006cce7e4779e595a35b25fbbc8dabc68d7e4`。React/Vite/Sharp本地开发服务器，data存原图／jobs／JSON／生成图；Responses检测、Images重构、可选editorial，crop/garment/modeled审批／拒绝／重生，拖放粘贴和元数据。[middleware](https://github.com/tandpfun/wardrobe/blob/main/scripts/import-job-api.mjs)、[Vite配置](https://github.com/tandpfun/wardrobe/blob/main/vite.config.mjs)证明Node服务端调用，不用define暴露key；不能复述第三方“无服务器必泄key”。仍bind0.0.0.0，无已验证多用户安全；[package](https://github.com/tandpfun/wardrobe/blob/main/package.json)check仅build，无test/lint。照片去云，成本依生成／重试、未核价。文件夹拷贝非标准互换。[gallery](screenshots/wardrobe-gallery.png)奶油底抠图网格／类目／加号。无fit；重构可编造遮挡，保原图／标签。

### bek-sam/wardrobe_ai

[repo](https://github.com/bek-sam/wardrobe_ai)，MIT文件、0star、Aug18；Next／Supabase／Postgres／private storage／OpenAI／Open-Meteo，目标Vercel+Supabase，成本另计。README称RLS、持久任务／删除、审核提取、规则候选、精确自有单品、计划wear、MFA／测试，树有对应文件，**没有全面安全验证**。只细读[export](https://github.com/bek-sam/wardrobe_ai/blob/main/src/app/api/account/export/build-export.ts)：版本schema、RLS RPC、auth元数据白名单、排除token；只导路径／元数据，**无图片bytes，非完整备份**。无身体尺码引擎验证，无截图；文档有Wardrobe脉络，fork:false不代表原创。

### wardrobe-hq/wardrobe

[repo](https://github.com/wardrobe-hq/wardrobe)、[AGPL](https://github.com/wardrobe-hq/wardrobe/blob/main/LICENSE)，26star、Sept5；Nuxt/Vue/Tailwind、本地文件、Docker/rembg，标签类别、身体部位槽、组合预览、季节温度标签。README推荐“upcoming”与实现描述矛盾，未运行；明确无auth／安全保证，需反代或VPN，未见测试。源码免费托管另计，AGPL有义务；无已验证尺码／独立口碑，README showcase未视检，不存截图。

### kobo-labs-open-source/garment-measurements

[repo](https://github.com/kobo-labs-open-source/garment-measurements)，MIT已读，1star、Apr15。免费术语数据包，不是App；点位、地区基准／放码、半宽与厘米有助规范。普通regular-fit表不是品牌款式实测，标准引用不证明每表经验来源。无个人存储／AI／尺码引擎验证，不适用App截图，3＋3不足。

### 筛出／有限证据

- [Gurshaan-Deol/Hangar](https://github.com/Gurshaan-Deol/Hangar)：1star、June4，MIT仅metadata/README；Next/FastAPI/Postgres/Redis、OAuth、云／本地AI、天气／历史。未深审，笼统不出第三方与云provider冲突；无尺码、运行、截图或口碑验证。
- [akleventis/toop-closet](https://github.com/akleventis/toop-closet)：React/Netlify/S3、多图／公开衣橱、fits、旅行箱、后台job，README级；API license:null且未见授权，**不能批准复用代码**。公开对象不是私密存储，未测／未视检demo，无尺码证据，托管费用未核实。
- 未找到足够验证且许可清楚、可优先推荐的服装专用浏览器捕获扩展。GitHub搜索抓取被拒，直接repo／web可用；这是有界缺口，不证明不存在。名为OpenWardrobe不等于开源。

## 6. 优先借鉴与不应照搬

以下是本轮集合内的研究优先级，不是运行性能排名。FitPassport已具照片／文件夹／批量／composer，应复用而非重造。

| 优先 | 可借模式 | 最直接证据 | 对Fit Passport的边界 |
|---|---|---|---|
| 1 | wear事件账本、派生次数／近期 | Wardrowbe ItemHistory/WashHistory | 引用owned item ID，计划与实际分开，可选追加ComfortCheck。 |
| 2 | 来源／不确定性／选择披露 | Agio schema/matcher | 保留单位、方法、时间、容差；解释不可反向泄露身体值。 |
| 3 | 幂等持久上传、原图保留 | Wardrowbe item、tandpfun分阶段导入 | 现有批量应可重试；生成抠图是衍生资产，不是fit事实。 |
| 4 | LLM前的确定性适用规则 | Wardrowbe scorer、StyleCast纯规则 | 小而可检查的天气／场合／可用性规则；计穿次和排脏衣无需模型。 |
| 5 | 人工mask修正、本地处理 | Libre客户端抠图源码 | 降低录入修正和外发负担；仍审AGPL、依赖和模型条款。 |
| 6 | 真正可恢复导出而非仅元数据 | bek-sam导出是部分示例 | 版本manifest＋原始／衍生图＋outcomes，需restore/re-import测试。 |
| 7 | 带预报日历 | Libre/Wardrowbe文档 | 未来计划不是穿着证据；事件语义未定前不重建宽泛planner。 |

**保存、生成、计划不等于穿过，更不等于合身已证实。**

不照搬庞大stack、客户端密钥、把自托管等同零外发、通用码转换当实测、生成图当真值、模糊公网URL当隐私、AGPL等于禁商用、无许可公开代码当可用。源码URL多为main；实施前固定以上SHA，并核依赖／模型／图像权利。完整恢复、离线、质量、成本、测试通过、安全仍未验证。上游截图版权与被摄人物／品牌／商品图权利不同，见[manifest](screenshots/manifest.json)。

元数据核查采用GitHub仓库API、`/commits?per_page=1`、`/releases?per_page=2`以及递归树／当前文件；不是只读stars。主要项目和重点补充项目实际许可已读，Hangar仅metadata/README、toop未获授权。PWA不保证完整离线，自托管不保证无外发；移动兼容、恢复、模型质量／费用、测试通过、生产安全和传递依赖权利仍未验证。六张上游截图是静态参考，不是交互QA；本研究不构成安装、采购、托管或迁移决定。
