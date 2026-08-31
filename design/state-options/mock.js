/* Stand-in data for the four candidates. Shapes match the storefront
   contracts closely enough to judge a layout; nothing here ships. */

export const CATEGORY = { slug: "bags", name: "Bags", nameAr: "شنط" };

export const PRODUCTS = [
  {
    kind: "bag",
    name: "Woven raffia tote",
    shop: "Nefertari",
    area: "Zamalek",
    price: 640,
  },
  {
    kind: "bag",
    name: "Canvas market bag",
    shop: "Dokki Denim",
    area: "Dokki",
    price: 285,
  },
  {
    kind: "bag",
    name: "Leather crossbody",
    shop: "Beit El Kotn",
    area: "Maadi",
    price: 1180,
  },
  {
    kind: "bag",
    name: "Quilted shoulder bag",
    shop: "Nefertari",
    area: "Zamalek",
    price: 870,
  },
  {
    kind: "bag",
    name: "Small suede pouch",
    shop: "Halawa",
    area: "Heliopolis",
    price: 340,
  },
  {
    kind: "bag",
    name: "Striped weekender",
    shop: "Dokki Denim",
    area: "Dokki",
    price: 1520,
  },
  {
    kind: "bag",
    name: "Beaded evening clutch",
    shop: "Sett El Sham",
    area: "Mohandessin",
    price: 760,
  },
  {
    kind: "bag",
    name: "Cotton drawstring sack",
    shop: "Beit El Kotn",
    area: "Maadi",
    price: 195,
  },
];

export const SHOPS = [
  {
    name: "Nefertari",
    area: "Zamalek",
    street: "Shagaret El Dor",
    pieces: 34,
    open: true,
  },
  {
    name: "Beit El Kotn",
    area: "Maadi",
    street: "Road 9",
    pieces: 21,
    open: true,
  },
  {
    name: "Dokki Denim",
    area: "Dokki",
    street: "Tahrir",
    pieces: 18,
    open: false,
  },
  {
    name: "Sett El Sham",
    area: "Mohandessin",
    street: "Gameat El Dowal",
    pieces: 12,
    open: true,
  },
];

export const SIBLINGS = [
  { kind: "shoe", name: "Shoes", count: 128 },
  { kind: "dress", name: "Dresses", count: 96 },
  { kind: "jacket", name: "Jackets", count: 74 },
  { kind: "cap", name: "Caps", count: 41 },
  { kind: "knit", name: "Knitwear", count: 63 },
  { kind: "shirt", name: "Shirts", count: 152 },
];

/** Latin figures in both languages, no decimals on a shelf price. */
export const egp = (n) => `${n.toLocaleString("en-US")} EGP`;
