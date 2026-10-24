# 初步研究更正账本

日期2026-10-24；旧扫描原文保留并在顶部标历史。本文解释哪些结论被更窄证据取代，不把未验证写成反面事实。

| 旧说法／易混点 | 当前更正 | 证据位置 |
|---|---|---|
| 穿啥不做尺码 | 未见量化选码证据；有可选size/身型，不作绝对否定 | [国内](chinese-wardrobe-apps-2026-10-24.md) |
| 多个Mira混为同一竞品 | trymira/Arium、历史Chrome、Edge YourMira关联、Epsota widget、Parsa原型分别辨认；历史Chrome→YourMira仅可能 | [身份图](mira-2026-10-24.md) |
| 本地运行意味着照片不离设备 | trymira政策明确Gemini/Kling云处理，权限镜像仅历史版本 | [Mira隐私](mira-2026-10-24.md) |
| 只有下架Mira尝试选码／我们插件引擎评测是别人没有的 | True Fit/Fit Analytics/Bold/历史YourFit等直接竞争；Google原生入口削弱扩展独占 | [企业](enterprise-sizing-2026-10-24.md)、[Google](google-virtual-tryon-doppl-2026-10-24.md) |
| Acloset/Whering/Indyx只有平铺，Stylebook无sync/尺寸 | 前三者有当前VTO说明，Stylebook有iCloud与手工Size Tracker；都不自动证明自动量化fit | [全球](global-wardrobe-apps-2026-10-24.md) |
| 搭搭只是标签size | 新日志有最宜穿单品参数表，算法仍未公开证实 | [国内](chinese-wardrobe-apps-2026-10-24.md) |
| WearWow当前可购买／404等于全球下架 | 主商店404，评论可读、历史BE缓存有价；地区与端点分开 | [国内](chinese-wardrobe-apps-2026-10-24.md) |
| Doppl仍是新App机会 | 官方索引确认2026-04-30停用；直链现重定向，历史参考 | [Google](google-virtual-tryon-doppl-2026-10-24.md) |
| AGPL不能复制／非商业 | 可商用但义务依覆盖/修改/集成/网络部署判断；不开笼统法律绿灯 | [开源](open-source-wardrobes-2026-10-24.md) |
| Leffa唯一可商用候选；顶层MIT即完整可用 | 代码/权重/底模/预处理/数据逐层核查；FASHN parser、OmniTry底模等各有限制 | [模型与抠图](virtual-tryon-and-cutout-2026-10-24.md) |
| Open-Meteo开放就可免费商业调用 | 数据CC BY与免费托管非商业条款分开；商业走合适计划 | [天气](weather-commercial-licenses-2026-10-24.md) |
| FitPassport尚无图库/批量/3D/买后反馈 | 固定提交已有，新增建议应定位改进或缺失事件流程 | [基线](fit-passport-baseline-2026-10-24.md) |
| truth0/11、capture仅本地、测试通过即全正确 | 当前11truth/9旧capture；图表合成评测，真实穿着未建；扩展UI仍工具阻塞 | [基线验证](fit-passport-baseline-2026-10-24.md) |
| 只有我们知道现在合身；生成图永远不能显示紧松 | 自报fit有时间和不确定性；外观图不是已经验证的测量证据，避免绝对化 | [总结](summary-2026-10-24.md) |
| 页面无年份日期按2026 | 保留原显示日期，核查日另列；不同评论不因版本顺序补年份 | [方法](methods-and-sources-2026-10-24.md) |
| 每款必须凑3好评3抱怨 | 证据不足明写；n=1孤例、n=2弱重复、n≥3较强且仍非代表统计 | [方法](methods-and-sources-2026-10-24.md) |
| FitCue图示runs small；Bold Kids图是UI | 本地目视：图为runs large；Kids是家庭宣传照，Kids UI仍缺 | [企业](enterprise-sizing-2026-10-24.md) |

价格冲突及历史版本不覆盖现行报价；所有采购、准确率、隐私后端执行仍待针对性验证。此次仅更正文档，没有更改应用。

- 导出／账号控制：补查固定提交路由后明确为策略控制的有限元数据 JSON、改密码与保留数据的软停用；不能写成全量可迁移备份或已实现硬删除。详见[基线补查](fit-passport-baseline-2026-10-24.md#10-导出与账号控制的精确源码边界)。
