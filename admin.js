const keys = {
  orders: 'sm-one-stop-orders',
  products: 'sm-one-stop-products',
  inventory: 'sm-one-stop-inventory',
  activity: 'sm-one-stop-activity',
  vouchers: 'sm-one-stop-vouchers'
};
const login = document.querySelector('#admin-login');
const dashboard = document.querySelector('#admin-dashboard');
const content = document.querySelector('#admin-section-content');
const read = (key, fallback = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const money = (value) => `₱${Number(value).toLocaleString('en-PH')}`;
const categories = ['Electronics', 'Clothing', 'Beauty', 'Accessories', 'Food'];
const defaultVouchers = [
  { id: 'voucher-welcome10', code: 'WELCOME10', type: 'percent', value: 10, minimum: 500, active: true },
  { id: 'voucher-save100', code: 'SAVE100', type: 'fixed', value: 100, minimum: 1000, active: true },
  { id: 'voucher-sm15', code: 'SM15', type: 'percent', value: 15, minimum: 1500, active: true },
  { id: 'voucher-firstbuy', code: 'FIRSTBUY', type: 'fixed', value: 75, minimum: 700, active: true },
  { id: 'voucher-everyday5', code: 'EVERYDAY5', type: 'percent', value: 5, minimum: 0, active: true }
];
const defaultImages = {
  'Sunday Morning Candle': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600',
  'Everyday Canvas Tote': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
  'Daily Glow Essentials': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  'Local Roast Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  'Soft Weekend Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
  'Pocket Sound Speaker': 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600'
};
const categoryOptions = (selected) => categories.map((category) => `<option ${category === selected ? 'selected' : ''}>${category}</option>`).join('');
const defaultProducts = [
  ['Sunday Morning Candle', 'Home', 299, 20], ['Everyday Canvas Tote', 'Accessories', 499, 12],
  ['Daily Glow Essentials', 'Beauty', 389, 3], ['Local Roast Coffee', 'Food', 159, 14],
  ['Soft Weekend Shirt', 'Clothing', 699, 8], ['Pocket Sound Speaker', 'Electronics', 899, 6]
];

function seedData() {
  const products = read(keys.products, defaultProducts.map(([name, category, price], index) => ({ id: `product-${index}`, name, category, price })));
  const inventory = read(keys.inventory, defaultProducts.map(([name, category, price, stock], index) => ({ id: `product-${index}`, name, category, price, stock })));
  const uniqueProducts = [...new Map(products.map((item) => [item.name, item])).values()];
  const uniqueInventory = [...new Map(inventory.map((item) => [item.name, item])).values()];
  products.splice(0, products.length, ...uniqueProducts);
  inventory.splice(0, inventory.length, ...uniqueInventory);
  products.forEach((item, index) => { item.id ||= `product-${index}`; });
  inventory.forEach((item, index) => { item.id ||= products[index]?.id || `product-${index}`; });
  products.forEach((item) => { if (!item.image && defaultImages[item.name]) item.image = defaultImages[item.name]; });
  products.forEach((item) => { if (item.name === 'Pocket Sound Speaker' && (!item.image || item.image.includes('1608043152269') || item.image.includes('1589003077984') || item.image.includes('imgs.search.brave.com'))) item.image = defaultImages[item.name]; });
  inventory.forEach((item) => { if (!item.image && defaultImages[item.name]) item.image = defaultImages[item.name]; });
  inventory.forEach((item) => { if (item.name === 'Pocket Sound Speaker' && (!item.image || item.image.includes('1608043152269') || item.image.includes('1589003077984') || item.image.includes('imgs.search.brave.com'))) item.image = defaultImages[item.name]; });
  products.forEach((item) => { if (!categories.includes(item.category)) item.category = 'Accessories'; });
  inventory.forEach((item) => { if (!categories.includes(item.category)) item.category = 'Accessories'; });
  inventory.forEach((item) => {
    if (!products.some((product) => product.id === item.id)) {
      products.push({ id: item.id, name: item.name, category: item.category, price: item.price });
    }
  });
  defaultProducts.forEach(([name, category, price, stock], index) => {
    if (!products.some((item) => item.name === name)) products.push({ id: `product-${index}`, name, category: categories.includes(category) ? category : 'Accessories', price, image: defaultImages[name] });
    if (!inventory.some((item) => item.name === name)) inventory.push({ id: `product-${index}`, name, category: categories.includes(category) ? category : 'Accessories', price, stock, image: defaultImages[name] });
  });
  write(keys.products, products);
  write(keys.inventory, inventory);
  if (!localStorage.getItem(keys.vouchers)) write(keys.vouchers, defaultVouchers);
}

function orders() { return read(keys.orders); }
function refreshStats() {
  const list = orders();
  document.querySelector('#admin-order-count').textContent = list.length;
  document.querySelector('#admin-revenue').textContent = money(list.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total), 0));
}

function orderRows(list = orders()) {
  return list.length ? list.map((order) => `<div class="order-row"><strong>#${order.id}</strong><span>${order.customer || 'Guest'}<br><small>${order.address || 'Address not provided'}</small><br>${order.items.length} item${order.items.length === 1 ? '' : 's'}${order.review ? `<br><b class="admin-review">★ ${order.review.rating}/5${order.review.comment ? ` · ${order.review.comment}` : ''}</b>` : ''}</span><span>${order.date}</span><select class="status-select" data-order="${order.id}"><option ${order.status === 'Processing' ? 'selected' : ''}>Processing</option><option ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option><option ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option><option ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option></select><strong>${money(order.total)}</strong></div>`).join('') : '<div class="empty-orders">No orders yet. Customer checkouts will appear here.</div>';
}

function demandChart(totalForecast) {
  const values = [0.58, 0.7, 0.64, 0.82, 0.9, 1].map((factor) => Math.max(0, Math.round(totalForecast * factor)));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${index * 20},${78 - (value / max) * 62}`).join(' ');
  const dots = values.map((value, index) => `<circle cx="${index * 20}" cy="${78 - (value / max) * 62}" r="2.8"></circle>`).join('');
  const labels = ['-30d', '-24d', '-18d', '-12d', '-6d', 'Now'].map((label, index) => `<span style="left:${index * 20}%">${label}</span>`).join('');
  return `<div class="forecast-chart"><div class="chart-grid"><i></i><i></i><i></i></div><svg viewBox="0 0 100 88" preserveAspectRatio="none" aria-label="Demand forecast trend"><polyline points="${points}"></polyline>${dots}</svg><div class="chart-labels">${labels}</div></div>`;
}

function salesChart(list) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index), 1);
    return { label: date.toLocaleDateString('en-US', { month: 'short' }), month: date.getMonth(), year: date.getFullYear(), total: 0 };
  });
  list.filter((order) => order.status !== 'Cancelled').forEach((order) => {
    const date = new Date(order.date);
    const month = months.find((item) => item.month === date.getMonth() && item.year === date.getFullYear());
    if (month) month.total += Number(order.total);
  });
  const max = Math.max(...months.map((month) => month.total), 1);
  const points = months.map((month, index) => `${index * 20},${78 - (month.total / max) * 62}`).join(' ');
  const dots = months.map((month, index) => `<circle cx="${index * 20}" cy="${78 - (month.total / max) * 62}" r="2.8"></circle>`).join('');
  const labels = months.map((month, index) => `<span style="left:${index * 20}%">${month.label}</span>`).join('');
  return `<div class="sales-chart"><div class="chart-grid"><i></i><i></i><i></i></div><svg viewBox="0 0 100 88" preserveAspectRatio="none" aria-label="Sales trend for the last six months"><polyline points="${points}"></polyline>${dots}</svg><div class="chart-labels">${labels}</div></div>`;
}

function inventoryPlanning(list) {
  const inventory = read(keys.inventory);
  const validOrders = list.filter((order) => order.status !== 'Cancelled');
  const unitsSold = validOrders.reduce((sum, order) => sum + order.items.length, 0);
  const annualDemand = Math.max(unitsSold, 1);
  const orderingCost = 100;
  const averagePrice = inventory.length ? inventory.reduce((sum, item) => sum + Number(item.price), 0) / inventory.length : 0;
  const holdingCost = Math.max(averagePrice * 0.2, 1);
  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
  const averageDailyDemand = annualDemand / 365;
  const leadTime = 7;
  const safetyStock = 2;
  const reorderPoint = averageDailyDemand * leadTime + safetyStock;
  const averageInventoryValue = inventory.reduce((sum, item) => sum + Number(item.price) * Number(item.stock), 0);
  const cogs = validOrders.reduce((sum, order) => sum + Number(order.total), 0) * 0.6;
  const turnover = averageInventoryValue ? cogs / averageInventoryValue : 0;
  const daysOfInventory = turnover ? 365 / turnover : 0;
  return `<div class="planning-card"><div class="table-heading"><div><p class="admin-kicker">INVENTORY PLANNING</p><h2>Stock health calculations</h2></div><span class="live-label">Estimated locally</span></div><div class="planning-grid"><div><strong>${eoq.toFixed(1)} units</strong><small>Economic Order Quantity</small><em>√(2DS/H)</em></div><div><strong>${reorderPoint.toFixed(1)} units</strong><small>Reorder Point</small><em>Daily demand × 7 days + 2 safety stock</em></div><div><strong>${turnover.toFixed(2)}×</strong><small>Inventory Turnover</small><em>COGS / average inventory value</em></div><div><strong>${daysOfInventory.toFixed(1)} days</strong><small>Days of Inventory</small><em>365 / inventory turnover</em></div></div><p class="planning-note">Demo assumptions: ordering cost ₱${orderingCost} per order, 7-day lead time, 2-unit safety stock, 20% annual holding rate, and COGS estimated at 60% of sales.</p></div>`;
}

function renderOverview() {
  const list = orders();
  const sold = {};
  list.filter((order) => order.status !== 'Cancelled').forEach((order) => order.items.forEach((item) => { sold[item.name] = (sold[item.name] || 0) + 1; }));
  const topProducts = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const average = list.length ? list.filter((order) => order.status !== 'Cancelled').reduce((sum, order) => sum + Number(order.total), 0) / Math.max(1, list.filter((order) => order.status !== 'Cancelled').length) : 0;
  const delivered = list.filter((order) => order.status === 'Delivered').length;
  content.innerHTML = `<div class="sales-analytics"><div class="table-heading"><div><p class="admin-kicker">SALES ANALYTICS</p><h2>Shop performance</h2></div><span class="live-label">Last 6 months</span></div>${salesChart(list)}<div class="analytics-grid"><div><strong>${money(average)}</strong><small>Average order value</small></div><div><strong>${delivered}</strong><small>Delivered orders</small></div><div><strong>${topProducts[0]?.[1] || 0}</strong><small>Top item units sold</small></div><div><strong>${topProducts[0]?.[0] || 'No sales yet'}</strong><small>Most sold product</small></div></div></div>${inventoryPlanning(list)}<div class="admin-table"><div class="table-heading"><h2>Recent orders</h2></div><div class="order-row order-head"><span>ORDER</span><span>CUSTOMER</span><span>DATE</span><span>STATUS</span><span>TOTAL</span></div><div>${orderRows()}</div></div>${activityPanel()}`;
}

function renderSalesAnalytics() {
  const list = orders();
  content.innerHTML = `<div class="sales-analytics"><div class="table-heading"><div><p class="admin-kicker">SALES ANALYTICS</p><h2>Shop performance</h2></div><span class="live-label">Last 6 months</span></div>${salesChart(list)}</div>${inventoryPlanning(list)}`;
}

function renderDemandForecasting() {
  const list = orders().filter((order) => order.status !== 'Cancelled');
  const inventory = read(keys.inventory);
  const demand = {};
  list.forEach((order) => order.items.forEach((item) => { demand[item.name] = (demand[item.name] || 0) + 1; }));
  const rows = inventory.map((item) => {
    const sold = demand[item.name] || 0;
    const daily = sold / 30;
    const forecast = Math.ceil(daily * 30);
    const reorder = Math.ceil(daily * 7 + 2);
    return `<div class="forecast-row"><strong>${item.name}</strong><span>${sold} sold</span><span>${forecast} next 30 days</span><b class="${item.stock <= reorder ? 'forecast-low' : 'forecast-good'}">${item.stock <= reorder ? 'Reorder soon' : 'Stock okay'}</b></div>`;
  }).join('');
  const totalForecast = inventory.reduce((sum, item) => sum + Math.ceil((demand[item.name] || 0) / 30 * 30), 0);
  content.innerHTML = `<div class="sales-analytics"><div class="table-heading"><div><p class="admin-kicker">DEMAND FORECASTING</p><h2>Demand trend</h2></div><span class="live-label">30-day estimate</span></div>${demandChart(totalForecast)}<p class="planning-note">The trend uses the last 30 days of local order activity and projects the next 30 days.</p></div><div class="admin-table"><div class="table-heading"><div><p class="admin-kicker">DEMAND FORECASTING</p><h2>Next 30 days</h2></div><span class="live-label">Based on local orders</span></div><div class="forecast-head"><span>PRODUCT</span><span>DEMAND</span><span>FORECAST</span><span>STOCK STATUS</span></div>${rows || '<div class="empty-orders">No inventory to forecast.</div>'}</div>`;
}

function renderVouchers() {
  const vouchers = read(keys.vouchers, defaultVouchers);
  content.innerHTML = `<div class="admin-table"><div class="table-heading"><div><p class="admin-kicker">PROMOTIONS</p><h2>Vouchers</h2></div><button id="add-voucher" type="button">Create voucher +</button></div><div class="voucher-form" id="voucher-form" hidden><input id="voucher-code" placeholder="Code e.g. SAVE20"><select id="voucher-type"><option value="percent">Percent off</option><option value="fixed">Fixed amount</option></select><input id="voucher-value" type="number" min="1" placeholder="Value"><input id="voucher-minimum" type="number" min="0" placeholder="Minimum spend"><button id="save-voucher" type="button">Save voucher</button></div><div class="voucher-list">${vouchers.map((voucher) => `<div class="voucher-row"><strong>${voucher.code}</strong><span>${voucher.type === 'percent' ? `${voucher.value}% off` : `${money(voucher.value)} off`}</span><span>Minimum ${money(voucher.minimum)}</span><b>${voucher.active ? 'Active' : 'Inactive'}</b></div>`).join('')}</div></div>`;
  document.querySelector('#add-voucher').onclick = () => { document.querySelector('#voucher-form').hidden = false; };
  document.querySelector('#save-voucher').onclick = () => {
    const code = document.querySelector('#voucher-code').value.trim().toUpperCase();
    const type = document.querySelector('#voucher-type').value;
    const value = Number(document.querySelector('#voucher-value').value);
    const minimum = Number(document.querySelector('#voucher-minimum').value || 0);
    if (!code || value <= 0 || minimum < 0 || vouchers.some((voucher) => voucher.code === code)) return;
    vouchers.push({ id: `voucher-${Date.now()}`, code, type, value, minimum, active: true });
    write(keys.vouchers, vouchers);
    renderVouchers();
  };
}

function inventoryRows() {
  return read(keys.inventory).map((item) => `<div class="inventory-item"><span class="inventory-dot ${item.stock < 5 ? 'low' : ''}"></span><div><strong>${item.name}</strong><small>${item.category} · ${item.stock} in stock</small></div><b class="${item.stock >= 5 ? 'good-stock' : ''}">${item.stock < 5 ? 'Low stock' : 'In stock'}</b></div>`).join('');
}

function activityPanel() {
  const list = read(keys.activity);
  return `<div class="activity-card"><div class="table-heading"><div><p class="admin-kicker">CUSTOMER ↔ SELLER</p><h2>Recent activity</h2></div><span class="live-label">● Live locally</span></div>${list.length ? list.slice(0, 10).map((item) => `<div class="activity-row"><span class="activity-icon ${item.type}">${item.type === 'admin' ? 'SM' : '♙'}</span><div><strong>${item.text}</strong><small>${item.date}</small></div><b>${item.type === 'admin' ? 'Admin' : 'Customer'}</b></div>`).join('') : '<div class="empty-orders">No activity yet.</div>'}</div>`;
}

function renderSection(section) {
  const names = { overview: ['Overview', 'Good morning, admin.', 'Here is what is happening with your shop today.'], products: ['Products', 'Product catalog', 'Add or remove items sold in your shop.'], orders: ['Orders', 'Customer orders', 'Review orders and change their status.'], customers: ['Customers', 'Customer list', 'Customers who have completed checkout.'], inventory: ['Inventory', 'Stock control', 'Add stock, edit quantities, or remove products.'], 'sales-analytics': ['Sales Analytics', 'Sales performance', 'Track your sales trend and inventory value.'], 'demand-forecasting': ['Demand Forecasting', 'Demand planning', 'Estimate upcoming product demand.'], vouchers: ['Vouchers', 'Discount codes', 'Create vouchers customers can use at checkout.'] };
  const [label, title, description] = names[section];
  document.querySelector('#section-label').textContent = label.toUpperCase();
  document.querySelector('#section-title').textContent = title;
  document.querySelector('#section-description').textContent = description;
  refreshStats();
  if (section === 'overview') renderOverview();
  if (section === 'sales-analytics') renderSalesAnalytics();
  if (section === 'demand-forecasting') renderDemandForecasting();
  if (section === 'vouchers') renderVouchers();
  if (section === 'orders') content.innerHTML = `<div class="admin-table"><div class="table-heading"><h2>All orders</h2></div><div class="order-row order-head"><span>ORDER</span><span>CUSTOMER</span><span>DATE</span><span>STATUS</span><span>TOTAL</span></div>${orderRows()}</div>`;
  if (section === 'customers') {
    const customers = [...new Map(orders().map((order) => [order.customer || 'Guest', order])).values()];
    content.innerHTML = `<div class="admin-table"><div class="table-heading"><h2>Customers who ordered</h2></div>${customers.length ? customers.map((order) => `<div class="customer-row"><strong>${order.customer || 'Guest'}</strong><span>${order.address || 'Address not provided'}</span><span>${order.items.length} item${order.items.length === 1 ? '' : 's'}${order.review ? `<br><b class="admin-review">★ ${order.review.rating}/5${order.review.comment ? ` · ${order.review.comment}` : ''}</b>` : ''}</span><b>${money(order.total)}</b></div>`).join('') : '<div class="empty-orders">No customers yet.</div>'}</div>`;
  }
  if (section === 'inventory') content.innerHTML = `<div class="admin-table"><div class="table-heading"><h2>Manage products and stock</h2></div><div class="inventory-labels"><span>NAME</span><span>CATEGORY</span><span>PRICE (₱)</span><span>STOCK</span><span>IMAGE URL</span><span>ACTIONS</span></div><div id="inventory-list">${read(keys.inventory).map((item, index) => `<div class="inventory-edit"><input class="inventory-name" value="${item.name}" data-name="${index}" aria-label="Name"><select data-category="${index}" aria-label="Category">${categoryOptions(item.category)}</select><label class="money-input"><span>₱</span><input type="number" min="0" value="${item.price}" data-price="${index}" aria-label="Price"></label><input type="number" min="0" value="${item.stock}" data-stock="${index}" aria-label="Stock"><input type="url" value="${item.image || ''}" data-image="${index}" aria-label="Image URL"><button data-edit="${index}" type="button">Save</button><button data-delete="${index}" type="button">Delete</button></div>`).join('')}</div></div>`;
  if (section === 'products') content.innerHTML = `<div class="admin-table"><div class="table-heading"><h2>Products</h2><button id="add-product" type="button">Add product +</button></div><div class="inventory-labels"><span>NAME</span><span>CATEGORY</span><span>PRICE</span><span>ACTIONS</span></div>${read(keys.products).map((item, index) => `<div class="customer-row"><strong>${item.name}</strong><span>${item.category}</span><span>${money(item.price)}</span><button data-product-delete="${index}" type="button">Delete</button></div>`).join('')}</div>`;
  bindSection(section);
}

function bindSection(section) {
  content.querySelectorAll('.status-select').forEach((select) => {
    select.onchange = () => {
      const list = orders(); const order = list.find((item) => item.id === select.dataset.order);
      order.status = select.value; write(keys.orders, list);
      const activity = read(keys.activity); activity.unshift({ type: 'admin', text: `Admin changed order #${order.id} to ${order.status}`, date: new Date().toLocaleString() }); write(keys.activity, activity);
      renderSection(section);
    };
  });
  content.querySelectorAll('[data-edit]').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.edit);
      const inventory = read(keys.inventory);
      const products = read(keys.products);
      const oldName = inventory[index].name;
      const updated = {
        name: content.querySelector(`[data-name="${index}"]`).value.trim(),
        category: content.querySelector(`[data-category="${index}"]`).value.trim(),
        price: Number(content.querySelector(`[data-price="${index}"]`).value),
        stock: Number(content.querySelector(`[data-stock="${index}"]`).value),
        image: content.querySelector(`[data-image="${index}"]`).value.trim()
      };
      if (!updated.name || !updated.category || updated.price < 0 || updated.stock < 0) return;
      updated.id = inventory[index].id;
      updated.originalName = inventory[index].originalName || oldName;
      inventory[index] = updated;
      const product = products.find((item) => item.name === oldName);
      if (product) Object.assign(product, { id: updated.id, name: updated.name, originalName: product.originalName || oldName, category: updated.category, price: updated.price, image: updated.image });
      else products.push({ id: updated.id, name: updated.name, originalName: oldName, category: updated.category, price: updated.price, image: updated.image });
      write(keys.inventory, inventory);
      write(keys.products, products);
      renderSection('inventory');
    };
  });
  content.querySelectorAll('[data-delete], [data-product-delete]').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.delete ?? button.dataset.productDelete);
      const inventory = read(keys.inventory);
      const products = read(keys.products);
      const name = button.dataset.delete !== undefined ? inventory[index]?.name : products[index]?.name;
      write(keys.inventory, inventory.filter((item) => item.name !== name));
      write(keys.products, products.filter((item) => item.name !== name));
      renderSection(section);
    };
  });
  content.querySelector('#add-product')?.addEventListener('click', openProductModal);
}

function openProductModal() {
  document.querySelector('#product-modal').classList.add('is-open');
  document.querySelector('#product-modal').setAttribute('aria-hidden', 'false');
  document.querySelector('#new-name').focus();
}

function closeProductModal() {
  document.querySelector('#product-modal').classList.remove('is-open');
  document.querySelector('#product-modal').setAttribute('aria-hidden', 'true');
  document.querySelector('#product-form').reset();
  document.querySelector('#new-image-preview').hidden = true;
  document.querySelector('#new-image-preview').removeAttribute('src');
  document.querySelector('#modal-error').textContent = '';
}

document.querySelector('#modal-close').onclick = closeProductModal;
document.querySelector('#product-modal').onclick = (event) => {
  if (event.target.id === 'product-modal') closeProductModal();
};
document.querySelector('#new-image').oninput = () => {
  const imageUrl = document.querySelector('#new-image').value.trim();
  const preview = document.querySelector('#new-image-preview');
  if (!imageUrl) {
    preview.hidden = true;
    return;
  }
  preview.src = imageUrl;
  preview.onerror = () => { preview.hidden = true; };
  preview.hidden = false;
};
document.querySelector('#product-form').onsubmit = (event) => {
  event.preventDefault();
  const name = document.querySelector('#new-name').value.trim();
  const category = document.querySelector('#new-category').value;
  const price = Number(document.querySelector('#new-price').value);
  const stock = Number(document.querySelector('#new-stock').value);
  if (!name || !categories.includes(category) || price < 0 || stock < 0) {
    document.querySelector('#modal-error').textContent = 'Complete all fields with valid values.';
    return;
  }
  const image = document.querySelector('#new-image').value.trim();
  if (image) {
    try {
      new URL(image);
    } catch {
      document.querySelector('#modal-error').textContent = 'Enter a valid image URL.';
      return;
    }
  }
  const id = `product-${Date.now()}`;
  const product = { id, name, category, price, image };
  const inventory = { ...product, stock };
  write(keys.products, [...read(keys.products), product]);
  write(keys.inventory, [...read(keys.inventory), inventory]);
  closeProductModal();
  renderSection('products');
};

seedData();
document.querySelector('#show-password').onclick = () => { const input = document.querySelector('#password'); input.type = input.type === 'password' ? 'text' : 'password'; };
document.querySelector('#login-form').onsubmit = (event) => {
  event.preventDefault();
  const valid = document.querySelector('#username').value === 'admin' && document.querySelector('#password').value === 'SMOneStop!2026';
  document.querySelector('#login-error').textContent = valid ? '' : 'Please check your username and password.';
  if (valid) { login.classList.add('is-hidden'); dashboard.classList.add('is-visible'); renderSection('overview'); }
};
document.querySelectorAll('.admin-nav').forEach((button) => { button.onclick = () => { document.querySelector('.admin-nav.active').classList.remove('active'); button.classList.add('active'); renderSection(button.dataset.section); }; });
document.querySelector('#signout').onclick = () => { dashboard.classList.remove('is-visible'); login.classList.remove('is-hidden'); };
document.querySelector('#reset-data').onclick = () => {
  if (!confirm('Clear all local orders, reviews, and activity?')) return;
  localStorage.removeItem(keys.orders);
  localStorage.removeItem(keys.activity);
  renderSection(document.querySelector('.admin-nav.active').dataset.section);
};
