const injectScannerIfNeeded = async () => {
  if (!window.location.href.includes("/shipping_labels/purchase/")) return;
  if (document.getElementById("shopify-scanner-wrapper")) return;

  const API_URL = "https://shopify-inv-tracker-backend-d0b1c1125141.herokuapp.com/api";

  // 🕓 Wait until Shopify finishes rendering the product info
  await new Promise(resolve => {
    const check = setInterval(() => {
      const thumbs = document.querySelectorAll(".Polaris-Thumbnail img");
      if (thumbs.length > 0) {
        clearInterval(check);
        resolve();
      }
    }, 300);
  });

  // 🟡 Step 1: Scrape ordered items from DOM
  const productGrids = [...document.querySelectorAll("div.Polaris-InlineGrid")].filter(grid =>
    grid.querySelector(".Polaris-Thumbnail") &&
    grid.querySelector("a[href*='/products/']") &&
    grid.querySelector("input[type='number']")
  );

  const orderedItems = productGrids.map(grid => {
    const title = grid.querySelector("a[href*='/products/']").textContent.trim();
    const quantity = parseInt(grid.querySelector("input[type='number']").value);
    return { title, quantity };
  });

  console.log("🟡 Ordered Items (Scraped):", orderedItems);

  // 🟣 Step 2: Fetch barcode list from backend
  let variants = [];
  try {
    const res = await fetch(`${API_URL}/products-for-inventorycount`);
    variants = await res.json();
    console.log("🟣 Backend Variants:", variants);
  } catch (err) {
    alert("❌ Failed to fetch product data from backend");
    return;
  }

  // ✅ Step 3: Match ordered items to backend barcodes
  const matched = orderedItems.map(item => {
    const match = variants.find(v =>
      v.title.toLowerCase().includes(item.title.toLowerCase()) ||
      item.title.toLowerCase().includes(v.title.toLowerCase())
    );

    return {
      title: item.title,
      quantity: item.quantity,
      barcode: match?.barcode || null,
      scanned: 0
    };
  });

  console.log("✅ Matched Items:", matched);

  // 💠 Step 4: Inject scanner UI
  const wrapper = document.createElement("div");
  wrapper.id = "shopify-scanner-wrapper";
  wrapper.style.position = "fixed";
  wrapper.style.bottom = "24px";
  wrapper.style.right = "24px";
  wrapper.style.zIndex = "99999";

  const shadow = wrapper.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .verifier-box {
      font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      border-radius: 12px;
      border: 1px solid #dfe3e8;
      width: 360px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      padding: 16px;
      background-color: #fef3f2;
      transition: background 0.3s ease, border-color 0.3s ease;
    }
    .verifier-box.complete {
      background-color: #edfdf4;
      border-color: #34c759;
    }
    .verifier-box h3 {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      color: #212b36;
    }
    input {
      box-sizing: border-box;
      width: 100%;
      padding: 10px 12px;
      font-size: 14px;
      border-radius: 8px;
      border: 1px solid #dfe3e8;
      margin-bottom: 12px;
      outline: none;
    }
    .product {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      padding: 6px 0;
      color: #212b36;
    }
    .status-icon {
      font-size: 16px;
    }
    .success {
      color: #2e7d32;
    }
    .error {
      color: #d32f2f;
    }
    .check-icon {
      text-align: center;
      font-size: 28px;
      margin-top: 12px;
      color: #2e7d32;
    }
  `;

  const box = document.createElement("div");
  box.className = "verifier-box";
  box.innerHTML = `
    <h3>Scan Products</h3>
    <input id="barcodeInput" placeholder="Scan barcode and press Enter" />
    <div id="productList"></div>
    <div id="checkIcon" class="check-icon" style="display: none;">✅</div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(box);
  document.body.appendChild(wrapper);

  const productList = shadow.getElementById("productList");
  const barcodeInput = shadow.getElementById("barcodeInput");
  const checkIcon = shadow.getElementById("checkIcon");

  const updateUI = () => {
    productList.innerHTML = matched.map(item => {
      const isComplete = item.scanned >= item.quantity;
      return `
        <div class="product">
          <span>${item.scanned}/${item.quantity} × ${item.title}</span>
          <span class="status-icon ${isComplete ? 'success' : 'error'}">${isComplete ? '✔️' : '❌'}</span>
        </div>
      `;
    }).join("");

    const allMatched = matched.every(i => i.barcode && i.scanned >= i.quantity);
    const boxEl = shadow.querySelector(".verifier-box");

    const buyBtn = document.querySelector("button.Polaris-Button--variantPrimary");
    if (buyBtn) buyBtn.disabled = !allMatched;

    if (allMatched) {
      boxEl.classList.add("complete");
      checkIcon.style.display = "block";
    } else {
      boxEl.classList.remove("complete");
      checkIcon.style.display = "none";
    }
  };

  barcodeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const code = e.target.value.trim();
      e.target.value = "";

      const match = matched.find(m => m.barcode === code);
      if (!match) {
        alert("❌ Barcode not found in this order.");
        return;
      }

      if (match.scanned >= match.quantity) {
        alert(`⚠️ You already scanned all ${match.quantity} required for "${match.title}".`);
        return;
      }

      match.scanned += 1;
      updateUI();
    }
  });

  updateUI();
};

// 🔁 Shopify SPA support: re-run on URL change
let lastURL = location.href;
setInterval(() => {
  const currentURL = location.href;
  if (currentURL !== lastURL) {
    lastURL = currentURL;
    const old = document.getElementById("shopify-scanner-wrapper");
    if (old) old.remove();
    injectScannerIfNeeded();
  }
}, 500);

injectScannerIfNeeded();
