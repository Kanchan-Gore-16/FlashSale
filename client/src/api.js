const API_BASE = 'http://localhost:4000/api';

// -------------------- PRODUCTS --------------------

export async function fetchLiveProducts() {
  const res = await fetch(`${API_BASE}/products/live`);
  if (!res.ok) throw new Error('Failed to fetch live products');
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

// -------------------- HOLDS --------------------

export async function createHold({ productId, email, qty }) {
  const res = await fetch(`${API_BASE}/holds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      email,
      qty,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create hold');
  }

  return data; // { orderId, holdExpiresAt }
}

// -------------------- ORDERS --------------------

export async function fetchOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch order');
  }

  return data;
}

export async function confirmOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/confirm`, {
    method: 'POST',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to confirm order');
  }

  return data;
}

export async function fetchOrdersByEmail(email) {
  const res = await fetch(
    `${API_BASE}/orders?email=${encodeURIComponent(email)}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch orders');
  }

  return data;
}

// -------------------- ADMIN --------------------

export async function fetchAdminMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin metrics');
  }

  return data;
}
