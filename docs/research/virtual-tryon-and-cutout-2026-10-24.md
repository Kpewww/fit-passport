# 虚拟试穿与衣物抠图：技术、许可及产品证据核查

核查日期：2026-10-24。本文件整理本轮研究提供的证据。**没有安装、运行或评测模型，没有购买／调用 API，没有上传用户照片。** 这是工程选型许可筛查，不是法律清关。下文“宽松许可”只描述已找到的授权，不保证训练数据来源、肖像／图片权利或不侵权。主分支链接会变动，生产采用前须固定版本并重新审计实际文件。

## 1. 建议与产品边界

1. **外观预览与合身预测分开。** 这些模型生成合理照片，不能据此证明衣物尺寸、尺码兼容、弹性、压力、舒适度或物理垂坠。所查推理接口没有同时结合校准身体测量、衣片结构与材料力学。不要把图片可信度转换成 Fit Passport 尺码／合身分数；输出标注“AI 风格预览，不保证尺码或合身”。
2. **先评估衣物抠图。** 官方 BiRefNet 的代码 MIT、官方权重卡标 MIT，可列入自托管评估，保留原图与人工修正。RMBG-2.0 不是免费商用替代：公开版本为非商业许可，商用需另签协议或使用商业 API。
3. **获准且有预算上限的商业 API 试验，是较短的试穿验证路径。** FASHN v1.6 可作为成本／延迟对照，Try-On Max 作为高分辨率对照；公共研究 demo 不是生产服务。本文没有采购或调用。
4. **FASHN VTON 1.5 核心有潜力，但原装完整管线有许可阻碍。** 人体解析依赖采用 NVIDIA 研究／评估限定许可，仅看 Apache 标识不足。静态代码显示平铺衣物、完全移除解析器的窄适配可能可行；尚未实现、测试或完成依赖审计。

## 2. 虚拟试穿模型对照

所有性能数字均为发布方陈述，除非另有标注；本轮没有复现。

| 模型 | 代码／权重／依赖 | 商用筛查 | 技术证据与边界 |
|---|---|---|---|
| FASHN VTON v1.5 | [核心 Apache-2.0](https://raw.githubusercontent.com/fashn-AI/fashn-vton-1.5/main/LICENSE)、[官方权重卡 Apache-2.0](https://huggingface.co/fashn-ai/fashn-vton-1.5)。独立像素空间模型，并非声明的 SD／FLUX 微调。解析器例外见下文。 | 核心授权宽松；**原装完整管线未获商用清关**。 | 权重卡称 972M MMDiT、576×864、约 8 GB VRAM、H100 约 5 秒；Ampere+ bf16、20/30/50 steps。人物＋衣物 RGB＋品类、DWPose；支持上装／下装／连体，平铺或穿着图。宽松换修身、长换短时可能体型漂移或残留旧衣。 |
| IDM-VTON | [代码 CC BY-NC-SA 4.0](https://raw.githubusercontent.com/yisol/IDM-VTON/main/LICENSE.txt)、[同许可权重](https://huggingface.co/yisol/IDM-VTON)。SDXL、IP-Adapter／图像编码器及预处理资产。 | **非商业授权**；免费 beta 不自动等于非商业。 | [README](https://raw.githubusercontent.com/yisol/IDM-VTON/main/README.md)：数据集推理需 mask、DensePose、衣物描述；demo 还需 parsing／OpenPose。双重条件旨在保留细节；本轮未建立生产内存／延迟保证。 |
| CatVTON | [代码 CC BY-NC-SA 4.0](https://raw.githubusercontent.com/Zheng-Chong/CatVTON/edited/LICENSE)、[同许可权重](https://huggingface.co/zhengchong/CatVTON)。原版 SD 系列不可与 CatVTON-FLUX 混同。 | **非商业**；无 mask 变体不改变授权。 | [README](https://raw.githubusercontent.com/Zheng-Chong/CatVTON/edited/README.md)：总参数 899.06M、可训练 49.57M、1024×768 少于 8 GB VRAM；有 mask-free 发布。原版输入人物、衣物和衣物 mask，自动 mask 引入 SCHP／DensePose。可作低显存研究对照，非上线建议。 |
| OOTDiffusion | [代码 CC BY-NC-SA 4.0](https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/LICENSE)、[同许可权重](https://huggingface.co/levihsu/OOTDiffusion)。 | **非商业**。 | [README](https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/README.md)：VITON-HD 半身、Dress Code 全身，上／下装／连衣裙；参考 Python 3.10、Torch 2.0.1，测试 Ubuntu 22.04；需人体解析、OpenPose、CLIP。不能把旧 demo 不支持下装当成模型不支持。无已核实端到端资源保证。 |
| Leffa | [MIT 代码](https://raw.githubusercontent.com/franciszzj/Leffa/main/LICENSE)、[标 MIT 权重](https://huggingface.co/franciszzj/Leffa)。试穿基于 SD inpainting，姿态转移基于 SDXL inpainting。 | **完整管线许可有条件／未解决**；Dress Code、OpenPose 与 checkpoint 来源需核查。 | [app.py](https://raw.githubusercontent.com/franciszzj/Leffa/main/app.py) 调整到 768×1024，加载 parsing、OpenPose、DensePose，分 VITON-HD／DressCode／姿态模型。[仓库](https://github.com/franciszzj/Leffa) 称 A100 fp16 约 6 秒；flow-attention regularization 旨在改善细节；最低显存未核实。完整产品档案见第 10 节。 |
| OmniTry | [Apache 代码](https://raw.githubusercontent.com/Kunbyte-AI/OmniTry/main/LICENSE)、[标 Apache 的 LoRA](https://huggingface.co/Kunbyte/OmniTry)，但 [FLUX.1-Fill-dev 许可](https://huggingface.co/black-forest-labs/FLUX.1-Fill-dev/blob/main/LICENSE.md) 限制模型非商业／非生产使用，除非另获许可。 | **底模阻止通常的商用自托管**。输出使用权不等于生产推理权。 | [官方仓库](https://github.com/Kunbyte-AI/OmniTry)：bf16 推理至少 28 GB，FLUX Fill＋统一／衣物 LoRA，可选 flash-attn。无 mask 可穿戴物／配饰研究候选，不是衣物 MVP 必需。 |
| Kolors Virtual Try-On | [通用 Kolors 仓库](https://github.com/Kwai-Kolors/Kolors) 不是精确 VTON 权重已发布的证明；[模型协议](https://raw.githubusercontent.com/Kwai-Kolors/Kolors/master/MODEL_LICENSE) 有注册／MAU 等条件，与代码 Apache 不同。 | 精确 VTON 模型的**自托管路径不明确／不可获得**。 | [Space 源码](https://huggingface.co/spaces/Kwai-Kolors/Kolors-Virtual-Try-On/raw/main/app.py) 用环境凭据将图片发给私有后端，不是加载本地权重。未核实该 demo 的商业 API SLA、价格或留存。 |
| Qwen-Image-Edit-2509 | [Qwen 代码 Apache](https://raw.githubusercontent.com/QwenLM/Qwen-Image/main/LICENSE)、[官方权重卡 Apache-2.0](https://huggingface.co/Qwen/Qwen-Image-Edit-2509)。社区试穿 LoRA 须逐个审计。 | 宽松底模候选，不代表任意 adapter 已获商用许可。 | 多图人物＋商品编辑，建议 1–3 张图；CUDA／bf16 参考流程，40-step 示例。通用编辑器，不是已验证尺码模型。VTON 专项质量、延迟、最低显存均未独立核实。 |

## 3. FASHN 1.5 的依赖许可阻碍与可能路线

- 可审计的 [固定提交 pipeline.py：7c0f10af3f91ad4048fe9729c470a13ef905d25a](https://raw.githubusercontent.com/fashn-AI/fashn-vton-1.5/7c0f10af3f91ad4048fe9729c470a13ef905d25a/src/fashn_vton/pipeline.py) 导入 `FashnHumanParser`，无条件初始化，并在 mask 行为判断前对人物和衣物预测。所查 main 渲染源码也有这些调用。[提交历史](https://github.com/fashn-AI/fashn-vton-1.5/commits/main/) 可定位该提交，但缓存历史不是实时 HEAD 证明。
- [解析器实现](https://raw.githubusercontent.com/fashn-AI/fashn-human-parser/main/src/fashn_human_parser/parser.py) 默认下载 `fashn-ai/fashn-human-parser`；[权重卡](https://huggingface.co/fashn-ai/fashn-human-parser) 标 `nvidia-segformer`、底模 `nvidia/mit-b4`；[包装器 LICENSE](https://raw.githubusercontent.com/fashn-AI/fashn-human-parser/main/LICENSE) 明确继承 SegFormer 条款，不只是根据架构猜测。
- [NVIDIA 许可 §3.3](https://raw.githubusercontent.com/NVlabs/SegFormer/master/LICENSE) 将非商业限定为研究或评估。因此产品选型应记录“依赖商用清关阻碍”；这不是对衍生作品边界或私人授权合同的最终法律判断。
- [agnostic.py](https://raw.githubusercontent.com/fashn-AI/fashn-vton-1.5/main/src/fashn_vton/preprocessing/agnostic.py) 在关闭 mask 时返回原人物图，在平铺且关闭 mask 时返回原衣物图。**静态推断**：平铺＋完全移除分割的窄实现可能消除解析器推理，但需删除 import、包依赖和安装器自动下载，不能只改 flag。保留 resize、姿态、品类和 tensor 处理，并用有权使用的图片验证一致性后才谈性能。穿着图衣物提取则需另行获准的分割／人工 mask 和重新测质；普通去背景不等于衣物／身体部位解析。
- [下载脚本](https://raw.githubusercontent.com/fashn-AI/fashn-vton-1.5/main/scripts/download_weights.py) 下载 `fashn-ai/DWPose` ONNX 并初始化解析器。[DWPose 代码](https://raw.githubusercontent.com/IDEA-Research/DWPose/main/LICENSE) 和 [YOLOX 代码](https://raw.githubusercontent.com/Megvii-BaseDetection/YOLOX/main/LICENSE) 为 Apache，但实际再分发 ONNX 的许可与来源仍须记录。此次未下载权重。

## 4. 数据与预处理权利是独立层

[VITON-HD 许可](https://raw.githubusercontent.com/shadow2496/VITON-HD/main/LICENSE) 为 CC BY-NC 4.0。[Dress Code 实际许可](https://raw.githubusercontent.com/aimagelab/dress-code/main/LICENCE) 限非商业学术用途，并明确涉及使用它制作的改编／其他作品；[访问政策](https://github.com/aimagelab/dress-code) 排除私营公司。即使模型标 MIT，这些仍是重要清关问题。不要笼统断言所有非商业数据集必然“感染”全部权重；需要具体资产来源、授权与法律核查，也不能因文件可下载就拿来做商业公司的微调或评估。

[CMU OpenPose 许可](https://raw.githubusercontent.com/CMU-Perceptual-Computing-Lab/openpose/master/LICENSE) 限非商业研究。宽松 Python 重实现不自动清除继承的姿态 checkpoint 限制。Leffa／OOT／IDM 预处理须逐个资产检查。此次未查看任何单独商业协议。

## 5. 衣物抠图方案与商用筛查

先区分目标：给平铺衣物去背景，不等于从穿衣人物中只取出一件上衣。前景模型可能合理保留整个人、衣架、首饰或人台。需商品隔离修正工具，对多件重叠衣物可拒绝处理；任何模型补出的遮挡衣片都不能作为事实商品证据。

| 方案 | 许可与来源 | 技术、部署与质量边界 | 建议 |
|---|---|---|---|
| BRIA RMBG-2.0 权重 | [实际 LICENSE](https://raw.githubusercontent.com/Bria-AI/RMBG-2.0/dev/LICENSE) 为 CC BY-NC 4.0；[官方卡](https://huggingface.co/briaai/RMBG-2.0) 要求商用自托管另签协议，提供商业 API。数据已获许可是厂商陈述，未独立审计。 | BiRefNet 架构，参考 1024×1024 后还原尺寸；alpha matte，不是衣物语义标签。Torch／torchvision／Pillow／Kornia／Transformers，示例远程代码加载需固定并审查。无可靠已核实延迟／最低显存或签约自托管价格。 | 不将公开免费权重嵌入商业上线。 |
| 官方 BiRefNet | [MIT 代码](https://raw.githubusercontent.com/ZhengPeng7/BiRefNet/main/LICENSE)、[官方 MIT 权重卡](https://huggingface.co/ZhengPeng7/BiRefNet)。各 general／portrait／HR 变体须分别核查，优先官方而非不明再打包。 | [发布方 README](https://raw.githubusercontent.com/ZhengPeng7/BiRefNet/main/README.md)：标准 fp16、1024² 在 RTX4090 约 17 FPS／3.45 GB，不是服务 SLA；有 HR／matting／dynamic。卡片提及 DIS-TR 训练，需测试头发、蕾丝、透明、细带。 | 自托管评估优先候选，带许可清单、原图保留与修正。 |
| rembg＋U²-Net | [rembg MIT](https://raw.githubusercontent.com/danielgatis/rembg/main/LICENSE.txt) 只覆盖 wrapper；[U²-Net Apache](https://raw.githubusercontent.com/xuebinqin/U-2-Net/master/LICENSE) 提供候选基础，实际转换权重另核来源。 | [rembg](https://github.com/danielgatis/rembg) 支持 CPU／GPU／ONNX，易于基线部署，较低参考输入分辨率。 | 成本基线，验证蕾丝／细带，不因 wrapper 方便就认定质量或全部权重许可。 |
| rembg＋ISNet | wrapper MIT，IS-Net 代码 Apache；数据与实际 ONNX 权重仍需独立核验。 | CPU／GPU ONNX、较高参考分辨率。 | 有条件评估，不能以 rembg MIT 一概清关。 |
| SAM 2/2.1 | [Apache 许可](https://raw.githubusercontent.com/facebookresearch/sam2/main/LICENSE)、[仓库明确含 checkpoint](https://github.com/facebookresearch/sam2)，保留第三方通知。 | 交互点／框选 mask；不是自动 18 类衣物解析，也不是天然柔和 alpha matting，需边缘优化。demo 字体等另有通知。 | 人工修正配套，不直接替代抠图。 |
| IMG.LY background-removal-js | AGPL-3.0，可商用但有义务；闭源集成可能需替代商业条款。 | 浏览器本地推理，首次 ONNX／WASM 下载，可自托管资产；移动性能需测。 | 若可履行 AGPL 或另获授权，可列隐私／离线候选。 |
| BRIA 托管去背景 | 商业服务路线；需审查适用的 2026-09 协议。 | 图像离开自身基础设施，有结果留存；不能从营销推导身体照片许可。 | 有权使用的商品图付费对照，正式条款仍有获取缺口。 |

### IMG.LY：不是非商业许可，也不是无条件宽松许可

[实际 LICENSE](https://raw.githubusercontent.com/imgly/background-removal-js/main/LICENSE.md) 为 AGPL v3；分发／组合作品源码与远程网络交互义务需结合集成方式判断。[Web package README](https://raw.githubusercontent.com/imgly/background-removal-js/main/packages/web/README.md) 提供联系获取其他许可，不是固定商业报价。文档写明 ONNX Runtime Web、CPU／WebGPU、默认 `isnet_fp16`，量化约 40 MB／默认约 80 MB、浏览器缓存和自定义托管。冷启动带宽、移动内存、WebGPU 与跨源隔离是部署关卡。“本地运行”须用实际网络追踪验证，不自动消除 CDN、分析、崩溃日志或应用上传；还需确认 ONNX 资产在约定授权范围内。

### rembg：实际权重必须进入资产清单

[U²-Net loader](https://raw.githubusercontent.com/danielgatis/rembg/main/rembg/sessions/u2net.py) 从 rembg `v0.0.0` release 下载 `u2net.onnx`，输入 320×320。[ISNet loader](https://raw.githubusercontent.com/danielgatis/rembg/main/rembg/sessions/dis_general_use.py) 从同 release 下载 `isnet-general-use.onnx`，输入 1024×1024。需记录具体文件、转换链、许可证据和 SHA-256；内置 MD5 是下载完整性辅助，不是权利证明。

[IS-Net/DIS 代码许可](https://raw.githubusercontent.com/xuebinqin/DIS/main/LICENSE.md) 为 Apache-2.0；[仓库说明](https://github.com/xuebinqin/DIS) 将代码／评测指标与单独 DIS5K 数据集 PDF 分开。general-use 模型、academic checkpoint 与未发布 DIS V2.0 不能混同。数据 PDF 被网页读取器以不支持的 application/octet-stream 阻塞，故没有确认数据条款允许商业训练。BiRefNet 的 DIS-TR 也须作此区分：官方权重卡有明确授权，不等于对上游数据权利的法律保证。

## 6. 商业 API：FASHN 价格、隐私与使用条件

[2026-08-07 更新的服务条款](https://fashn.ai/legal/terms-of-service) 允许合法商业用途以及集成到服务自身用户的应用；禁止独立转售 API 或暴露凭据。使用者须持有素材权利和所需同意；输出所有权受法律与第三方权利约束，不保证排他或不侵权。未另行明确 opt-in 时不以客户内容训练。服务协议独立于开源权重许可；订阅 API 不授予自托管权利。

| 价格／接口 | 当日公开证据 | 成本解释 |
|---|---|---|
| [API 价格](https://fashn.ai/pricing) | 按需 $0.075/credit，最低 $7.50／100 credits；API 无免费额度，App 试用不同。 | 不能把一个 credit 当作一个最终满意结果。 |
| [v1.6](https://docs.fashn.ai/api-reference/tryon-v1-6) | 1 credit/output，处理 864×1296；典型 performance 5 秒、balanced 8 秒、quality 12–17 秒。 | **计算情景**：1,000 张 $75；一次接受结果若需 4 个候选，则 $0.30，未计重试、失败和其他费用。 |
| [Try-On Max](https://docs.fashn.ai/api-reference/tryon-max) | fast 1K＝1、balanced 1K＝2、quality 4K＝5 credits；1–4 个输出按数量倍增。典型 fast1K 约 10 秒、balanced2K 约 25 秒、quality4K 约 55 秒，受负载影响。 | 前述 1／2／5 credit 档按需分别 $0.075／$0.15／$0.375 每输出；balanced2K 延迟例与 balanced1K 价格例不是同一个配置。 |

[留存文档](https://docs.fashn.ai/api-overview/data-retention-privacy)：请求元数据／URL 字符串不自动删除；没有记录删除 endpoint，需联系。URL 输入保存 URL 而非图片副本；base64 临时副本处理完成删除，另有一天清理兜底。CDN 输出计划 3 天删除，base64 输出可获取 60 分钟。服务商按协议也处理内容；这**不是零留存**。建议客户照片采用 base64 或不含姓名／账户 ID 的短效签名 URL，输出用 base64；正式处理客户照片前审阅 [DPA](https://fashn.ai/legal/dpa) 和 [子处理方](https://fashn.ai/legal/subprocessors)，核对地区与场景。

## 7. BRIA 价格、留存与现行协议缺口

[官方价格表](https://bria.ai/pricing)：Background Removal $0.018/image，带 prompt $0.025/image，guided removal $0.025/image。**计算情景**：1,000 张不带 prompt＝$18，未计重试、税及其他服务。自托管企业价仍定制；“100 次免费生成”不直接证明可对外商用。

[官方留存说明](https://docs.bria.ai/getting-started/asset-retention)：默认输出 3 天到期，可按组织配置；输入仅保留处理所需时间。Job ID／状态可能晚于资产到期继续存在；这不是完整账户、日志、备份或删除政策。

[法律中心](https://bria.ai/legal-lobby) 区分仅内部评估、不得商用／对外发布输出的 evaluation pilot，以及 enterprise、online、background-removal 协议。当前去背景链接指向 [2026-09 非生成式条款 v1.5](https://drive.google.com/file/d/1LLOEA5yhWlohQEGGEm-zGXM53_XZ6xNR/view?usp=sharing)，online 指向 [2026-09 条款 v1.4](https://drive.google.com/file/d/1WaqnqpRdfPqtJIwUnWS6kAl0UnrLUFLz/view?usp=sharing)。公共读取器只看到 loading／sign-in，**完整现行生效条款未核实，未登录**。上线前须取得适用协议、DPA 与赔偿排除条款；没有用旧索引中的 2025 企业条款代替当前去背景协议。

## 8. 如何看待厂商比较与模型清单

[FASHN 对比文章](https://fashn.ai/blog/comparing-the-top-4-open-source-virtual-try-on-viton-models) 原发 2025-06-30、标 2026-10-01 更新，但横向测试仍是 2025-06：两个人、四选一最优、不同 demo／硬件，CatVTON 使用 FLUX 变体，未必是原版。新 FASHN／Leffa／OmniTry／Qwen 未重跑。这是推广自家 API 的厂商材料，只适合定性示例，不是中立可复现排名或生产 SLA；商用简写也遗漏前述 parser 问题。

[XQ0820 清单](https://github.com/XQ0820/open-virtual-try-on-models) 标 2026-10-19 核验，由 WearTryOn 团队维护，可作发现索引，不是许可权威。“似可商用”中含 OmniTry，同时又警告 NC FLUX，说明代码＋权重两列仍不够。ViViD、DCI-VTON、CatV2TON、FitDiT、Voost、MagicTryOn、MV-VTON、StableVITON、LaDI-VTON、HR-VITON、GP-VTON、PF-AFN **此次未完整独立清关**，不据此优于短名单推荐。没有许可证不等于允许使用。

## 9. 分阶段验证建议（均未实施）

1. **产品约定。** 试穿可选、与尺码判断分开。起步限制为穿衣成年人、单人、单品类、正面照、商品平铺图，不做内衣／脱衣变换；确认人物与商品图片权利／同意。无需上传身体照也能使用常规商品与合身流程。
2. **私有衣物抠图。** 在拥有或获准素材上比较 BiRefNet 与原图；测试毛发／皮草、透明蕾丝、细带、同色背景、裁切及多物体。保留原图，可逆预览、擦除／恢复，不默改尺寸或作为真值的商家图片。
3. **离线、获同意的评价。** 先批准预算和样本，涵盖体型、肤色、辅助行动器具、文化服饰、尺码、姿态；不自动推断敏感标签。首样本与 best-of-four 分开；评人物／体型保留、SKU／颜色／logo／文字、衣摆／袖子、手与遮挡、背景、失败率和可拒绝性。记录版本／参数／seed，不把原图写日志；测包含上传、排队、重试、冷启动的 p50／p95，以及每个接受预览成本。
4. **小规模主动选择的 API pilot。** 采购／隐私审阅与明确预算后才执行。服务端凭据、认证队列、用户／速率／费用上限、异步状态、有界重试与幂等计费；覆盖输入／输出／派生 mask 的删除请求；短留存、不用公开 bucket、不在分析或崩溃日志带照片。单独追踪厂商元数据删除。展示 AI 标签和原图对照，支持报告／丢弃，并防止第三方冒充和非自愿照片使用。
5. **有证据后再自托管。** 用许可或审计后的无解析器路线解决 FASHN 阻碍，固定代码／权重／摘要／许可，禁止运行时下载与外连，检查依赖与自定义 loader，实测目标 GPU。把闲置 GPU、容量余量、存储、重试、工程运维计入总成本。量化／offload 须重测保真与延迟，不能从 checkpoint 小就推断浏览器／CPU 可行。

上线门槛：资产级许可清单、来源及照片同意、留存／删除验收、事先确定的质量阈值、可观测 p95 与失败预算、关闭开关、清楚的非合身保证说明。物理合身主张需要另一套测量／衣物数据和真实穿着结果验证，不可由生成图替代。

## 10. Leffa 产品档案：固定字段与缺失证据

### 定位、平台与价格

[franciszzj/Leffa 官方仓库](https://github.com/franciszzj/Leffa) 是关联 CVPR 2025 的研究模型／框架，不是消费级衣橱服务。对 Fit Passport 的角色是可选渲染后端实验，不是合身引擎、衣橱数据库、购物服务或尺码推荐层。平台为 Python／GPU 自托管及 [Hugging Face Space](https://huggingface.co/spaces/franciszzj/Leffa) 公共 demo。源码 MIT、权重卡 MIT 不代表完整管线可免费商用；此次未核实商业托管价格、服务 SLA 或自托管总成本。

### 功能逐项与证据类型

| 功能 | 证据类型 | 范围／限制 |
|---|---|---|
| 虚拟试穿与姿态转移两流程 | [app.py 静态源码](https://raw.githubusercontent.com/franciszzj/Leffa/main/app.py)，未运行 | 人物／参考图输入，VITON-HD／Dress Code 选择；不能写成亲自成功试用。 |
| 衣物品类、steps、guidance、seed、加速控制 | 同上，静态源码 | 属于 demo 控制项，不是质量保证。 |
| 中间 mask／DensePose | 同上，静态源码 | 依赖辅助预处理；完整内存与来源须核查。 |
| 细节保留、A100 fp16 约 6 秒 | 发布方论文／仓库宣称 | 未在 Fit Passport 数据或硬件复现。 |
| 物理合身、测量、购物集成、自动入橱、天气 | 未找到支持证据 | 不把图像试穿当尺码推荐。 |
| 保证人脸／体型不变 | 未找到保证证据 | 需单独保真测试；不是天然属性。 |

源码加载三个 diffusion 模型及辅助组件，生产服务不应直接继承 demo 全模型内存开销。没有当前独立最低 VRAM 证据。

### 尺码是否支持、如何支持

未发现测量输入驱动的尺码排序或衣物物理贴合推断证据。它将人物和衣物图用于外观合成；不能给出“该买哪个尺码”的已验证答案，也没有证据证明舒适度、压力或垂坠准确率。

### 技术栈、许可、设计借鉴与商用

参考 Python 3.10；[requirements.txt](https://raw.githubusercontent.com/franciszzj/Leffa/main/requirements.txt) 包含 Torch、Diffusers、Transformers、Accelerate、ONNX Runtime、OpenCV、Gradio、PEFT、Triton 与图像库，多数版本未固定。[模型卡](https://huggingface.co/franciszzj/Leffa) 描述 SCHP／DensePose mask、训练数据与 checkpoint。可借鉴把任务和中间结果分开、可控 seed／参数的研究界面；采用前固定依赖并审计供应链。代码／权重 MIT 不覆盖 OpenPose、底模、数据或所有导入资产。Dress Code 与预处理许可未解决前，仅保留在研究对照中。

### 隐私：照片、人脸、身体尺寸

图像输入涉及人物／身体外观。自托管且禁用运行时下载／遥测、不启用 Gradio 公共分享，可把照片留在受控基础设施；这是设计可能，不是已验证默认行为。没有核实公共 Space 的模型专属留存／DPA。不得为了查看 demo 上传个人身体照。源码含 checkpoint 下载与文件路径图像处理，上线前需检查临时文件、缓存、Gradio 队列和日志生命周期。未发现身体尺寸测量表单证据。

### 关键页面与截图

| 页面名 | URL | 本轮证据／缺口 |
|---|---|---|
| 官方代码仓库 | https://github.com/franciszzj/Leffa | 读取源码／文档；未取得 UI 截图。 |
| 模型卡 | https://huggingface.co/franciszzj/Leffa | 读取权重／技术说明；未取得截图。 |
| Leffa Space listing | https://huggingface.co/spaces/franciszzj/Leffa | 页面可读并标 ZeroGPU；不是成功推理证据。 |
| 交互 demo iframe | https://franciszzj-leffa.hf.space | 本轮网页读取不可访问；**缺当前交互 UI 截图与获同意素材的可复现运行**。未登录、未上传、未推理。 |

发布方样例拼图不是成功测试 demo 的截图。此次没有截图文件可交付，不用其他图片冒充。

### 重复好评与抱怨：证据不足，不能凑足 3＋3

| 信号 | 来源 | 能证明什么／不能证明什么 |
|---|---|---|
| 颜色暗淡／不准确 | [Issue #58，2025-04-24](https://github.com/franciszzj/Leffa/issues/58) | 用户报告；提取页只有标题，缺详细复现样例，不是已复现错误率。 |
| 质量下降／背景细节变化 | [Issue #65，2025-06-26](https://github.com/franciszzj/Leffa/issues/65) | 用户输出抱怨，未独立复现。 |
| 是否仍维护 | [Issue #63，2025-06-18](https://github.com/franciszzj/Leffa/issues/63) | 无支持性正文的维护疑问，不证明项目弃置。 |
| 泛泛赞扬并请求训练代码 | [Issue #46，2025-02-15](https://github.com/franciszzj/Leffa/issues/46) | 不是实质性能好评。 |

**结果：0 条核实的实质正面评测，2 条输出抱怨＋1 条维护疑问。没有足够独立重复证据归纳各 3 个好评／抱怨主题。** 发布方样例、研究主张、stars／likes 与再托管页面不能补作独立用户评价。

### 对 Fit Passport 的结论

保持研究候选，先解决数据与预处理权限。上线验证路线可比较获准商业 API 或审计后的窄 FASHN 核心实验，衣物抠图单独评估 BiRefNet。没有在相同图片、约束、seed／样本预算和完整管线测量下对照前，不宣布比较赢家。

## 11. 未解决项与取证限制

未获得法律意见或私人商业协议，未调用 API／采购／测试模型。完整传递依赖、精确 ONNX 来源和训练图片权利仍开放。部分 Hugging Face raw LICENSE 无法读取，已以作者模型卡和可读仓库许可交叉检查；发布包仍须归档精确文件。live／main 与缓存页行数存在差异，关键 FASHN 行为用 raw、渲染页和固定提交相互佐证。没有已核实的 BRIA 自托管报价；本文件只记录公开 API 标价。没有证据确立物理合身准确率或 Fit Passport 退货率改善。
