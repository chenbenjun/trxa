// 菜品分类
export type DishCategory =
  | "special" // 本店特色
  | "jianghu" // 江湖菜
  | "vegetable" // 素菜
  | "soup" // 汤类
  | "alcohol" // 酒水
  | "beverage"; // 饮料

// 标签分类
export type TagCategory =
  | "avoidance" // 忌口
  | "cooking" // 做法
  | "taste" // 口味
  | "portion" // 份量
  | "custom"; // 自定义

// 标签接口
export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
  icon?: string; // emoji图标
}

// 标签分类显示名称
export const TAG_CATEGORY_NAMES: Record<TagCategory, string> = {
  avoidance: "忌口",
  cooking: "做法",
  taste: "口味",
  portion: "份量",
  custom: "自定义"
};

// 预设标签数据
export const PRESET_TAGS: Record<TagCategory, Tag[]> = {
  avoidance: [
    { id: "avoid-cilantro", name: "不吃香菜", category: "avoidance", icon: "🌿" },
    { id: "avoid-spicy", name: "不吃辣", category: "avoidance", icon: "🌶️" },
    { id: "avoid-salty", name: "少盐", category: "avoidance", icon: "🧂" },
    { id: "avoid-sugar", name: "少糖", category: "avoidance", icon: "🍬" },
    { id: "avoid-egg", name: "不吃鸡蛋", category: "avoidance", icon: "🥚" },
    { id: "avoid-peanut", name: "花生过敏", category: "avoidance", icon: "🥜" },
    { id: "avoid-seafood", name: "海鲜过敏", category: "avoidance", icon: "🦐" },
    { id: "avoid-pork", name: "不吃猪肉", category: "avoidance", icon: "🥩" },
    { id: "avoid-beef", name: "不吃牛肉", category: "avoidance", icon: "🐮" },
  ],
  cooking: [
    { id: "cook-stir", name: "清炒", category: "cooking", icon: "🥘" },
    { id: "cook-spicy", name: "炝炒", category: "cooking", icon: "🔥" },
    { id: "cook-steam", name: "清蒸", category: "cooking", icon: "♨️" },
    { id: "cook-boil", name: "水煮", category: "cooking", icon: "🫕" },
    { id: "cook-fry", name: "油炸", category: "cooking", icon: "🍳" },
    { id: "cook-braise", name: "红烧", category: "cooking", icon: "🥫" },
    { id: "cook-broil", name: "烧烤", category: "cooking", icon: "🍖" },
  ],
  taste: [
    { id: "taste-spicy", name: "微辣", category: "taste", icon: "🌶️" },
    { id: "taste-medium", name: "中辣", category: "taste", icon: "🌶️" },
    { id: "taste-hot", name: "特辣", category: "taste", icon: "🔥" },
    { id: "taste-sour", name: "多醋", category: "taste", icon: "🍋" },
    { id: "taste-sweet", name: "多糖", category: "taste", icon: "🍯" },
    { id: "taste-salty", name: "多盐", category: "taste", icon: "🧂" },
    { id: "taste-green-onion", name: "多葱", category: "taste", icon: "🧅" },
    { id: "taste-garlic", name: "多蒜", category: "taste", icon: "🧄" },
  ],
  portion: [
    { id: "port-small", name: "小份", category: "portion", icon: "🥣" },
    { id: "port-medium", name: "中份", category: "portion", icon: "🍽️" },
    { id: "port-large", name: "大份", category: "portion", icon: "🥘" },
    { id: "port-double", name: "双倍", category: "portion", icon: "⭐" },
  ],
  custom: [
    { id: "custom-1", name: "少饭", category: "custom", icon: "🍚" },
    { id: "custom-2", name: "多饭", category: "custom", icon: "🍚" },
    { id: "custom-3", name: "加汤", category: "custom", icon: "🥣" },
    { id: "custom-4", name: "打包", category: "custom", icon: "📦" },
    { id: "custom-5", name: "外卖", category: "custom", icon: "🛵" },
  ]
};

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  price: number;
  image: string; // 主图片（向后兼容）
  images?: string[]; // 多图片数组
  description?: string;
  isAvailable: boolean;
  rating?: number; // 评分 0-5
  customTags?: string[]; // 自定义规格标签（可选）
}

// 购物车项目
export interface CartItem extends Dish {
  quantity: number;
  taste?: string[]; // 口味标签
  customTaste?: string; // 自定义口味
  avoidance?: string[]; // 忌口标签
}

// 订单信息
export interface Order {
  id: string;
  tableNumber: string;
  customerCount: number;
  items: CartItem[];
  totalAmount: number;
  createdAt: Date;
}

// 活跃订单接口（已下单但未结账的订单）
export interface ActiveOrder {
  orderId: string;
  tableNumber: string;
  customerCount: number;
  items: CartItem[];
  totalAmount: number;
  createdAt: string; // ISO时间戳
  status: 'active' | 'completed'; // active: 进行中, completed: 已结账
}

// 口味标签预设
export const TASTE_TAGS = [
  "清炒",
  "炝炒",
  "不要辣椒",
  "不要味精",
  "少盐",
  "多醋",
  "多放葱",
  "多放蒜",
];

// 忌口标签类型
export interface AvoidanceTag {
  id: string;
  name: string;
  icon?: string; // emoji图标
}

// 默认分类忌口标签
export const DEFAULT_AVOIDANCE_TAGS: Record<DishCategory, AvoidanceTag[]> = {
  special: [
    { id: "no-cilantro", name: "不吃香菜", icon: "🚫" },
    { id: "no-spicy", name: "不吃辣", icon: "🌶️" },
    { id: "less-salt", name: "少盐", icon: "🧂" },
    { id: "no-egg", name: "不吃鸡蛋", icon: "🥚" },
    { id: "peanut-allergy", name: "花生过敏", icon: "🥜" },
    { id: "seafood-allergy", name: "海鲜过敏", icon: "🦐" },
    { id: "no-pork", name: "不吃猪肉", icon: "🥩" },
  ],
  jianghu: [
    { id: "no-cilantro", name: "不吃香菜", icon: "🚫" },
    { id: "no-spicy", name: "不吃辣", icon: "🌶️" },
    { id: "less-salt", name: "少盐", icon: "🧂" },
    { id: "no-egg", name: "不吃鸡蛋", icon: "🥚" },
    { id: "peanut-allergy", name: "花生过敏", icon: "🥜" },
    { id: "seafood-allergy", name: "海鲜过敏", icon: "🦐" },
  ],
  vegetable: [
    { id: "no-cilantro", name: "不吃香菜", icon: "🚫" },
    { id: "no-spicy", name: "不吃辣", icon: "🌶️" },
    { id: "less-salt", name: "少盐", icon: "🧂" },
  ],
  soup: [
    { id: "no-cilantro", name: "不吃香菜", icon: "🚫" },
    { id: "less-salt", name: "少盐", icon: "🧂" },
  ],
  beverage: [
    { id: "ice", name: "加冰", icon: "🧊" },
    { id: "room-temp", name: "常温", icon: "🌡️" },
  ],
  alcohol: [], // 酒水不显示忌口按钮
};

// 忌口标签（保留用于向后兼容，现在由 DEFAULT_AVOIDANCE_TAGS 替代）
export const AVOIDANCE_TAGS = DEFAULT_AVOIDANCE_TAGS.special;

// 分类显示名称映射（默认可修改）
export let CATEGORY_NAMES: Record<DishCategory, string> = {
  special: "特色",
  jianghu: "江湖菜",
  vegetable: "素菜",
  soup: "汤类",
  alcohol: "酒水",
  beverage: "饮料",
};

// 更新分类名称的函数
export const updateCategoryNames = (newNames: Record<DishCategory, string>) => {
  CATEGORY_NAMES = { ...CATEGORY_NAMES, ...newNames };
};

// 分类颜色映射
export const CATEGORY_COLORS: Record<DishCategory, string> = {
  special: "bg-red-500",
  jianghu: "bg-orange-500",
  vegetable: "bg-green-500",
  soup: "bg-yellow-500",
  alcohol: "bg-purple-500",
  beverage: "bg-blue-500",
};
