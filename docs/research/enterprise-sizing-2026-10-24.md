# 企业尺码基础设施：True Fit、Fit Analytics、Bold Metrics、3DLOOK

核查2026-10-24 UTC。公开只读研究，无登录、安装、照片提交、支付或联系销售；**四家均未实际完成功能测试**。厂商自述、公开展示图、用户评论和研究判断分开。清单是可核实公开功能，不保证每套餐全部开放。结果图谱、统计身体估计、照片量体、物理衣物合身与视觉试穿不是同一能力。

## 1. True Fit

### 定位、平台、价格

B2B服装鞋fit intelligence，JS PDP、Shopify、API、新购物Agent/MCP；消费者有免费[iOS/iPad列表](https://apps.apple.com/us/app/true-fit/id6749843112)，未安装、不推Android。[Shopify](https://apps.shopify.com/truefit)Standard US$1,000/月、最多150k年订单，列Agentic/form推荐、按需报告／知识库／客服及Checkout／Loop Returns／Tapcart。企业、新VTON/MCP包含关系、超额／最低合同未核实。

### 功能（均厂商自述，非运行）

| 模块 | 公开范围与来源 |
|---|---|
| 推荐基础 | 单商品选码、熟悉品牌衣物、身体fit needs／松紧偏好；无profile通用偏大偏小，size bracketing分析。[机制](https://www.truefit.com/resources/robots) |
| 品类 | 男女／鞋／2T+童装、内衣泳装西装等；暂不支持孕装、定制生产、配饰。[coverage](https://help.truefit.com/category-coverage) |
| Agent | 尺码／伸展／面料／腰内长下摆对话，PDP/PLP/search/home分发与推荐码库存筛选。[Agent](https://www.truefit.com/conversation-fit-agent) |
| 技术／MCP | 单一推荐码、confidence signal、持久profile、品牌品类退货洞察；Agent上下文／解释、token scope／角色／撤销／审计。[spec](https://www.truefit.com/fit-intelligence-spec)，未调用。 |
| 视觉／报表 | 首页VTON为illustrative、时间压缩预览，非尺码推荐；Size Sampling／True360／Demographics／Fit Consistency／Top Closet Brands。当地配送为营销场景非已验证履约平台。[首页](https://www.truefit.com/) |

### 尺码机制、集成、可信度

厂商称目录／图表／描述映射跨品牌universal size，再由已穿品牌款式、偏好和购买／退货修正；身体上下文不是可直接裁衣实测。Shopify[数据需求](https://help.truefit.com/app-data-requirements)目录＋订单必需，退货可选但强建议，Product API和checkout pixel；不能把退货历史写成所有启动硬条件。[纠偏](https://help.truefit.com/adjusting-recommendations)商家可向支持提供style ID与方向，之后随数据更新。cold-start SKU、少数体型、材料和退货噪声待测，confidence未有公开校准曲线，不能当概率；通用提示不是个性化判断。

### 关键截图

[选码宣传](screenshots/truefit-shopify-size-ui.png)、[功能图](screenshots/truefit-shopify-features.png)、[输入机制图](screenshots/truefit-recommendation-inputs.png)，均[Shopify发布方](https://apps.shopify.com/truefit)图，不是研究账号结果。未保留本地首页浏览器截图；不声称运行VTON。

### 评论（商家，非真实穿着准确率）

[评论页](https://apps.shopify.com/truefit/reviews)4.5/23快照。三正面主题：接入方便（Mons Royale 2026-05-19、Montirex2024-04-18、YMI2023-11-30，n=3）；支持（上述及Stylest、Sachin&Babi，≥3）；基于已穿品牌／选码易懂（Mons Royale、YMI、Beverly Berg，n=3）。不少短期或“期待”退货下降，不是已测ROI。

负面：[1星](https://apps.shopify.com/truefit/reviews?ratings%5B%5D=1)／[2星](https://apps.shopify.com/truefit/reviews?ratings%5B%5D=2)：免费安装／收费预期（Born of Shadows2026-02-11、Athlonea2026-09-26，n=2弱重复，历史$499非现价）；卸载／支持不回（L’Equilibriste2025-04-09，n=1）；先邮箱／tracking再遇付费（Athlonea，n=1）。**不足3个强重复抱怨主题**。

### 隐私

[2026-10-19政策](https://www.truefit.com/privacy-policy-and-choices)：年龄／性别／尺码／品牌体型偏好，可选邮箱、VTON图，称不从图生成biometric；接商家购买，可能向商家／服务商／制造商分享profile和洞察，之后对方政策适用。必要性／法律留存、无照片统一天数，系统改进非全面禁训练；列Google/Meta/Pinterest/Glance AI分析广告，非完整生产名单。可请求删除但部分归档可能无法永久移除，跨境美国等。**服务非为未成年人特别16岁以下设计**，另谈监护人上传儿童图；2T+品类不代表儿童账号或验证过儿童保护。脸遮挡、独立VTON TTL、训练退出、全链路删除未证实。

### Fit Passport借鉴（判断）

已知合身→具体款解释，通用与个性化分层、退货纠偏；若无交易网络，坦白覆盖不足，用具体衣物测量与确认补齐，不能假装同等network effect。

## 2. Fit Analytics／Fit Finder

### 定位、平台、公司与价格

问答式服装／鞋选码＋AI Shopping Assistant，web/native API、widget／white-label、A2A/MCP/API。[集成](https://fitanalytics.com/how-to-integrate)。现官网联系销售，**无可靠公开价**；第三方€350与自身说未公开矛盾，不用，旧按购买付费也非现价。[2024-03-04官方稿](https://media.fitanalytics.com/website/Press_Release-Fit_Analytics_Sizing_Solution_Company_Fit_Analytics_Thrives_as_Independent_Entity_after_Decoupling_from_Snap_Inc.pdf)：2024-01重新独立为Fit Analytics Innovation GmbH，仍属Snap/ARES是旧资料。

### 功能与尺码（厂商自述）

[Fit Finder](https://fitanalytics.com/fit-finder)：无需消费者账户、49语言／多尺码制、个性化推荐和合资格商品Fit Cues。[技术](https://fitanalytics.com/our-technologies)：身体模型、生产尺码表、相似消费者／商品及品牌买退数据持续学习，数据库含扫描不等于每个购物者要扫描。输入可含gender/height/weight/age/bra/body shape/偏好/参考品牌，**不是每人必填全部**；输出主要尺码／fit，不是完整实测围度或CAD。公开置信分布、拒答／缺货字段未取得。

[Assistant](https://fitanalytics.com/ai-shopping-assistant)理解风格预算场景、比较／加购；[集成](https://fitanalytics.com/how-to-integrate)需feed、数据验证、对象实现／QA／培训／支持，未承诺固定天数。[首页](https://fitanalytics.com/)列Multiple Size Alert、4–6%转化／2–4%退货变化等厂商案例，实验口径不统一，不能横比或作保证。

### 截图

[保存Fit Cue](screenshots/fitanalytics-fitcue.png)实际文字为**runs large／建议小一码**，不是初稿图注的runs small；观察图仅证明该通用提示样式，不代表个性化结果。[官方产品页](https://fitanalytics.com/fit-finder)。无本轮功能流程截图。

### 口碑

[GetApp](https://www.getapp.de/software/2037723/fit-analytics)无用户评论；[ProvenExpert](https://www.provenexpert.com/fit-analytics-innovation-gmbh/)仅5个Google Maps评分，不能推导产品主题；[FeaturedCustomers](https://www.featuredcustomers.com/vendor/fit-analytics)为证言／案例，员工评论不替代商家。**独立3＋3不足**。转化、协作、信心是厂商选择的案例主题，不是独立好评；cold-start／问答负担是研究问题，不冒充投诉。

### 消费者隐私

[2024-07-12消费者PDF](https://media.fitanalytics.com/widget/documents/privacy_en.pdf)：商家controller、Fit Analytics processor，不收姓名邮箱地址，仍含身体、假名ID/IP、浏览／订单／退货。EU GCP多区域，essential raw30日、匿名和analytics两年及例外；改善模型是用途，不写“不训练”。委托商户返还可跨境，provider语境下读不售／不向其他第三方分享；完整动态名单未得。privacy@fitanalytics.com行权，拒非必要cookie可见widget不保证完整功能。无照片减少脸风险，身体不因此变非个人数据。

### 借鉴

最少问答／无登录渐进补充，标“该款保留反馈”还是“图表推断”；shopper专属隐私正文；商户私有数据与个人跨店profile授权分开。

## 3. Bold Metrics

### 定位、平台、价格

统计身体数字孪生与服装设计／选码基础设施：SSC、Virtual Sizer、Virtual Tailor、Apparel Insights、ASP，web／Shopify／custom API；[官网](https://boldmetrics.com/)，**报价制，未找到官方公开价**。调用限制按合同，公共文档不是免费API。

### 功能（厂商自述）

[SSC](https://boldmetrics.com/solutions/smart-size-chart)：4–6问估50+身体值、款式尺码和区域fit、可调松紧；Multi-SSC多商品分别选码、Kids2–19。[消费者说明](https://boldmetrics.com/for-shoppers)年龄身高体重、腰或bra，不需照片／量尺／账号；不是本人逐点实测，也不能将成人输入／准确率／同意路径外推Kids。[Virtual Tailor](https://boldmetrics.com/solutions/virtual-tailor)／[API](https://docs.boldmetrics.io/)提供白标问答及制造用预测；[Insights](https://boldmetrics.com/solutions/apparel-insights)客户孪生、尺码放码／体型覆盖／交易退货／库存；[ASP](https://boldmetrics.com/solutions/agentic-sizing-protocol)宣称Agent低token、区域解释／outlier/fallback、key隔离，未验证。

### 尺码接口、数值与集成

[Virtual Sizer](https://docs.boldmetrics.io/virtual-sizer)：height/weight/age＋男装waist或女装bra，brand/category/product/anon_id，按product选chart/tech pack；good_matches、fit_description、fit_score、outlier。**0为最佳的方向分数不是0–1概率**；负值snug正文与某例负值loose矛盾是文档歧义，不是已证明运行bug。设计body block与成衣对比不等于完整面料动态仿真。

[Common API](https://docs.boldmetrics.io/common-api-topics)：HTTPS、client_id/user_key，异常组合仍可预测、全局25req/s另受合同；GET身体参数／key需防URL日志泄漏，不放浏览器／LLM。outlier可能真罕见体型，不自动怪用户。[SSC集成](https://docs.boldmetrics.io/smart-size-chart)：Shopify自定义app product/order scope、script/div/object、商家加购接线；其它商城先feed，soft launch默认不公开。未使用override探未公开功能，“一行代码”不等于零映射QA。

### 截图

[SSC界面示意](screenshots/boldmetrics-ssc-ui.png)包含输入与L推荐／区域图，属厂商。[Kids资产](screenshots/boldmetrics-kids-ui.png)实际是**家庭照片宣传图，不是Kids UI截图**，因此Kids操作界面仍缺。源见manifest，没有功能测试。

### 评论

[Serchen](https://www.serchen.com/company/bold-metrics)／[SoftwareSuggest](https://www.softwaresuggest.com/bold-metrics)0评论，G2替代品列表／Indeed员工不适用。**独立3＋3不足**。无照片摩擦、退货／AOV、体型设计是厂商案例主题；SSC同页−17%与−18%fit returns、4x转化、+22%AOV不能当统一保证或跨供应商排名。

### 隐私

[公开政策](https://boldmetrics.com/privacy)以网站联系／cookies／广告／retention.com为主，未充分解释身体产品TTL、训练退出、子处理方、删除SLA；不卖PII措辞不是身体不存。[Sizer](https://docs.boldmetrics.io/virtual-sizer)anon_id不可姓名邮箱，但bm cookie关联浏览／购买，商家可join身份；无照片仍有敏感体型。DPA、跨客户训练、删除传播和退出数据归属未问销售，仍待合同核实。

### 借鉴

最小字段、低置信再问、按部位松紧、多商品不同码、no-good-match；标predicted/self-reported/measured＋时间误差。商品尺码体系不等于身份二分。

## 4. 3DLOOK：Mobile Tailor／历史YourFit／FitXpress

### 定位、当前状态与价格

`https://3dlook.ai/yourfit/`重定向[当前首页](https://3dlook.ai/)FitXpress健康／健身，不能把旧YourFit称当前完整在售。[Mobile Tailor](https://3dlook.ai/mobile-tailor/)仍有页面，定制／制服／按需／ready-to-wear远程量体。[价格](https://3dlook.ai/pricing/?mt=)：Basic **$499/月、100 scans/月**；Premium **$999/月、500 scans/月**；Enterprise500+ scans/月定制。Basic80+测量／CSV／3D view/export／widget，Premium定制／通知／短信邮件模板，Enterprise API/web/mobile SDK／专属支持；7日试用未注册。另FitXpress Starter **$1,000/月500 scans/月**，Pro **$1,500/月1000 scans/月**。扫描额度非无限客户，总实施费未核。

### 功能（M）与历史分层

Mobile Tailor前侧两照→80+身体值和3D、商家dashboard、链接／widget、自助语音／桌面放手机／朋友辅助、CSV／模型。FitXpress另为体重／BMI／成分／进展／姿势与宽松衣检测，不是医疗或衣物尺码验证。[2021-07-08 YourFit发布](https://www.prweb.com/releases/3dlook-launches-yourfit-the-first-and-only-integrated-solution-that-combines-virtual-try-on-with-size-and-fit-recommendations-879403683.html)历史合成试穿与尺寸匹配可分部署，动态面料更准仍列未来。[YourFit2.0转载](https://textilevaluechain.in/3dlook-bridges-the-gap-between-physical--digital-shopping-with-the-new-yourfit-20)页面2025但事件正文**2022-03-29**：体型偏好库存／bestseller推荐、分享，不能当2025新发布。

### 尺码与采集可靠性

手机正／侧、建议紧身衣、手机放置／语音／朋友，采集光照衣着姿势基准敏感。页面30秒与FAQ少于3分钟**计时口径未澄清**，不擅定一个推理一个全流程，也不承诺总30秒。身体值是估计，成衣还需款式尺寸／弹性／ease／偏好；80+测量不证明品牌L合身，CAD输入不自动是纸样。需要重复与分体型误差测试。

### 截图

[Mobile Tailor官方合成](screenshots/3dlook-mobiletailor-hero.webp)人物、拍照手机、表和avatar，原图[这里](https://3dlook.ai/wp-content/uploads/2024/11/mt-hero-desktop.webp)。不是本研究照片或实测结果；没有本地保存当前浏览器页面截图。

### 历史评论

[G2](https://www.g2.com/products/3dlook/reviews)4.5/12、主要2021–2023，多incentivized、SKU混杂。好评：易用视觉（Gabrielle/Murtadha/Piret，n=3）；自己身体预览（Ricardo/Zaroon/匿名，n=3）；avatar／设计测量（Roz/Piret/Gerome，n=3宽主题）。负面：费用／前置成本（Ricardo2022、匿名2021、francoise，n=3历史）；光照／兼容（Zaroon/Murtadha，n=2不同约束）；结果不完美／缺帽码（匿名/Gerome，n=2不同问题）；售后差n=1。**后两项不是强重复同一故障**。旧无试用不适用现7天试用，不归因2026单一SKU。

### 隐私

[政策](https://3dlook.ai/privacy-policy/)称fit/sizing图建模后即删，VTON另为试穿、demo可员工看，测量／联系方式可给商家；一般数据最多三年复核，某些情形再十年，**删图不是删测量**。privacy@3dlook.me／账户删除，列Google/Meta/AppsFlyer/LinkedIn/Hotjar分析非完整生产清单，改进用途不等于禁训练；排除16岁以下使用。FAQ说想删图需邮件与自动删除措辞不一致，脸模糊／测量TTL／训练退出／实际删除未测。[Concordia历史隐私报告](https://madiba.encs.concordia.ca/reports/OPC-2023/public/pdf/VR_OPC_Report.pdf)全文抓取超时，搜索线索涉及YourFit/LogRocket，**仅待核历史线索，不断言当前泄漏违规**。

### 借鉴

量体、商品合身、视觉图三类输出各自标用途；拍照可选、有非照替代、先讲生命周期；明确重拍原因、测量导出／删除与版本品类。

## 5. 跨产品采购与验证门槛

provenance包含值／单位／方法／日期／版本／误差；身体、平铺、ease不可混列。推荐说明来自图表／已知衣物／交易还是估计，证据缺允许拒答；score非概率，图片美观非ground truth。照片／测量／日志独立TTL，商家／模型删除范围要明确。比较转化必须同流量A/B、采纳、购买、fit-related退货与bracketing分开，厂商相关性不能横比。

未决：现版本和模块、品类SKU覆盖、最低／超额／实施费、feed、DPA／地区／处理商／训练、删除SLA／迁移、置信校准、罕见体型申诉、无障碍／失败率。没有合同清关或独立准确率结论。
