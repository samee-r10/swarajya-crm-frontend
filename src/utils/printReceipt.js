import receiptStyles from '../assets/payment-receipt.css?raw'

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character])
}

export async function printReceiptDocument(element, receiptNumber) {
  if (!element) throw new Error('Open the receipt preview before printing.')
  // Open during the click event, before awaiting images, to retain browser activation.
  const printWindow = window.open('', '_blank', 'width=900,height=1100')
  if (!printWindow) throw new Error('Please allow pop-ups to print the receipt.')

  printWindow.document.write(`<!doctype html>
    <html lang="en"><head>
      <meta charset="utf-8">
      <title>Receipt ${escapeHtml(receiptNumber)}</title>
      <base href="${escapeHtml(window.location.origin)}/">
      <style>
        ${receiptStyles}
        @page { size: A4 portrait; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        .receipt-print-page { position: relative; width: 210mm; height: 296mm; margin: 0 auto; overflow: hidden; }
        .receipt-print-page .receipt-sheet {
          position: absolute; top: 0; left: 50%; margin: 0;
          transform: translateX(-50%) scale(var(--receipt-print-scale, 1));
          transform-origin: top center; box-shadow: none;
        }
      </style>
    </head><body><main class="receipt-print-page">${element.outerHTML}</main></body></html>`)
  printWindow.document.close()

  // The logo and fonts must finish loading before measuring or opening print preview.
  await Promise.all([
    ...Array.from(printWindow.document.images, image => image.decode().catch(() => {})),
    printWindow.document.fonts.ready
  ])
  if (printWindow.closed) return
  const page = printWindow.document.querySelector('.receipt-print-page')
  const sheet = printWindow.document.querySelector('.receipt-sheet')
  const height = Math.max(sheet.scrollHeight, sheet.getBoundingClientRect().height)
  const scale = Math.min(1, page.getBoundingClientRect().height / height)
  sheet.style.setProperty('--receipt-print-scale', String(scale))
  printWindow.addEventListener('afterprint', () => printWindow.close(), { once: true })
  printWindow.focus()
  printWindow.print()
}
