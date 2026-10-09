// Category names real shops and catalogues use, each with the type (or types)
// it should find — Session 98. garmentTaxonomy.test.ts searches every one.
//
// Sources, and how sure each list is:
//   google-zh, google-en  Google's product taxonomy, downloaded 2026-10-08:
//                         taxonomy-with-ids.zh-CN.txt and .en-US.txt, the leaves
//                         under 服饰与配饰 / Apparel & Accessories. Copied as listed.
//   shopify               Shopify's product taxonomy, dist/en/categories.txt on
//                         GitHub (main), downloaded 2026-10-08. Copied as listed.
//   jd, taobao            JD and Taobao category names for women's, men's,
//                         underwear, sports, shoes and accessories. Their pages
//                         render categories in script and could not be read, so
//                         these are written from memory of those pages:
//                         UNVERIFIED as their exact current wording.
//
// Left out on purpose: baby and toddler lines, wigs and hair extensions, costume
// and sports-team uniforms by sport, and names that are a size range or an age
// ("大码女装", "中老年女装") or a market ("设计师／潮牌") rather than a garment.
//
// A name found missing goes HERE first; the test then fails until a type or an
// alias covers it.

export type CoverageCase = { name: string; expect: string | string[]; source: "google-zh" | "google-en" | "shopify" | "jd" | "taobao" };

const c = (source: CoverageCase["source"], rows: Array<[string, string | string[]]>): CoverageCase[] =>
  rows.map(([name, expect]) => ({ name, expect, source }));

export const COVERAGE: CoverageCase[] = [
  ...c("google-zh", [
    ["衬衫/上衣", ["shirt", "top"]], ["连衣裙", "dress"], ["裙子", ["skirt", "dress"]], ["迷你裙", "skirt"], ["及膝裙", "skirt"],
    ["长裙", ["skirt", "dress"]], ["裙裤", "skort"], ["裤装", "pants"], ["短裤", "shorts"], ["背带裤", "overalls"],
    ["连体衣/连衫裤", "jumpsuit"], ["外套与夹克", ["jacket", "outerwear"]], ["外衣", "outerwear"], ["摩托车夹克", "leather-jacket"],
    ["背心", ["tank", "gilet"]], ["渔猎马甲背心", "gilet"], ["套装", "co-ord"], ["套装裙", "suit"], ["长裤套装", "suit"],
    ["无尾晚礼服", "suit"], ["婚纱", "gown"], ["伴娘/花童/新人母亲礼服", "gown"], ["和服", "kimono"], ["日式浴衣", "kimono"],
    ["莎丽服/楞哈", "traditional"], ["阿尔卑斯少女裙", "traditional"], ["校服", "uniform"], ["制服", "uniform"],
    ["厨师服", "uniform"], ["军装", "uniform"], ["运动服", "tracksuit"], ["泳装", "swimsuit"], ["文胸", "bra"],
    ["塑身内衣", "shapewear"], ["内衣", ["bra", "underwear", "lingerie"]], ["衬裙", "lingerie"], ["吊袜带", "lingerie"],
    ["家居服", "pajamas"], ["睡衣/家居服", "pajamas"], ["睡衣裤", "pajamas"], ["连体睡裙", "nightdress"], ["浴袍", "robe"],
    ["秋衣秋裤", "thermals"], ["连裤袜/长袜/打底裤", ["tights", "leggings", "socks"]], ["袜子", "socks"], ["滑雪裤/连体装", "ski-pants"],
    ["雨裤", "ski-pants"], ["雨衣套装", "trench"], ["围巾", "scarf"], ["围巾与披巾", "scarf"], ["披肩", "scarf"], ["帽子", "hat"],
    ["手套/连指手套", "gloves"], ["太阳镜", "sunglasses"], ["领带", "tie"], ["领带夹", "tie"], ["袖扣", "cufflinks"], ["腰带", "belt"],
    ["腰带扣", "belt"], ["背带", "belt"], ["发饰", "hair-accessory"], ["发夹", "hair-accessory"], ["耳罩/耳包", "accessory"],
    ["手帕", "accessory"], ["脖套", "scarf"], ["鞋类", "shoes"],
  ]),
  ...c("google-en", [
    ["Shirts & Tops", ["shirt", "top"]], ["Dresses", "dress"], ["Skirts", "skirt"], ["Mini Skirts", "skirt"], ["Long Skirts", "skirt"],
    ["Skorts", "skort"], ["Pants", "pants"], ["Shorts", "shorts"], ["Overalls", "overalls"], ["Jumpsuits & Rompers", ["jumpsuit", "playsuit"]],
    ["Suits", "suit"], ["Tuxedos", "suit"], ["Skirt Suits", "suit"], ["Outerwear", "outerwear"], ["Coats & Jackets", ["coat", "jacket"]],
    ["Vests", "gilet"], ["Motorcycle Jackets", "leather-jacket"], ["Rain Pants", "ski-pants"], ["Snow Pants & Suits", "ski-pants"],
    ["Swimwear", "swimsuit"], ["Bras", "bra"], ["Underwear", "underwear"], ["Lingerie", "lingerie"], ["Shapewear", "shapewear"],
    ["Long Johns", "thermals"], ["Undershirts", "base-layer"], ["Hosiery", "tights"], ["Socks", "socks"], ["Pajamas", "pajamas"],
    ["Nightgowns", "nightdress"], ["Robes", "robe"], ["Loungewear", "pajamas"], ["Kimonos", "kimono"], ["Saris & Lehengas", "traditional"],
    ["Dirndls", "traditional"], ["Wedding Dresses", "gown"], ["Bridal Party Dresses", "gown"], ["Activewear", "tracksuit"],
    ["School Uniforms", "uniform"], ["Military Uniforms", "uniform"], ["Leotards & Unitards", "bodysuit"], ["Hats", "hat"],
    ["Scarves & Shawls", "scarf"], ["Gloves & Mittens", "gloves"], ["Sunglasses", "sunglasses"], ["Neckties", "tie"],
    ["Cufflinks", "cufflinks"], ["Belts", "belt"], ["Suspenders", "belt"], ["Hair Accessories", "hair-accessory"],
    ["Headbands", "hair-accessory"], ["Earmuffs", "accessory"], ["Shoes", "shoes"],
  ]),
  ...c("shopify", [
    ["Cardigans", "cardigan"], ["Hoodies", "hoodie"], ["Sweatshirts", "sweatshirt"], ["Sweaters", "sweater"], ["Blouses", "blouse"],
    ["Tank Tops", "tank"], ["Camisoles", "tank"], ["Polos", "polo"], ["T-Shirts", "tshirt"], ["Henley Shirts", "tshirt"],
    ["Crop Tops", "top"], ["Corset Tops", "shapewear"], ["Bodysuits", "bodysuit"], ["Overshirts", "shirt"], ["Dress Shirts", "shirt"],
    ["Base Layer Tops", "base-layer"], ["Jeans", "jeans"], ["Joggers", "joggers"], ["Sweatpants", "joggers"], ["Track Pants", "joggers"],
    ["Leggings", "leggings"], ["Jeggings", "leggings"], ["Chinos", "pants"], ["Capris", "pants"], ["Palazzo Pants", "pants"],
    ["Harem Pants", "pants"], ["Trousers", "pants"], ["Cargo Pants", "cargo-pants"], ["Cargo Shorts", "shorts"],
    ["Bermudas", "shorts"], ["Denim Shorts", "denim-shorts"], ["Chino Shorts", "shorts"], ["Trench Coats", "trench"],
    ["Rain Coats", "trench"], ["Parkas", "down-jacket"], ["Puffer Jackets", "down-jacket"], ["Blazers", "blazer"],
    ["Bomber Jackets", "jacket"], ["Trucker Jackets", "denim-jacket"], ["Track Jackets", "jacket"], ["Bolero Jackets", "jacket"],
    ["Overcoats", "coat"], ["Pea Coats", "coat"], ["Ponchos", "cape"], ["Capes", "cape"], ["Cheongsams", "qipao"],
    ["Hanboks", "traditional"], ["Kaftans", "traditional"], ["Kurtas & Kurta Sets", "traditional"], ["Kilts", "traditional"],
    ["Abayas & Jilbabs", "traditional"], ["Bridesmaid Dresses", "gown"], ["Pant Suits", "suit"], ["Scrubs", "uniform"],
    ["Outfit Sets", "co-ord"], ["Bib Overalls", "overalls"], ["Coveralls", "jumpsuit"], ["Bikinis", "bikini"], ["Tankinis", "bikini"],
    ["One-Piece Swimsuits", "swimsuit"], ["Boardshorts", "swim-trunks"], ["Swim Shorts", "swim-trunks"], ["Rash Guards", "rash-guard"],
    ["Cover Ups", "swimsuit"], ["Sports Bras", "sports-bra"], ["Briefs", "underwear"], ["Boxer Briefs", "underwear"], ["Boxers", "underwear"],
    ["Thongs", "underwear"], ["Corsets & Bustiers", "shapewear"], ["Petticoats", "lingerie"], ["Pantyhose", "tights"], ["Tights", "tights"],
    ["Lounge Pants", "pajamas"], ["Sneakers", "sneakers"], ["Athletic Shoes", "sneakers"], ["Boots", "boots"], ["Sandals", "sandals"],
    ["Slippers", "slippers"], ["Heels", "heels"], ["Flats", "flats"], ["Beanies", "hat"], ["Baseball Caps", "hat"], ["Bucket Hats", "hat"],
    ["Fedoras", "hat"], ["Berets", "hat"], ["Bow Ties", "tie"], ["Pocket Squares", "tie"], ["Handbags", "bag"], ["Shoulder Bags", "bag"],
    ["Scrunchies", "hair-accessory"], ["Neck Gaiters", "scarf"], ["Cummerbunds", "belt"],
  ]),
  ...c("jd", [
    ["T恤", "tshirt"], ["衬衫", "shirt"], ["针织衫", "sweater"], ["雪纺衫", "blouse"], ["卫衣", "sweatshirt"], ["马甲", "gilet"],
    ["半身裙", "skirt"], ["牛仔裤", "jeans"], ["休闲裤", "pants"], ["打底裤", "leggings"], ["正装裤", "dress-pants"],
    ["小西装", "blazer"], ["短外套", "jacket"], ["风衣", "trench"], ["毛呢大衣", "coat"], ["真皮皮衣", "leather-jacket"],
    ["仿皮皮衣", "leather-jacket"], ["棉服", "padded-jacket"], ["羽绒服", "down-jacket"], ["打底衫", "base-layer"],
    ["旗袍/唐装", ["qipao", "tang-suit"]], ["加绒裤", "pants"], ["吊带/背心", "tank"], ["羊绒衫", "sweater"], ["羊毛衫", "sweater"],
    ["皮草", "fur"], ["礼服", "gown"], ["毛衣", "sweater"], ["牛仔外套", "denim-jacket"], ["POLO衫", "polo"], ["夹克", "jacket"],
    ["西服", ["suit", "blazer"]], ["西裤", "dress-pants"], ["西服套装", "suit"], ["唐装/中山装", "tang-suit"], ["工装", "uniform"],
    ["卫裤/运动裤", "joggers"], ["马甲/背心", ["gilet", "tank"]], ["女式内裤", "underwear"], ["男式内裤", "underwear"],
    ["塑身美体", "shapewear"], ["泳衣", "swimsuit"], ["抹胸", "tube-top"], ["连裤袜/丝袜", "tights"], ["美腿袜", "tights"],
    ["商务男袜", "socks"], ["保暖内衣", "thermals"], ["情侣睡衣", "pajamas"], ["文胸套装", "bra"], ["休闲棉袜", "socks"],
    ["运动T恤", "sport-top"], ["运动套装", "tracksuit"], ["运动卫衣/套头衫", "sweatshirt"], ["运动短裤", "sport-shorts"],
    ["运动背心", "tank"], ["运动内衣", "sports-bra"], ["运动袜", "socks"], ["冲锋衣", "shell-jacket"], ["冲锋裤", "ski-pants"],
    ["滑雪服", "shell-jacket"], ["速干衣", "sport-top"], ["瑜伽服", "leggings"], ["单鞋", "flats"], ["休闲鞋", "casual-shoes"],
    ["帆布鞋", "canvas-shoes"], ["鱼嘴鞋", "heels"], ["妈妈鞋", "flats"], ["凉鞋", "sandals"], ["拖鞋", "slippers"], ["高跟鞋", "heels"],
    ["坡跟鞋", "heels"], ["松糕鞋", "heels"], ["雪地靴", "boots"], ["马丁靴", "boots"], ["短靴", "boots"], ["长靴", "boots"],
    ["女靴", "boots"], ["男靴", "boots"], ["雨鞋/雨靴", "rain-boots"], ["布鞋/绣花鞋", "cloth-shoes"], ["传统布鞋", "cloth-shoes"],
    ["商务休闲鞋", ["dress-shoes", "casual-shoes"]], ["正装鞋", "dress-shoes"], ["凉鞋/沙滩鞋", "sandals"], ["拖鞋/人字拖", "slippers"],
    ["工装鞋", "boots"], ["跑步鞋", "sneakers"], ["篮球鞋", "sneakers"], ["板鞋", "casual-shoes"], ["训练鞋", "sneakers"],
    ["足球鞋", "sneakers"], ["徒步鞋", "sneakers"], ["乐福鞋", "loafers"], ["毛线帽", "hat"], ["棒球帽", "hat"], ["遮阳帽", "hat"],
    ["鸭舌帽", "hat"], ["领带/领结/领带夹", "tie"], ["手套", "gloves"], ["口罩", "accessory"], ["女士丝巾/围巾/披肩", "scarf"],
    ["男士腰带", "belt"], ["双肩包", "bag"], ["手提包", "bag"], ["钱包", "bag"], ["斜挎包", "bag"], ["手表", "jewellery"], ["项链", "jewellery"],
  ]),
  ...c("taobao", [
    ["裤子", "pants"], ["卫衣/绒衫", "sweatshirt"], ["毛针织衫", "sweater"], ["外套", "outerwear"], ["西装", "blazer"], ["毛呢外套", "coat"],
    ["棉衣/棉服", "padded-jacket"], ["皮衣", "leather-jacket"], ["马夹", "gilet"], ["蕾丝衫/雪纺衫", "blouse"], ["背心吊带", "tank"],
    ["套装/学生校服/工作制服", ["co-ord", "uniform"]], ["婚纱/旗袍/礼服", ["gown", "qipao"]], ["唐装/民族服装/舞台服装", ["tang-suit", "traditional"]],
    ["时尚套装", "co-ord"], ["休闲运动套装", ["tracksuit", "co-ord"]], ["学生校服", "uniform"], ["工作制服", "uniform"], ["汉服", "hanfu"],
    ["开衫", "cardigan"], ["针织开衫", "cardigan"], ["毛衣开衫", "cardigan"], ["连帽卫衣", "hoodie"], ["阔腿裤", "pants"],
    ["百褶裙", "pleated-skirt"], ["包臀裙", "pencil-skirt"], ["A字裙", "a-line-skirt"], ["牛仔裙", "denim-skirt"], ["吊带裙", "slip-dress"],
    ["针织连衣裙", "knit-dress"], ["衬衫裙", "shirt-dress"], ["连体裤", "jumpsuit"], ["工装裤", "cargo-pants"], ["防晒衣", "rash-guard"],
    ["比基尼", "bikini"], ["睡裙", "nightdress"], ["马面裙", "skirt"], ["新中式", "hanfu"],
  ]),
];
