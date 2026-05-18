import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [account, setAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meRes = await fetch('/api/auth/me');
        const me = await meRes.json();
        setUser(me.user || null);
        setAuthChecked(true);

        if (!me.user) {
          setLoading(false);
          return;
        }

        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/account/orders'),
          fetch('/api/products'),
        ]);

        const ordersData = await ordersRes.json();
        if (!ordersRes.ok) throw new Error(ordersData.error || 'Unable to load account');

        const productData = await productsRes.json();
        setAccount(ordersData);
        setProducts(Array.isArray(productData) ? productData : []);
      } catch (err) {
        setError(err.message || 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const purchasedSlugs = useMemo(() => {
    const slugs = new Set();
    account?.orders?.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.slug) slugs.add(item.slug);
      });
    });
    return slugs;
  }, [account]);

  const recommendations = products
    .filter((product) => !purchasedSlugs.has(product.slug))
    .slice(0, 4);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (!authChecked || loading) {
    return (
      <>
        <Head><title>Dashboard - PixelVault</title></Head>
        <DashboardStyles />
        <main className="dash-shell"><div className="loading">Loading your dashboard...</div></main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head><title>Dashboard - PixelVault</title></Head>
        <DashboardStyles />
        <main className="guest">
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <section className="guest-card">
            <p className="eyebrow">Customer dashboard</p>
            <h1>Log in to view your purchases</h1>
            <p>Your dashboard keeps order history, paid downloads, and account details in one place.</p>
            <div className="actions">
              <Link href="/login" className="primary">Login</Link>
              <Link href="/signup" className="secondary">Create account</Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const summary = account?.summary || {};
  const orders = account?.orders || [];
  const downloads = account?.downloads || [];

  return (
    <>
      <Head>
        <title>My Dashboard - PixelVault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DashboardStyles />
      <main className="dash-shell">
        <aside className="sidebar">
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <nav>
            <a href="#overview">Overview</a>
            <a href="#downloads">Downloads</a>
            <a href="#orders">Orders</a>
            <a href="#recommended">Recommended</a>
          </nav>
          <button onClick={logout}>Logout</button>
        </aside>

        <section className="dash-main">
          <header className="topbar">
            <div>
              <p className="eyebrow">My account</p>
              <h1>Welcome, {user.name}</h1>
              <p>{user.email}</p>
            </div>
            <Link href="/" className="shop-link">Continue shopping</Link>
          </header>

          {error && <div className="error">{error}</div>}

          <section id="overview" className="metrics">
            <div><span>Total spent</span><strong>{formatMoney(summary.totalSpent)}</strong></div>
            <div><span>Paid orders</span><strong>{summary.paidOrders || 0}</strong></div>
            <div><span>Downloads</span><strong>{summary.downloads || 0}</strong></div>
            <div><span>Pending</span><strong>{summary.pendingOrders || 0}</strong></div>
          </section>

          <section id="downloads" className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Your downloads</h2>
              </div>
            </div>
            {downloads.length === 0 ? (
              <div className="empty">
                No paid downloads yet. Products appear here after a successful payment.
                <Link href="/">Browse products</Link>
              </div>
            ) : (
              <div className="download-grid">
                {downloads.map((download) => (
                  <article className="download-card" key={`${download.orderId}-${download.slug}`}>
                    <span>{formatDate(download.purchasedAt)}</span>
                    <h3>{download.name}</h3>
                    <p>Order {download.orderId}</p>
                    <a href={download.href}>Download file</a>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="orders" className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent orders</h2>
              </div>
            </div>
            {orders.length === 0 ? (
              <div className="empty">You have not placed an order yet.</div>
            ) : (
              <div className="orders">
                {orders.map((order) => (
                  <article className="order-row" key={order.orderId}>
                    <div>
                      <strong>{order.orderId}</strong>
                      <span>{formatDate(order.createdAt)} · {order.items.map((item) => item.name).join(', ')}</span>
                    </div>
                    <div className="order-meta">
                      <span className={`status ${order.status}`}>{order.status}</span>
                      <strong>{formatMoney(order.total)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="recommended" className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Next best tools</p>
                <h2>Recommended for you</h2>
              </div>
            </div>
            <div className="rec-grid">
              {recommendations.map((product) => (
                <article className="rec-card" key={product.slug}>
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.problem || product.description}</p>
                  <div>
                    <strong>{formatMoney(product.price)}</strong>
                    <Link href="/">View</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function DashboardStyles() {
  return (
    <style jsx global>{`
      *{box-sizing:border-box}
      body{margin:0;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
      a{text-decoration:none;color:inherit}
      .dash-shell{min-height:100vh;display:grid;grid-template-columns:250px 1fr;background:#f5f2ec}
      .sidebar{background:#0d0d14;color:#f5f2ec;padding:24px;display:flex;flex-direction:column;gap:26px;position:sticky;top:0;height:100vh}
      .brand{color:#e8d5a8;font-weight:800;font-size:1.35rem}
      .brand em{color:#c8a96e;font-style:italic}
      .sidebar nav{display:flex;flex-direction:column;gap:8px}
      .sidebar nav a{color:#aaa;padding:10px 12px;border-radius:8px;font-size:.9rem}
      .sidebar nav a:hover{background:rgba(255,255,255,.08);color:#fff}
      .sidebar button{margin-top:auto;border:1px solid rgba(255,255,255,.18);background:none;color:#f5f2ec;border-radius:8px;padding:10px 12px;cursor:pointer}
      .dash-main{padding:28px;max-width:1180px;width:100%;margin:0 auto}
      .topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
      .eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;color:#1a6b6b;font-weight:800;margin:0 0 7px}
      h1{margin:0 0 5px;font-size:2rem;color:#0d0d14}
      h2{margin:0;font-size:1.2rem;color:#0d0d14}
      h3{margin:0;color:#0d0d14}
      .topbar p:not(.eyebrow){margin:0;color:#7a7065}
      .shop-link,.primary{background:#1a6b6b;color:#fff;border-radius:8px;padding:11px 16px;font-weight:800}
      .secondary{border:1px solid #d8d0c4;border-radius:8px;padding:11px 16px;font-weight:800;color:#0d0d14}
      .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px}
      .metrics div,.panel,.guest-card{background:#fff;border:1px solid #d8d0c4;border-radius:10px}
      .metrics div{padding:18px}
      .metrics span{display:block;color:#7a7065;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
      .metrics strong{font-size:1.65rem;color:#1a6b6b}
      .panel{padding:20px;margin-bottom:18px}
      .panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .download-grid,.rec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
      .download-card,.rec-card,.order-row{border:1px solid #e2dbd1;background:#fbfaf7;border-radius:9px;padding:15px}
      .download-card span,.rec-card span{display:block;color:#7a7065;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
      .download-card p,.rec-card p{color:#7a7065;font-size:.86rem;line-height:1.45}
      .download-card a,.rec-card a{display:inline-flex;margin-top:10px;background:#0d0d14;color:#e8d5a8;border-radius:7px;padding:9px 12px;font-weight:800;font-size:.84rem}
      .orders{display:flex;flex-direction:column;gap:10px}
      .order-row{display:flex;align-items:center;justify-content:space-between;gap:14px}
      .order-row span{display:block;color:#7a7065;font-size:.84rem;margin-top:4px}
      .order-meta{text-align:right}
      .status{display:inline-block;border-radius:999px;padding:4px 9px;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;background:#efe9dc;color:#6b5a33;margin-bottom:6px}
      .status.paid{background:#e4f5ed;color:#1a7a4a}
      .status.failed{background:#fff0ed;color:#c0392b}
      .empty{border:1px dashed #d8d0c4;border-radius:9px;padding:22px;color:#7a7065;background:#fbfaf7}
      .empty a{display:inline-flex;margin-left:10px;color:#1a6b6b;font-weight:800}
      .rec-card div{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .error{background:#fff3f1;border:1px solid #f0bbb3;color:#a33427;border-radius:8px;padding:10px 12px;font-size:.86rem;margin-bottom:14px}
      .loading{margin:auto;background:#fff;border:1px solid #d8d0c4;border-radius:10px;padding:28px;color:#7a7065}
      .guest{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:linear-gradient(180deg,#0d0d14 0,#0d0d14 36%,#f5f2ec 36%)}
      .guest .brand{margin-bottom:20px}
      .guest-card{width:min(520px,100%);padding:30px;text-align:center;box-shadow:0 18px 50px rgba(13,13,20,.18)}
      .guest-card p:not(.eyebrow){color:#7a7065;line-height:1.55}
      .actions{display:flex;gap:10px;justify-content:center;margin-top:20px;flex-wrap:wrap}
      @media(max-width:820px){
        .dash-shell{grid-template-columns:1fr}
        .sidebar{height:auto;position:static}
        .sidebar nav{flex-direction:row;flex-wrap:wrap}
        .metrics{grid-template-columns:repeat(2,1fr)}
        .topbar,.order-row{align-items:flex-start;flex-direction:column}
        .order-meta{text-align:left}
      }
      @media(max-width:520px){.metrics{grid-template-columns:1fr}.dash-main{padding:18px}}
    `}</style>
  );
}
