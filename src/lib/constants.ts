export interface ProductDefinition {
  id: string;
  name: string;
  flavor: string;
  keyIngredients: string;
  caffeineMg: number;
  volumeMl: number;
  priceInr: number;
  accentColor: string;
  shadowClass: string;
  badgeClass: string;
  description: string;
  tagline: string;
  imagePath: string;
}

export const VYRA_FLAVORS: ProductDefinition[] = [
  {
    id: "VP-CIT-001",
    name: "Vyra Pulse Citrus Charge",
    flavor: "Citrus (Lemon-Lime)",
    keyIngredients: "Lemon; Lime; Green Tea Extract; B-Vitamins; Electrolytes",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#CCFF00",
    shadowClass: "shadow-flavor-citrus",
    badgeClass: "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30",
    description: "Crisp lemon-lime rush paired with green tea extract and bio-available electrolytes for sharp, sustained mental clarity.",
    tagline: "Instant Focus. Zero Sugar Crash.",
    imagePath: "/assets/products/citrus-charge.svg",
  },
  {
    id: "VP-BLU-002",
    name: "Vyra Pulse Blueberry Blast",
    flavor: "Blueberry",
    keyIngredients: "Blueberry Flavor; Acai Flavor; Caffeine; L-Theanine; B-Vitamins",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#38BDF8",
    shadowClass: "shadow-flavor-blueberry",
    badgeClass: "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30",
    description: "Antioxidant-dense wild blueberry & acai blend synergized with L-theanine for smooth, jitter-free flow state.",
    tagline: "Deep Flow State.",
    imagePath: "/assets/products/blueberry-blast.svg",
  },
  {
    id: "VP-MAN-003",
    name: "Vyra Pulse Mango Fusion",
    flavor: "Mango",
    keyIngredients: "Mango Flavor; Caffeine; Ginseng Extract; B-Vitamins; Electrolytes",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#F59E0B",
    shadowClass: "shadow-flavor-mango",
    badgeClass: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
    description: "Sun-drenched Alphonso mango infusion fortified with Korean panax ginseng to supercharge endurance and reflex speed.",
    tagline: "Max Endurance Surge.",
    imagePath: "/assets/products/mango-fusion.svg",
  },
  {
    id: "VP-WAT-004",
    name: "Vyra Pulse Watermelon Rush",
    flavor: "Watermelon",
    keyIngredients: "Watermelon Flavor; Coconut Water; Caffeine; Electrolytes; B-Vitamins",
    caffeineMg: 70,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#F43F5E",
    shadowClass: "shadow-flavor-watermelon",
    badgeClass: "bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30",
    description: "Crisp summer watermelon fused with natural coconut water hydration for rapid biological rehydration and stamina.",
    tagline: "Ultra Rapid Hydration.",
    imagePath: "/assets/products/watermelon-rush.svg",
  },
  {
    id: "VP-GRA-005",
    name: "Vyra Pulse Grape Surge",
    flavor: "Grape",
    keyIngredients: "Grape Flavor; Caffeine; Ginseng Extract; B-Vitamins",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#A855F7",
    shadowClass: "shadow-flavor-grape",
    badgeClass: "bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/30",
    description: "Deep Concord dark grape elixir loaded with neuro-stimulants and vitality vitamins for intensive late-night sessions.",
    tagline: "Electrified Vitality.",
    imagePath: "/assets/products/grape-surge.svg",
  },
  {
    id: "VP-GUA-006",
    name: "Vyra Pulse Pink Guava Spark",
    flavor: "Pink Guava",
    keyIngredients: "Pink Guava Flavor; Caffeine; B-Vitamins; Electrolytes",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#EC4899",
    shadowClass: "shadow-flavor-guava",
    badgeClass: "bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/30",
    description: "Exotic pink guava spark delivering a tropical rush of energizing B-complex vitamins and cellular electrolytes.",
    tagline: "Tropical Energy Ignition.",
    imagePath: "/assets/products/pink-guava-spark.svg",
  },
  {
    id: "VP-MIN-007",
    name: "Vyra Pulse Icy Mint Freeze",
    flavor: "Mint",
    keyIngredients: "Mint Flavor; Caffeine; L-Theanine; Electrolytes; B-Vitamins",
    caffeineMg: 70,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#14B8A6",
    shadowClass: "shadow-flavor-mint",
    badgeClass: "bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/30",
    description: "Sub-zero glacial spearmint blast for immediate thermal cooling, heightened airway clarity, and crisp neuro-focus.",
    tagline: "Sub-Zero Neural Reset.",
    imagePath: "/assets/products/icy-mint-freeze.svg",
  },
  {
    id: "VP-PEA-008",
    name: "Vyra Pulse Peach Boost",
    flavor: "Peach",
    keyIngredients: "Peach Flavor; Caffeine; Ginseng Extract; B-Vitamins; Electrolytes",
    caffeineMg: 80,
    volumeMl: 330,
    priceInr: 149.0,
    accentColor: "#FB923C",
    shadowClass: "shadow-flavor-peach",
    badgeClass: "bg-[#FB923C]/10 text-[#FB923C] border-[#FB923C]/30",
    description: "Velvety white peach infused with active adaptogens and bio-fermented caffeine for clean, uplifting motivation.",
    tagline: "Adaptive Mood & Power.",
    imagePath: "/assets/products/peach-boost.svg",
  },
];

export const BRAND_ASSETS = {
  logo: "/assets/branding/Logo.png",
  drinksHero: "/assets/branding/all-8-flavors-hero.jpg",
  allFlavorsHero: "/assets/branding/all-8-flavors-hero.jpg",
};

export const STORE_POLICIES = {
  freeShippingThreshold: 445.0,
  defaultDeliveryFee: 50.0,
  pointsPerCan: 10,
  currency: "INR",
};
