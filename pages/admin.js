import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { productCategories } from '../lib/starter-products.mjs';

const emptyProduct = {
  slug: '',
  name: '',
  description: '',
  longDesc: '',
  audience: '',
  problem: '',
  outcome: '',
  category: 'ai-courses',
  format: 'Digital Product',
  price: 199,
  comparePrice: 999,
  image: '',
  downloadUrl: '',
  badge: 'New',
  features: '',
  fileList: '',
  preview: '',
};

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function toLines(value) {
  return String(value || '').split('\n').map((line) => line.trim()).filter(Boolean);
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [products, setProducts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('pixelvault_admin_secret') || '';
    setSecret(saved);
  }, []);

  const activeProducts = useMemo(() => products.filter((product) => product.active !== false), [products]);

  async function loadAdminData(nextSecret = secret) {
    if (!nextSecret) {
      setStatus('Enter the admin secret first.');
      return;
    }

    setLoading(true);
    setStatus('Loading admin data...');
    try {
      window.localStorage.setItem('pixelvault_admin_secret', nextSecret);
      const headers = { 'x-admin-secret': nextSecret };
      const [ordersRes, productsRes, submissionsRes] = await Promise.all([
        fetch('/api/orders', { headers }),
        fetch('/api/products'),
        fetch('/api/creator-submissions', { headers }),
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const submissionsData = await submissionsRes.json();
      if (!ordersRes.ok) throw new Error(ordersData.error || 'Unable to load orders');
      if (!submissionsRes.ok) throw new Error(submissionsData.error || 'Unable to load submissions');

      setOrders(ordersData.orders || []);
      setRevenue(ordersData.revenue || 0);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSubmissions(submissionsData.submissions || []);
      setStatus('Admin data loaded.');
    } catch (err) {
      setStatus(err.message || 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setStatus('Saving product...');
    const payload = {
      ...form,
      price: Number(form.price || 0),
      comparePrice: Number(form.comparePrice || 0),
      features: toLines(form.features),
      fileList: toLines(form.fileList),
      preview: toLines(form.preview),
      active: true,
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to save product');
      setForm(emptyProduct);
      setStatus('Product saved. Run seed only for starter products; admin products are already in MongoDB.');
      await loadAdminData(secret);
    } catch (err) {
      setStatus(err.message || 'Unable to save product.');
    }
  }

  async function deactivateProduct(slug) {
    if (!slug) return;
    setStatus(`Deactivating ${slug}...`);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { 'x-admin-secret': secret },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to deactivate product');
      await loadAdminData(secret);
    } catch (err) {
      setStatus(err.message || 'Unable to deactivate product.');
    }
  }

  return (
    <>
      <Head><title>Admin - PixelVault</title></Head>
      <main className="admin">
        <aside>
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <a href="#overview">Overview</a>
          <a href="#products">Products</a>
          <a href="#orders">Orders</a>
          <a href="#creators">Creator submissions</a>
        </aside>

        <section className="main">
          <header>
            <div>
              <p className="eyebrow">Admin dashboard</p>
              <h1>Manage store, products, orders, and creators</h1>
            </div>
            <div className="secret">
              <input type="password" placeholder="Admin secret" value={secret} onChange={(event) => setSecret(event.target.value)} />
              <button onClick={() => loadAdminData(secret)} disabled={loading}>{loading ? 'Loading' : 'Load'}</button>
            </div>
          </header>

          {status && <div className="status">{status}</div>}

          <section id="overview" className="metrics">
            <div><span>Revenue</span><strong>{money(revenue)}</strong></div>
            <div><span>Paid orders</span><strong>{orders.length}</strong></div>
            <div><span>Active products</span><strong>{activeProducts.length}</strong></div>
            <div><span>Creator submissions</span><strong>{submissions.length}</strong></div>
          </section>

          <section id="products" className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Products</p>
                <h2>Add a digital product</h2>
              </div>
            </div>
            <form onSubmit={saveProduct} className="product-form">
              <input required placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
              <input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {productCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
              </select>
              <input placeholder="Format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
              <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input type="number" placeholder="Compare price" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} />
              <input placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              <input placeholder="Protected download URL" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} />
              <textarea required placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <textarea placeholder="Long description" value={form.longDesc} onChange={(e) => setForm({ ...form, longDesc: e.target.value })} />
              <textarea placeholder="Features, one per line" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
              <textarea placeholder="Files included, one per line" value={form.fileList} onChange={(e) => setForm({ ...form, fileList: e.target.value })} />
              <button type="submit">Save product</button>
            </form>

            <div className="table">
              {products.slice(0, 30).map((product) => (
                <div className="row" key={product.slug}>
                  <div><strong>{product.name}</strong><span>{product.slug} / {product.category}</span></div>
                  <div>{money(product.price)}</div>
                  <div className="row-actions">
                    <Link href={`/products/${product.slug}`}>View</Link>
                    <button onClick={() => deactivateProduct(product.slug)}>Deactivate</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="orders" className="panel">
            <p className="eyebrow">Orders</p>
            <div className="table">
              {orders.slice(0, 30).map((order) => (
                <div className="row" key={order.orderId}>
                  <div><strong>{order.orderId}</strong><span>{order.customer?.email}</span></div>
                  <div>{money(order.total)}</div>
                  <div>{order.status}</div>
                </div>
              ))}
            </div>
          </section>

          <section id="creators" className="panel">
            <p className="eyebrow">Creator submissions</p>
            <div className="table">
              {submissions.map((submission) => (
                <div className="row" key={submission._id}>
                  <div><strong>{submission.productName}</strong><span>{submission.creatorName} / {submission.email}</span></div>
                  <div>{submission.category}</div>
                  <div>{submission.status}</div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        .admin{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif;display:grid;grid-template-columns:250px 1fr}
        a{text-decoration:none;color:inherit}
        aside{background:#0d0d14;color:#eee;padding:24px;display:flex;flex-direction:column;gap:10px;position:sticky;top:0;height:100vh}
        aside a:not(.brand){color:#bbb;padding:10px 12px;border-radius:8px;font-size:.9rem}aside a:hover{background:rgba(255,255,255,.08);color:#fff}
        .brand{color:#e8d5a8;font-weight:850;font-size:1.25rem;margin-bottom:16px}.brand em{font-style:italic;color:#c8a96e}
        .main{padding:28px;max-width:1180px;width:100%;margin:0 auto}
        header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
        h1{margin:0;color:#0d0d14;font-size:2rem}h2{margin:0}.eyebrow{margin:0 0 6px;color:#1a6b6b;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:850}
        .secret{display:flex;gap:8px}.secret input,.product-form input,.product-form select,.product-form textarea{border:1px solid #d8d0c4;border-radius:8px;background:#fff;padding:11px;font-family:inherit;color:#171720}
        button,.secret button{border:none;background:#1a6b6b;color:#fff;border-radius:8px;padding:11px 14px;font-weight:850;cursor:pointer}button:disabled{opacity:.6}
        .status{background:#fff;border:1px solid #d8d0c4;border-radius:9px;padding:12px;margin-bottom:16px;color:#625b54}
        .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.metrics div,.panel{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:18px}.metrics span{display:block;color:#7a7065;font-size:.78rem;margin-bottom:7px}.metrics strong{font-size:1.5rem;color:#1a6b6b}
        .panel{margin-bottom:16px}.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .product-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}.product-form textarea{min-height:88px}.product-form button{grid-column:1/-1}
        .table{display:grid;gap:8px}.row{display:grid;grid-template-columns:1fr 140px 180px;gap:12px;align-items:center;border:1px solid #e7ded3;background:#fbfaf7;border-radius:9px;padding:12px}.row span{display:block;color:#7a7065;font-size:.82rem;margin-top:3px}.row-actions{display:flex;gap:8px}.row-actions a,.row-actions button{font-size:.8rem;padding:8px 10px}.row-actions a{background:#0d0d14;color:#e8d5a8;border-radius:7px;font-weight:850}
        @media(max-width:860px){.admin{grid-template-columns:1fr}aside{position:static;height:auto}.metrics,.product-form,.row{grid-template-columns:1fr}header{flex-direction:column}.secret{width:100%}.secret input{flex:1}}
      `}</style>
    </>
  );
}
