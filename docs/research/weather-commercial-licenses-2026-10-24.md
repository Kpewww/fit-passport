# 天气数据商业许可与集成边界

核查2026-10-24 UTC；公开采购／架构比较，非法律意见或实测预报排名。没有购买key、调用带用户位置的API。初版只需用户选城市／时区、小时温度／体感、降雨概率／量和风；“穿衣指数”不是个人冷热或衣物合身证据。

| 提供方 | 商用／费用 | 署名、缓存、再分发 | 覆盖与判断 |
|---|---|---|---|
| Open-Meteo | 免费托管endpoint限非商业；商业订阅用客户endpoint/key，Standard每月1M、Professional5M calls；当页未提取可靠货币价格，不引用旧价。 | 数据CC BY4.0允许商业改编／再分发，须署名、许可、变更说明；服务端代码AGPLv3是另一层。未确定缓存上限，不能以开放数据绕免费API条款。 | 全球模型、欧美服务器、含CMA；未测中国延迟／误差。商业计划可作全球候选。 |
| 和风QWeather | Standard按量，天气/basic每月首50k免费，之后950k每次¥0.0007；**计算**1M基本请求约¥665/月，其他组／tier不同。 | 可商用组合／衍生和天气缓存，禁止裸数据转售／再授权或竞争API；**GeoAPI不含缓存／索引／改编权**。显示名称＋链接，预警／AQI原样refer.sources。 | 中国含港澳台和200+国家地区；中国分钟降雨、全球小时日预报、穿衣指数；称10中心，未实测。中国候选，别把受限geo/weather混入passport导出。 |
| WeatherAPI.com | API Free可商用100k/月、3日；Starter $7/月3M／7日；Pro+ $25/5M，Business $65/10M，观察月价。 | 每key／订阅一个app/service，不转售天气。API条款强制免费署名，价格FAQ柔和措辞不覆盖。current缓存60min、forecast24h、history不限但不超过订阅期；需对终端用户说明天气不确定性。 | 声称全球、current10–15min／forecast4–6h；历史为归档预报非观测。低成本商业原型候选，未测中国。 |
| MET Norway | 公开API、无付费SLA；全app超过20req/s需协议。 | CC BY4.0／NLOD2.0；可识别User-Agent／contact、遵守Expires/Last-Modified、条件请求、缓存、坐标≤4小数；图标MIT另层。 | 全球位置预测、地区来源不同、无保证。可作开放替代／fallback，非付费可靠性代替。 |
| OpenWeather | 当前One Call首1000次/日免费，额外$0.0015/次；页面并列v4/v3；Startup$40／Developer$180／Professional$470／Expert$1200每月，endpoint权限不同。 | Free–Professional需署名；旧官方解释CC BY-SA/ODbL衍生限制与新价格／普通app说明不一致，**适用许可、缓存、再分发待书面确认**。 | 全球key API；不能因熟悉就假定闭源产品／数据集权利清晰。 |

## 一手来源与重要区别

- Open-Meteo：[价格](https://open-meteo.com/en/pricing)、[条款](https://open-meteo.com/en/terms)、[repo许可／数据说明](https://github.com/open-meteo/open-meteo)。订阅、广告支持应用及商业产品属商业；数据许可不授免费托管商业访问。天气旁署名，不能只埋法律页。
- QWeather：[价格](https://dev.qweather.com/docs/finance/pricing/)、[实际EULA](https://staticpages.qweather.com/legal/developers-eula.html?head=0)、[署名](https://dev.qweather.com/docs/terms/attribution/)、[限制](https://dev.qweather.com/docs/terms/restriction/)、[缓存](https://dev.qweather.com/docs/best-practices/cache/)、[覆盖](https://dev.qweather.com/docs/features/service-and-data/)、[部署](https://dev.qweather.com/docs/features/global-deployment/)。EULA2.1.2–2.2区分天气与GeoAPI，2.4.3–2.4.6限制裸分发／竞争；建议缓存当前10–30min、小时30–60min、日1–6h不是GeoAPI存储许可。两文档更新频率有差异，以endpoint时间戳与合同为准。
- WeatherAPI：[价格](https://www.weatherapi.com/pricing)、[API条款](https://www.weatherapi.com/terms)。网页内容的商业限制与API服务条款不同，不把前者误套成API不得商用；key保密、署名、缓存按API段。
- MET：[服务条款](https://api.met.no/doc/TermsOfService)、[许可](https://api.met.no/doc/License)，使用缓存headers、错峰刷新，后端缓存降低终端IP／位置外传。
- OpenWeather：[FAQ](https://openweathermap.org/faq)、[官方2025许可解释](https://openweathermap.org/storage/app/media/documents/License_explainer_25_Feb_25.pdf)、[现价](https://openweathermap.org/price)。价格核实不等于解决许可冲突；再分发数据／衍生输出前需明确适用条款。

## 推荐架构（未实施）

provider adapter保存source/version/fetchedAt/validUntil/timezone/attribution；服务器保管key、按粗位置＋预报窗口缓存，不按身体profile请求。不送尺寸或照片。城市手选优先，可选获同意坐标；显示过期／不可用，允许手填室内／天气情境。把原始受许可天气数据与永久wear／舒适历史分开，不自动导出专有天气／GeoAPI作为用户拥有数据。选目标中国／海外城市测可达、字段、预测误差，再选供应商；任何提供方都不能直接证明个人保暖舒适。
