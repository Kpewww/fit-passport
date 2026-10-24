# 功能对照矩阵（2026-10-24）

功能为行，产品为列；每组最后均为Fit Passport。完整横向表见[CSV](feature-matrix-2026-10-24.csv)。M＝厂商自述，S＝源码静态检查，V＝发布图观察，P＝政策，R＝评论，D＝录制demo，H＝历史。全部未亲自运行；未证实不是没有。品牌可提供功能不保证每地区/套餐开放。VTON只指外观，不等于尺码准确。

Fit Passport B1–B6证据见[基线](fit-passport-baseline-2026-10-24.md)：B1 README/较新session与公开路由；B2 schema/Pilot及未见项边界；B3 outfits源码；B4 bodyEstimate/size-calibration/评测；B5 tryonImage；B6较新3D记录。固定提交`aa74c46a93034cfdf24c171d591963a002c9d765`。有=实现/记录存在而非线上验收；没有=所查范围未见；部分=表内限定。

## 1. 国内衣橱

| 功能 | [穿啥](chinese-wardrobe-apps-2026-10-24.md) | [Outfity](chinese-wardrobe-apps-2026-10-24.md) | [WearWow（可购未证）](chinese-wardrobe-apps-2026-10-24.md) | [搭搭](chinese-wardrobe-apps-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | M | M | M 历史 | M | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | M 淘/小红书/得物 | M 购买链接字段；自动导入未证实 | M 收据/网页历史 | M 电商 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | M 整套拆件 | M | M 拆件 | M | 有：B1 批量 |
| 自动抠图 | M | M | M | M | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | M 遮挡修复；原图恢复未证实 | M 可改标签；原图恢复未证实 | M 标签；原图未证实 | M 批量编辑 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | M | M | M | M | 有：B1 |
| 手工/规则搭配 | M 推荐/摇一摇 | M | M | M | 有：B3 composer |
| 搭配计划/日历 | M | M | M | M 多套日记 | 没有：B2 wear日历未见 |
| 实际穿着记录 | M 日历；计数规则未证实 | M diary | M 真/AI图日历；计数未证 | M | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | M 公式未证实 | M 历史/样机 | M | 没有：B2 价格/次数模型未见 |
| 天气场景 | M | M WeatherKit | M | M | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | M 历史 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | M 购物喜恶；状态分离未证实 | 未证实 | 未证实 | M wishlist/正常/闲置/丢弃 | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | M 可选尺码/身型 | M 衣物size字段 | P 身高/size/体型 | M 身材/码档 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | 未证实 | 未证实 | 未证实 | M 最宜穿单品参数；算法未证 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | M 图/视频 | M | M | 未证实 | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | M | M 模特照 | M | 未证实 | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | P 邮件副本 | P 泛称分享导出；全量未证实 | P 邮件权利 | R 终身会员备份；格式未证 | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | P 本地可选发现+确认上传；云AI | P 云图/AI/国际处理 | P 云图/EXIF/广告/跨境 | P 云AI/广告；身体TTL不明 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | M iOS系 | M iPhone | 主商店404；评论可读 | M iOS系 | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | CN IAP与宣传冲突；详档 | CN ¥12/月 ¥88/年+点 | 历史BE €3.99周等；非现价 | CN 多VIP/SVIP/终身SKU | 部分：B1 gated集成；商用价未核 |

## 2. 全球衣橱

| 功能 | [Acloset](global-wardrobe-apps-2026-10-24.md) | [Stylebook](global-wardrobe-apps-2026-10-24.md) | [Whering](global-wardrobe-apps-2026-10-24.md) | [Indyx](global-wardrobe-apps-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | M | M | M | M | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | M 历史/邮件 | M web clipping | M 网页/数据库 | M 收据/URL | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | M Chrome | M 跨app拖放 | M 扩展 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | M 连拍/Detector | M v10 | M 每批10 | 未证实 | 有：B1 批量 |
| 自动抠图 | M | M v10 | M | M | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | M 标签/Beautify | M Clean Up/多图 | M canvas；原图恢复未证 | M 增强/多视图 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | M | M | M | M | 有：B1 |
| 手工/规则搭配 | M | M canvas/shuffle | M Dress Me/Canvas | M boards/真人stylist | 有：B3 composer |
| 搭配计划/日历 | M | M | M | M | 没有：B2 wear日历未见 |
| 实际穿着记录 | M | M | M selfie关联 | M selfie/calendar | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | M | M | M | M 排序免费 | 没有：B2 价格/次数模型未见 |
| 天气场景 | M | 未证实 | M Planner | 未证实 | 没有：B2 未见集成 |
| 旅行/装箱 | M | M | M | M | 没有：B2 未见 |
| 待购与已拥有区分 | M | M laundry/lent/wishlist | M | M | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | P sizing；Fit Analysis非选码 | M 手工Size Tracker | M size metadata | M 人工size | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | 未证实 | M size/品牌例外；实测预测未证 | 未证实 | M resale人工measurements | 有：B4 图表/known-good |
| 具体商品尺码推荐 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | M Basic/Pro | 未证实 | M 每次1credit | M virtual selfies非fit | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | M | 未证实 | M 全身照复用 | M 人物预览 | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | 未证实 | M iCloud/分享打印；通用归档未证 | M 无自助导出；P权利另有 | M 客服收费CSV；非原图包 | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | P Gmail禁训练不能外推全图 | P 本机+iCloud；非全部AI离线 | P 训练可退出；VTO照另同意 | P 邮件解析；身体照TTL不明 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | M iOS/Android/Chrome | M iPhone/iPad；无桌面 | M iOS/Android/桌面查看/扩展 | M iOS/Android | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | US 免费100件+订阅+Beans | US $4.99买断 | US 免费核心+credits/单项 | US $12.99月/$74.99年；真人另费 | 部分：B1 gated集成；商用价未核 |

## 3. Mira各身份

| 功能 | [Mira Arium/trymira](mira-2026-10-24.md) | [Mira历史选码扩展](mira-2026-10-24.md) | [Mira Epsota/YourMira](mira-2026-10-24.md) | [Mira Parsa原型](mira-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | M PDP | H M PDP | M 零售PDP集成 | 未证实 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | M Chrome侧栏 | H M Chrome/Edge分ID | 未证实 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 批量 |
| 自动抠图 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | M wardrobe | 未证实 | 未证实 | 未证实 | 有：B1 |
| 手工/规则搭配 | M 叠穿/保存look | 未证实 | 未证实 | 未证实 | 有：B3 composer |
| 搭配计划/日历 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 wear日历未见 |
| 实际穿着记录 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 价格/次数模型未见 |
| 天气场景 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | M universal cart | H M 跨店收藏/价格 | 未证实 | 未证实 | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | M 照片+measurements | H M avatar/measurements | 未证实 | D 照片/扫描身体宣称 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | 未证实 | 未证实 | 未证实 | D 面料/尺寸宣称 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | 未证实 | H M Edge身体对商家表 | M 建议/fit notes；机制未证 | D S/M/L比较 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | M | H M | M 图/可选动画 | 未证实 | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | M | H M | M 用户照片预览 | D 中性3D人台 | 有：B6 身体模型 |
| 三维/物理合身可视 | M 3D/drape宣传；物理未证 | H M 3D宣称 | 未证实 | D 紧松/姿态原型；未校准 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | P Gemini/Kling云处理 | 历史具体合同未证 | P 云/未具名provider；TTL模糊 | 产品政策未证 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | Chrome 当前ID见专档 | H 镜像移除；身份关联有限 | M Shopify/Woo/custom | 开发中录屏；非上线证明 | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | 未证实；有paywall事件 | 历史免费avatar；现价未证 | US$29.99/月+$0.25次 | 未证实 | 部分：B1 gated集成；商用价未核 |

## 4. 企业尺码

| 功能 | [True Fit](enterprise-sizing-2026-10-24.md) | [Fit Analytics](enterprise-sizing-2026-10-24.md) | [Bold Metrics](enterprise-sizing-2026-10-24.md) | [3DLOOK（分SKU）](enterprise-sizing-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 批量 |
| 自动抠图 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 |
| 手工/规则搭配 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B3 composer |
| 搭配计划/日历 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 wear日历未见 |
| 实际穿着记录 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 价格/次数模型未见 |
| 天气场景 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | M profile/偏好 | M 问答/参考品牌 | M 问答预测50+ | M MT两照80+估测 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | M catalog/chart | M production charts | M product/tech pack | H YourFit商品数据 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | M | M Finder/Cues | M Sizer/SSC | H YourFit；MT非单独选码 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | M confidence signal未校准 | 未证实 | M outlier/no-good-match；score非概率 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | M 购买退货 | M 购买退货 | M Insights交易退货 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | M 新原生预览 | 未证实 | 未证实 | H YourFit | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | 未证实 | 未证实 | 未证实 | M MT 3D | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | M digital twin；非物理仿真证据 | M 身体；H drape未来项 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | 未证实 | 未证实 | 未证实 | M MT CSV/3D | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | P 图/身体/交易共享；TTL不定 | P EU GCP/30日raw/匿名2年 | P 身体产品TTL/DPA待询 | P sizing删图≠删测量；FAQ有歧义 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | M B2B JS/Shopify/API/Agent；iOS | M widget/web/native/API/Agent | M web/Shopify/API/ASP | MT活跃；YourFit重定向；FitXpress健康 | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | US$1000/月≤150k年单 | 报价未公开 | 报价未公开 | MT $499/100scans月起 | 部分：B1 gated集成；商用价未核 |

## 5. Google与历史Doppl

| 功能 | [Google Shopping](google-virtual-tryon-doppl-2026-10-24.md) | [Google Chrome原生](google-virtual-tryon-doppl-2026-10-24.md) | [Doppl（历史停用）](google-virtual-tryon-doppl-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|
| 照片入库 | 未证实 | 未证实 | H M 灵感图非库存 | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | M 搜索/商品入口 | M 零售PDP | 未证实 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | 未证实 | M 原生入口；非扩展 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | 未证实 | 未证实 | 未证实 | 有：B1 批量 |
| 自动抠图 | 未证实 | 未证实 | 未证实 | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | 未证实 | 未证实 | 未证实 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | 未证实 | 未证实 | 未证实 | 有：B1 |
| 手工/规则搭配 | 未证实 | 未证实 | H M 发现/风格 | 有：B3 composer |
| 搭配计划/日历 | 未证实 | 未证实 | 未证实 | 没有：B2 wear日历未见 |
| 实际穿着记录 | 未证实 | 未证实 | 未证实 | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | 未证实 | 未证实 | 没有：B2 价格/次数模型未见 |
| 天气场景 | 未证实 | 未证实 | 未证实 | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | M save；owned分离未证 | 未证实 | H M collections | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | M 常穿码/照片 | 未证实 | 未证实 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | 未证实 | 未证实 | 未证实 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | 未证实 | 未证实 | 未证实 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | 未证实 | 未证实 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | M 自照/预设两模式 | M 原图切换/重生 | H M 图/动画 | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | M 自拍全身像 | M 账户照片复用 | H M | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | 未证实 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | 未证实 | 未证实 | 未证实 | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | P 复用可删/不训练照片 | P 不给其它站/不用于广告 | H 改进训练可退出；删副本有例外 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | M 成人登录/指定地区 | 文档存在；rollout未亲验 | H 2026-04-30停用 | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | 未见单独收费；无限未证 | 未注明 | H 免费/额度未明 | 部分：B1 gated集成；商用价未核 |

## 6. 核心开源/模型

| 功能 | [Libre Closet](open-source-wardrobes-2026-10-24.md) | [ai-closet zebangeth](open-source-wardrobes-2026-10-24.md) | [Wardrowbe Anyesh](open-source-wardrobes-2026-10-24.md) | [Leffa](virtual-tryon-and-cutout-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | M/S | S | S | 未证实 | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | 未证实 | 未证实 | S 幂等队列 | 未证实 | 有：B1 批量 |
| 自动抠图 | S 本地IMG.LY | S fal BiRefNet | S rembg/HTTP | 未证实 | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | S mask修正/失败原图 | M 标签 | S 标签/原图衍生 | 未证实 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | M/S | S | S | 未证实 | 有：B1 |
| 手工/规则搭配 | M/S 类别行 | S canvas | S 规则+AI | 未证实 | 有：B3 composer |
| 搭配计划/日历 | M | 未证实 | M/S | 未证实 | 没有：B2 wear日历未见 |
| 实际穿着记录 | V Worn/文档 | 未证实 | S ItemHistory/WashHistory | 未证实 | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | 未证实 | M 分析/S价字段；公式未证 | 未证实 | 没有：B2 价格/次数模型未见 |
| 天气场景 | M | 未证实 | S | 未证实 | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | S 库存size非身体 | 未证实 | 未证实 | 未证实 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | 未证实 | 未证实 | S wear偏好；物理fit未证 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | 未证实 | S Kling调用 | 未证实 | S 图像试穿代码 | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | 未证实 | 未证实 | 未证实 | S 人物图/姿态转移非3D | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | 运维备份；用户互换未证 | 未证实 | M pg_dump+image卷 | 未证实 | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | S 本地/S3；可选auth | S 本地存+云AI；客户端key风险 | S provider可本地/云 | 自托管可能；demo TTL未证 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | Web/PWA缓存；离线编辑未证 | Expo移动原型；未运行 | Next/FastAPI自托管 | Python/GPU/Gradio研究 | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | AGPL源码+自托管 | MIT源码+AI费用 | MIT+infra/models | MIT核心；数据/预处理清关未完 | 部分：B1 gated集成；商用价未核 |

## 7. 补充开源

| 功能 | [Agio Fit](open-source-wardrobes-2026-10-24.md) | [StyleCast](open-source-wardrobes-2026-10-24.md) | [tandpfun Wardrobe](open-source-wardrobes-2026-10-24.md) | [bek-sam Wardrobe AI](open-source-wardrobes-2026-10-24.md) | Fit Passport现状 |
|---|---|---|---|---|---|
| 照片入库 | 未证实 | S IndexedDB | S | M 树存在未深验 | 有：B1 照片/相机/裁剪 |
| 商品URL/网页导入 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B1 URL与提取 |
| 浏览器/手机分享入口 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B1 桌面扩展；原生分享未有 |
| 批量/整套录入 | 未证实 | 未证实 | S 多件pipeline | M | 有：B1 批量 |
| 自动抠图 | 未证实 | 未证实 | S 生成重构非事实原图 | 未证实 | 没有：B2 所查路径未见 |
| 识别/图像修正与原图 | 未证实 | S 标签；图片缩小 | S approve/reject/regenerate | 未证实 | 部分：B1 编辑/撤销；无mask修正 |
| 持久衣橱/库存 | 未证实 | S | S gallery | M | 有：B1 |
| 手工/规则搭配 | 未证实 | S deterministic | M modeled图非完整composer验证 | M | 有：B3 composer |
| 搭配计划/日历 | 未证实 | 未证实 | 未证实 | M | 没有：B2 wear日历未见 |
| 实际穿着记录 | 未证实 | S 仅lastWorn非完整ledger | 未证实 | M | 没有：B2 非ComfortCheck |
| 穿着次数/CPW | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 价格/次数模型未见 |
| 天气场景 | 未证实 | S Open-Meteo | 未证实 | M | 没有：B2 未见集成 |
| 旅行/装箱 | 未证实 | 未证实 | 未证实 | 未证实 | 没有：B2 未见 |
| 待购与已拥有区分 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B2 SavedItem独立 |
| 身体/尺寸档案 | S 来源/单位/日期/容差 | 未证实 | 未证实 | 未证实 | 有：B4 profile/规则估计 |
| 衣物尺寸/tech pack | S cut/ease/stretch | 未证实 | 未证实 | 未证实 | 有：B4 图表/known-good |
| 具体商品尺码推荐 | S heuristic matcher | 未证实 | 未证实 | 未证实 | 有：B4 透明规则；非线上验收 |
| 置信/未知/拒答 | S 缺数据/启发confidence | 未证实 | 未证实 | 未证实 | 有：B4 来源/估计上限/拒答 |
| 保留/退货/合身反馈 | S kept/returned/despite | 未证实 | 未证实 | 未证实 | 有：B2 Outcome/ComfortCheck |
| 本人+商品视觉VTON | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B5 仅文字通用生图 |
| 人物avatar/替身 | 未证实 | 未证实 | 未证实 | 未证实 | 有：B6 身体模型 |
| 三维/物理合身可视 | 未证实 | 未证实 | 未证实 | 未证实 | 部分：B6 区域解释非布料物理 |
| 导出/可携 | S JSON选择披露 | 未证实 | 未证实 | S JSON元数据无图片bytes | 部分：B1 策略控制元数据导出；无完整图片／关系包 |
| 照片/身体处理边界 | S 低披露防反推；无vault | S 本地模型+weather/search外发 | S 本地server+OpenAI | M RLS/private未审计 | 部分：B1 改密码／软停用保留数据；删除未验 |
| 平台/状态 | v0.1 schema/Python草案 | 静态PWA早期 | React/Vite本地开发服务 | Next/Supabase | 有：B1 Web/扩展；native未有 |
| 价格/商用门槛 | Apache实现/CC BY spec | MIT；Gemma/API另审 | MIT+API | MIT+云/模型 | 部分：B1 gated集成；商用价未核 |

