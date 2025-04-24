# 🛒 Shopify Order Barcode Validator – Chrome Extension

This Chrome Extension enhances order accuracy during the Shopify shipping label purchase process by **requiring barcode scans of each ordered item before allowing a label to be purchased**. It provides a seamless, Shopify-styled UI directly within the admin panel.

---

## ✅ What It Does

- Extracts the list of ordered products (title and quantity) from the Shopify shipping label creation page.
- Fetches product variant data including barcodes from your backend.
- Matches scanned barcodes against ordered products.
- Displays a real-time progress list (e.g., `1/2 × Apple Watch`).
- Disables the “Buy shipping label” button until all items are confirmed scanned.
- Uses color-coded icons and backgrounds to show verification status.
- Automatically reinjects itself on Shopify's SPA page changes.
- Only activates on URLs like:  
  `https://admin.shopify.com/store/.../shipping_labels/purchase/...`

---

## 🔒 Why It's Useful

Shopify does not natively verify order fulfillment with barcodes, which can lead to:
- Shipping incorrect items
- Incomplete fulfillment
- Errors caused by manual packing

This extension introduces a lightweight but effective validation step to ensure all items are correctly scanned before shipping.

---

## 🚀 Technologies Used

- Vanilla JavaScript
- Shadow DOM for encapsulated UI injection
- Shopify Polaris-inspired styling
- SPA detection via MutationObserver + setInterval
- Backend API integration for barcode lookups

---

## 🛠 Requirements

- A backend API route returning product variants with `title` and `barcode`.
- A barcode scanner or manual barcode input during packing.
