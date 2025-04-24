# 🛒 Shopify Order Barcode Validator – Chrome Extension

This Chrome Extension improves Shopify order fulfillment by requiring barcode validation before allowing a shipping label to be purchased. It injects a Shopify-style UI into the shipping label page and ensures all ordered items are correctly scanned before enabling the “Buy shipping label” button.

---

## ✅ What It Does

- Extracts product titles and quantities directly from the shipping label page
- Fetches your product barcode data from a backend API
- Displays real-time scan progress (e.g., “1/2 × Apple Watch”)
- Blocks the "Buy shipping label" button until all required items are scanned
- Shows visual success/failure status with green/red color indicators
- Automatically reinjects itself when navigating between pages (SPA support)
- Only activates on URLs like:  
  https://admin.shopify.com/store/.../shipping_labels/purchase/...

---

## 🛠 Requirements

- A backend API that returns your product list with `title` and `barcode`
- A barcode scanner (or manual entry of barcodes)
- Chrome browser with Developer Mode enabled

---

## 🚀 Technologies Used

- Vanilla JavaScript
- Shadow DOM for isolated component injection
- Shopify Polaris-inspired UI/UX
- setInterval polling for SPA page change detection
- REST API integration for product data

---

## ▶️ How to Use

1. Download or clone this repository.
2. Open Google Chrome and visit `chrome://extensions/`.
3. Enable **Developer Mode** using the top-right toggle.
4. Click **“Load unpacked”** and select the extension folder.
5. Visit any Shopify order shipping label page.
6. A scanner panel will appear in the lower-right corner.
7. Start scanning product barcodes:
   - Shows current scan count and required quantity
   - Prevents scanning of unlisted or excess items
   - Blocks the "Buy shipping label" button until complete
   - Turns green with a ✅ when all items are scanned correctly

---

## 📁 Project Structure

- `content.js` — main script that injects and controls the scanner UI
- `manifest.json` — Chrome extension manifest
- `icon128.png` — extension icon
- `README.md` — this file
