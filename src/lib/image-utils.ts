// 图片处理工具函数（前端本地实现）

/**
 * 强制压缩图片到指定大小以下
 * @param base64 - Base64图片字符串
 * @param maxSizeInMB - 最大大小（MB）
 * @param keepTransparent - 是否保留透明背景（PNG格式）
 * @returns 压缩后的Base64字符串
 */
export const forceCompressToSize = async (
  base64: string,
  maxSizeInMB: number = 0.5,
  keepTransparent: boolean = false
): Promise<string> => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  const currentSize = base64.length * 0.75; // Base64 约为原大小的 4/3
  
  // 如果已经小于限制，直接返回
  if (currentSize <= maxSizeInBytes) {
    return base64;
  }
  
  // 计算需要的压缩比例
  const ratio = Math.sqrt(maxSizeInBytes / currentSize);
  const targetWidth = Math.floor(800 * ratio);
  const targetHeight = Math.floor(600 * ratio);
  
  // 逐步降低质量直到满足大小要求
  let quality = 0.8;
  let result = base64;
  
  while (quality > 0.3) {
    result = await compressImage(base64, targetWidth, targetHeight, quality, keepTransparent);
    const resultSize = result.length * 0.75;
    
    if (resultSize <= maxSizeInBytes) {
      console.log(`图片压缩: ${(currentSize / 1024 / 1024).toFixed(2)}MB -> ${(resultSize / 1024 / 1024).toFixed(2)}MB (质量: ${quality})`);
      return result;
    }
    
    quality -= 0.1;
  }
  
  // 如果质量降到 0.3 还是太大，继续降低尺寸
  return compressImage(base64, targetWidth * 0.7, targetHeight * 0.7, 0.7, keepTransparent);
};

/**
 * 将文件转换为Base64字符串（自动压缩）
 * @param file - 文件对象
 * @param maxSize - 最大文件大小（字节），默认10MB
 * @param compressMaxSize - 压缩后最大大小（MB），默认0.5MB
 * @param keepTransparent - 是否保留透明背景（PNG格式）
 * @returns Base64字符串
 */
export const fileToBase64 = (file: File, maxSize: number = 10 * 1024 * 1024, compressMaxSize: number = 0.5, keepTransparent: boolean = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查文件大小
    if (file.size > maxSize) {
      reject(new Error(`文件大小超过限制（最大${maxSize / 1024 / 1024}MB）`));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      try {
        // 自动压缩图片
        const compressed = await forceCompressToSize(result, compressMaxSize, keepTransparent);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * 将多个文件转换为Base64数组（自动压缩）
 * @param files - 文件数组
 * @param maxSize - 每个文件的最大大小
 * @param maxCount - 最大文件数量
 * @param compressMaxSize - 压缩后最大大小（MB）
 * @param keepTransparent - 是否保留透明背景（PNG格式）
 * @returns Base64字符串数组
 */
export const filesToBase64Array = (
  files: File[],
  maxSize: number = 10 * 1024 * 1024,
  maxCount: number = 5,
  compressMaxSize: number = 0.5,
  keepTransparent: boolean = false
): Promise<string[]> => {
  if (files.length > maxCount) {
    return Promise.reject(new Error(`最多上传${maxCount}张图片`));
  }

  return Promise.all(files.map(file => fileToBase64(file, maxSize, compressMaxSize, keepTransparent)));
};

/**
 * 压缩图片（通过Canvas）
 * @param base64 - Base64图片字符串
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @param quality - 压缩质量（0-1）
 * @param keepTransparent - 是否保留透明背景（PNG格式）
 * @returns 压缩后的Base64字符串
 */
export const compressImage = (
  base64: string,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8,
  keepTransparent: boolean = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算新的尺寸
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // 创建Canvas进行压缩
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'));
        return;
      }

      // 如果需要保留透明背景，清除画布为透明
      if (keepTransparent) {
        ctx.clearRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // 导出为Base64
      try {
        // 如果需要保留透明背景，使用PNG格式；否则使用JPEG
        const mimeType = keepTransparent ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = base64;
  });
};

/**
 * 批量压缩图片
 * @param base64Array - Base64图片数组
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @param quality - 压缩质量
 * @param keepTransparent - 是否保留透明背景（PNG格式）
 * @returns 压缩后的Base64数组
 */
export const compressImages = (
  base64Array: string[],
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8,
  keepTransparent: boolean = false
): Promise<string[]> => {
  return Promise.all(
    base64Array.map(base64 => compressImage(base64, maxWidth, maxHeight, quality, keepTransparent))
  );
};

/**
 * 获取图片尺寸
 * @param base64 - Base64图片字符串
 * @returns 图片尺寸对象
 */
export const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.onerror = (error) => {
      reject(error);
    };
    img.src = base64;
  });
};

/**
 * 验证是否为有效的图片Base64
 * @param base64 - Base64字符串
 * @returns 是否为有效图片
 */
export const isValidImageBase64 = (base64: string): boolean => {
  const validPrefixes = [
    'data:image/jpeg',
    'data:image/jpg',
    'data:image/png',
    'data:image/gif',
    'data:image/webp',
    'data:image/svg+xml'
  ];
  return validPrefixes.some(prefix => base64.startsWith(prefix));
};

/**
 * 创建占位图
 * @param text - 显示的文字
 * @param width - 宽度
 * @param height - 高度
 * @param color - 背景颜色
 * @returns Base64字符串
 */
export const createPlaceholderImage = (
  text: string,
  width: number = 300,
  height: number = 200,
  color: string = '#DC2626'
): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}" opacity="0.1"/>
      <rect width="${width}" height="${height}" fill="${color}"/>
      <text x="${width/2}" y="${height/2}" 
            font-family="Arial, sans-serif" 
            font-size="${Math.min(width, height) / 5}" 
            fill="white" 
            text-anchor="middle" 
            font-weight="bold" 
            dominant-baseline="middle">${text.charAt(0)}</text>
      <text x="${width/2}" y="${height * 0.75}" 
            font-family="Arial, sans-serif" 
            font-size="${Math.min(width, height) / 10}" 
            fill="white" 
            text-anchor="middle">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};
