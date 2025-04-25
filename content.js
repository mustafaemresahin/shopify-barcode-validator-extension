// content.js

const injectScannerIfNeeded = async () => {
  if (!window.location.href.includes("/shipping_labels/purchase/")) return;
  if (document.getElementById("shopify-scanner-wrapper")) return;

  const API_URL       = "https://shopify-inv-tracker-backend-d0b1c1125141.herokuapp.com/api";
  const SOUND_SUCCESS = new Audio(chrome.runtime.getURL("sounds/success.mp3"));
  const SOUND_ERROR   = new Audio(chrome.runtime.getURL("sounds/error.mp3"));
  const SOUND_COMPLETE= new Audio(chrome.runtime.getURL("sounds/complete.mp3"));

  await new Promise(resolve => {
    const check = setInterval(() => {
      if (document.querySelectorAll(".Polaris-Thumbnail img").length) {
        clearInterval(check);
        resolve();
      }
    }, 300);
  });

  const productGrids = [...document.querySelectorAll("div.Polaris-InlineGrid")].filter(g =>
    g.querySelector(".Polaris-Thumbnail") &&
    g.querySelector("a[href*='/products/']") &&
    g.querySelector("input[type='number']")
  );
  const orderedItems = productGrids.map(g => ({
    title:    g.querySelector("a[href*='/products/']").textContent.trim(),
    quantity: parseInt(g.querySelector("input[type='number']").value, 10)
  }));

  let variants = [];
  try {
    const res = await fetch(`${API_URL}/products-for-inventorycount`);
    variants = await res.json();
  } catch {
    alert("❌ Failed to fetch product data");
    return;
  }

  const matched = orderedItems.map(item => {
    const m = variants.find(v =>
      v.title.toLowerCase().includes(item.title.toLowerCase()) ||
      item.title.toLowerCase().includes(v.title.toLowerCase())
    );
    return { ...item, barcode: m?.barcode||null, scanned: 0 };
  });

  const wrapper = document.createElement("div");
  wrapper.id = "shopify-scanner-wrapper";
  Object.assign(wrapper.style, {
    position: "fixed", bottom: "24px", right: "24px", zIndex: "99999"
  });
  const shadow = wrapper.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    .verifier-box {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      border-radius: 12px;
      border: 1px solid #e1e6eb;
      width: 360px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      transition: background-color 0.3s ease;
    }
    .verifier-box.incomplete { background: #ffeef0; }
    .verifier-box.complete   { background: #e4f7e7; border-color: #34c759; }
    h3 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: #212b36;
    }
    input {
      width: 100%;
      padding: 10px;
      font-size: 14px;
      border: 1px solid #c4cdd5;
      border-radius: 6px;
      margin-bottom: 12px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    input:focus {
      border-color: #008060;
    }
    .product {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      padding: 6px 0;
    }
    .status-icon {
      font-size: 16px;
      transition: transform 0.2s ease;
    }
    .status-icon.success { color: #008060; }
    .status-icon.error   { color: #bf0711; }
    .status-icon.success.animate {
      transform: scale(1.4);
    }
    .check-icon {
      text-align: center;
      font-size: 28px;
      margin-top: 12px;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      transform: scale(0.5);
    }
    .verifier-box.complete .check-icon {
      opacity: 1;
      transform: scale(1);
      animation: bounce 0.6s ease;
    }
    @keyframes bounce {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-8px); }
    }
    .confetto {
      position: absolute;
      width: 8px; height: 8px;
      opacity: 0.9;
      pointer-events: none;
      animation: fall 2s linear forwards;
    }
    @keyframes fall {
      to { transform: translateY(200px) rotate(360deg); opacity: 0; }
    }
    button.Polaris-Button--variantPrimary:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
  `;

  const box = document.createElement("div");
  box.className = "verifier-box incomplete";
  box.innerHTML = `
    <h3>Scan Products</h3>
    <input id="barcodeInput" placeholder="Scan barcode and press Enter" autofocus />
    <div id="productList"></div>
    <div id="checkIcon" class="check-icon">✅</div>
  `;
  shadow.append(style, box);
  document.body.append(wrapper);

  const productList  = shadow.getElementById("productList");
  const barcodeInput = shadow.getElementById("barcodeInput");
  let confettiFired = false;

  const triggerConfetti = () => {
    for (let i = 0; i < 40; i++) {
      const c = document.createElement("div");
      c.className = "confetto";
      c.style.backgroundColor = `hsl(${Math.random()*360}, 100%, 60%)`;
      c.style.left = `${Math.random()*100}%`;
      c.style.top  = `-10px`;
      c.style.transform = `rotate(${Math.random()*360}deg)`;
      shadow.append(c);
      setTimeout(() => c.remove(), 2000);
    }
  };

  const updateUI = () => {
    productList.innerHTML = matched.map(item => {
      const done = item.scanned >= item.quantity;
      return `
        <div class="product">
          <span>${item.scanned}/${item.quantity} × ${item.title}</span>
          <span class="status-icon ${done?'success':'error'}">
            ${done ? '✔️' : '❌'}
          </span>
        </div>`;
    }).join("");

    // animate newly-success icons
    shadow.querySelectorAll(".status-icon.success").forEach(ic => {
      ic.classList.add("animate");
      setTimeout(() => ic.classList.remove("animate"), 300);
    });

    const allDone = matched.every(i=>i.barcode && i.scanned>=i.quantity);
    const buyBtn = document.querySelector("button.Polaris-Button--variantPrimary");
    if (buyBtn) buyBtn.disabled = !allDone;

    if (allDone) {
      box.classList.replace("incomplete","complete");
      if (!confettiFired) {
        SOUND_COMPLETE.play();
        triggerConfetti();
        confettiFired = true;
      }
    } else {
      box.classList.replace("complete","incomplete");
    }
  };

  barcodeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const code = e.target.value.trim();
      e.target.value = "";
      const m = matched.find(x=>x.barcode===code);
      if (!m) {
        SOUND_ERROR.play();
        alert("❌ Barcode not found.");
        return;
      }
      if (m.scanned >= m.quantity) {
        alert(`⚠️ Already scanned all of "${m.title}".`);
        return;
      }
      m.scanned++;
      SOUND_SUCCESS.play();
      updateUI();
    }
  });

  updateUI();
};

// SPA support
let lastURL = location.href;
setInterval(() => {
  if (location.href !== lastURL) {
    lastURL = location.href;
    const old = document.getElementById("shopify-scanner-wrapper");
    if (old) old.remove();
    injectScannerIfNeeded();
  }
}, 500);

injectScannerIfNeeded();
