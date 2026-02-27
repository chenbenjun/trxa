import { Dish, CartItem, Order, AvoidanceTag, DishCategory, DEFAULT_AVOIDANCE_TAGS } from "./types";
import { saveImageToDB, getImageFromDB, removeImageFromDB } from "./indexed-db";

// 本地存储键名
const STORAGE_KEYS = {
  DISHES: "taoran_dishes",
  ORDERS: "taoran_orders",
  BACKUP_DATE: "taoran_backup_date",
  PRINTER_IP: "taoran_printer_ip",
  AVOIDANCE_TAGS: "taoran_avoidance_tags", // 向后兼容
  AVOIDANCE_TAGS_BY_CATEGORY: "taoran_avoidance_tags_by_category", // 新的分类标签存储
  CUSTOM_BACKGROUND: "taoran_custom_background", // 自定义背景图片（存储在IndexedDB中，key保存在localStorage）
  CUSTOM_LOGO: "taoran_custom_logo", // 自定义Logo（存储在IndexedDB中，key保存在localStorage）
  BACKGROUND_OPACITY: "taoran_background_opacity", // 背景透明度
  BACKGROUND_BLUR: "taoran_background_blur", // 背景模糊度
  LOGO_SIZE: "taoran_logo_size", // Logo大小
  CART: "taoran_cart", // 购物车数据
  ACTIVE_ORDERS: "taoran_active_orders", // 活跃订单（已下单但未结账）
  COMPLETED_ORDERS: "taoran_completed_orders", // 已结账订单（用于今日汇总）
};

// 保存菜品数据到本地存储（图片存 IndexedDB，元数据存 localStorage）
export const saveDishes = async (dishes: Dish[]): Promise<{ success: boolean; message?: string }> => {
  try {
    // 1. 提取图片存 IndexedDB，元数据（不含大图）存 localStorage
    const dishesMeta = await Promise.all(
      dishes.map(async (dish) => {
        // 保存主图片到 IndexedDB
        if (dish.image && dish.image.startsWith('data:')) {
          await saveImageToDB(`dish_${dish.id}_main`, dish.image);
        }
        // 保存多张图片到 IndexedDB
        if (dish.images && dish.images.length > 0) {
          await Promise.all(
            dish.images.map(async (img, idx) => {
              if (img && img.startsWith('data:')) {
                await saveImageToDB(`dish_${dish.id}_img_${idx}`, img);
              }
            })
          );
        }
        
        // 返回元数据（图片只保留占位标识）
        return {
          ...dish,
          image: dish.image ? `__idb__dish_${dish.id}_main` : '',
          images: dish.images?.map((_, idx) => `__idb__dish_${dish.id}_img_${idx}`) || [],
        };
      })
    );

    // 2. 存元数据到 localStorage（体积小）
    const data = JSON.stringify(dishesMeta);
    localStorage.setItem(STORAGE_KEYS.DISHES, data);
    
    console.log(`保存了 ${dishes.length} 道菜品，元数据大小: ${(data.length * 2 / 1024).toFixed(2)} KB`);
    return { success: true };
  } catch (error) {
    console.error("保存菜品数据失败:", error);
    return {
      success: false,
      message: "保存失败，请重试"
    };
  }
};

// 从本地存储加载菜品数据（从 IndexedDB 加载图片）
export const loadDishes = async (): Promise<Dish[] | null> => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DISHES);
    if (!data) return null;
    
    const dishesMeta: Dish[] = JSON.parse(data);
    
    // 从 IndexedDB 加载图片并合并
    const dishes = await Promise.all(
      dishesMeta.map(async (dish) => {
        // 加载主图片
        if (dish.image && dish.image.startsWith('__idb__')) {
          const realImage = await getImageFromDB(`dish_${dish.id}_main`);
          dish.image = realImage || '';
        }
        // 加载多张图片
        if (dish.images && dish.images.length > 0) {
          const realImages = await Promise.all(
            dish.images.map(async (_, idx) => {
              return await getImageFromDB(`dish_${dish.id}_img_${idx}`) || '';
            })
          );
          dish.images = realImages.filter(img => img !== '');
        }
        return dish;
      })
    );
    
    return dishes;
  } catch (error) {
    console.error("加载菜品数据失败:", error);
    return null;
  }
};

// 保存订单到本地存储
export const saveOrder = (order: Order): void => {
  try {
    const orders = loadOrders() || [];
    orders.unshift(order); // 新订单放在最前面
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error("保存订单失败:", error);
  }
};

// 从本地存储加载订单
export const loadOrders = (): Order[] | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("加载订单失败:", error);
    return null;
  }
};

// 检查是否需要备份（每周一次）
export const shouldBackup = (): boolean => {
  try {
    const lastBackup = localStorage.getItem(STORAGE_KEYS.BACKUP_DATE);
    if (!lastBackup) return true;

    const lastBackupDate = new Date(lastBackup);
    const now = new Date();
    const daysSinceBackup = Math.floor((now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceBackup >= 7;
  } catch (error) {
    console.error("检查备份失败:", error);
    return true;
  }
};

// 更新备份日期
export const updateBackupDate = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKUP_DATE, new Date().toISOString());
  } catch (error) {
    console.error("更新备份日期失败:", error);
  }
};

// 导出数据为JSON（用于备份）
export const exportData = (): string => {
  try {
    const dishes = localStorage.getItem(STORAGE_KEYS.DISHES);
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const data = {
      dishes: dishes ? JSON.parse(dishes) : [],
      orders: orders ? JSON.parse(orders) : [],
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("导出数据失败:", error);
    return "";
  }
};

// 保存打印机IP地址
export const savePrinterIP = (ip: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRINTER_IP, ip);
  } catch (error) {
    console.error("保存打印机IP失败:", error);
  }
};

// 获取打印机IP地址
export const getPrinterIP = (): string => {
  try {
    const ip = localStorage.getItem(STORAGE_KEYS.PRINTER_IP);
    return ip || "192.168.0.113"; // 默认IP（用户提供的打印机IP）
  } catch (error) {
    console.error("获取打印机IP失败:", error);
    return "192.168.0.113";
  }
};

// 保存忌口标签
export const saveAvoidanceTags = (tags: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AVOIDANCE_TAGS, JSON.stringify(tags));
  } catch (error) {
    console.error("保存忌口标签失败:", error);
  }
};

// 获取忌口标签
export const getAvoidanceTags = (): string[] => {
  try {
    const tags = localStorage.getItem(STORAGE_KEYS.AVOIDANCE_TAGS);
    return tags ? JSON.parse(tags) : [
      "忌糖",
      "忌辣",
      "忌生",
      "忌冷",
      "忌油",
      "忌海鲜",
      "忌牛肉",
      "忌羊肉",
      "忌香菜",
      "忌花生",
    ];
  } catch (error) {
    console.error("获取忌口标签失败:", error);
    return [
      "忌糖",
      "忌辣",
      "忌生",
      "忌冷",
      "忌油",
      "忌海鲜",
      "忌牛肉",
      "忌羊肉",
      "忌香菜",
      "忌花生",
    ];
  }
};

// 保存按类别分组的忌口标签
export const saveAvoidanceTagsByCategory = (tagsByCategory: Record<DishCategory, AvoidanceTag[]>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AVOIDANCE_TAGS_BY_CATEGORY, JSON.stringify(tagsByCategory));
  } catch (error) {
    console.error("保存分类忌口标签失败:", error);
  }
};

// 获取按类别分组的忌口标签
export const getAvoidanceTagsByCategory = (): Record<DishCategory, AvoidanceTag[]> => {
  try {
    const tagsByCategory = localStorage.getItem(STORAGE_KEYS.AVOIDANCE_TAGS_BY_CATEGORY);
    return tagsByCategory ? JSON.parse(tagsByCategory) : DEFAULT_AVOIDANCE_TAGS;
  } catch (error) {
    console.error("获取分类忌口标签失败:", error);
    return DEFAULT_AVOIDANCE_TAGS;
  }
};

// 保存自定义背景图片（使用IndexedDB）
export const saveCustomBackground = async (imageData: string): Promise<void> => {
  try {
    await saveImageToDB(STORAGE_KEYS.CUSTOM_BACKGROUND, imageData);
  } catch (error) {
    console.error("保存背景图片失败:", error);
    alert("背景图片保存失败，请重试");
  }
};

// 获取自定义背景图片（从IndexedDB）
export const getCustomBackground = async (): Promise<string | null> => {
  try {
    return await getImageFromDB(STORAGE_KEYS.CUSTOM_BACKGROUND);
  } catch (error) {
    console.error("获取背景图片失败:", error);
    return null;
  }
};

// 保存自定义Logo（使用IndexedDB）
export const saveCustomLogo = async (imageData: string): Promise<void> => {
  try {
    await saveImageToDB(STORAGE_KEYS.CUSTOM_LOGO, imageData);
  } catch (error) {
    console.error("保存Logo失败:", error);
    alert("Logo保存失败，请重试");
  }
};

// 获取自定义Logo（从IndexedDB）
export const getCustomLogo = async (): Promise<string | null> => {
  try {
    return await getImageFromDB(STORAGE_KEYS.CUSTOM_LOGO);
  } catch (error) {
    console.error("获取Logo失败:", error);
    return null;
  }
};

// 删除自定义背景图片
export const removeCustomBackground = async (): Promise<void> => {
  try {
    await removeImageFromDB(STORAGE_KEYS.CUSTOM_BACKGROUND);
  } catch (error) {
    console.error("删除背景图片失败:", error);
  }
};

// 删除自定义Logo
export const removeCustomLogo = async (): Promise<void> => {
  try {
    await removeImageFromDB(STORAGE_KEYS.CUSTOM_LOGO);
  } catch (error) {
    console.error("删除Logo失败:", error);
  }
};

// 保存背景透明度
export const saveBackgroundOpacity = (opacity: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_OPACITY, opacity.toString());
  } catch (error) {
    console.error("保存背景透明度失败:", error);
  }
};

// 获取背景透明度
export const getBackgroundOpacity = (): number => {
  try {
    const opacity = localStorage.getItem(STORAGE_KEYS.BACKGROUND_OPACITY);
    return opacity ? parseInt(opacity, 10) : 60; // 默认60%
  } catch (error) {
    console.error("获取背景透明度失败:", error);
    return 60;
  }
};

// 保存背景模糊度
export const saveBackgroundBlur = (blur: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.BACKGROUND_BLUR, blur.toString());
  } catch (error) {
    console.error("保存背景模糊度失败:", error);
  }
};

// 获取背景模糊度
export const getBackgroundBlur = (): number => {
  try {
    const blur = localStorage.getItem(STORAGE_KEYS.BACKGROUND_BLUR);
    return blur ? parseInt(blur, 10) : 0; // 默认0（不模糊）
  } catch (error) {
    console.error("获取背景模糊度失败:", error);
    return 0;
  }
};

// 保存Logo大小（百分比，相对于侧边栏高度）
export const saveLogoSize = (size: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGO_SIZE, size.toString());
  } catch (error) {
    console.error("保存Logo大小失败:", error);
  }
};

// 获取Logo大小（百分比，相对于侧边栏高度）
export const getLogoSize = (): number => {
  try {
    const size = localStorage.getItem(STORAGE_KEYS.LOGO_SIZE);
    if (size) {
      const parsedSize = parseInt(size, 10);
      // 如果保存的是旧版本的像素值（>30），转换为百分比
      if (parsedSize > 30) {
        // 将像素值转换为百分比（假设原始范围32-200px对应10%-30%）
        const percent = Math.round(10 + ((parsedSize - 32) / (200 - 32)) * 20);
        // 保存新的百分比值
        saveLogoSize(percent);
        return percent;
      }
      return parsedSize;
    }
    return 15; // 默认15%
  } catch (error) {
    console.error("获取Logo大小失败:", error);
    return 15;
  }
};

// 保存购物车数据到本地存储
export const saveCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (error) {
    console.error("保存购物车数据失败:", error);
  }
};

// 从本地存储加载购物车数据
export const loadCart = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem(STORAGE_KEYS.CART);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("加载购物车数据失败:", error);
    return [];
  }
};

// 清空购物车数据
export const clearCart = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CART);
  } catch (error) {
    console.error("清空购物车数据失败:", error);
  }
};

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

// 保存活跃订单列表
export const saveActiveOrders = (orders: ActiveOrder[]): void => {
  try {
    console.log('保存活跃订单列表，数量:', orders.length);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDERS, JSON.stringify(orders));
    console.log('活跃订单列表已保存到localStorage');
  } catch (error) {
    console.error("保存活跃订单失败:", error);
  }
};

// 获取活跃订单列表
export const getActiveOrders = (): ActiveOrder[] => {
  try {
    const ordersData = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDERS);
    console.log('从localStorage读取活跃订单数据:', ordersData ? '找到数据' : '未找到数据');
    
    if (!ordersData) return [];
    
    const orders = JSON.parse(ordersData);
    console.log('解析活跃订单数据，数量:', orders.length);
    
    // 去重：按 orderId 去重，保留最新的一个
    const uniqueOrders = orders.filter((order: ActiveOrder, index: number, self: ActiveOrder[]) => {
      return self.findIndex(o => o.orderId === order.orderId) === index;
    });
    
    // 如果有重复，保存去重后的列表
    if (uniqueOrders.length !== orders.length) {
      console.log('发现重复订单，已去重:', orders.length, '->', uniqueOrders.length);
      saveActiveOrders(uniqueOrders);
    }
    
    return uniqueOrders;
  } catch (error) {
    console.error("获取活跃订单失败:", error);
    return [];
  }
};

// 添加或更新活跃订单（按订单号）
export const addOrUpdateActiveOrder = (order: ActiveOrder): void => {
  try {
    console.log('addOrUpdateActiveOrder 开始处理订单:', order.orderId, '桌号:', order.tableNumber);
    
    const activeOrders = getActiveOrders();
    console.log('当前活跃订单数量:', activeOrders.length);
    
    // 查找是否已存在该订单号的订单
    const existingIndex = activeOrders.findIndex(o => o.orderId === order.orderId);
    
    if (existingIndex !== -1) {
      console.log('找到已存在的订单，准备合并菜品');
      // 如果存在，合并菜品项（加菜）
      const existingOrder = activeOrders[existingIndex];
      const mergedItems = [...existingOrder.items];
      
      order.items.forEach(newItem => {
        const existingItemIndex = mergedItems.findIndex(
          i => i.id === newItem.id && 
               JSON.stringify(i.taste) === JSON.stringify(newItem.taste) &&
               i.customTaste === newItem.customTaste &&
               JSON.stringify(i.avoidance) === JSON.stringify(newItem.avoidance)
        );
        
        if (existingItemIndex !== -1) {
          // 合并数量
          mergedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          // 添加新菜品
          mergedItems.push(newItem);
        }
      });
      
      // 更新订单
      activeOrders[existingIndex] = {
        ...existingOrder,
        items: mergedItems,
        totalAmount: mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        createdAt: order.createdAt, // 更新为最新操作时间
      };
      
      console.log('订单已更新');
    } else {
      console.log('新订单，添加到列表');
      // 新订单
      activeOrders.push(order);
    }
    
    saveActiveOrders(activeOrders);
    console.log('活跃订单已保存，总数:', activeOrders.length);
  } catch (error) {
    console.error("添加或更新活跃订单失败:", error);
  }
};

// 获取指定桌号的活跃订单
export const getActiveOrderByTable = (tableNumber: string): ActiveOrder | null => {
  try {
    const activeOrders = getActiveOrders();
    return activeOrders.find(o => o.tableNumber === tableNumber) || null;
  } catch (error) {
    console.error("获取桌号活跃订单失败:", error);
    return null;
  }
};

// 完成订单（结账）- 将订单移至已完成订单列表
export const completeOrder = (tableNumber: string): ActiveOrder | null => {
  try {
    const activeOrders = getActiveOrders();
    const orderToComplete = activeOrders.find(o => o.tableNumber === tableNumber);
    
    if (!orderToComplete) {
      console.warn(`未找到桌号 ${tableNumber} 的活跃订单`);
      return null;
    }
    
    // 标记订单为已完成
    const completedOrder: ActiveOrder = {
      ...orderToComplete,
      status: 'completed',
    };
    
    // 保存到已完成订单列表
    const completedOrders = getCompletedOrders();
    completedOrders.push(completedOrder);
    saveCompletedOrders(completedOrders);
    
    // 从活跃订单列表中移除
    const filteredOrders = activeOrders.filter(o => o.tableNumber !== tableNumber);
    saveActiveOrders(filteredOrders);
    
    return completedOrder;
  } catch (error) {
    console.error("完成订单失败:", error);
    return null;
  }
};

// 保存已完成订单列表
export const saveCompletedOrders = (orders: ActiveOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPLETED_ORDERS, JSON.stringify(orders));
  } catch (error) {
    console.error("保存已完成订单失败:", error);
  }
};

// 获取已完成订单列表
export const getCompletedOrders = (): ActiveOrder[] => {
  try {
    const ordersData = localStorage.getItem(STORAGE_KEYS.COMPLETED_ORDERS);
    if (!ordersData) return [];
    return JSON.parse(ordersData);
  } catch (error) {
    console.error("获取已完成订单失败:", error);
    return [];
  }
};

// 获取今日已完成订单
export const getTodayCompletedOrders = (): ActiveOrder[] => {
  try {
    const completedOrders = getCompletedOrders();

    // 获取今天的日期字符串（格式：YYYY-MM-DD）
    const today = new Date();
    const todayStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Shanghai' // 使用中国时区确保准确性
    }).replace(/\//g, '-');

    return completedOrders.filter(order => {
      // 将订单的创建时间也转换为本地日期字符串
      const orderDate = new Date(order.createdAt);
      const orderDateStr = orderDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Shanghai'
      }).replace(/\//g, '-');

      // 比较日期字符串
      return orderDateStr === todayStr;
    });
  } catch (error) {
    console.error("获取今日已完成订单失败:", error);
    return [];
  }
};

// 清空历史已完成订单（保留今天的）
export const clearOldCompletedOrders = (): void => {
  try {
    const todayOrders = getTodayCompletedOrders();
    saveCompletedOrders(todayOrders);
  } catch (error) {
    console.error("清空历史已完成订单失败:", error);
  }
};

// 清空所有已完成订单（包括今天的）
export const clearAllCompletedOrders = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.COMPLETED_ORDERS);
  } catch (error) {
    console.error("清空所有已完成订单失败:", error);
  }
};
