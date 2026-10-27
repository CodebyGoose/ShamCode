/*
  Customer storefront controller ito. Kinukuha nito ang product cards,
  cart, wishlist, drawer, at localStorage data para gumana ang shopping flow.
*/
let products = [...document.querySelectorAll('.product-card')];
const resultCount = document.querySelector('#result-count');
const cartCount = document.querySelector('#cart-count');
const wishlistCount = document.querySelector('#wishlist-count');
const drawer = document.querySelector('#side-drawer');
const drawerContent = document.querySelector('#drawer-content');
let cartItems = [];
let wishlistItems = [];
let drawerMode = 'cart';
const orderKey = 'sm-one-stop-orders';
const productKey = 'sm-one-stop-products';
const voucherKey = 'sm-one-stop-vouchers';
// Default discount codes ito na gagamitin kapag wala pang saved vouchers.
const defaultVouchers = [
  { id: 'voucher-welcome10', code: 'WELCOME10', type: 'percent', value: 10, minimum: 500, active: true },
  { id: 'voucher-save100', code: 'SAVE100', type: 'fixed', value: 100, minimum: 1000, active: true },
  { id: 'voucher-sm15', code: 'SM15', type: 'percent', value: 15, minimum: 1500, active: true },
  { id: 'voucher-firstbuy', code: 'FIRSTBUY', type: 'fixed', value: 75, minimum: 700, active: true },
  { id: 'voucher-everyday5', code: 'EVERYDAY5', type: 'percent', value: 5, minimum: 0, active: true }
];
/*
  Image map ito ng products. Kapag walang image ang catalog item,
  gagamitin ng sync function ang matching URL base sa product name.
*/
const defaultImages = {
  'Sunday Morning Candle': 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600',
  'Everyday Canvas Tote': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600',
  'Daily Glow Essentials': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  'Local Roast Coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
  'Soft Weekend Shirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
  'Pocket Sound Speaker': 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600',
  'Woven Table Runner': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600',
  'Mini Zip Pouch': 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600',
  'Fresh Start Hand Cream': 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
  'Honey Oat Granola': 'https://images.unsplash.com/photo-1517093728432-a0440f8d45af?w=600',
  'Relaxed Linen Shorts': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600',
  'Compact Desk Lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600',
  'Soft Cotton Hand Towels': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
  'Calamansi Tea Sachets': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600',
  'Daily Carry Crossbody': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'
};
// Minimum catalog ito ng storefront para laging may 15 products sa customer page.
const builtInProducts = [
  ['Sunday Morning Candle', 'Accessories', 299],
  ['Everyday Canvas Tote', 'Accessories', 499],
  ['Daily Glow Essentials', 'Beauty', 389],
  ['Local Roast Coffee', 'Food', 159],
  ['Soft Weekend Shirt', 'Clothing', 699],
  ['Pocket Sound Speaker', 'Electronics', 899],
  ['Woven Table Runner', 'Home', 549],
  ['Mini Zip Pouch', 'Accessories', 349],
  ['Fresh Start Hand Cream', 'Beauty', 279],
  ['Honey Oat Granola', 'Food', 229],
  ['Relaxed Linen Shorts', 'Clothing', 799],
  ['Compact Desk Lamp', 'Electronics', 1299],
  ['Soft Cotton Hand Towels', 'Home', 459],
  ['Calamansi Tea Sachets', 'Food', 189],
  ['Daily Carry Crossbody', 'Accessories', 649]
];

/*
  Sini-sync nito ang HTML cards at saved localStorage catalog.
  Ina-add ang missing products, ina-update ang presyo/category/image, at inaalis ang duplicate cards.
*/
function syncCustomerProducts() {
  const catalog = JSON.parse(localStorage.getItem(productKey) || 'null');
  if (!catalog) {
    products.forEach((card) => {
      const name = card.querySelector('h3').textContent;
      if (defaultImages[name] && !card.querySelector('.product-image img')) {
        card.querySelector('.product-image').innerHTML = `<img src="${defaultImages[name]}" alt="${name}">`;
      }
    });
    return;
  }
  let catalogChanged = false;
  catalog.forEach((item) => {
    if ((!item.image || item.name === 'Soft Cotton Hand Towels') && defaultImages[item.name]) {
      item.image = defaultImages[item.name];
      catalogChanged = true;
    }
    if (item.name === 'Pocket Sound Speaker' && (!item.image || item.image.includes('1608043152269') || item.image.includes('1589003077984') || item.image.includes('imgs.search.brave.com'))) {
      item.image = defaultImages[item.name];
      catalogChanged = true;
    }
  });
  builtInProducts.forEach(([name, category, price], index) => {
    if (!catalog.some((item) => item.name === name)) {
      catalog.push({ id: `product-${index}`, name, category, price, image: defaultImages[name] });
      catalogChanged = true;
    }
  });
  const uniqueCatalog = [...new Map(catalog.map((item) => [item.name, item])).values()];
  if (uniqueCatalog.length !== catalog.length) catalogChanged = true;
  if (catalogChanged) localStorage.setItem(productKey, JSON.stringify(uniqueCatalog));
  products.forEach((card) => {
    const originalName = card.querySelector('h3').textContent;
    const item = uniqueCatalog.find((product) => product.name === originalName || product.originalName === originalName || product.name === card.dataset.catalogName || product.id === card.dataset.catalogId);
    if (!item) {
      card.remove();
      return;
    }
    card.dataset.catalogId = item.id;
    card.dataset.catalogName = item.name;
    card.dataset.category = item.category;
    card.dataset.price = item.price;
    card.querySelector('h3').textContent = item.name;
    card.querySelector('small').textContent = item.category.toUpperCase();
    card.querySelector('.product-info > strong').textContent = money(item.price);
    const image = card.querySelector('.product-image');
    if (item.image && !image.querySelector('img')) {
      image.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
    }
  });
  const seenNames = new Set();
  products.forEach((card) => {
    const name = card.querySelector('h3').textContent;
    if (seenNames.has(name)) card.remove();
    seenNames.add(name);
  });
  uniqueCatalog.forEach((item) => {
    if (products.some((card) => card.querySelector('h3')?.textContent === item.name)) return;
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.catalogId = item.id;
    card.dataset.category = item.category;
    card.dataset.price = item.price;
    card.innerHTML = `<div class="product-image sage">${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="product-illustration candle"></div>'}</div><div class="product-info"><small>${item.category.toUpperCase()}</small><h3>${item.name}</h3><strong>${money(item.price)}</strong><div class="product-actions"><button class="add-button" type="button">Add to cart</button><button class="buy-button" type="button">Buy now</button><button class="wishlist-toggle" type="button" aria-label="Save item to wishlist">♡</button></div></div>`;
    document.querySelector('#product-grid').append(card);
  });
  products = [...document.querySelectorAll('.product-card')];
}

products.forEach((product) => {
  const button = document.createElement('button');
  button.className = 'wishlist-toggle';
  button.type = 'button';
  button.textContent = '♡';
  button.setAttribute('aria-label', 'Save item to wishlist');
  product.querySelector('.product-info').append(button);
});

const itemFrom = (product) => ({
  name: product.querySelector('h3').textContent,
  category: product.dataset.category,
  price: product.dataset.price,
  color: product.querySelector('.product-image').classList[1],
  image: product.querySelector('.product-image img')?.src || ''
});

const money = (value) => `₱${Number(value).toLocaleString('en-PH')}`;
const detailsModal = document.createElement('div');
detailsModal.className = 'product-details-modal';
detailsModal.id = 'product-details-modal';
detailsModal.innerHTML = '<div class="product-details-card" role="dialog" aria-modal="true" aria-labelledby="product-details-title"><button class="product-details-close" type="button" aria-label="Close product details">×</button><div class="product-details-body"></div></div>';
document.body.append(detailsModal);
if (!localStorage.getItem(voucherKey)) localStorage.setItem(voucherKey, JSON.stringify(defaultVouchers));
syncCustomerProducts();
const items = () => drawerMode === 'cart' ? cartItems : wishlistItems;

function renderDrawer() {
  if (drawerMode === 'orders') {
    renderMyOrders();
    return;
  }
  const list = items();
  document.querySelector('#drawer-title').textContent = drawerMode === 'cart' ? 'Your cart' : 'Your wishlist';
  document.querySelector('#drawer-eyebrow').textContent = drawerMode === 'cart' ? 'YOUR BAG' : 'SAVED FOR LATER';
  drawerContent.innerHTML = list.length
    ? list.map((item, index) => `<div class="drawer-item"><div class="drawer-product-image ${item.color}">${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<span>${item.category[0]}</span>`}</div><div class="drawer-item-details"><small>${item.category}</small><h3>${item.name}</h3><strong>${money(item.price)}</strong></div><button class="drawer-remove" data-index="${index}" type="button">×</button></div>`).join('')
    : '<div class="drawer-empty"><span>♡</span><h3>Nothing here yet</h3><p>Add an item and it will appear here.</p></div>';
  document.querySelector('#drawer-footer').innerHTML = drawerMode === 'cart' && list.length
    ? `<label class="checkout-label" for="customer-name">Your name</label><input class="checkout-input" id="customer-name" placeholder="Customer name"><label class="checkout-label" for="customer-address">Delivery address</label><textarea class="checkout-input checkout-address" id="customer-address" placeholder="House number, street, city" rows="2"></textarea><label class="checkout-label" for="courier">Courier</label><select class="checkout-input" id="courier"><option>J&T</option><option>SPX</option></select><label class="checkout-label" for="payment-method">Payment</label><select class="checkout-input" id="payment-method"><option>Pay on delivery</option><option>PayLater · 3 months</option><option>PayLater · 6 months</option><option>PayLater · 9 months</option><option>PayLater · 12 months</option></select><label class="checkout-label" for="voucher-code">Voucher</label><select class="checkout-input" id="voucher-code"><option value="">No voucher</option>${JSON.parse(localStorage.getItem(voucherKey) || '[]').filter((voucher) => voucher.active).map((voucher) => `<option value="${voucher.code}">${voucher.code} · ${voucher.type === 'percent' ? `${voucher.value}% off` : `${money(voucher.value)} off`} · min ${money(voucher.minimum)}</option>`).join('')}</select><div class="drawer-total"><span>Subtotal</span><strong>${money(cartItems.reduce((sum, item) => sum + Number(item.price), 0))}</strong></div><button class="drawer-checkout" id="checkout-button" type="button">Checkout <span>→</span></button>`
    : '';
  document.querySelector('#checkout-button')?.addEventListener('click', checkout);
  document.querySelector('#voucher-code')?.addEventListener('change', () => {
    const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
    const voucher = JSON.parse(localStorage.getItem(voucherKey) || '[]').find((item) => item.code === document.querySelector('#voucher-code').value && item.active);
    const discount = voucher && subtotal >= Number(voucher.minimum) ? (voucher.type === 'percent' ? subtotal * Number(voucher.value) / 100 : Math.min(subtotal, Number(voucher.value))) : 0;
    document.querySelector('.drawer-total strong').textContent = money(subtotal - discount);
  });
}

function renderMyOrders() {
  const orders = JSON.parse(localStorage.getItem(orderKey) || '[]');
  document.querySelector('#drawer-title').textContent = 'My orders';
  document.querySelector('#drawer-eyebrow').textContent = 'ORDER HISTORY';
  document.querySelector('#drawer-footer').innerHTML = '';
  drawerContent.innerHTML = orders.length
    ? orders.map((order, index) => `<article class="order-history"><div class="order-history-top"><strong>#${order.id}</strong><span class="customer-status ${order.status.toLowerCase()}">${order.status}</span></div><small>${order.date} · ${order.customer || 'Guest'}</small><p class="order-address">Deliver to: ${order.address || 'Address not provided'}</p><p class="order-payment">${order.courier || 'Courier not selected'} · ${order.payment || 'Pay on delivery'}</p>${order.voucher ? `<p class="order-discount">${order.voucher} saved ${money(order.discount)}</p>` : ''}<p class="delivery-eta">Delivery ETA: <strong>${order.eta || 'To be confirmed'}</strong></p><div class="order-history-items">${order.items.map((item) => `<div>${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}<span>${item.name}</span><strong>${money(item.price)}</strong></div>`).join('')}</div><b class="order-history-total">Total ${money(order.total)}</b>${order.status === 'Processing' ? `<button class="cancel-order-button" data-cancel-order="${index}" type="button">Cancel order</button>` : ''}${order.status === 'Delivered' ? (order.review ? `<div class="saved-review">★ ${order.review.rating}/5${order.review.comment ? ` · ${order.review.comment}` : ''}</div>` : `<div class="review-form"><label>Rate your delivered order</label><select data-review-rating="${index}" aria-label="Rating"><option value="">Choose a rating</option><option value="5">★★★★★ · 5</option><option value="4">★★★★☆ · 4</option><option value="3">★★★☆☆ · 3</option><option value="2">★★☆☆☆ · 2</option><option value="1">★☆☆☆☆ · 1</option></select><input data-review-comment="${index}" placeholder="Comment (optional)"><button data-review="${index}" type="button">Submit rating</button></div>`) : ''}</article>`).join('')
    : '<div class="drawer-empty"><span>▤</span><h3>No orders yet</h3><p>Your completed checkouts will appear here.</p><a class="drawer-shop-link" href="#shop">Start shopping <b>→</b></a></div>';
}

function checkout() {
  if (!cartItems.length) return;
  const customerName = document.querySelector('#customer-name').value.trim();
  const address = document.querySelector('#customer-address').value.trim();
  const courier = document.querySelector('#courier').value;
  const payment = document.querySelector('#payment-method').value;
  const voucherCode = document.querySelector('#voucher-code').value;
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price), 0);
  const voucher = JSON.parse(localStorage.getItem(voucherKey) || '[]').find((item) => item.code === voucherCode && item.active);
  const discount = voucher && subtotal >= Number(voucher.minimum) ? (voucher.type === 'percent' ? subtotal * Number(voucher.value) / 100 : Math.min(subtotal, Number(voucher.value))) : 0;
  if (!customerName || !address) {
    document.querySelector(customerName ? '#customer-address' : '#customer-name').focus();
    return;
  }
  const orders = JSON.parse(localStorage.getItem(orderKey) || '[]');
  const activity = JSON.parse(localStorage.getItem('sm-one-stop-activity') || '[]');
  const id = `SM-${Date.now().toString().slice(-6)}`;
  orders.unshift({
    id,
    customer: customerName,
    address,
    courier,
    items: cartItems,
    subtotal,
    discount,
    voucher: voucher ? voucher.code : '',
    total: subtotal - discount,
    date: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
    status: 'Processing',
    payment,
    eta: new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  });
  activity.unshift({ type: 'customer', text: `${customerName} placed order #${id}`, date: new Date().toLocaleString() });
  activity.unshift({ type: 'admin', text: `Seller received order #${id}`, date: new Date().toLocaleString() });
  localStorage.setItem(orderKey, JSON.stringify(orders));
  localStorage.setItem('sm-one-stop-activity', JSON.stringify(activity));
  cartItems = [];
  updateCounts();
  renderDrawer();
  drawerContent.innerHTML = '<div class="drawer-empty"><span>✓</span><h3>Order received</h3><p>Your order was saved and sent to the admin page.</p></div>';
}

function openDrawer(mode) {
  drawerMode = mode;
  renderDrawer();
  drawer.classList.add('is-open');
  document.querySelector('#drawer-backdrop').classList.add('is-visible');
  document.body.classList.add('drawer-open');
}

function closeDrawer() {
  drawer.classList.remove('is-open');
  document.querySelector('#drawer-backdrop').classList.remove('is-visible');
  document.body.classList.remove('drawer-open');
}

const updateCounts = () => {
  cartCount.textContent = cartItems.length;
  wishlistCount.textContent = wishlistItems.length;
};

document.querySelector('#wishlist-button').onclick = () => openDrawer('wishlist');
document.querySelector('#cart-button').onclick = () => openDrawer('cart');
document.querySelector('#my-orders-button').onclick = () => openDrawer('orders');
document.querySelector('#drawer-close').onclick = closeDrawer;
document.querySelector('#drawer-backdrop').onclick = closeDrawer;
drawerContent.onclick = (event) => {
  const button = event.target.closest('.drawer-remove');
  if (button) {
    items().splice(Number(button.dataset.index), 1);
    updateCounts();
    renderDrawer();
    return;
  }
  const reviewButton = event.target.closest('[data-review]');
  const cancelButton = event.target.closest('[data-cancel-order]');
  if (cancelButton) {
    const index = Number(cancelButton.dataset.cancelOrder);
    const orders = JSON.parse(localStorage.getItem(orderKey) || '[]');
    const order = orders[index];
    if (!order || order.status !== 'Processing') return;
    order.status = 'Cancelled';
    localStorage.setItem(orderKey, JSON.stringify(orders));
    const activity = JSON.parse(localStorage.getItem('sm-one-stop-activity') || '[]');
    activity.unshift({ type: 'customer', text: `${order.customer || 'Customer'} cancelled order #${order.id}`, date: new Date().toLocaleString() });
    localStorage.setItem('sm-one-stop-activity', JSON.stringify(activity));
    renderMyOrders();
    return;
  }
  if (!reviewButton) return;
  const index = Number(reviewButton.dataset.review);
  const rating = drawerContent.querySelector(`[data-review-rating="${index}"]`).value;
  const comment = drawerContent.querySelector(`[data-review-comment="${index}"]`).value.trim();
  if (!rating) return;
  const orders = JSON.parse(localStorage.getItem(orderKey) || '[]');
  orders[index].review = { rating, comment };
  localStorage.setItem(orderKey, JSON.stringify(orders));
  renderMyOrders();
};

function updateProducts(category = 'Everything') {
  const visible = products.filter((product) => category === 'Everything' || product.dataset.category === category);
  products.forEach((product) => { product.hidden = !visible.includes(product); });
  resultCount.textContent = `${visible.length} little finds picked for your everyday.`;
}

document.querySelectorAll('.category').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.category.active').classList.remove('active');
    button.classList.add('active');
    updateProducts(button.dataset.category);
  });
});

document.querySelector('#product-grid').addEventListener('click', (event) => {
  const product = event.target.closest('.product-card');
  if (!product) return;
  const addButton = event.target.closest('.add-button');
  const buyButton = event.target.closest('.buy-button');
  const wishlistButton = event.target.closest('.wishlist-toggle');
  if (!addButton && !buyButton && !wishlistButton) {
    const item = itemFrom(product);
    const body = document.querySelector('.product-details-body');
    body.innerHTML = `<div class="product-details-image">${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<span>${item.category[0]}</span>`}</div><div class="product-details-copy"><small>${item.category}</small><h2 id="product-details-title">${item.name}</h2><strong>${money(item.price)}</strong><p>A simple everyday find from SM One Stop. Add it to your cart or buy it now when you are ready.</p><div class="product-details-actions"><button class="add-button" data-details-add type="button">Add to cart</button><button class="buy-button" data-details-buy type="button">Buy now</button></div></div>`;
    detailsModal.classList.add('is-visible');
    return;
  }
  if (addButton) {
    cartItems.push(itemFrom(product));
    updateCounts();
    addButton.textContent = 'Added ✓';
    setTimeout(() => { addButton.textContent = 'Add to cart'; }, 1200);
  }
  if (buyButton) {
    cartItems = [itemFrom(product)];
    updateCounts();
    openDrawer('cart');
  }
  if (wishlistButton) {
    const index = wishlistItems.findIndex((item) => item.name === product.querySelector('h3').textContent);
    if (index >= 0) {
      wishlistItems.splice(index, 1);
      wishlistButton.classList.remove('is-saved');
      wishlistButton.textContent = '♡';
    } else {
      wishlistItems.push(itemFrom(product));
      wishlistButton.classList.add('is-saved');
      wishlistButton.textContent = '♥';
    }
    updateCounts();
  }
});

detailsModal.addEventListener('click', (event) => {
  if (event.target === detailsModal || event.target.closest('.product-details-close')) {
    detailsModal.classList.remove('is-visible');
    return;
  }
  const action = event.target.closest('[data-details-add], [data-details-buy]');
  if (!action) return;
  const product = products.find((card) => card.querySelector('h3')?.textContent === document.querySelector('#product-details-title')?.textContent);
  if (!product) return;
  if (action.hasAttribute('data-details-buy')) {
    cartItems = [itemFrom(product)];
    updateCounts();
    detailsModal.classList.remove('is-visible');
    openDrawer('cart');
    return;
  }
  cartItems.push(itemFrom(product));
  updateCounts();
  action.textContent = 'Added ✓';
});

document.querySelector('#search-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const query = document.querySelector('#search').value.toLowerCase().trim();
  products.forEach((product) => { product.hidden = query !== '' && !product.textContent.toLowerCase().includes(query); });
  resultCount.textContent = `${products.filter((product) => !product.hidden).length} little finds picked for your everyday.`;
});
