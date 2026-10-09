// Garment types in two levels — Session 98.
//
// The founder: a type should be chosen as "parent, then child" (tops, then a tank
// among them), as complete as people need, without a picker that is a wall of
// words. Three rules make that work:
//
//   1. A type may sit under more than one parent. A cardigan is knitwear, and
//      also what people reach for under outerwear and tops; it is ONE key shown
//      in three places, never three keys.
//   2. Every type carries search words in both languages (garmentAliases.ts,
//      loaded only when someone searches). A length, a fabric or a cut ("midi",
//      "羊绒", "阔腿") is an alias, not a type of its own.
//   3. garmentCoverage.fixture.ts lists the category names of JD, Taobao, Google
//      and Shopify; garmentTaxonomy.test.ts fails if one of them finds no type.
//      A name found missing goes into that list first, then here.
//
// The engine is not told about any of this. Each type names the ENGINE category
// it is sized as — one of the 23 keys the engine, the extractor and the extension
// already know (plus "underwear") — and every comparison of "the same kind of
// garment" goes through `engineCategoryOf`. A key that existed before Session 98
// is its own engine category, so nothing stored before scores differently
// (garmentTaxonomy.test.ts locks that).
//
// Names shown to people live in i18n/messages (garment.cat, garment.parent); the
// English `label` here is for the server and is kept equal to en.ts by the test.

export type GarmentParent =
  | "tops" | "knitwear" | "outerwear" | "onepiece" | "skirts" | "bottoms"
  | "sets" | "intimates" | "swimwear" | "footwear" | "accessories";

export const PARENT_ORDER: GarmentParent[] = [
  "tops", "knitwear", "outerwear", "onepiece", "skirts", "bottoms",
  "sets", "intimates", "swimwear", "footwear", "accessories",
];

/** The keys the engine sizes by: every category it knew before Session 98. */
export const ENGINE_CATEGORIES = [
  "tshirt", "top", "shirt", "polo", "sweater", "hoodie", "jacket",
  "pants", "jeans", "shorts", "skirt",
  "dress", "jumpsuit", "swimsuit",
  "shoes", "sneakers", "boots", "socks",
  "hat", "belt", "scarf", "accessory", "other",
  "underwear",
] as const;
export type EngineCategory = (typeof ENGINE_CATEGORIES)[number];

export type GarmentType = {
  key: string;
  /** English name, equal to en.ts garment.cat[key]. */
  label: string;
  /** Where the picker shows it; the first is its home (default folder, mannequin zone). */
  parents: GarmentParent[];
  /** The category the engine sizes it as. */
  engine: EngineCategory;
};

const T = (key: string, label: string, parents: GarmentParent[], engine: EngineCategory): GarmentType =>
  ({ key, label, parents, engine });

// Order within a parent is the order of its chips: the most common first, the
// parent's catch-all last.
export const GARMENT_TYPES: GarmentType[] = [
  // Tops
  T("tshirt", "T-shirt", ["tops"], "tshirt"),
  T("longsleeve-tee", "Long-sleeve T-shirt", ["tops"], "tshirt"),
  T("sport-top", "Sports top", ["tops"], "tshirt"),
  T("polo", "Polo", ["tops"], "polo"),
  T("shirt", "Shirt", ["tops"], "shirt"),
  T("blouse", "Blouse", ["tops"], "shirt"),
  T("tank", "Tank / cami", ["tops", "intimates"], "top"),
  T("tube-top", "Tube top", ["tops", "intimates"], "top"),
  T("base-layer", "Base layer", ["tops"], "top"),
  T("sweatshirt", "Sweatshirt", ["tops"], "hoodie"),
  T("hoodie", "Hoodie", ["tops"], "hoodie"),
  T("bodysuit", "Bodysuit", ["tops"], "top"),
  T("cardigan", "Cardigan", ["knitwear", "outerwear", "tops"], "sweater"),
  T("top", "Other top", ["tops"], "top"),

  // Knitwear
  T("sweater", "Sweater", ["knitwear"], "sweater"),
  T("sweater-vest", "Sweater vest", ["knitwear"], "sweater"),
  T("knit-tank", "Knit tank", ["knitwear"], "sweater"),

  // Outerwear
  T("blazer", "Blazer", ["outerwear"], "jacket"),
  T("jacket", "Jacket", ["outerwear"], "jacket"),
  T("denim-jacket", "Denim jacket", ["outerwear"], "jacket"),
  T("leather-jacket", "Leather jacket", ["outerwear"], "jacket"),
  T("trench", "Trench coat", ["outerwear"], "jacket"),
  T("coat", "Coat", ["outerwear"], "jacket"),
  T("down-jacket", "Down jacket", ["outerwear"], "jacket"),
  T("padded-jacket", "Padded jacket", ["outerwear"], "jacket"),
  T("shell-jacket", "Shell jacket", ["outerwear"], "jacket"),
  T("fur", "Fur coat", ["outerwear"], "jacket"),
  T("cape", "Cape / poncho", ["outerwear"], "jacket"),
  T("gilet", "Vest / gilet", ["outerwear"], "jacket"),
  T("outerwear", "Other outerwear", ["outerwear"], "jacket"),

  // Dresses and one-pieces
  T("dress", "Dress", ["onepiece"], "dress"),
  T("slip-dress", "Slip dress", ["onepiece"], "dress"),
  T("knit-dress", "Knit dress", ["onepiece", "knitwear"], "dress"),
  T("shirt-dress", "Shirt dress", ["onepiece"], "dress"),
  T("gown", "Evening gown", ["onepiece"], "dress"),
  T("qipao", "Qipao", ["onepiece"], "dress"),
  T("hanfu", "Hanfu", ["onepiece"], "dress"),
  T("kimono", "Kimono / yukata", ["onepiece"], "dress"),
  T("traditional", "Other traditional dress", ["onepiece"], "dress"),
  T("jumpsuit", "Jumpsuit", ["onepiece"], "jumpsuit"),
  T("playsuit", "Playsuit", ["onepiece"], "jumpsuit"),
  T("overalls", "Overalls", ["onepiece", "bottoms"], "pants"),

  // Skirts
  T("skirt", "Skirt", ["skirts"], "skirt"),
  T("a-line-skirt", "A-line skirt", ["skirts"], "skirt"),
  T("pleated-skirt", "Pleated skirt", ["skirts"], "skirt"),
  T("pencil-skirt", "Pencil skirt", ["skirts"], "skirt"),
  T("denim-skirt", "Denim skirt", ["skirts"], "skirt"),
  T("skort", "Skort / culottes", ["skirts"], "skirt"),

  // Bottoms
  T("jeans", "Jeans", ["bottoms"], "jeans"),
  T("pants", "Pants", ["bottoms"], "pants"),
  T("dress-pants", "Dress trousers", ["bottoms"], "pants"),
  T("joggers", "Joggers", ["bottoms"], "pants"),
  T("cargo-pants", "Cargo pants", ["bottoms"], "pants"),
  T("ski-pants", "Ski / rain pants", ["bottoms"], "pants"),
  T("leggings", "Leggings", ["bottoms", "intimates"], "pants"),
  T("shorts", "Shorts", ["bottoms"], "shorts"),
  T("denim-shorts", "Denim shorts", ["bottoms"], "shorts"),
  T("sport-shorts", "Athletic shorts", ["bottoms"], "shorts"),

  // Sets: sized by their top until the engine scores two pieces at once.
  T("suit", "Suit", ["sets"], "jacket"),
  T("tracksuit", "Tracksuit", ["sets"], "top"),
  T("co-ord", "Matching set", ["sets"], "top"),
  T("tang-suit", "Tang suit", ["sets"], "jacket"),
  T("uniform", "Uniform / workwear", ["sets"], "jacket"),

  // Intimates and loungewear: sized S to XL, never scored on the body.
  T("bra", "Bra", ["intimates"], "underwear"),
  T("sports-bra", "Sports bra", ["intimates"], "underwear"),
  T("underwear", "Underwear", ["intimates"], "underwear"),
  T("shapewear", "Shapewear", ["intimates"], "underwear"),
  T("thermals", "Thermals", ["intimates"], "underwear"),
  T("pajamas", "Pyjamas / loungewear", ["intimates"], "underwear"),
  T("nightdress", "Nightdress", ["intimates"], "underwear"),
  T("robe", "Robe", ["intimates"], "underwear"),
  T("tights", "Tights", ["intimates"], "socks"),
  T("lingerie", "Other lingerie", ["intimates"], "underwear"),

  // Swimwear
  T("swimsuit", "Swimsuit", ["swimwear"], "swimsuit"),
  T("bikini", "Bikini", ["swimwear"], "swimsuit"),
  T("swim-trunks", "Swim shorts", ["swimwear"], "shorts"),
  T("rash-guard", "Sun / rash guard", ["swimwear"], "jacket"),

  // Footwear
  T("sneakers", "Sneakers", ["footwear"], "sneakers"),
  T("casual-shoes", "Casual shoes", ["footwear"], "sneakers"),
  T("canvas-shoes", "Canvas shoes", ["footwear"], "sneakers"),
  T("dress-shoes", "Dress shoes", ["footwear"], "shoes"),
  T("loafers", "Loafers", ["footwear"], "shoes"),
  T("flats", "Flats", ["footwear"], "shoes"),
  T("heels", "Heels", ["footwear"], "shoes"),
  T("boots", "Boots", ["footwear"], "boots"),
  T("sandals", "Sandals", ["footwear"], "shoes"),
  T("slippers", "Slippers / slides", ["footwear"], "shoes"),
  T("cloth-shoes", "Cloth shoes", ["footwear"], "shoes"),
  T("rain-boots", "Rain boots", ["footwear"], "boots"),
  T("shoes", "Other shoes", ["footwear"], "shoes"),
  T("socks", "Socks", ["footwear", "intimates"], "socks"),

  // Accessories
  T("bag", "Bag", ["accessories"], "accessory"),
  T("hat", "Hat", ["accessories"], "hat"),
  T("scarf", "Scarf / shawl", ["accessories"], "scarf"),
  T("belt", "Belt", ["accessories"], "belt"),
  T("gloves", "Gloves", ["accessories"], "accessory"),
  T("sunglasses", "Sunglasses / glasses", ["accessories"], "accessory"),
  T("tie", "Tie / bow tie", ["accessories"], "accessory"),
  T("cufflinks", "Cufflinks", ["accessories"], "accessory"),
  T("hair-accessory", "Hair accessory", ["accessories"], "accessory"),
  T("jewellery", "Jewellery / watch", ["accessories"], "accessory"),
  T("accessory", "Other accessory", ["accessories"], "accessory"),
  T("other", "Other", ["accessories"], "other"),
];

const BY_KEY: Record<string, GarmentType> = Object.fromEntries(GARMENT_TYPES.map((g) => [g.key, g]));

export function garmentType(key: string | null | undefined): GarmentType | undefined {
  return key ? BY_KEY[key.toLowerCase()] : undefined;
}

/** The category the engine sizes `key` as. An unknown key is passed through. */
export function engineCategoryOf(key: string): string {
  const k = key.toLowerCase();
  return BY_KEY[k]?.engine ?? k;
}

/** Whether two stored categories are the same kind of garment, to the engine. */
export function sameEngineCategory(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && engineCategoryOf(a) === engineCategoryOf(b);
}

/** The home parent of a type; "tops" for a key we do not know. */
export function homeParentOf(key: string): GarmentParent {
  return garmentType(key)?.parents[0] ?? "tops";
}

/** Each parent's catch-all, shown last among its chips. */
const CATCH_ALLS = new Set(["top", "outerwear", "traditional", "lingerie", "shoes", "accessory", "other"]);

/** The types under a parent, in chip order: its own types, then the ones it shares
 *  with another parent (a cardigan under outerwear), then its catch-all. */
export function typesUnder(parent: GarmentParent): GarmentType[] {
  const rank = (g: GarmentType) => (CATCH_ALLS.has(g.key) ? 2 : g.parents[0] === parent ? 0 : 1);
  return GARMENT_TYPES.filter((g) => g.parents.includes(parent))
    .map((g, i) => ({ g, i }))
    .sort((a, b) => rank(a.g) - rank(b.g) || a.i - b.i)
    .map(({ g }) => g);
}
