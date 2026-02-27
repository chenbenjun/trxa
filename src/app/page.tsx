"use client";

import { useState, useEffect, useRef } from "react";
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Dish, DishCategory, CartItem, CATEGORY_NAMES, TASTE_TAGS, DEFAULT_AVOIDANCE_TAGS, AvoidanceTag, ActiveOrder, TagCategory, Tag, TAG_CATEGORY_NAMES, PRESET_TAGS } from "@/lib/types";
import { sampleDishes, DEFAULT_TABLES, DEFAULT_PEOPLE } from "@/lib/data";
import { saveDishes, loadDishes, saveOrder, shouldBackup, updateBackupDate, exportData, savePrinterIP, getPrinterIP, saveAvoidanceTags, getAvoidanceTags, getAvoidanceTagsByCategory, saveAvoidanceTagsByCategory, saveCustomBackground, getCustomBackground, saveCustomLogo, getCustomLogo, saveBackgroundOpacity, getBackgroundOpacity, saveBackgroundBlur, getBackgroundBlur, saveLogoSize, getLogoSize, saveCart, loadCart, clearCart, getActiveOrders, addOrUpdateActiveOrder, completeOrder, getCompletedOrders, getTodayCompletedOrders, clearOldCompletedOrders, clearAllCompletedOrders } from "@/lib/storage";
import { fileToBase64, filesToBase64Array, compressImages, createPlaceholderImage, isValidImageBase64 } from "@/lib/image-utils";
import { printOrder, printTest } from "@/lib/print";
import { ShoppingCart, Plus, Minus, Trash2, Printer, Users, Table, X, Check, Settings, Eye, Image as ImageIcon, Maximize2, Minimize2, Printer as PrinterIcon, Search, Flame, Utensils, DollarSign, Cog, Clock, Bell, Leaf, Coffee, Wine, ChevronLeft, ChevronRight, ChevronDown, Crop as CropIcon, Star, StarHalf } from "lucide-react";
import Image from "next/image";

export default function Home() {
  // ============ 状态管理 ============
  const [selectedCategory, setSelectedCategory] = useState<DishCategory>("special");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("15");
  const [customerCount, setCustomerCount] = useState("0");
  const [orderId, setOrderId] = useState("2026022301");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(sampleDishes);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 管理模式相关
  const [isEditMode, setIsEditMode] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DishCategory>("special");
  const [uploadImage, setUploadImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [uploadImages, setUploadImages] = useState<string[]>([]); // 多张图片的预览URL
  const [uploadName, setUploadName] = useState("");
  const [uploadPrice, setUploadPrice] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");

  // 编辑菜品相关
  const [editDishDialog, setEditDishDialog] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editPreview, setEditPreview] = useState<string>("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editTagExpandedCategory, setEditTagExpandedCategory] = useState<TagCategory | null>(null); // 编辑菜品时展开的标签分类
  const [customTagInput, setCustomTagInput] = useState(""); // 自定义标签输入
  
  // 查看菜品详情
  const [viewDishDialog, setViewDishDialog] = useState(false);
  const [viewingDish, setViewingDish] = useState<Dish | null>(null);

  // 全屏图片浏览相关
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [isTouching, setIsTouching] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 拖拽排序相关
  const [draggedDishId, setDraggedDishId] = useState<number | null>(null);

  // 活跃订单相关
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [selectedActiveOrder, setSelectedActiveOrder] = useState<ActiveOrder | null>(null);
  const [showOrderDetailDialog, setShowOrderDetailDialog] = useState(false);
  const [isAddingDishes, setIsAddingDishes] = useState(false);
  const [showPrintPreviewDialog, setShowPrintPreviewDialog] = useState(false);
  const [printPreviewOrder, setPrintPreviewOrder] = useState<ActiveOrder | null>(null);

  // 已完成订单相关（今日汇总）
  const [completedOrders, setCompletedOrders] = useState<ActiveOrder[]>([]);

  // 打开图片浏览
  const openImageViewer = (dish: Dish) => {
    // 确保 images 是有效的数组，回退到主图片
    const images = dish.images && dish.images.length > 0 && dish.images[0]
      ? dish.images
      : (dish.image ? [dish.image] : []);
    
    if (images.length === 0) {
      alert('该菜品没有图片');
      return;
    }
    
    setViewingImages(images);
    setCurrentImageIndex(0);
    setSlideDirection(null);
    setIsAnimating(false);
    setImageViewerOpen(true);
  };

  // 切换图片
  const changeImage = (direction: 'prev' | 'next', withAnimation = true) => {
    if (isAnimating && withAnimation) return;
    
    const newDirection = direction === 'prev' ? 'right' : 'left';
    setSlideDirection(newDirection);
    
    if (withAnimation) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 250); // 优化动画时长为250ms
    }
    
    setCurrentImageIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? viewingImages.length - 1 : prev - 1;
      } else {
        return prev === viewingImages.length - 1 ? 0 : prev + 1;
      }
    });
  };

  // 生成打印预览内容
  const generatePrintPreviewContent = (order: ActiveOrder): string => {
    let content = '================================\n';
    content += '            陶然小灶\n';
    content += '           消费明细单\n';
    content += '================================\n\n';
    content += `桌号：${order.tableNumber}号桌\n`;
    content += `订单号：${order.orderId}\n`;
    content += `人数：${formatCustomerCount(order.customerCount)}\n`;
    content += `时间：${new Date(order.createdAt).toLocaleString('zh-CN')}\n`;
    content += '--------------------------------\n';
    content += '菜品明细：\n\n';
    
    order.items.forEach((item, index) => {
      const tags = [];
      if (item.customTags && item.customTags.length > 0) {
        tags.push(...item.customTags);
      }
      const tagStr = tags.length > 0 ? ` (${tags.join('、')})` : '';
      
      content += `${index + 1}. ${item.name}${tagStr}\n`;
      content += `   单价：¥${item.price}  数量：${item.quantity}\n`;
      content += `   小计：¥${(item.price * item.quantity).toFixed(2)}\n`;
      content += '--------------------------------\n';
    });
    
    content += `\n合计：¥${order.totalAmount.toFixed(2)}\n`;
    content += '================================\n';
    content += '          感谢您的光临！\n';
    content += '================================\n';
    
    return content;
  };

  // 触摸滑动处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setIsTouching(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTouching || isAnimating) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    
    // 滑动距离超过80px，则判定为切换图片（符合iPad原生体验）
    if (Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        // 向右滑动，显示上一张
        changeImage('prev');
      } else {
        // 向左滑动，显示下一张
        changeImage('next');
      }
    }
    
    setIsTouching(false);
  };
  
  // 口味和忌口选择
  const [tasteSelections, setTasteSelections] = useState<Record<string, { tags: string[]; custom: string }>>({});
  const [avoidanceSelections, setAvoidanceSelections] = useState<Record<string, string[]>>({});
  const [showAvoidanceDialog, setShowAvoidanceDialog] = useState(false);
  const [currentAvoidanceDish, setCurrentAvoidanceDish] = useState<Dish | null>(null);
  
  // 忌口标签管理
  const [avoidanceTagsByCategory, setAvoidanceTagsByCategory] = useState<Record<DishCategory, AvoidanceTag[]>>(DEFAULT_AVOIDANCE_TAGS);
  const [showAvoidanceManagement, setShowAvoidanceManagement] = useState(false);
  const [newAvoidanceTagName, setNewAvoidanceTagName] = useState("");
  const [newAvoidanceTagIcon, setNewAvoidanceTagIcon] = useState("");
  const [managingCategory, setManagingCategory] = useState<DishCategory>("special");
  
  // 打印机设置
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  
  // 打印确认对话框
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  
  // 菜品标签选择相关
  const [showTagSelectDialog, setShowTagSelectDialog] = useState(false);
  const [currentTagDish, setCurrentTagDish] = useState<CartItem | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 当前导航项
  const [currentNav, setCurrentNav] = useState<"dish" | "progress" | "bill" | "manage">("dish");
  
  // 管理子导航
  const [manageSubNav, setManageSubNav] = useState<"image" | "price" | "tags" | "add" | "background" | "logo" | "printer">("image");
  
  // 标签管理相关
  const [tagManageCategory, setTagManageCategory] = useState<TagCategory>("avoidance");
  const [customTags, setCustomTags] = useState<Record<TagCategory, Tag[]>>(PRESET_TAGS);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagIcon, setNewTagIcon] = useState("");
  
  // 增加菜品标签选择
  const [uploadSelectedTags, setUploadSelectedTags] = useState<Tag[]>([]);
  
  // 图片管理分类筛选
  const [imageManageCategory, setImageManageCategory] = useState<DishCategory>("special");
  
  // 价格管理分类筛选
  const [priceManageCategory, setPriceManageCategory] = useState<DishCategory>("special");
  
  // 界面设置相关
  const [customBackground, setCustomBackground] = useState<string>("");
  const [customLogo, setCustomLogo] = useState<string>("");
  const [logoSizePercent, setLogoSizePercent] = useState<number>(15); // Logo大小（百分比）默认15%
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(60); // 背景透明度 0-100
  const [backgroundBlur, setBackgroundBlur] = useState<number>(0); // 背景模糊度 0-20
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<File | null>(null);
  
  // Logo裁剪相关
  const [showLogoCropDialog, setShowLogoCropDialog] = useState(false);
  const [logoImageSrc, setLogoImageSrc] = useState<string>("");
  const [logoCrop, setLogoCrop] = useState<Crop>();
  const [logoImageRef, setLogoImageRef] = useState<HTMLImageElement | null>(null);

  // 菜品份数状态
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});

  // 增加份数
  const handleAddQuantity = (dishId: string) => {
    // 更新菜品份数显示
    setDishQuantities(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1
    }));
    
    // 同步更新购物车
    const dish = dishes.find(d => d.id === dishId);
    if (dish) {
      addToCart(dish);
    }
  };

  // 减少份数
  const handleRemoveQuantity = (dishId: string) => {
    // 更新菜品份数显示
    setDishQuantities(prev => {
      const currentQuantity = prev[dishId] || 0;
      if (currentQuantity <= 0) return prev;
      return {
        ...prev,
        [dishId]: currentQuantity - 1
      };
    });
    
    // 同步更新购物车
    updateQuantity(dishId, -1);
  };

  // 切换份数（点击按钮：0→+1，>0→-1）
  const handleToggleQuantity = (dishId: string) => {
    const currentQuantity = dishQuantities[dishId] || 0;
    if (currentQuantity === 0) {
      handleAddQuantity(dishId);
    } else {
      handleRemoveQuantity(dishId);
    }
  };

  // 格式化人数显示
  const formatCustomerCount = (count: string | number) => {
    const countStr = String(count);
    if (!count || countStr === "" || countStr === "0") {
      return "（）人";
    }
    return `${countStr}人`;
  };

  // 桌号变化处理：重置加菜模式并生成新订单号（保留购物车内容）
  const handleTableNumberChange = (newTableNumber: string) => {
    // 检查桌号是否真的改变了
    if (newTableNumber !== tableNumber) {
      console.log(`桌号变化: ${tableNumber} -> ${newTableNumber}`);
      
      // 重置加菜模式
      if (isAddingDishes) {
        console.log('退出加菜模式');
        setIsAddingDishes(false);
      }
      
      // 生成新的订单号
      const date = new Date();
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const orderCountKey = `dailyOrderCount_${dateStr}`;
      const todayOrderCount = parseInt(localStorage.getItem(orderCountKey) || '0', 10);
      
      // 增加计数器（切换桌号需要新的订单号）
      localStorage.setItem(orderCountKey, String(todayOrderCount + 1));
      
      const newOrderId = `${dateStr}${String(todayOrderCount + 1).padStart(2, '0')}`;
      setOrderId(newOrderId);
      console.log(`生成新订单号: ${newOrderId}`);
      
      // 保留购物车内容，只提示用户
      console.log(`已切换到${newTableNumber}号桌，订单号已更新，购物车内容保留`);
      console.log(`购物车当前有 ${cart.length} 个菜品`);
      
      // 提示用户
      console.log(`桌号已切换到 ${newTableNumber}，订单号已更新为 ${newOrderId}`);
    }
    
    // 设置新的桌号
    setTableNumber(newTableNumber);
  };

  // ============ 初始化 ============
  useEffect(() => {
    const init = async () => {
      // 确保只在客户端运行
      if (typeof window === 'undefined') return;
      
      const savedDishes = await loadDishes();
      if (savedDishes) {
        setDishes(savedDishes);
      }
    
    const savedAvoidanceTagsByCategory = getAvoidanceTagsByCategory();
    setAvoidanceTagsByCategory(savedAvoidanceTagsByCategory);
    
    // 加载自定义背景和Logo（使用异步函数）
    const loadCustomImages = async () => {
      const savedBackground = await getCustomBackground();
      console.log('加载背景图片:', savedBackground ? '找到' : '未找到');
      if (savedBackground) {
        setCustomBackground(savedBackground);
      }
      
      const savedLogo = await getCustomLogo();
      console.log('加载Logo:', savedLogo ? '找到' : '未找到');
      if (savedLogo) {
        setCustomLogo(savedLogo);
      }
    };
    loadCustomImages();
    
    // 加载背景透明度
    const savedOpacity = getBackgroundOpacity();
    console.log('加载背景透明度:', savedOpacity);
    setBackgroundOpacity(savedOpacity);
    
    // 加载Logo大小
    const savedLogoSize = getLogoSize();
    console.log('加载Logo大小:', savedLogoSize);
    setLogoSizePercent(savedLogoSize);
    
    // 加载背景模糊度
    const savedBlur = getBackgroundBlur();
    console.log('加载背景模糊度:', savedBlur);
    setBackgroundBlur(savedBlur);
    
    // 加载购物车数据
    const savedCart = loadCart();
    if (savedCart && savedCart.length > 0) {
      console.log('加载购物车数据:', savedCart.length, '个菜品');
      setCart(savedCart);
      // 恢复菜品份数显示
      const quantities: Record<number, number> = {};
      savedCart.forEach(item => {
        quantities[parseInt(item.id)] = item.quantity;
      });
      setDishQuantities(quantities);
    }
    
    // 加载活跃订单
    const savedActiveOrders = getActiveOrders();
    if (savedActiveOrders) {
      console.log('加载活跃订单:', savedActiveOrders.length, '个');
      
      // 去重：按 orderId 去重，保留最新的一个
      const uniqueOrders = savedActiveOrders.filter((order: ActiveOrder, index: number, self: ActiveOrder[]) => {
        return self.findIndex(o => o.orderId === order.orderId) === index;
      });
      
      // 如果有重复，保存去重后的列表
      if (uniqueOrders.length !== savedActiveOrders.length) {
        console.log('发现重复订单，已去重:', savedActiveOrders.length, '->', uniqueOrders.length);
        setActiveOrders(uniqueOrders);
      } else {
        setActiveOrders(savedActiveOrders);
      }
    }
    
    // 生成订单号（年月日+当日序号）
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const orderCountKey = `dailyOrderCount_${dateStr}`;
    
    // 从localStorage读取当日订单数，如果没有则为0
    const todayOrderCount = parseInt(localStorage.getItem(orderCountKey) || '0', 10);
    const nextOrderNumber = todayOrderCount + 1;
    const orderId = `${dateStr}${String(nextOrderNumber).padStart(2, '0')}`;
    
    setOrderId(orderId);
    
    // 加载今日已完成订单
    const todayCompleted = getTodayCompletedOrders();
    console.log('加载今日已完成订单:', todayCompleted.length, '个');
    setCompletedOrders(todayCompleted);
    };
    
    init();
  }, []);

  // 监听菜品变化，自动更新购物车中的菜品信息
  useEffect(() => {
    if (cart.length === 0) return;
    
    setCart(prev => prev.map(item => {
      const updatedDish = dishes.find(d => d.id === item.id);
      if (!updatedDish) return item;
      
      // 不再自动更新购物车中的标签
      // 因为现在显示的是"备注可选"，用户需要手动选择
      return item;
    }));
  }, [dishes]);

  // ============ 全屏图片浏览键盘控制 ============
  useEffect(() => {
    if (!imageViewerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          changeImage('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeImage('next');
          break;
        case 'Escape':
          e.preventDefault();
          setImageViewerOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageViewerOpen, viewingImages]);

  // 监听购物车变化，自动保存到localStorage
  useEffect(() => {
    if (cart.length > 0) {
      saveCart(cart);
    } else {
      clearCart();
    }
  }, [cart]);

  // ============ 工具函数 ============
  const filteredDishes = dishes.filter(dish => {
    // 如果有搜索关键词，在整个菜品库中搜索（跨全库搜索）
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = dish.name.toLowerCase().includes(searchLower);
      const descMatch = dish.description?.toLowerCase().includes(searchLower);
      return nameMatch || descMatch;
    }
    
    // 如果没有搜索关键词，按当前分类显示
    return dish.category === selectedCategory;
  });
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 分页逻辑：每页8个菜品
  const dishesPerPage = 8;
  const totalPages = Math.ceil(filteredDishes.length / dishesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  // 当前页的菜品
  const getCurrentPageDishes = (pageIndex: number) => {
    const startIndex = pageIndex * dishesPerPage;
    const endIndex = startIndex + dishesPerPage;
    return filteredDishes.slice(startIndex, endIndex);
  };

  // 监听滚动事件，更新当前页
  useEffect(() => {
    const handleScroll = () => {
      const container = document.getElementById('dishes-scroll-container');
      if (container) {
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.offsetWidth;
        const newPage = Math.round(scrollLeft / containerWidth);
        setCurrentPage(Math.min(newPage, totalPages - 1));
      }
    };

    const container = document.getElementById('dishes-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [totalPages]);

  const getCartItemCount = (dishId: string) => {
    return cart.find(item => item.id === dishId)?.quantity || 0;
  };

  // 菜品卡片组件
  const DishCard = ({ dish, index }: { dish: Dish | null; index: number }) => {
    if (!dish) {
      // 占位框
      return (
        <div className="bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300 h-full">
          <span className="text-gray-500 text-xl font-bold">{index + 1}</span>
        </div>
      );
    }

    return (
      <Card
        className={`overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow flex flex-col bg-white p-0 m-0 gap-0 py-0 border-0 h-full ${isEditMode ? 'hover:ring-2 hover:ring-orange-500' : ''}`}
        onClick={() => handleDishClick(dish)}
      >
        {/* 菜品图片 - 固定高度容器，确保所有卡片高度一致 */}
        <div className="bg-gray-100 overflow-hidden m-0 p-0 flex-shrink-0" style={{ height: '60%' }}>
          <img
            src={dish.image || ''}
            alt={dish.name || ''}
            className="w-full h-full object-cover cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              openImageViewer(dish);
            }}
          />
        </div>

        {/* 菜品名称 */}
        <div className="px-2 border-b border-white flex-shrink-0 flex items-center justify-between" style={{ paddingTop: '2px', paddingBottom: '10px', height: '40px' }}>
          <h3 className="text-lg font-bold text-gray-900 truncate">{dish.name || ''}</h3>
          {/* 星级评价 */}
          {renderRating(dish.rating)}
        </div>

        {/* 价格区域 */}
        <div className="flex-shrink-0 flex items-center px-2 border-b border-white" style={{ marginTop: '-20px', paddingTop: '0', paddingBottom: '0', height: '40px' }}>
          {/* 价格靠左 */}
          <p className="text-base font-bold text-orange-500">RMB {dish.price || 0}/份</p>

          {/* 按钮组 - 靠右 */}
          <div className="flex items-center gap-0 ml-auto">
            {(dishQuantities[dish.id || 0] || 0) > 0 ? (
              // 数量大于0时：显示-号、数字、+号
              <>
                {/* 减少按钮 - 黄色圆形 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveQuantity(dish.id);
                  }}
                  className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold hover:bg-yellow-500 transition-colors"
                >
                  -
                </button>

                {/* 数量显示 */}
                <span className="text-sm font-bold text-gray-700 min-w-[20px] text-center">
                  {dishQuantities[dish.id] || 0}
                </span>

                {/* 增加按钮 - 黄色圆形 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddQuantity(dish.id);
                  }}
                  className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold hover:bg-yellow-500 transition-colors"
                >
                  +
                </button>
              </>
            ) : (
              // 数量为0时：只显示+号
              <>
                {/* 增加按钮 - 黄色圆形 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddQuantity(dish.id);
                  }}
                  className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold hover:bg-yellow-500 transition-colors"
                >
                  +
                </button>
              </>
            )}
          </div>
        </div>

        {/* 菜品介绍 */}
        <div className="px-2 flex-shrink-0" style={{ paddingTop: '-12px', paddingBottom: '6px', height: '45px' }}>
          <p className="text-[11px] text-gray-600 line-clamp-2 leading-[1.3]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dish.description || '暂无介绍'}
          </p>
        </div>
      </Card>
    );
  };

  // 渲染星级评价
  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        // 实心星
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else if (rating >= i - 0.5) {
        // 半星（用空心星表示，或者可以用 StarHalf）
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
      } else {
        // 空心星
        stars.push(<Star key={i} className="w-4 h-4 fill-none text-yellow-400" />);
      }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
  };

  // ============ 购物车功能 ============
  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      const tasteInfo = tasteSelections[dish.id] || { tags: [], custom: "" };
      
      if (existing) {
        return prev.map(item => 
          item.id === dish.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // 新逻辑：不设置默认标签，只有当用户手动选择后才设置
      // 如果菜品有customTags，标签为空数组
      // 如果菜品没有customTags，标签为['标准']
      let initialTaste: string[] = [];
      if (!dish.customTags || dish.customTags.length === 0) {
        initialTaste = ['标准'];
      }
      
      return [
        ...prev,
        {
          ...dish,
          quantity: 1,
          taste: initialTaste,
          customTaste: tasteInfo.custom,
          avoidance: avoidanceSelections[dish.id] || []
        }
      ];
    });
  };

  const updateQuantity = (dishId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === dishId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.id !== dishId));
  };

  // ============ 界面设置功能 ============
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 限制10MB
        alert("背景图片太大，请选择小于10MB的图片");
        return;
      }
      // 转换图片为Base64（自动压缩到5MB以下）
      try {
        const base64 = await fileToBase64(file, 10 * 1024 * 1024, 5);
        setCustomBackground(base64);
        setBackgroundPreview(file);
        await saveCustomBackground(base64);
      } catch (error) {
        console.error("背景图片处理失败:", error);
        alert(`背景图片处理失败: ${(error as Error).message}`);
      }
    }
  };

  const clearBackground = async () => {
    if (confirm("确定要清除自定义背景吗？")) {
      setCustomBackground("");
      setBackgroundPreview(null);
      await saveCustomBackground("");
    }
  };

  const clearLogo = async () => {
    if (confirm("确定要清除自定义Logo吗？")) {
      setCustomLogo("");
      setLogoPreview(null);
      await saveCustomLogo("");
    }
  };

  // ============ Logo裁剪功能 ============
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('png')) {
        alert("Logo请使用PNG格式");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 限制10MB
        alert("Logo图片太大，请选择小于10MB的图片");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setLogoImageSrc(imageData);
        setLogoPreview(file);
        setShowLogoCropDialog(true);
        // 设置初始裁剪区域为正方形
        const img = document.createElement('img');
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          setLogoCrop({
            unit: '%',
            x: 25,
            y: 25,
            width: 50,
            height: 50,
          });
        };
        img.src = imageData;
      };
      reader.readAsDataURL(file);
    }
  };

  const onLogoImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    setLogoImageRef(target);
  };

  const onLogoCropComplete = (crop: PixelCrop) => {
    // 裁剪完成时的回调
  };

  const handleLogoCropConfirm = async () => {
    if (!logoImageRef || !logoCrop) {
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const scaleX = logoImageRef.naturalWidth / logoImageRef.width;
    const scaleY = logoImageRef.naturalHeight / logoImageRef.height;

    canvas.width = logoCrop.width * scaleX;
    canvas.height = logoCrop.height * scaleY;

    ctx.drawImage(
      logoImageRef,
      logoCrop.x * scaleX,
      logoCrop.y * scaleY,
      logoCrop.width * scaleX,
      logoCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // 将Canvas转换为Base64并保存（压缩到6MB以下，保留透明背景，超高清质量）
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      try {
        const base64 = await fileToBase64(new File([blob], `logo-${Date.now()}.png`, { type: 'image/png' }), 10 * 1024 * 1024, 5, true);
        setCustomLogo(base64);
        await saveCustomLogo(base64);
        setShowLogoCropDialog(false);
        setLogoImageSrc("");
        setLogoCrop(undefined);
      } catch (error) {
        console.error("Logo处理失败:", error);
        alert(`Logo处理失败: ${(error as Error).message}`);
      }
    }, 'image/png');
  };

  const handleLogoCropCancel = () => {
    setShowLogoCropDialog(false);
    setLogoImageSrc("");
    setLogoCrop(undefined);
  };

  // ============ 菜品管理功能 ============
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 检查总图片数量（最多5张）
    const currentCount = uploadImages.length;
    const newCount = files.length;
    if (currentCount + newCount > 5) {
      alert(`最多只能上传5张图片，当前已上传${currentCount}张，还能上传${5 - currentCount}张`);
      return;
    }

    // 检查每张文件大小（限制10M）
    const maxSize = 10 * 1024 * 1024; // 10M
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        alert(`第${i + 1}张图片大小不能超过10M`);
        return;
      }
    }

    // 转换图片为Base64（自动压缩到5MB以下）
    try {
      const base64Images = await filesToBase64Array(Array.from(files), maxSize, 5, 5);
      setUploadImages(prev => [...prev, ...base64Images]);
      setUploadPreview(base64Images[0]); // 第一张作为主图
      setUploadImage(files[0]); // 第一张作为主文件
    } catch (error) {
      console.error("图片处理失败:", error);
      alert(`图片处理失败: ${(error as Error).message}`);
    }
  };

  // 删除上传的图片
  const handleDeleteUploadImage = (index: number) => {
    setUploadImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // 如果删除的是当前主图，更新主图
      if (newImages.length > 0) {
        setUploadPreview(newImages[0]);
      } else {
        setUploadPreview("");
        setUploadImage(null);
      }
      return newImages;
    });
  };

  // 编辑菜品图片上传（支持多选，最多5张，每张10M）
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = 5 - (editingDish?.images?.length || 1);
    const filesToProcess = fileArray.slice(0, remainingSlots);
    
    // 检查文件大小（限制10M）
    const maxSize = 10 * 1024 * 1024; // 10M
    for (const file of filesToProcess) {
      if (file.size > maxSize) {
        alert(`图片"${file.name}"大小超过10M，无法上传`);
        return;
      }
    }
    
    if (filesToProcess.length < fileArray.length) {
      alert(`最多只能上传5张图片，已忽略${fileArray.length - filesToProcess.length}张图片`);
    }
    
    // 转换图片为Base64（自动压缩到5MB以下）
    try {
      const newImages = await filesToBase64Array(filesToProcess, maxSize, 5, 5);
      
      setEditImages((prev) => {
        const updated = [...prev, ...newImages];
        return updated.slice(0, 5);
      });
      
      // 更新主图片为第一张
      const firstImage = newImages[0];
      setEditPreview(firstImage);
      setEditingDish(prev => prev ? { ...prev, image: firstImage, images: [...(prev.images || [prev.image]), ...newImages].slice(0, 5) } : null);
    } catch (error) {
      console.error("图片处理失败:", error);
      alert(`图片处理失败: ${(error as Error).message}`);
    }
  };

  // 删除菜品图片
  const handleRemoveEditImage = (index: number) => {
    setEditImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // 更新主图片
      if (updated.length > 0) {
        const firstImage = updated[0];
        setEditPreview(firstImage);
        setEditingDish(prev => prev ? { ...prev, image: firstImage, images: updated } : null);
      }
      return updated;
    });
  };

  // 设置主图片
  const handleSetPrimaryImage = (index: number) => {
    if (!editingDish || index >= editImages.length) return;
    
    const primaryImage = editImages[index];
    const currentPrimaryIndex = 0;
    
    // 将选中的图片移到第一位
    const reorderedImages = [...editImages];
    const [selectedImage] = reorderedImages.splice(index, 1);
    reorderedImages.unshift(selectedImage);
    
    setEditImages(reorderedImages);
    setEditPreview(primaryImage);
    setEditingDish(prev => prev ? { ...prev, image: primaryImage, images: reorderedImages } : null);
  };

  const handleAddDish = async () => {
    if (!uploadName || !uploadPrice || !uploadPreview) {
      alert("请填写完整的菜品信息");
      return;
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name: uploadName,
      category: uploadCategory,
      price: parseFloat(uploadPrice),
      image: uploadPreview,
      images: uploadImages,
      description: uploadDescription,
      customTags: uploadSelectedTags.map(t => t.name),
      isAvailable: true,
    };

    const updatedDishes = [...dishes, newDish];
    const result = await saveDishes(updatedDishes);

    if (result.success) {
      setDishes(updatedDishes);
      setUploadName("");
      setUploadPrice("");
      setUploadImage(null);
      setUploadPreview("");
      setUploadImages([]);
      setUploadDescription("");
      setUploadSelectedTags([]);
      setShowUploadDialog(false);
    } else {
      alert(result.message || "添加失败，请重试");
    }
  };

  const handleDishClick = (dish: Dish) => {
    if (isEditMode) {
      setEditingDish({ ...dish });
      setEditPreview(dish.image || '');
      setEditImages(dish.images && dish.images.length > 0 && dish.images[0] ? dish.images : (dish.image ? [dish.image] : []));
      setEditDescription(dish.description || '');
      setCurrentImageIndex(0);
      setEditTagExpandedCategory(null); // 重置标签分类选择
      setCustomTagInput(""); // 重置自定义标签输入
      setEditDishDialog(true);
    } else {
      setViewingDish(dish);
      setCurrentImageIndex(0);
      setViewDishDialog(true);
    }
  };

  const saveDishEdit = async () => {
    if (!editingDish) return;

    // 调试：检查 editingDish 中的 customTags
    console.log('保存菜品前 - editingDish:', {
      id: editingDish.id,
      name: editingDish.name,
      customTags: editingDish.customTags
    });

    // 确保有有效的图片
    const validImages = editImages.length > 0 && editImages[0]
      ? editImages
      : (editPreview ? [editPreview] : []);
    
    if (validImages.length === 0) {
      alert('请至少添加一张图片');
      return;
    }

    const updatedDish: Dish = {
      ...editingDish,
      image: validImages[0],
      images: validImages,
      description: editDescription,
      customTags: editingDish.customTags, // 明确保存 customTags
    };

    console.log('保存菜品 - updatedDish:', {
      id: updatedDish.id,
      name: updatedDish.name,
      customTags: updatedDish.customTags
    });

    const updatedDishes = dishes.map(d => d.id === editingDish.id ? updatedDish : d);
    const result = await saveDishes(updatedDishes);

    console.log('保存结果:', result);
    console.log('更新后的 dishes:', updatedDishes.map(d => ({
      id: d.id,
      name: d.name,
      customTags: d.customTags
    })));

    if (result.success) {
      setDishes(updatedDishes);
      setEditDishDialog(false);
      setEditingDish(null);
      setEditImages([]);
    } else {
      alert(result.message || "保存失败，请重试");
    }
  };

  const deleteDish = async (dishId: string) => {
    if (!confirm("确定要删除这个菜品吗？")) return;
    
    const updatedDishes = dishes.filter(d => d.id !== dishId);
    const result = await saveDishes(updatedDishes);
    
    if (result.success) {
      setDishes(updatedDishes);
      setEditDishDialog(false);
    } else {
      alert(result.message || "删除失败，请重试");
    }
  };

  // ============ 拖拽排序功能 ============
  const handleDragStart = (e: React.DragEvent, dishId: number) => {
    setDraggedDishId(dishId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDishId: number) => {
    e.preventDefault();
    
    if (draggedDishId === null || draggedDishId === targetDishId) {
      setDraggedDishId(null);
      return;
    }

    // 获取当前分类的菜品
    const categoryDishes = dishes.filter(dish => dish.category === imageManageCategory);
    const otherCategoryDishes = dishes.filter(dish => dish.category !== imageManageCategory);
    
    // 找到拖拽的菜品和目标菜品的索引
    const draggedIndex = categoryDishes.findIndex(dish => dish.id === String(draggedDishId));
    const targetIndex = categoryDishes.findIndex(dish => dish.id === String(targetDishId));
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedDishId(null);
      return;
    }
    
    // 创建新数组并移动菜品
    const newCategoryDishes = [...categoryDishes];
    const [movedDish] = newCategoryDishes.splice(draggedIndex, 1);
    newCategoryDishes.splice(targetIndex, 0, movedDish);
    
    // 重新计算所有菜品的 ID 以保持排序顺序
    const allDishes = [...otherCategoryDishes, ...newCategoryDishes];
    const reorderedDishes = allDishes.map((dish, index) => ({
      ...dish,
      id: String(index + 1)
    }));
    
    setDishes(reorderedDishes);
    await saveDishes(reorderedDishes);
    setDraggedDishId(null);
  };

  // ============ 口味和忌口功能 ============
  const toggleTasteTag = (dishId: string, tag: string) => {
    setTasteSelections(prev => {
      const current = prev[dishId] || { tags: [], custom: "" };
      const newTags = current.tags.includes(tag)
        ? current.tags.filter(t => t !== tag)
        : [...current.tags, tag];
      return { ...prev, [dishId]: { ...current, tags: newTags } };
    });
  };

  const handleCustomTasteChange = (dishId: string, value: string) => {
    setTasteSelections(prev => {
      const current = prev[dishId] || { tags: [], custom: "" };
      return { ...prev, [dishId]: { ...current, custom: value } };
    });
  };

  const openAvoidanceDialog = (dish: Dish) => {
    setCurrentAvoidanceDish(dish);
    setShowAvoidanceDialog(true);
  };

  const toggleAvoidanceTag = (tag: string) => {
    if (!currentAvoidanceDish) return;
    setAvoidanceSelections(prev => {
      const current = prev[currentAvoidanceDish.id] || [];
      const newTags = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag];
      return { ...prev, [currentAvoidanceDish.id]: newTags };
    });
  };

  const handleAddAvoidanceTag = () => {
    if (!newAvoidanceTagName.trim()) return;
    const existingTags = avoidanceTagsByCategory[managingCategory];
    if (existingTags?.some(tag => tag.name === newAvoidanceTagName.trim())) {
      alert("该标签已存在");
      return;
    }
    const newTag: AvoidanceTag = {
      id: `tag-${Date.now()}`,
      name: newAvoidanceTagName.trim(),
      icon: newAvoidanceTagIcon.trim() || undefined
    };
    const updatedTagsByCategory = {
      ...avoidanceTagsByCategory,
      [managingCategory]: [...(existingTags || []), newTag]
    };
    setAvoidanceTagsByCategory(updatedTagsByCategory);
    saveAvoidanceTagsByCategory(updatedTagsByCategory);
    setNewAvoidanceTagName("");
    setNewAvoidanceTagIcon("");
  };

  const handleDeleteAvoidanceTag = (tagId: string) => {
    if (!confirm(`确定要删除该标签吗？`)) return;
    const updatedTagsByCategory = {
      ...avoidanceTagsByCategory,
      [managingCategory]: (avoidanceTagsByCategory[managingCategory] || []).filter(tag => tag.id !== tagId)
    };
    setAvoidanceTagsByCategory(updatedTagsByCategory);
    saveAvoidanceTagsByCategory(updatedTagsByCategory);
  };

  // ============ 打印功能 ============
  
  // 测试打印功能
  const handleTestPrint = () => {
    printTest();
  };

  const handlePrintOrder = () => {
    console.log('=== handlePrintOrder 被调用 ===');
    console.log('购物车状态:', {
      长度: cart.length,
      内容: cart.map(i => `${i.name}×${i.quantity}`).join(', ')
    });
    
    if (cart.length === 0) {
      alert("购物车是空的，无法打印");
      return;
    }

    console.log('=== 开始处理打印订单 ===');
    console.log('当前桌号:', tableNumber);
    console.log('当前订单号:', orderId);
    console.log('是否加菜模式:', isAddingDishes);
    console.log('当前活跃订单数量:', activeOrders.length);
    console.log('当前购物车菜品数量:', cart.length);

    // 检查该桌号是否已有活跃订单
    const existingOrder = activeOrders.find(o => o.tableNumber === tableNumber);
    console.log('找到的已存在订单:', existingOrder ? `桌号${existingOrder.tableNumber}, 订单号${existingOrder.orderId}` : '无');

    // 确定要使用的订单号
    let currentOrderId = orderId;

    if (existingOrder && !isAddingDishes) {
      const shouldAddToExisting = confirm(
        `${tableNumber}号桌已有订单，是否要加菜？\n\n点击"确定"将添加到现有订单\n点击"取消"将创建新订单`
      );
      if (shouldAddToExisting) {
        // 进入加菜模式
        console.log('用户选择加菜模式');
        setIsAddingDishes(true);
        setOrderId(existingOrder.orderId);
        currentOrderId = existingOrder.orderId;
      } else {
        // 用户选择创建新订单，继续执行
        console.log('用户选择创建新订单');
        // 生成新的订单号（立即增加计数器）
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const orderCountKey = `dailyOrderCount_${dateStr}`;
        const todayOrderCount = parseInt(localStorage.getItem(orderCountKey) || '0', 10);
        
        // 立即增加计数器，防止订单号重复
        localStorage.setItem(orderCountKey, String(todayOrderCount + 1));
        
        const newOrderId = `${dateStr}${String(todayOrderCount + 1).padStart(2, '0')}`;
        currentOrderId = newOrderId;
        setOrderId(newOrderId);
        console.log('生成新订单号:', newOrderId);
        console.log('已增加计数器到:', todayOrderCount + 1);
      }
    } else if (isAddingDishes) {
      // 加菜模式：使用已存在订单的订单号
      const orderForAdding = activeOrders.find(o => o.tableNumber === tableNumber);
      if (orderForAdding) {
        currentOrderId = orderForAdding.orderId;
        console.log('加菜模式，使用订单号:', currentOrderId);
      }
    }

    // 准备订单数据
    const order = {
      id: currentOrderId,
      tableNumber,
      customerCount,
      items: cart,
      totalAmount: cartTotal,
      createdAt: new Date()
    };

    console.log('准备订单数据:', {
      订单号: order.id,
      桌号: order.tableNumber,
      人数: order.customerCount,
      菜品数: order.items.length,
      总金额: order.totalAmount
    });

    // 打开确认对话框
    setPendingOrder(order);
    setShowPrintDialog(true);
  };

  // 只下单，不打印
  const handlePlaceOrder = () => {
    if (!pendingOrder) return;
    
    console.log('=== 只下单，不打印 ===');
    console.log('订单号:', pendingOrder.id);
    console.log('桌号:', pendingOrder.tableNumber);
    console.log('是否加菜模式:', isAddingDishes);
    
    // 保存为活跃订单
    const activeOrder: ActiveOrder = {
      orderId: pendingOrder.id,
      tableNumber: pendingOrder.tableNumber,
      customerCount: pendingOrder.customerCount,
      items: pendingOrder.items,
      totalAmount: pendingOrder.totalAmount,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    console.log('准备保存活跃订单:', activeOrder);
    addOrUpdateActiveOrder(activeOrder);
    
    // 刷新活跃订单列表
    const updatedOrders = getActiveOrders();
    console.log('刷新活跃订单列表:', updatedOrders.length, '个');
    console.log('活跃订单详情:', updatedOrders.map(o => ({ 订单号: o.orderId, 桌号: o.tableNumber, 菜品数: o.items.length })));
    
    // 强制更新状态
    setActiveOrders([...updatedOrders]);
    
    // 清空购物车和菜品份数
    setCart([]);
    setDishQuantities({});
    setTasteSelections({});
    setAvoidanceSelections({});
    setShowPrintDialog(false);
    setPendingOrder(null);
    
    // 自动跳转到进度页
    setCurrentNav('progress');
    
    alert('下单成功！订单已在进度页面显示');
  };

  // 下单并打印
  const handlePlaceOrderWithPrint = () => {
    if (!pendingOrder) return;
    
    console.log('=== 下单并打印 ===');
    console.log('订单号:', pendingOrder.id);
    console.log('桌号:', pendingOrder.tableNumber);
    console.log('是否加菜模式:', isAddingDishes);
    
    // 使用本地打印
    printOrder({
      orderId: pendingOrder.id,
      tableNumber: pendingOrder.tableNumber,
      customerCount: pendingOrder.customerCount,
      items: pendingOrder.items,
      totalAmount: pendingOrder.totalAmount,
      createdAt: pendingOrder.createdAt
    });
    
    // 保存为活跃订单
    const activeOrder: ActiveOrder = {
      orderId: pendingOrder.id,
      tableNumber: pendingOrder.tableNumber,
      customerCount: pendingOrder.customerCount,
      items: pendingOrder.items,
      totalAmount: pendingOrder.totalAmount,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    console.log('准备保存活跃订单:', activeOrder);
    addOrUpdateActiveOrder(activeOrder);
    
    // 刷新活跃订单列表
    const updatedOrders = getActiveOrders();
    console.log('刷新活跃订单列表:', updatedOrders.length, '个');
    console.log('活跃订单详情:', updatedOrders.map(o => ({ 订单号: o.orderId, 桌号: o.tableNumber, 菜品数: o.items.length })));
    
    // 强制更新状态
    setActiveOrders([...updatedOrders]);

    // 清空购物车和菜品份数
    setCart([]);
    setDishQuantities({});
    setTasteSelections({});
    setAvoidanceSelections({});
    setShowPrintDialog(false);
    setPendingOrder(null);
    
    // 自动跳转到进度页
    setCurrentNav('progress');
  };

  // 取消下单
  const handleCancelOrder = () => {
    console.log('=== 取消下单 ===');
    setShowPrintDialog(false);
    setPendingOrder(null);
  };

  // ============ 订单详情功能 ============
  // 打开订单详情
  const openOrderDetail = (order: ActiveOrder) => {
    setSelectedActiveOrder(order);
    setShowOrderDetailDialog(true);
  };

  // 加菜功能
  const handleAddDishes = (order: ActiveOrder) => {
    // 关闭订单详情对话框
    setShowOrderDetailDialog(false);
    
    // 设置当前桌号和人数
    setTableNumber(order.tableNumber);
    setCustomerCount(order.customerCount.toString());
    
    // 设置为加菜模式
    setIsAddingDishes(true);
    
    // 提示用户
    alert(`已切换到${order.tableNumber}号桌，请选择要添加的菜品`);
  };

  // 完成订单（结账）
  const handleCompleteOrder = (tableNumber: string) => {
    if (!confirm(`确定要结账${tableNumber}号桌吗？`)) return;
    
    completeOrder(tableNumber);
    setActiveOrders(getActiveOrders());
    
    // 更新今日已完成订单列表
    setCompletedOrders(getTodayCompletedOrders());
    
    setShowOrderDetailDialog(false);
    setSelectedActiveOrder(null);
    
    // 如果是当前加菜的桌号，退出加菜模式
    if (isAddingDishes && tableNumber === tableNumber) {
      setIsAddingDishes(false);
    }
  };

  // 打印已存在的订单 - 打开预览弹窗
  const handlePrintExistingOrder = (order: ActiveOrder) => {
    setPrintPreviewOrder(order);
    setShowPrintPreviewDialog(true);
  };

  // 确认打印订单
  const confirmPrintExistingOrder = (order: ActiveOrder) => {
    // 使用本地打印
    printOrder({
      orderId: order.orderId,
      tableNumber: order.tableNumber,
      customerCount: order.customerCount,
      items: order.items,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });

    setShowPrintPreviewDialog(false);
  };

  // 生成打印预览内容
  // ============ 价格管理功能 ============
  // 更新菜品价格
  const updateDishPrice = async (dishId: string, newPrice: number) => {
    const updatedDishes = dishes.map(dish => 
      dish.id === dishId ? { ...dish, price: newPrice } : dish
    );
    setDishes(updatedDishes);
    // 保存到 IndexedDB
    await saveDishes(updatedDishes);
  };

  // ============ 菜品标签选择功能 ============
  // 打开标签选择对话框
  const openTagSelectDialog = (item: CartItem) => {
    const dish = dishes.find(d => d.id === item.id);
    // 如果菜品没有自定义标签，不允许选择
    if (!dish?.customTags || dish.customTags.length === 0) {
      alert('该菜品暂无可选规格标签');
      return;
    }
    
    setCurrentTagDish(item);
    // 使用菜品自定义标签
    const availableTags = dish.customTags;
    
    // 当前已选的标签（如果item已有tags，则使用；否则使用空数组，不默认选择）
    const currentTags = item.taste && item.taste.length > 0 && item.taste[0] !== '标准' 
      ? [...item.taste] 
      : [];
    
    setSelectedTags(currentTags);
    setCustomTagInput("");
    setShowTagSelectDialog(true);
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    // "标准"标签特殊处理：如果选择了其他标签，则移除"标准"；如果只选择"标准"，则保持
    const dish = dishes.find(d => d.id === currentTagDish?.id);
    const hasStandardTag = dish?.customTags?.includes('标准');
    
    if (tag === '标准' && hasStandardTag) {
      if (selectedTags.length === 1 && selectedTags[0] === '标准') {
        // 已经只有"标准"，不做任何操作
        return;
      }
      // 清空其他标签，只保留"标准"
      setSelectedTags(['标准']);
    } else {
      // 其他标签
      if (selectedTags.includes('标准') && hasStandardTag) {
        // 移除"标准"，添加新标签
        setSelectedTags([tag]);
      } else if (selectedTags.includes(tag)) {
        // 已选择该标签，移除它
        const newTags = selectedTags.filter(t => t !== tag);
        // 如果没有其他标签且customTags包含"标准"，默认选择"标准"
        if (newTags.length === 0 && hasStandardTag) {
          setSelectedTags(['标准']);
        } else {
          setSelectedTags(newTags);
        }
      } else {
        // 添加新标签
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  // 确认标签选择
  const confirmTagSelection = () => {
    if (!currentTagDish) return;
    
    // 更新购物车中该菜品的标签
    setCart(prev => prev.map(item => {
      if (item.id === currentTagDish.id && item.name === currentTagDish.name) {
        return {
          ...item,
          taste: selectedTags
        };
      }
      return item;
    }));
    
    setShowTagSelectDialog(false);
    setCurrentTagDish(null);
  };

  // 取消标签选择
  const cancelTagSelection = () => {
    setShowTagSelectDialog(false);
    setCurrentTagDish(null);
    setSelectedTags([]);
    setCustomTagInput("");
  };

  // ============ 自定义标签管理功能 ============
  // 添加自定义标签
  const addCustomTag = () => {
    if (!newTagName.trim() || !editingDish) return;
    
    const tagName = newTagName.trim();
    // 检查是否已存在
    if (editingDish.customTags && editingDish.customTags.includes(tagName)) {
      alert("该标签已存在");
      return;
    }
    
    // 添加标签
    setEditingDish(prev => prev ? {
      ...prev,
      customTags: [...(prev.customTags || []), tagName]
    } : null);
    
    setNewTagName("");
  };

  // 删除自定义标签
  const removeCustomTag = (index: number) => {
    if (!editingDish) return;
    
    setEditingDish(prev => prev ? {
      ...prev,
      customTags: prev.customTags?.filter((_, i) => i !== index)
    } : null);
  };

  // 添加自定义标签到选择对话框
  const addCustomTagToSelection = () => {
    const trimmedTag = customTagInput.trim();
    if (!trimmedTag) return;
    
    // 检查是否已存在
    if (selectedTags.includes(trimmedTag)) {
      alert("该标签已选择");
      return;
    }
    
    // 如果有"标准"标签且selectedTags只有"标准"，则移除"标准"
    const dish = dishes.find(d => d.id === currentTagDish?.id);
    const hasStandardTag = dish?.customTags?.includes('标准');
    
    if (hasStandardTag && selectedTags.length === 1 && selectedTags[0] === '标准') {
      setSelectedTags([trimmedTag]);
    } else {
      setSelectedTags([...selectedTags, trimmedTag]);
    }
    
    setCustomTagInput("");
  };

  // 删除已选的自定义标签
  const removeSelectedTag = (tag: string) => {
    const dish = dishes.find(d => d.id === currentTagDish?.id);
    const hasStandardTag = dish?.customTags?.includes('标准');
    
    const newTags = selectedTags.filter(t => t !== tag);
    
    // 如果删除后没有标签且customTags包含"标准"，默认选择"标准"
    if (newTags.length === 0 && hasStandardTag) {
      setSelectedTags(['标准']);
    } else {
      setSelectedTags(newTags);
    }
  };

  // ============ 全屏切换 ============
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`全屏模式启用失败: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ============ 分类图标 ============
  const getCategoryIcon = (category: DishCategory) => {
    switch (category) {
      case 'special': return <Flame className="w-4 h-4" />;
      case 'jianghu': return <Utensils className="w-4 h-4" />;
      case 'vegetable': return <Leaf className="w-4 h-4" />;
      case 'soup': return <Coffee className="w-4 h-4" />;
      case 'alcohol':
      case 'beverage': return <Wine className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* 黑色背景层 - 当透明度为0时显示 */}
      <div className="fixed inset-0 bg-black -z-20" />
      <style jsx global>{`
        #dishes-scroll-container::-webkit-scrollbar {
          display: none;
        }
        #dishes-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      {/* 全局背景图层 */}
      {customBackground ? (
        <div 
          className="fixed inset-0 -z-10"
          style={{ 
            backgroundImage: `url(${customBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: backgroundOpacity / 100,
            filter: `blur(${backgroundBlur}px)`
          }}
        />
      ) : null}
      
      {/* ============ 左侧侧边栏 ============ */}
      <aside className="hidden md:flex flex-shrink-0 flex-col text-white relative z-10" style={{ width: '20%' }}>
        
        {/* 品牌区 */}
        <div className="p-[1.35rem] flex-shrink-0 relative z-10" style={{ background: 'rgba(0, 0, 0, 0)' }}>
          <div className="text-center">
            {customLogo ? (
              <div className="bg-transparent">
                <img 
                  src={customLogo} 
                  alt="Logo" 
                  className="mx-auto object-contain bg-transparent"
                  style={{ maxHeight: `${logoSizePercent * 0.8}vh` }}
                />
              </div>
            ) : (
              <div 
                className="mx-auto flex items-center justify-center border-2 border-dashed border-white/30 rounded-lg"
                style={{ 
                  height: `${logoSizePercent * 0.8}vh`,
                  width: `${logoSizePercent}vh`
                }}
              >
                <span className="text-sm text-white/50">LOGO区域</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 桌况信息区 - 背景图+半透明遮罩 */}
        <div className="pt-4 pb-3 flex-shrink-0 relative z-10 -mt-10">
          {/* 加菜模式提示 */}
          {isAddingDishes && (
            <div className="px-6 mb-2">
              <div className="bg-green-500/20 border border-green-400 rounded-lg px-3 py-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300 font-medium">加菜模式：{tableNumber}号桌</span>
                <button
                  onClick={() => {
                    setIsAddingDishes(false);
                    setCart([]);
                    setDishQuantities({});
                    setTasteSelections({});
                    setAvoidanceSelections({});
                    alert('已退出加菜模式，购物车已清空');
                  }}
                  className="ml-auto text-xs text-green-300 hover:text-white underline"
                >
                  退出
                </button>
              </div>
            </div>
          )}
          
          <div className="px-6 space-y-0">
            <div className="flex items-center justify-between -mb-2">
              <span className="text-gray-400 text-sm inline-block w-16 whitespace-nowrap">桌  号：</span>
              <Select value={tableNumber} onValueChange={handleTableNumberChange}>
                <SelectTrigger className="flex-1 border-0 bg-transparent text-white text-sm h-8 justify-between pl-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_TABLES.map(table => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm inline-block w-16 whitespace-nowrap">人  数：</span>
              <Select value={customerCount} onValueChange={setCustomerCount}>
                <SelectTrigger className="flex-1 border-0 bg-transparent text-white text-sm h-8 justify-between pl-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_PEOPLE.map(people => (
                    <SelectItem key={people.value} value={people.value}>
                      {people.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 text-sm inline-block w-16 whitespace-nowrap">订单号：</span>
              <span className="text-white text-sm font-medium">{orderId}</span>
            </div>
          </div>
        </div>
        
        {/* 导航菜单区 */}
        <nav className="flex-1 overflow-hidden relative">
          {/* 导航菜单 */}
          <div className="relative flex flex-col h-full">
            {/* 菜单列表 */}
            <div className="flex-1 py-3 space-y-0 overflow-y-auto">
              <button
                onClick={() => setCurrentNav('dish')}
                className={`relative text-center transition-all w-full ${
                  currentNav === 'dish'
                    ? 'bg-amber-800/80 border-l-4 border-yellow-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ padding: '0.95rem 0' }}
              >
                <Utensils className={`absolute left-1/2 top-1/2 -translate-x-[calc(50%+2.5rem)] -translate-y-1/2 w-5 h-5 ${currentNav === 'dish' ? 'text-yellow-400' : 'text-white'}`} />
                <span className={`inline-block text-base font-medium ${currentNav === 'dish' ? 'text-yellow-400' : 'text-white'}`} style={{ letterSpacing: '0.5em' }}>菜品</span>
              </button>
              
              <button
                onClick={() => setCurrentNav('progress')}
                className={`relative text-center transition-all w-full ${
                  currentNav === 'progress'
                    ? 'bg-amber-800/80 border-l-4 border-yellow-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ padding: '0.95rem 0' }}
              >
                <Clock className={`absolute left-1/2 top-1/2 -translate-x-[calc(50%+2.5rem)] -translate-y-1/2 w-5 h-5 ${currentNav === 'progress' ? 'text-yellow-400' : 'text-white'}`} />
                <span className={`inline-block text-base font-medium ${currentNav === 'progress' ? 'text-yellow-400' : 'text-white'}`} style={{ letterSpacing: '0.5em' }}>进度</span>
              </button>
              
              <button
                onClick={() => setCurrentNav('bill')}
                className={`relative text-center transition-all w-full ${
                  currentNav === 'bill'
                    ? 'bg-amber-800/80 border-l-4 border-yellow-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ padding: '0.95rem 0' }}
              >
                <DollarSign className={`absolute left-1/2 top-1/2 -translate-x-[calc(50%+2.5rem)] -translate-y-1/2 w-5 h-5 ${currentNav === 'bill' ? 'text-yellow-400' : 'text-white'}`} />
                <span className={`inline-block text-base font-medium ${currentNav === 'bill' ? 'text-yellow-400' : 'text-white'}`} style={{ letterSpacing: '0.5em' }}>报表</span>
              </button>
              
              <button
                onClick={() => setCurrentNav('manage')}
                className={`relative text-center transition-all w-full ${
                  currentNav === 'manage'
                    ? 'bg-amber-800/80 border-l-4 border-yellow-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ padding: '0.95rem 0' }}
              >
                <Cog className={`absolute left-1/2 top-1/2 -translate-x-[calc(50%+2.5rem)] -translate-y-1/2 w-5 h-5 ${currentNav === 'manage' ? 'text-yellow-400' : 'text-white'}`} />
                <span className={`inline-block text-base font-medium ${currentNav === 'manage' ? 'text-yellow-400' : 'text-white'}`} style={{ letterSpacing: '0.5em' }}>管理</span>
              </button>
            </div>
          </div>
        </nav>
        
        {/* 底部功能区 */}
        <div className="relative z-20">
          {/* 分隔线 */}
          <div className="border-t border-white/10 mx-6 mt-4 mb-2"></div>
          <div className="flex justify-around px-6 pb-6 pt-2">
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform scale-90">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2 relative">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full text-white text-sm font-bold flex items-center justify-center border-2 border-transparent">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-300">购物车</span>
                </div>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col bg-gray-50 h-full max-h-full overflow-hidden">
                {/* 隐藏的DialogTitle用于可访问性 */}
                <VisuallyHidden>
                  <DialogTitle>{isAddingDishes ? `${tableNumber}号桌加菜` : '已选菜单'}</DialogTitle>
                </VisuallyHidden>
                
                {/* 标题栏 */}
                <div className="px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {isAddingDishes ? `${tableNumber}号桌加菜` : '已选菜单'}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">共{cartCount}件商品</p>
                    </div>
                    <button
                      onClick={() => { setCart([]); }}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mr-6"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空
                    </button>
                  </div>
                </div>

                {/* 商品列表区 */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p>购物车是空的</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <ScrollArea className="flex-1 overflow-auto">
                      <div className="p-3 space-y-2" style={{ marginTop: '-15px' }}>
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center gap-3 bg-white rounded-lg" style={{ padding: '2px' }}>
                            {/* 左侧菜品图 */}
                            <div className="w-[56px] h-[56px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* 中间信息区 */}
                            <div className="flex-1 min-w-0" style={{ lineHeight: '5px' }}>
                              <h3 className="font-bold text-gray-900 mb-1 truncate" style={{ lineHeight: '1.2', fontSize: '14px' }}>{item.name}</h3>
                              <div 
                                className="mb-1 px-1 -mx-1"
                                style={{ lineHeight: '1.2' }}
                              >
                                {(() => {
                                  const dish = dishes.find(d => d.id === item.id);
                                  const hasCustomTags = dish?.customTags && dish.customTags.length > 0;
                                  // 只要菜品有自定义标签，就可以点击选择
                                  const canSelect = hasCustomTags;
                                  
                                  // 调试信息
                                  console.log(`菜品 [${item.name}] 调试:`, {
                                    itemId: item.id,
                                    itemIdType: typeof item.id,
                                    dishFound: !!dish,
                                    dishId: dish?.id,
                                    dishIdType: typeof dish?.id,
                                    customTags: dish?.customTags,
                                    hasCustomTags,
                                    canSelect,
                                    currentTaste: item.taste
                                  });
                                  
                                  // 新逻辑：
                                  // 如果菜品有customTags：
                                  //   - 如果已选择标签，显示已选标签（橙色，可点击）
                                  //   - 如果未选择标签，显示"备注可选"（红色，可点击）
                                  // 如果菜品没有customTags，显示"标准"（灰色，不可点击）
                                  return (
                                    hasCustomTags ? (
                                      // 有customTags的情况
                                      item.taste && item.taste.length > 0 && !(item.taste.length === 1 && item.taste[0] === '标准') ? (
                                        // 已选择标签
                                        <div 
                                          className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                                          onClick={() => openTagSelectDialog(item)}
                                          autoCapitalize="off"
                                          autoCorrect="off"
                                        >
                                          {item.taste.map((tag, index) => (
                                            <Badge 
                                              key={index} 
                                              className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        // 未选择标签
                                        <Badge 
                                          className="text-xs px-2 py-0.5 text-red-500 border-red-300 cursor-pointer hover:bg-red-50 hover:border-red-400 transition-colors"
                                          onClick={() => openTagSelectDialog(item)}
                                          autoCapitalize="off"
                                          autoCorrect="off"
                                        >
                                          备注可选
                                        </Badge>
                                      )
                                    ) : (
                                      // 没有customTags的情况
                                      <Badge 
                                        className="text-xs px-2 py-0.5 border-gray-300 text-gray-500 bg-gray-50"
                                      >
                                        标准
                                      </Badge>
                                    )
                                  );
                                })()}
                              </div>
                              <p className="font-bold text-gray-900" style={{ lineHeight: '1.2', fontSize: '14px' }}>¥{item.price}</p>
                            </div>

                            {/* 右侧数量控制器 */}
                            <div className="flex items-center gap-0 flex-shrink-0">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold hover:bg-yellow-500 transition-colors"
                              >
                                -
                              </button>
                              <span className="text-sm font-bold text-gray-700 min-w-[20px] text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded-full bg-yellow-400 text-black flex items-center justify-center text-lg font-bold hover:bg-yellow-500 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* 底部结算栏 */}
                    <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <ShoppingCart className="w-6 h-6 text-gray-900" />
                            {cartCount > 0 && (
                              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                                {cartCount}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-red-500">¥{cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                        <button
                          onClick={handlePrintOrder}
                          className="px-6 py-3 bg-amber-400 text-gray-900 font-bold text-sm rounded-full hover:bg-amber-500 transition-colors"
                        >
                          立即下单
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
            
            <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform scale-90" onClick={handlePrintOrder}>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-sm text-gray-300">打印</span>
            </div>
          </div>
        </div>
      </aside>
      
      {/* ============ 右侧主内容区 ============ */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 h-full">
        {/* 顶部导航栏 */}
        <header className="h-[76.8px] md:h-[96px] flex items-center px-3 md:px-6" style={{ background: 'rgba(0, 0, 0, 0)' }}>
          {/* 分类标签 */}
          <div className="flex items-center space-x-0 flex-1 overflow-x-auto scrollbar-hide">
            {(Object.keys(CATEGORY_NAMES) as DishCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-1 px-1 md:px-2 pt-4 md:pt-6 pb-0 rounded-t-lg flex items-center justify-center space-x-1 md:space-x-2 transition-all min-w-max ${
                  selectedCategory === category
                    ? 'text-yellow-400'
                    : 'text-white hover:bg-white/5'
                }`}
              >
                <span className={selectedCategory === category ? 'text-yellow-400' : 'text-white'}>
                  {getCategoryIcon(category)}
                </span>
                <span className="font-medium text-xs md:text-base">{CATEGORY_NAMES[category]}</span>
              </button>
            ))}
          </div>
          
          {/* 搜索框和全屏按钮 */}
          <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-4 mt-5">
            <div className="hidden md:flex rounded-full px-5 py-2 flex items-center justify-between space-x-3 w-[10rem] lg:w-[13rem] bg-white/10 border border-white/20 overflow-visible">
              <Search className="text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索菜品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1 text-sm"
              />
              {searchQuery && (
                <X
                  className="text-gray-400 cursor-pointer hover:text-white w-4 h-4"
                  onClick={() => setSearchQuery('')}
                />
              )}
              <Search className="text-gray-400 w-4 h-4 cursor-pointer hover:text-white" />
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 p-2 rounded-md border border-gray-400"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
            </Button>
            {/* 移动端搜索按钮 */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const searchInput = document.getElementById('mobile-search-input') as HTMLInputElement;
                if (searchInput) searchInput.focus();
              }}
              className="md:hidden text-white hover:bg-white/10 p-2"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </header>
        
        {/* 移动端搜索框 */}
        <div className="md:hidden px-3 py-2" style={{ background: 'rgba(45, 40, 40, 0.95)' }}>
          <div className="rounded-full px-5 py-2.5 flex items-center space-x-3 bg-white/10 border border-white/20">
            <Search className="text-gray-400 w-4 h-4" />
            <input
              id="mobile-search-input"
              type="text"
              placeholder="搜索菜品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white placeholder-gray-400 flex-1 text-sm"
            />
            {searchQuery && (
              <X
                className="text-gray-400 cursor-pointer hover:text-white w-4 h-4"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
        </div>
        
        {/* 主内容区 - 米黄色背景 */}
        <main className="overflow-hidden" style={{ background: '#FFF9E8', flex: 1, minHeight: 0 }}>
          {/* 框架预留区域 */}
          {currentNav === 'manage' ? (
            // 管理模式：显示管理子导航和对应内容
            <div className="h-full flex flex-col p-4">
              {/* 管理子导航 */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[
                  { id: 'image', label: '图片管理', icon: ImageIcon },
                  { id: 'price', label: '价格管理', icon: DollarSign },
                  { id: 'tags', label: '标签管理', icon: Settings },
                  { id: 'add', label: '增加菜品', icon: Plus },
                  { id: 'background', label: '背景设置', icon: ImageIcon },
                  { id: 'logo', label: 'LOGO设置', icon: Settings },
                  { id: 'printer', label: '打印设置', icon: Printer }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setManageSubNav(item.id as any)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      manageSubNav === item.id
                        ? 'bg-amber-800 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mb-1" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
              
              {/* 管理内容区 */}
              <div className="flex-1 overflow-auto">
                {manageSubNav === 'image' && (
                  <div className="text-gray-900">
                    {/* 分类筛选 */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(Object.keys(CATEGORY_NAMES) as DishCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setImageManageCategory(cat)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            imageManageCategory === cat
                              ? "bg-amber-800 text-white"
                              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          }`}
                        >
                          {CATEGORY_NAMES[cat]}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {dishes
                        .filter(dish => dish.category === imageManageCategory)
                        .map((dish) => (
                        <Card key={dish.id} className="cursor-pointer hover:ring-2 hover:ring-orange-500" onClick={() => {
                          setEditingDish({ ...dish });
                          setEditPreview(dish.image || '');
                          setEditImages(dish.images && dish.images.length > 0 && dish.images[0] ? dish.images : (dish.image ? [dish.image] : []));
                          setEditDescription(dish.description || '');
                          setNewTagName("");
                          setCurrentImageIndex(0);
                          setEditDishDialog(true);
                        }} autoCapitalize="off" autoCorrect="off">
                          <img src={dish.image} alt={dish.name} className="w-full h-32 object-cover" />
                          <div className="p-2">
                            <p className="text-sm font-bold text-gray-900 truncate">{dish.name}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {manageSubNav === 'price' && (
                  <div className="text-gray-900">
                    {/* 分类筛选 */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {(Object.keys(CATEGORY_NAMES) as DishCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPriceManageCategory(cat)}
                          className={`px-4 py-2 rounded-lg transition-all ${
                            priceManageCategory === cat
                              ? "bg-amber-800 text-white"
                              : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          }`}
                        >
                          {CATEGORY_NAMES[cat]}
                        </button>
                      ))}
                    </div>
                    
                    {/* 价格列表 */}
                    <div className="grid grid-cols-2 gap-4">
                      {dishes
                        .filter(dish => dish.category === priceManageCategory)
                        .map((dish, index) => (
                        <div 
                          key={dish.id} 
                          className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                        >
                          {/* 序号 */}
                          <span className="w-8 text-center font-bold text-gray-500">{index + 1}</span>
                          
                          {/* 菜品名称 */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 truncate">{dish.name}</h4>
                            <Badge className="mt-1 text-xs" variant="secondary">{CATEGORY_NAMES[dish.category]}</Badge>
                          </div>
                          
                          {/* 价格输入 */}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">¥</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={dish.price}
                              className="w-24 text-right font-bold text-lg"
                              autoCapitalize="off"
                              autoCorrect="off"
                              onBlur={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                if (newPrice > 0 && newPrice !== dish.price) {
                                  updateDishPrice(dish.id, newPrice);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newPrice = parseFloat((e.target as HTMLInputElement).value);
                                  if (newPrice > 0 && newPrice !== dish.price) {
                                    updateDishPrice(dish.id, newPrice);
                                  }
                                }
                              }}
                            />
                            <span className="text-sm text-gray-500">/份</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {manageSubNav === 'tags' && (
                  <div className="text-gray-900">
                    <div className="space-y-4">
                      {/* 分类筛选 */}
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(TAG_CATEGORY_NAMES) as TagCategory[]).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setTagManageCategory(cat)}
                            className={`px-4 py-2 rounded-lg transition-all ${
                              tagManageCategory === cat
                                ? "bg-amber-800 text-white"
                                : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                            }`}
                          >
                            {TAG_CATEGORY_NAMES[cat]}
                          </button>
                        ))}
                      </div>
                      
                      {/* 当前分类的标签列表 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-lg">{TAG_CATEGORY_NAMES[tagManageCategory]}标签</h3>
                          <Button
                            onClick={() => setShowAddTagDialog(true)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            添加标签
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {customTags[tagManageCategory]?.map(tag => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="px-4 py-2 text-base flex items-center gap-2"
                            >
                              {tag.name}
                              <button
                                onClick={() => {
                                  setCustomTags(prev => ({
                                    ...prev,
                                    [tagManageCategory]: prev[tagManageCategory].filter(t => t.id !== tag.id)
                                  }));
                                }}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                          {(!customTags[tagManageCategory] || customTags[tagManageCategory].length === 0) && (
                            <span className="text-gray-500 text-sm">暂无{TAG_CATEGORY_NAMES[tagManageCategory]}标签</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 添加标签对话框 */}
                      <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>添加{TAG_CATEGORY_NAMES[tagManageCategory]}标签</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>标签名称</Label>
                              <Input
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                placeholder="输入标签名称"
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>标签图标（Emoji，可选）</Label>
                              <Input
                                value={newTagIcon}
                                onChange={(e) => setNewTagIcon(e.target.value)}
                                placeholder="选择emoji图标"
                                className="mt-2"
                              />
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {['🌶️', '🧂', '🍋', '🍯', '🔥', '🥘', '♨️', '🌿', '🚫', '⭐', '🥣', '🍽️', '📦', '🛵'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => setNewTagIcon(emoji)}
                                    className={`text-2xl hover:bg-gray-100 rounded p-1 ${newTagIcon === emoji ? 'bg-orange-100' : ''}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => {
                              setShowAddTagDialog(false);
                              setNewTagName('');
                              setNewTagIcon('');
                            }}>
                              取消
                            </Button>
                            <Button
                              onClick={() => {
                                if (!newTagName.trim()) {
                                  alert('请输入标签名称');
                                  return;
                                }
                                const newTag: Tag = {
                                  id: `${tagManageCategory}-${Date.now()}`,
                                  name: newTagName.trim(),
                                  category: tagManageCategory,
                                  icon: newTagIcon.trim()
                                };
                                setCustomTags(prev => ({
                                  ...prev,
                                  [tagManageCategory]: [...(prev[tagManageCategory] || []), newTag]
                                }));
                                setShowAddTagDialog(false);
                                setNewTagName('');
                                setNewTagIcon('');
                              }}
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            >
                              确定
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                {manageSubNav === 'background' && (
                  <div className="text-gray-900">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-900">背景透明度</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={backgroundOpacity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setBackgroundOpacity(value);
                              saveBackgroundOpacity(value);
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-900">{backgroundOpacity}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-900">背景模糊度</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={backgroundBlur}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setBackgroundBlur(value);
                              saveBackgroundBlur(value);
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-900">{backgroundBlur}px</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-900">背景图片</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundUpload}
                          className="mt-2 cursor-pointer"
                        />
                        {customBackground && (
                          <img 
                            src={customBackground} 
                            alt="背景预览" 
                            className="mt-4 w-64 h-40 object-cover rounded" 
                            style={{ filter: `blur(${backgroundBlur}px)` }}
                          />
                        )}
                      </div>
                      {customBackground && (
                        <Button
                          onClick={async () => {
                            setCustomBackground('');
                            await saveCustomBackground('');
                          }}
                          variant="destructive"
                        >
                          清除背景
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {manageSubNav === 'add' && (
                  <div className="text-gray-900">
                    <div className="grid grid-cols-12 gap-6">
                      {/* 左栏：添加图片模块 */}
                      <div className="col-span-4">
                        <div className="border-2 border-gray-200 rounded-lg p-6 h-full min-h-[400px] flex flex-col">
                          <h3 className="text-sm font-medium text-gray-900 mb-6 text-center">添加图片（最多5张，每张≤10M）</h3>
                          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            {/* 图片预览网格 */}
                            <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                              {uploadImages.map((image, index) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={image} 
                                    alt={`预览${index + 1}`}
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                  />
                                  <button
                                    onClick={() => handleDeleteUploadImage(index)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                  {index === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white text-xs text-center py-0.5 rounded-b-lg">
                                      主图
                                    </div>
                                  )}
                                </div>
                              ))}
                              {uploadImages.length < 5 && (
                                <div 
                                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all"
                                  onClick={() => document.getElementById('add-dish-image')?.click()}
                                >
                                  <Plus className="w-8 h-8 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-500">添加</span>
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <span className="text-xs text-gray-500">已上传 {uploadImages.length}/5 张</span>
                            </div>
                            <input 
                              id="add-dish-image"
                              type="file" 
                              accept="image/*" 
                              multiple
                              onChange={handleUploadImage}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500 text-center px-4">支持拍照或从相册选择图片</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 右栏：相关信息模块 */}
                      <div className="col-span-8">
                        <div className="border-2 border-gray-200 rounded-lg p-6 h-full min-h-[400px]">
                          <div className="space-y-5">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">菜品名称</Label>
                              <Input 
                                value={uploadName} 
                                onChange={(e) => setUploadName(e.target.value)} 
                                placeholder="输入菜品名称" 
                                className="mt-2"
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">价格</Label>
                                <Input 
                                  type="number" 
                                  value={uploadPrice} 
                                  onChange={(e) => setUploadPrice(e.target.value)} 
                                  placeholder="输入价格" 
                                  className="mt-2"
                                  autoCapitalize="off"
                                  autoCorrect="off"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">分类</Label>
                                <Select value={uploadCategory} onValueChange={(value: DishCategory) => setUploadCategory(value)}>
                                  <SelectTrigger className="mt-2">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Object.keys(CATEGORY_NAMES) as DishCategory[]).map((cat) => (
                                      <SelectItem key={cat} value={cat}>{CATEGORY_NAMES[cat]}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {/* 标签选择区域 */}
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2">标签选择</Label>
                              <div className="flex flex-wrap gap-2">
                                {/* 显示预设的5个常用标签 */}
                                {PRESET_TAGS.custom.slice(0, 5).map(tag => (
                                  <button
                                    key={tag.id}
                                    onClick={() => {
                                      if (uploadSelectedTags.find(t => t.id === tag.id)) {
                                        setUploadSelectedTags(uploadSelectedTags.filter(t => t.id !== tag.id));
                                      } else {
                                        setUploadSelectedTags([...uploadSelectedTags, tag]);
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-all ${
                                      uploadSelectedTags.find(t => t.id === tag.id)
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {tag.name}
                                  </button>
                                ))}
                                {uploadSelectedTags.length > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center">已选 {uploadSelectedTags.length} 个</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium text-gray-700">菜品描述</Label>
                              <textarea
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="输入菜品描述（30字以内）"
                                className="w-full min-h-[60px] mt-2 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                                rows={2}
                                maxLength={30}
                              />
                              <p className="text-xs text-gray-500 mt-1">{uploadDescription.length}/30 字</p>
                            </div>
                            <div className="flex gap-4 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setUploadName('');
                                  setUploadPrice('');
                                  setUploadDescription('');
                                  setUploadImage(null);
                                  setUploadPreview('');
                                  setUploadImages([]);
                                  setUploadSelectedTags([]);
                                }}
                                className="flex-1"
                              >
                                清空
                              </Button>
                              <Button 
                                onClick={handleAddDish} 
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
                                disabled={!uploadName || !uploadPrice || !uploadImage}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                添加菜品
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {manageSubNav === 'logo' && (
                  <div className="text-gray-900">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-900">LOGO大小</Label>
                        <div className="flex items-center gap-4 mt-2">
                          <input
                            type="range"
                            min="5"
                            max="40"
                            value={logoSizePercent}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setLogoSizePercent(value);
                              saveLogoSize(value);
                            }}
                            className="flex-1"
                          />
                          <span className="text-sm text-gray-900">{logoSizePercent}%</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-900">LOGO图片</Label>
                        <Input
                          type="file"
                          accept="image/png"
                          onChange={handleLogoUpload}
                          className="mt-2 cursor-pointer"
                        />
                        {customLogo && (
                          <img src={customLogo} alt="LOGO预览" className="mt-4 w-32 h-32 object-contain rounded bg-transparent" />
                        )}
                      </div>
                      {customLogo && (
                        <Button
                          onClick={async () => {
                            setCustomLogo('');
                            await saveCustomLogo('');
                          }}
                          variant="destructive"
                        >
                          清除LOGO
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {manageSubNav === 'printer' && (
                  <div className="text-gray-900">
                    <div className="space-y-6 max-w-2xl">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                          <Printer className="w-4 h-4" />
                          本地打印功能
                        </h3>
                        <p className="text-sm text-green-800">
                          本系统采用本地打印模式，无需配置网络打印机。
                          打印功能通过浏览器直接调用系统打印机，支持：
                        </p>
                        <ul className="text-sm text-green-800 mt-2 ml-4 list-disc">
                          <li>热敏打印机（USB或网络连接）</li>
                          <li>普通打印机（A4或58mm热敏纸）</li>
                          <li>PDF虚拟打印机</li>
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleTestPrint}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          测试打印
                        </Button>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">使用说明</h4>
                        <div className="text-sm text-gray-600 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">Q:</span>
                            <span>如何设置打印机？</span>
                          </div>
                          <div className="pl-4">
                            <p>A:</p>
                            <ul className="list-disc list-inside ml-2 text-xs">
                              <li>将打印机通过USB连接到iPad（如适用）</li>
                              <li>或在系统设置中添加网络打印机</li>
                              <li>测试时会自动弹出打印机选择对话框</li>
                            </ul>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">Q:</span>
                            <span>打印不出来怎么办？</span>
                          </div>
                          <div className="pl-4">
                            <p>A:</p>
                            <ul className="list-disc list-inside ml-2 text-xs">
                              <li>检查浏览器是否允许弹窗</li>
                              <li>确认打印机已正确连接并开启</li>
                              <li>检查系统打印设置中的打印机列表</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : currentNav === 'progress' ? (
            // 进度模式：显示活跃订单
            <div className="h-full flex flex-col p-6">
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                  <Clock className="w-16 h-16 mb-4" />
                  <p>暂无就餐中的订单</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeOrders.map((order) => (
                    <Card 
                      key={order.orderId} 
                      className="p-3 cursor-pointer hover:shadow-lg transition-shadow bg-white"
                      onClick={() => openOrderDetail(order)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Table className="w-5 h-5 text-orange-500" />
                          <span className="text-base font-bold text-gray-900">{order.tableNumber}号桌</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs">就餐中</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">订单号：{order.orderId}</span>
                      </div>
                      <div className="space-y-2 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{formatCustomerCount(order.customerCount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Utensils className="w-4 h-4" />
                          <span>{order.items.length}道菜</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-bold text-red-500 text-sm">¥{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 h-10 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintExistingOrder(order);
                          }}
                        >
                          打印
                        </Button>
                        <Button 
                          className="flex-1 h-10 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteOrder(order.tableNumber);
                          }}
                        >
                          结账
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : currentNav === 'bill' ? (
            // 报表模式：显示今日已结账订单的汇总和明细
            <div className="h-full flex flex-col p-6 overflow-hidden">
              {completedOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-500">
                  <DollarSign className="w-16 h-16 mb-4" />
                  <p>今日暂无已结账订单</p>
                  <p className="text-sm mt-2">结账后会在此处显示汇总信息</p>
                </div>
              ) : (
                <>
                  {/* 汇总数据卡片 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-to-br from-amber-500 to-red-600 text-white">
                      <div className="text-sm opacity-80 mb-1">订单总数</div>
                      <div className="text-3xl font-bold">{completedOrders.length}</div>
                      <div className="text-xs mt-1 opacity-70">单</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                      <div className="text-sm opacity-80 mb-1">营业总额</div>
                      <div className="text-3xl font-bold">¥{completedOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</div>
                      <div className="text-xs mt-1 opacity-70">元</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      <div className="text-sm opacity-80 mb-1">平均消费</div>
                      <div className="text-3xl font-bold">¥{(completedOrders.reduce((sum, o) => sum + o.totalAmount, 0) / completedOrders.length).toFixed(2)}</div>
                      <div className="text-xs mt-1 opacity-70">元/单</div>
                    </Card>
                    <Card className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      <div className="text-sm opacity-80 mb-1">总桌数</div>
                      <div className="text-3xl font-bold">{completedOrders.reduce((sum, o) => sum + 1, 0)}</div>
                      <div className="text-xs mt-1 opacity-70">桌</div>
                    </Card>
                  </div>

                  {/* 明细列表 */}
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h2 className="text-lg font-bold text-gray-900">订单明细</h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('确定要清空今日汇总吗？此操作不可恢复。')) {
                            clearAllCompletedOrders();
                            setCompletedOrders([]);
                          }
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        清空今日
                      </Button>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="space-y-3 pr-4">
                        {completedOrders.map((order, index) => (
                          <Card 
                            key={order.orderId}
                            className="p-4 bg-white hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    #{index + 1}
                                  </Badge>
                                  <span className="text-sm font-bold text-gray-900">
                                    {order.tableNumber}号桌
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {order.orderId}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-xs text-gray-600 mb-2">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{formatCustomerCount(order.customerCount)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Utensils className="w-3 h-3" />
                                    <span>{order.items.length}道菜</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(order.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  菜品：{order.items.map(item => `${item.name}×${item.quantity}`).join('、')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-red-500">
                                  ¥{order.totalAmount.toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          ) : (
            // 菜品模式：显示菜品网格（支持滑动翻页）
            <div className="flex flex-col h-full p-4 relative">
              {/* 水平滚动容器 */}
              <div
                id="dishes-scroll-container"
                className="flex overflow-x-auto snap-x snap-mandatory flex-1 scroll-smooth"
                style={{
                  scrollbarWidth: 'none', // Firefox
                  msOverflowStyle: 'none', // IE/Edge
                }}
              >
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="flex-shrink-0 w-full snap-center"
                  >
                    <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
                      {/* 当前页的8个菜品卡片 */}
                      {getCurrentPageDishes(pageIndex).map((dish, index) => (
                        <DishCard
                          key={dish.id}
                          dish={dish}
                          index={pageIndex * dishesPerPage + index}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* ============ 对话框组件 ============ */}
      
      {/* Logo裁剪对话框 */}
      <Dialog open={showLogoCropDialog} onOpenChange={setShowLogoCropDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>裁剪Logo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center min-h-[400px] bg-gray-100 rounded-lg overflow-auto">
            {logoImageSrc && (
              <ReactCrop
                crop={logoCrop}
                onChange={(c) => setLogoCrop(c)}
                onComplete={onLogoCropComplete}
                aspect={undefined}
                circularCrop={false}
                className="max-w-full"
              >
                <img
                  src={logoImageSrc}
                  alt="待裁剪Logo"
                  onLoad={onLogoImageLoad}
                  className="max-w-full max-h-[70vh]"
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleLogoCropCancel}>
              取消
            </Button>
            <Button onClick={handleLogoCropConfirm}>
              <CropIcon className="w-4 h-4 mr-2" />
              确认裁剪
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 打印确认对话框 */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ maxWidth: '320px' }}>
          <DialogHeader>
            <DialogTitle className="text-center">确认下单</DialogTitle>
          </DialogHeader>
          {pendingOrder && (
            <div className="space-y-3">
              {/* 小票样式容器 */}
              <div className="border-2 border-gray-300 bg-white p-4" style={{ width: '100%' }}>
                {/* 标题 */}
                <div className="text-center mb-3 pb-3 border-b-2 border-dashed border-gray-300">
                  <h2 className="text-xl font-bold text-gray-900">陶然小灶</h2>
                  <p className="text-sm text-gray-600 mt-1">厨房订单</p>
                </div>

                {/* 订单信息 */}
                <div className="text-sm mb-3 pb-3 border-b border-dashed border-gray-300">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">桌号：</span>
                    <span className="font-bold">{pendingOrder.tableNumber}号桌</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">人数：</span>
                    <span className="font-bold">{formatCustomerCount(pendingOrder.customerCount)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">订单号：</span>
                    <span className="font-bold">{pendingOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">时间：</span>
                    <span className="font-bold">
                      {new Date(pendingOrder.createdAt).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* 菜品列表 */}
                <div className="mb-3 pb-3 border-b border-dashed border-gray-300">
                  <p className="text-base font-bold mb-2 border-l-4 border-gray-900 pl-2">菜品明细</p>
                  {pendingOrder.items.map((item: any, index: number) => (
                    <div key={item.id} className="mb-5">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-bold text-sm flex-1 mr-2">
                          {index + 1}. {item.name}
                        </span>
                        <span className="font-bold text-sm">× {item.quantity}</span>
                      </div>
                      {/* 口味和忌口备注 */}
                      {((item.taste && !(item.taste.length === 1 && item.taste[0] === '标准')) || item.avoidance || item.customTaste) && (
                        <div className="text-xs text-gray-600 ml-2">
                          {item.taste && item.taste.length > 0 && !(item.taste.length === 1 && item.taste[0] === '标准') && (
                            <span>口味：{item.taste.join("、")}</span>
                          )}
                          {item.avoidance && item.avoidance.length > 0 && (
                            <span className="ml-2">忌口：{item.avoidance.join("、")}</span>
                          )}
                          {item.customTaste && (
                            <span className="ml-2">备注：{item.customTaste}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 提示信息 */}
                <div className="text-xs text-center text-gray-500">
                  <p>━━━━━━━━━━━━━━━━━━</p>
                  <p className="mt-2">共 {pendingOrder.items.length} 道菜</p>
                  <p className="mt-1">请尽快配菜炒菜</p>
                  <p className="mt-3 text-gray-400">谢谢光临</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelOrder}
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={handlePlaceOrder}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              下单
            </Button>
            <Button 
              onClick={handlePlaceOrderWithPrint}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 打印预览对话框 */}
      <Dialog open={showPrintPreviewDialog} onOpenChange={setShowPrintPreviewDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ maxWidth: '400px' }}>
          <DialogHeader>
            <DialogTitle className="text-center">打印预览</DialogTitle>
          </DialogHeader>
          {printPreviewOrder && (
            <div className="space-y-3">
              {/* 打印内容预览 */}
              <div className="border-2 border-gray-300 bg-white p-4 font-mono text-xs" style={{ 
                width: '100%',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {generatePrintPreviewContent(printPreviewOrder)}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintPreviewDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={() => printPreviewOrder && confirmPrintExistingOrder(printPreviewOrder)} 
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              确认打印
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 订单详情对话框 */}
      <Dialog open={showOrderDetailDialog} onOpenChange={setShowOrderDetailDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ maxWidth: '600px' }}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">订单详情</DialogTitle>
          </DialogHeader>
          {selectedActiveOrder && (
            <div className="space-y-4">
              {/* 订单基本信息 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">桌号：</span>
                    <span className="font-bold">{selectedActiveOrder.tableNumber}号桌</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">人数：</span>
                    <span className="font-bold">{formatCustomerCount(selectedActiveOrder.customerCount)}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">订单号：</span>
                    <span className="font-bold">{selectedActiveOrder.orderId}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">下单时间：</span>
                    <span className="font-bold">{new Date(selectedActiveOrder.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <DollarSign className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">消费金额：</span>
                    <span className="font-bold text-red-500 text-lg">¥{selectedActiveOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 菜品明细 */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 border-b pb-2">菜品明细</h3>
                <div className="space-y-3">
                  {selectedActiveOrder.items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                          <span className="text-sm font-bold text-orange-500 ml-2">×{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-red-500 font-bold">¥{item.price}</span>
                          {((item.taste && !(item.taste.length === 1 && item.taste[0] === '标准')) || item.avoidance || item.customTaste) && (
                            <span className="text-xs text-gray-500">
                              {item.taste && item.taste.length > 0 && !(item.taste.length === 1 && item.taste[0] === '标准') && (
                                <span>口味：{item.taste.join("、")}</span>
                              )}
                              {item.avoidance && item.avoidance.length > 0 && (
                                <span className="ml-1">忌口：{item.avoidance.join("、")}</span>
                              )}
                              {item.customTaste && (
                                <span className="ml-1">备注：{item.customTaste}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetailDialog(false)}>
              关闭
            </Button>
            <Button 
              onClick={() => selectedActiveOrder && handleAddDishes(selectedActiveOrder)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              加菜
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 菜品标签选择对话框 */}
      <Dialog open={showTagSelectDialog} onOpenChange={setShowTagSelectDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>选择菜品规格</DialogTitle>
          </DialogHeader>
          {currentTagDish && (
            <div className="space-y-4">
              {/* 菜品信息 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img src={currentTagDish.image} alt={currentTagDish.name} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h3 className="font-bold text-gray-900">{currentTagDish.name}</h3>
                  <p className="text-sm text-gray-500">选择您需要的规格</p>
                </div>
              </div>

              {/* 标签选择区域 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">可选规格（可多选）</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const dish = dishes.find(d => d.id === currentTagDish.id);
                    const availableTags = dish?.customTags || [];
                    return availableTags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                            : 'hover:bg-amber-50 hover:border-amber-300 text-gray-700 border-gray-300'
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ));
                  })()}
                </div>
              </div>

              {/* 自定义标签输入区域 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800 mb-2">自定义备注：</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="输入自定义备注（如：多放葱花）"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customTagInput.trim()) {
                        e.preventDefault();
                        addCustomTagToSelection();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={addCustomTagToSelection} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  输入自定义备注后按回车或点击+号添加
                </p>
              </div>

              {/* 已选标签显示 */}
              {selectedTags.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800 mb-2">已选规格：</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        className="bg-amber-500 text-white flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeSelectedTag(tag)}
                          className="hover:bg-amber-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">提示：</span>
                    未选择任何规格，如需特殊要求请在上方输入框添加自定义备注
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cancelTagSelection}>
              取消
            </Button>
            <Button onClick={confirmTagSelection} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Check className="w-4 h-4 mr-2" />
              确认选择
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 编辑菜品对话框 */}
      <Dialog open={editDishDialog} onOpenChange={setEditDishDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑菜品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 第一行：菜品名称 + 价格 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label>菜品名称</Label>
                <Input value={editingDish?.name || ''} onChange={(e) => setEditingDish(prev => prev ? { ...prev, name: e.target.value } : null)} />
              </div>
              <div>
                <Label>价格</Label>
                <Input type="number" value={editingDish?.price || ''} onChange={(e) => setEditingDish(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)} autoCapitalize="off" autoCorrect="off" />
              </div>
            </div>
            
            {/* 第二行：评分 + 分类 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>评分</Label>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      onClick={() => setEditingDish(prev => prev ? { ...prev, rating: star } : null)}
                      className={`w-6 h-6 cursor-pointer transition-colors flex-shrink-0 ${
                        (editingDish?.rating || 0) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-none text-gray-300 hover:text-yellow-400'
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-xs text-gray-600 whitespace-nowrap">
                    {editingDish?.rating ? `${editingDish.rating} / 5` : '未评分'}
                  </span>
                  {editingDish?.rating && (
                    <button
                      onClick={() => setEditingDish(prev => prev ? { ...prev, rating: undefined } : null)}
                      className="ml-1 w-4 h-4 rounded-full bg-red-100 hover:bg-red-200 text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                      title="清除评分"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="ml-20">
                <Label>分类</Label>
                <Select value={editingDish?.category} onValueChange={(value: DishCategory) => setEditingDish(prev => prev ? { ...prev, category: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_NAMES) as DishCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>{CATEGORY_NAMES[cat]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>菜品描述</Label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="输入菜品描述（30字以内）"
                className="w-full min-h-[60px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                rows={2}
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-1">{editDescription.length}/30 字</p>
            </div>
            
            <div>
              <Label>菜品图片</Label>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleEditImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-gray-500">支持拍照或从相册选择图片，最多5张，每张≤10M</p>
                <p className="text-xs text-gray-500">当前: {editImages.length}/5</p>
                {editImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {editImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={img} 
                          alt={`预览${index + 1}`} 
                          className={`w-full h-20 object-cover rounded border-2 ${index === 0 ? 'border-orange-500' : 'border-gray-300'}`} 
                        />
                        {/* 删除按钮 */}
                        <button
                          onClick={() => handleRemoveEditImage(index)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {/* 主图标签或设置主图按钮 */}
                        {index === 0 ? (
                          <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                            主图
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSetPrimaryImage(index)}
                            className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded hover:bg-green-600 transition-colors"
                            title="设为主图"
                          >
                            设为主图
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 标签管理 - 自动获取创建的标签 */}
            <div>
              <Label>菜品标签</Label>
              <p className="text-xs text-gray-500 mb-2">
                为该菜品设置可选标签。顾客在购物车中可以从中选择。
              </p>
              
              {/* 分类菜单 */}
              <div className="flex gap-2 mb-3 flex-wrap">
                {(Object.keys(TAG_CATEGORY_NAMES) as TagCategory[]).map((cat) => {
                  const categoryTags = customTags[cat] || [];
                  if (categoryTags.length === 0) return null;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setEditTagExpandedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        editTagExpandedCategory === cat
                          ? "bg-amber-800 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {TAG_CATEGORY_NAMES[cat]}
                    </button>
                  );
                })}
              </div>
              
              {/* 当前分类的标签列表 */}
              {editTagExpandedCategory && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  {editTagExpandedCategory !== 'custom' ? (
                    <div className="flex flex-wrap gap-2">
                      {(customTags[editTagExpandedCategory] || []).map(tag => {
                        const isSelected = editingDish?.customTags?.includes(tag.name);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => {
                              if (isSelected) {
                                setEditingDish(prev => prev ? {
                                  ...prev,
                                  customTags: (prev.customTags || []).filter(t => t !== tag.name)
                                } : null);
                              } else {
                                setEditingDish(prev => prev ? {
                                  ...prev,
                                  customTags: [...(prev.customTags || []), tag.name]
                                } : null);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // 自定义标签：显示输入框
                    <div className="flex items-center gap-2">
                      <Input
                        value={customTagInput}
                        onChange={(e) => setCustomTagInput(e.target.value)}
                        placeholder="输入自定义标签"
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && customTagInput.trim()) {
                            setEditingDish(prev => prev ? {
                              ...prev,
                              customTags: [...(prev.customTags || []), customTagInput.trim()]
                            } : null);
                            setCustomTagInput("");
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (customTagInput.trim()) {
                            setEditingDish(prev => prev ? {
                              ...prev,
                              customTags: [...(prev.customTags || []), customTagInput.trim()]
                            } : null);
                            setCustomTagInput("");
                          }
                        }}
                        className="bg-orange-500 text-white"
                      >
                        添加
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              {/* 已选标签 */}
              {(editingDish?.customTags || []).length > 0 && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">已选标签</p>
                  <div className="flex flex-wrap gap-2">
                    {editingDish?.customTags?.map(tagName => {
                      return (
                        <span
                          key={tagName}
                          className="px-3 py-1 rounded-full text-sm bg-orange-500 text-white flex items-center gap-1"
                        >
                          {tagName}
                          <button
                            onClick={() => {
                              setEditingDish(prev => prev ? {
                                ...prev,
                                customTags: (prev.customTags || []).filter(t => t !== tagName)
                              } : null);
                            }}
                            className="hover:bg-orange-600 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {(Object.keys(TAG_CATEGORY_NAMES) as TagCategory[]).every(cat => (customTags[cat] || []).length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">
                  暂无标签，请先在"标签管理"页面创建标签
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDishDialog(false)}>取消</Button>
            <Button onClick={saveDishEdit} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">保存</Button>
            <Button variant="destructive" onClick={() => editingDish && deleteDish(editingDish.id)}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 全屏图片浏览器 - 类似iPad原生体验 */}
      {imageViewerOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* 背景黑色 */}
            <div className="absolute inset-0 bg-black" />
            
            {/* 图片容器 - 用于动画 */}
            <div 
              className="relative w-full h-full flex items-center justify-center"
              style={{
                transition: isAnimating ? 'transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none'
              }}
            >
              {/* 全屏图片 */}
              <img
                src={viewingImages[currentImageIndex]}
                alt={`图片 ${currentImageIndex + 1}`}
                className="relative w-full h-full object-contain select-none"
                style={{ 
                  maxWidth: '100vw', 
                  maxHeight: '100vh',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  transition: isAnimating ? 'opacity 0.15s ease-in-out' : 'none',
                  opacity: isAnimating ? 0.5 : 1
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              />
            </div>
            
            {/* 顶部信息栏 - 半透明 */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent pt-4 pb-12 px-4 z-10">
              <div className="flex justify-between items-start">
                {/* 左侧图片计数 */}
                <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                  {currentImageIndex + 1} / {viewingImages.length}
                </div>
                
                {/* 关闭按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageViewerOpen(false);
                  }}
                  className="w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm"
                  style={{ pointerEvents: 'auto' }}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* 底部图片指示器 - 半透明 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-12 pb-4 px-4 z-10">
              <div className="flex justify-center gap-3">
                {viewingImages.map((_, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/70'
                    }`}
                    style={{ pointerEvents: 'auto' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 查看菜品详情对话框 */}
      <Dialog open={viewDishDialog} onOpenChange={setViewDishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingDish?.name}</DialogTitle>
          </DialogHeader>
          {viewingDish && (
            <div className="space-y-4">
              <img src={viewingDish.image} alt={viewingDish.name} className="w-full h-64 object-cover rounded" />
              <p className="text-2xl font-bold text-orange-500">RMB {viewingDish.price}/份</p>
              <p className="text-gray-600">{CATEGORY_NAMES[viewingDish.category]}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => {
              viewingDish && addToCart(viewingDish);
              setViewDishDialog(false);
            }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Plus className="w-5 h-5 mr-2" />
              加入购物车
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 忌口选择对话框 */}
      <Dialog open={showAvoidanceDialog} onOpenChange={setShowAvoidanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>忌口选择</DialogTitle>
          </DialogHeader>
          {currentAvoidanceDish && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">菜品：{currentAvoidanceDish.name}</p>
                <p className="text-xs text-gray-500 mt-1">分类：{CATEGORY_NAMES[currentAvoidanceDish.category]}</p>
              </div>
              <div>
                <Label className="text-base font-medium mb-3 block">请选择选项：</Label>
                {avoidanceTagsByCategory[currentAvoidanceDish.category]?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>该分类暂无可选选项</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {avoidanceTagsByCategory[currentAvoidanceDish.category]?.map((tag) => {
                      const isSelected = avoidanceSelections[currentAvoidanceDish.id]?.includes(tag.name);
                      return (
                        <Badge
                          key={tag.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer px-4 py-2 text-base flex items-center gap-1 ${
                            isSelected ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'hover:bg-orange-100 text-gray-700 border-2'
                          }`}
                          onClick={() => toggleAvoidanceTag(tag.name)}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                          {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowAvoidanceDialog(false)} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
