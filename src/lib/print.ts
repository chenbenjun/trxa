// 本地打印工具函数

/**
 * 生成本地打印预览HTML
 */
export const generatePrintHTML = (order: {
  orderId: string;
  tableNumber: string;
  customerCount: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    customTags?: string[];
  }>;
  totalAmount: number;
  createdAt: string;
}): string => {
  const now = new Date(order.createdAt);

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>陶然小灶 - 消费单</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: "Microsoft YaHei", Arial, sans-serif;
          font-size: 14px;
          color: #000;
          max-width: 58mm;
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 20px;
          margin-bottom: 5px;
          color: #DC2626;
        }
        .info {
          margin-bottom: 10px;
          padding: 5px;
          background: #f5f5f5;
        }
        .info p {
          margin: 3px 0;
        }
        .items {
          margin-bottom: 10px;
        }
        .item {
          padding: 5px 0;
          border-bottom: 1px dashed #ccc;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .item-name {
          font-weight: bold;
        }
        .item-detail {
          font-size: 12px;
          color: #666;
        }
        .total {
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          margin: 10px 0;
          color: #DC2626;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>陶然小灶</h1>
        <p>消费明细单</p>
      </div>

      <div class="info">
        <p><strong>桌号：</strong>${order.tableNumber}号桌</p>
        <p><strong>订单号：</strong>${order.orderId}</p>
        <p><strong>人数：</strong>${order.customerCount}人</p>
        <p><strong>时间：</strong>${now.toLocaleString('zh-CN')}</p>
      </div>

      <div class="items">
        <h3 style="margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px;">
          菜品明细
        </h3>
  `;

  order.items.forEach((item, index) => {
    const tags = item.customTags && item.customTags.length > 0 ? ` (${item.customTags.join('、')})` : '';

    html += `
      <div class="item">
        <div class="item-header">
          <span class="item-name">${index + 1}. ${item.name}${tags}</span>
          <span>×${item.quantity}</span>
        </div>
        <div class="item-detail">
          <span>单价：¥${item.price.toFixed(2)}</span>
          <span style="margin-left: 20px;">小计：¥${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    `;
  });

  html += `
      </div>

      <div class="total">
        合计：¥${order.totalAmount.toFixed(2)}
      </div>

      <div class="footer">
        <p>================================</p>
        <p>感谢您的光临！</p>
        <p>================================</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #DC2626;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        ">打印</button>
        <button onclick="window.close()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #ccc;
          color: #000;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">关闭</button>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * 执行本地打印
 */
export const printOrder = (order: {
  orderId: string;
  tableNumber: string;
  customerCount: number;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    customTags?: string[];
  }>;
  totalAmount: number;
  createdAt: string;
}): void => {
  const printHTML = generatePrintHTML(order);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.focus();
    // 延迟一下确保内容加载完成
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    alert('无法打开打印窗口，请检查浏览器的弹窗设置。');
  }
};

/**
 * 测试打印
 */
export const printTest = (): void => {
  const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>测试打印</title>
      <style>
        body {
          font-family: "Microsoft YaHei", Arial, sans-serif;
          font-size: 14px;
          padding: 20px;
        }
        .test-content {
          max-width: 58mm;
          margin: 0 auto;
        }
        h1 { color: #DC2626; }
        .success { color: green; font-weight: bold; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="test-content">
        <h1>测试打印单</h1>
        <p>================================</p>
        <p><strong>测试时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
        <p>--------------------------------</p>
        <p class="success">✓ 打印机连接正常</p>
        <p class="success">✓ 打印功能正常</p>
        <p class="success">✓ 陶然小灶系统就绪</p>
        <p>--------------------------------</p>
        <p>如果您看到这张测试单，说明打印功能可以使用！</p>
        <p>================================</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #DC2626;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        ">打印</button>
        <button onclick="window.close()" style="
          padding: 10px 20px;
          font-size: 16px;
          background: #ccc;
          color: #000;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">关闭</button>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(testHTML);
    printWindow.document.close();
    printWindow.focus();
  } else {
    alert('无法打开打印窗口，请检查浏览器的弹窗设置。');
  }
};
