import toast from 'react-hot-toast';
import { BarcodeRecord } from './types';
import JsBarcode from 'jsbarcode';

// Generate a valid EAN-13 barcode with prefix 200 (common for in-store items)
export const generateEAN13 = () => {
  let partial = '200';
  for (let i = 3; i < 12; i++) {
    partial += Math.floor(Math.random() * 10).toString();
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(partial[i]) * (i % 2 === 1 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return partial + checkDigit;
};

export const generateVariableEAN13 = (priceOrWeight: number, isWeight: boolean = false, itemCode?: string) => {
  // Prefix: 20 for Price, 21 for Weight
  const prefix = isWeight ? '21' : '20';
  
  // Item Code: 5 digits
  let code = itemCode;
  if (!code || code.length !== 5) {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
  }

  // Value: 5 digits
  // Price: assumes 2 decimal places (e.g. 15.50 -> 01550)
  // Weight: assumes 3 decimal places (e.g. 1.500kg -> 01500)
  const multiplier = isWeight ? 1000 : 100;
  const valueInt = Math.round(priceOrWeight * multiplier);
  const valueStr = valueInt.toString().padStart(5, '0').substring(0, 5);

  let partial = prefix + code + valueStr;
  
  // Checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(partial[i]) * (i % 2 === 1 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return partial + checkDigit;
};

export const downloadPNG = (barcode: string, barcodeRecord?: BarcodeRecord) => {
  try {
    const isEAN13 = /^\d{13}$/.test(barcode);
    const format = isEAN13 ? 'EAN13' : 'CODE128';

    // 1. Create a dedicated off-screen canvas to render the pure barcode
    const tempBarcodeCanvas = document.createElement('canvas');
    try {
      JsBarcode(tempBarcodeCanvas, barcode, {
        format,
        width: 3,
        height: 90,
        displayValue: true,
        font: 'monospace',
        fontSize: 16,
        textMargin: 6,
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch (bcErr) {
      // Fallback to CODE128 if EAN13 checksum fails
      JsBarcode(tempBarcodeCanvas, barcode, {
        format: 'CODE128',
        width: 3,
        height: 90,
        displayValue: true,
        font: 'monospace',
        fontSize: 16,
        textMargin: 6,
        margin: 15,
        background: '#ffffff',
        lineColor: '#000000',
      });
    }

    const hasCustomData = Boolean(
      barcodeRecord?.shop_name || barcodeRecord?.item_name || barcodeRecord?.price_mt || barcodeRecord?.attributes
    );

    const barcodeWidth = tempBarcodeCanvas.width;
    const barcodeHeight = tempBarcodeCanvas.height;

    // Header dimensions for store name, product name, price
    const extraHeaderHeight = hasCustomData ? 75 : 0;
    const totalWidth = Math.max(barcodeWidth, 340);
    const totalHeight = barcodeHeight + extraHeaderHeight + 10;

    // 2. Final composition canvas
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Erro ao processar imagem');
      return;
    }

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render store / product header
    if (hasCustomData) {
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      let yOffset = 10;
      if (barcodeRecord?.shop_name) {
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(barcodeRecord.shop_name.toUpperCase(), canvas.width / 2, yOffset);
        yOffset += 20;
      }

      if (barcodeRecord?.item_name || barcodeRecord?.attributes) {
        ctx.font = '13px sans-serif';
        const text = [barcodeRecord?.item_name, barcodeRecord?.attributes].filter(Boolean).join(' ');
        // Truncate if too long
        const displayText = text.length > 40 ? text.substring(0, 37) + '...' : text;
        ctx.fillText(displayText, canvas.width / 2, yOffset);
        yOffset += 18;
      }

      if (barcodeRecord?.price_mt !== undefined && barcodeRecord?.price_mt !== null) {
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`${Number(barcodeRecord.price_mt).toFixed(2)} MT`, canvas.width / 2, yOffset);
      }
    }

    // Center and draw the barcode
    const barcodeX = Math.round((canvas.width - barcodeWidth) / 2);
    const barcodeY = hasCustomData ? extraHeaderHeight : 5;
    ctx.drawImage(tempBarcodeCanvas, barcodeX, barcodeY);

    // Trigger download
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    const safeName = (barcodeRecord?.item_name || barcode).replace(/[^a-zA-Z0-9-_]/g, '_');
    downloadLink.download = `etiqueta-${safeName}-${barcode}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    toast.success(`Etiqueta ${barcode} descarregada!`);
  } catch (err) {
    console.error('Download error:', err);
    toast.error('Erro ao gerar imagem PNG do código de barras');
  }
};

// Prints a sheet of filtered barcodes in a grid format
export const printBarcodeSheet = (filteredBarcodes: BarcodeRecord[]) => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  let html = `
    <html>
    <head>
      <title>Print Barcodes</title>
      <style>
        body { font-family: sans-serif; margin: 0; padding: 10mm; }
        .sheet { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 10mm 5mm; 
        }
        .label { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
          text-align: center;
          border: 1px dashed #ccc;
          padding: 5mm;
          page-break-inside: avoid;
        }
        .shop { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
        .item { font-size: 10px; margin-bottom: 2px; }
        .price { font-size: 12px; font-weight: bold; margin-bottom: 4px; }
        svg { max-width: 100%; height: auto; }
        @media print {
          .label { border: none; }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
  `;

  filteredBarcodes.forEach(b => {
    const svgElement = document.getElementById(`barcode-${b.barcode}`)?.querySelector('svg');
    if (svgElement) {
      const svgHTML = svgElement.outerHTML;
      html += `
        <div class="label">
          ${b.shop_name ? `<div class="shop">${b.shop_name}</div>` : ''}
          ${(b.item_name || b.attributes) ? `<div class="item">${b.item_name || ''} ${b.attributes ? `(${b.attributes})` : ''}</div>` : ''}
          ${b.price_mt ? `<div class="price">${b.price_mt.toFixed(2)} MT</div>` : ''}
          ${svgHTML}
        </div>
      `;
    }
  });

  html += `
      </div>
    </body>
    </html>
  `;

  const printDocument = iframe.contentWindow?.document;
  if (printDocument) {
    printDocument.open();
    printDocument.write(html);
    printDocument.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  } else {
    document.body.removeChild(iframe);
    toast.error('Failed to create print frame');
  }
};
