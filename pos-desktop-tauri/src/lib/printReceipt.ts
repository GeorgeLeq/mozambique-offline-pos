import JsBarcode from 'jsbarcode';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptPaymentHistory {
  date: string;
  amount: number;
  method: string;
}

export interface ReceiptData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  receiptId: string;
  date: string;
  cashierName: string;
  items: ReceiptItem[];
  totalDue: number;
  paymentMethod: string;
  paymentHistory?: ReceiptPaymentHistory[];
}

// Utility to format values using current offline localization settings
function formatLocalValue(val: number): string {
  const symbol = localStorage.getItem('currency_symbol') || 'MT';
  const decimals = parseInt(localStorage.getItem('currency_decimals') || '2', 10);
  const decimalSep = localStorage.getItem('currency_decimal_separator') || ',';
  
  const num = (val || 0).toFixed(decimals);
  const thousandSep = decimalSep === ',' ? '.' : ' ';
  const parts = num.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
  
  return `${parts.join(decimalSep)} ${symbol}`;
}

// Generates an offline barcode SVG string using jsbarcode
export function generateBarcodeSVG(text: string): string {
  try {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, text, {
      format: 'CODE128',
      width: 1.5,
      height: 45,
      displayValue: true,
      fontSize: 10,
      margin: 0
    });
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
  } catch (err) {
    console.error('Failed to generate offline barcode SVG', err);
    return '';
  }
}

export function printReceipt(data: ReceiptData) {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  // Retrieve customized Receipt Branding fields from settings (or fallback)
  const brandTitle = localStorage.getItem('receipt_header_title') || data.shopName;
  const brandAddress = localStorage.getItem('receipt_header_address') || data.shopAddress || '';
  const brandPhone = localStorage.getItem('receipt_header_phone') || data.shopPhone || '';
  const brandNuit = localStorage.getItem('receipt_header_nuit') || '';
  const brandFooter = localStorage.getItem('receipt_footer_msg') || 'Obrigado pela sua preferência!';
  const showBarcodeSetting = localStorage.getItem('receipt_show_barcode') !== 'false';

  // Printer configuration options
  const paperWidth = localStorage.getItem('printer_paper_width') || '80mm';
  const copiesStr = localStorage.getItem('printer_copies') || '1';
  const copies = parseInt(copiesStr, 10) || 1;

  const itemsHtml = data.items.map(item => {
    const price = item.price || 0;
    const total = item.total || 0;
    return `
      <div class="item">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <span>${item.quantity} x ${formatLocalValue(price)}</span>
          <span>${formatLocalValue(total)}</span>
        </div>
      </div>
    `;
  }).join('');

  // Generate the optional barcode at the bottom of the receipt
  let barcodeHtml = '';
  if (showBarcodeSetting && data.receiptId) {
    const barcodeSVG = generateBarcodeSVG(data.receiptId.substring(0, 12).toUpperCase());
    if (barcodeSVG) {
      barcodeHtml = `
        <div class="barcode-wrapper" style="margin-top: 15px; display: flex; justify-content: center;">
          ${barcodeSVG}
        </div>
      `;
    }
  }

  // Generate copy copies html
  let copiesHtml = '';
  for (let i = 0; i < copies; i++) {
    const isLast = i === copies - 1;
    copiesHtml += `
      <div class="receipt-copy" style="${isLast ? '' : 'page-break-after: always;'}">
        <div class="header">
          <h2>${brandTitle}</h2>
          ${i > 0 ? `<p style="font-weight: bold; font-size: ${paperWidth === '58mm' ? '8px' : '10px'}; margin-bottom: 4px; text-transform: uppercase;">VIA ${i + 1} (${i === 1 ? 'Arquivo' : 'Secção'})</p>` : ''}
          ${brandAddress ? `<p>${brandAddress}</p>` : ''}
          ${brandPhone ? `<p>Tel: ${brandPhone}</p>` : ''}
          ${brandNuit ? `<p>NUIT: ${brandNuit}</p>` : ''}
        </div>
        
        <div class="meta">
          <div>RECIBO: #${data.receiptId.substring(0, 8).toUpperCase()}</div>
          <div>DATA: ${new Date(data.date).toLocaleString()}</div>
          <div>OPERADOR: ${data.cashierName.toUpperCase()}</div>
          <div>PAGAMENTO: ${data.paymentMethod.toUpperCase()}</div>
        </div>

        <div class="items">
          ${itemsHtml}
        </div>

        ${(() => {
          const rawTaxRate = localStorage.getItem('tax_rate');
          const taxRate = rawTaxRate !== null ? (parseFloat(rawTaxRate) || 0) : 16;
          if (taxRate > 0) {
            const subtotal = data.totalDue / (1 + taxRate / 100);
            const taxAmt = data.totalDue - subtotal;
            return `
              <div class="subtotals" style="margin-bottom: 6px; font-size: ${paperWidth === '58mm' ? '8px' : '10px'}; line-height: 1.4; border-bottom: 1px dotted #000; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal (Sem IVA)</span>
                  <span>${formatLocalValue(subtotal)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>IVA (${taxRate}%)</span>
                  <span>${formatLocalValue(taxAmt)}</span>
                </div>
              </div>
            `;
          }
          return '';
        })()}

        <div class="totals" style="font-size: ${paperWidth === '58mm' ? '11px' : '13px'};">
          <span>TOTAL PAGO</span>
          <span>${formatLocalValue(data.totalDue || 0)}</span>
        </div>

        ${data.paymentHistory && data.paymentHistory.length > 0 ? `
          <div class="meta" style="margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; border-bottom: none; margin-bottom: 0;">
            <div style="font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Histórico de Pagamentos</div>
            ${data.paymentHistory.map(p => `
              <div style="display: flex; justify-content: space-between;">
                <span>${new Date(p.date).toLocaleDateString()} (${p.method.toUpperCase()})</span>
                <span>${formatLocalValue(p.amount)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer">
          <p>${brandFooter}</p>
          <p style="margin-top: 4px; font-size: 8px; color: #555;">Processado por SmartPOS</p>
        </div>

        ${barcodeHtml}
      </div>
    `;
  }

  const html = `
    <html>
      <head>
        <title>Receipt ${data.receiptId}</title>
        <style>
          @page {
            margin: 0;
            size: ${paperWidth} auto; /* Thermal roll auto sizing */
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${paperWidth === '58mm' ? '9px' : '11px'};
            color: #000;
            margin: 0;
            padding: ${paperWidth === '58mm' ? '2mm 2mm 8mm 2mm' : '4mm 4mm 10mm 4mm'};
            width: ${paperWidth === '58mm' ? '50mm' : '72mm'};
          }
          h1, h2, h3, p {
            margin: 0;
            padding: 0;
            text-align: center;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          .header h2 { font-size: ${paperWidth === '58mm' ? '12px' : '15px'}; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
          .header p { font-size: ${paperWidth === '58mm' ? '8px' : '10px'}; line-height: 1.3; }
          .meta {
            font-size: ${paperWidth === '58mm' ? '8px' : '10px'};
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
            line-height: 1.4;
          }
          .items {
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .item {
            margin-bottom: 5px;
            page-break-inside: avoid;
          }
          .item-name {
            font-weight: bold;
            text-transform: uppercase;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
          }
          .totals {
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-top: 2px;
          }
          .footer {
            text-align: center;
            font-size: ${paperWidth === '58mm' ? '8px' : '9px'};
            margin-top: 10px;
            line-height: 1.4;
            border-top: 1px dashed #000;
            padding-top: 6px;
          }
          .barcode-wrapper svg {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${copiesHtml}
      </body>
    </html>
  `;

  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(html);
  iframe.contentWindow?.document.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000); // Remove iframe after printing
  };
}

export function generateWhatsAppLink(data: ReceiptData, phoneNumber: string = ''): string {
  const brandTitle = localStorage.getItem('receipt_header_title') || data.shopName;
  const brandAddress = localStorage.getItem('receipt_header_address') || data.shopAddress || '';
  const brandPhone = localStorage.getItem('receipt_header_phone') || data.shopPhone || '';
  const brandNuit = localStorage.getItem('receipt_header_nuit') || '';
  const brandFooter = localStorage.getItem('receipt_footer_msg') || 'Obrigado pela preferência!';

  let text = `*${brandTitle.toUpperCase()}*\n`;
  if (brandAddress) text += `${brandAddress}\n`;
  if (brandPhone) text += `Tel: ${brandPhone}\n`;
  if (brandNuit) text += `NUIT: ${brandNuit}\n`;
  text += `\n`;
  text += `Recibo: #${data.receiptId.substring(0, 8).toUpperCase()}\n`;
  text += `Data: ${new Date(data.date).toLocaleString()}\n`;
  text += `Atendente: ${data.cashierName.toUpperCase()}\n\n`;
  text += `*ITENS:*\n`;
  
  data.items.forEach(item => {
    const price = item.price || 0;
    const total = item.total || 0;
    text += `- ${item.quantity}x ${item.name} (${formatLocalValue(price)}) = ${formatLocalValue(total)}\n`;
  });
  
  const totalDue = data.totalDue || 0;
  const rawTaxRate = localStorage.getItem('tax_rate');
  const taxRate = rawTaxRate !== null ? (parseFloat(rawTaxRate) || 0) : 16;
  
  if (taxRate > 0) {
    const subtotal = totalDue / (1 + taxRate / 100);
    const taxAmt = totalDue - subtotal;
    text += `\nSubtotal (Sem IVA): ${formatLocalValue(subtotal)}`;
    text += `\nIVA (${taxRate}%): ${formatLocalValue(taxAmt)}`;
  }
  
  text += `\n\n*TOTAL PAGO:* ${formatLocalValue(totalDue)}\n`;
  text += `Pagamento: ${data.paymentMethod.toUpperCase()}\n`;

  if (data.paymentHistory && data.paymentHistory.length > 0) {
    text += `\n*HISTÓRICO DE PAGAMENTOS:*\n`;
    data.paymentHistory.forEach(p => {
      text += `- ${new Date(p.date).toLocaleDateString()}: ${formatLocalValue(p.amount)} (${p.method.toUpperCase()})\n`;
    });
  }

  text += `\n${brandFooter}`;

  const encodedText = encodeURIComponent(text);
  let url = `https://wa.me/?text=${encodedText}`;
  if (phoneNumber) {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return url;
}

export function shareReceiptWhatsApp(data: ReceiptData, phoneNumber: string = '') {
  const url = generateWhatsAppLink(data, phoneNumber);
  window.open(url, '_blank');
}
