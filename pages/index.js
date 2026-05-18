// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { readSession } from '../lib/auth';

export default function Home({ initialUser = null }) {
  const [products, setProducts]     = useState([]);
  const [cart, setCart]             = useState([]);
  const [cartOpen, setCartOpen]     = useState(false);
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);
  const [payModal, setPayModal]     = useState(false);
  const [customer, setCustomer]     = useState({ name: '', email: '', phone: '' });
  const [paying, setPaying]         = useState(false);
  const [success, setSuccess]       = useState(null);
  const [toast, setToast]           = useState('');
  const [tab, setTab]               = useState('store');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('featured');
  const [user, setUser]             = useState(initialUser);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load products from DB
  useEffect(() => {
    fetch(`/api/products${filter !== 'all' ? `?category=${filter}` : ''}`)
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setCustomer(prev => ({
            ...prev,
            name: prev.name || data.user.name || '',
            email: prev.email || data.user.email || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.emoji} ${product.name} added to cart`);
  };

  const changeQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i._id === id ? { ...i, qty: i.qty + delta } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    showToast('Logged out');
  };

  const cartCount  = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const gst        = Math.round(subtotal * 0.18);
  const total      = subtotal + gst;
  const visibleProducts = products
    .filter((product) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [product.name, product.description, product.problem, product.outcome, product.audience, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    });

  const handlePay = async () => {
    if (!customer.name || !customer.email) {
      showToast('Please enter your name and email');
      return;
    }
    setPaying(true);
    try {
      // 1. Create order on server
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i._id, qty: i.qty })),
          customer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order creation failed');

      // 2. Open Razorpay checkout
      const options = {
        key:      data.keyId,
        amount:   data.amount,
        currency: data.currency,
        name:     'PixelVault',
        description: `Order ${data.orderId}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name:    customer.name,
          email:   customer.email,
          contact: customer.phone,
        },
        theme: { color: '#1a6b6b' },
        handler: async (response) => {
          // 3. Verify on server
          const vRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, orderId: data.orderId }),
          });
          const vData = await vRes.json();
          if (vData.success) {
            setCart([]);
            setPayModal(false);
            setCartOpen(false);
            setSuccess(vData.orderId);
          } else {
            showToast('Payment verification failed. Contact support.');
          }
          setPaying(false);
        },
        modal: { ondismiss: () => setPaying(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast(err.message || 'Something went wrong');
      setPaying(false);
    }
  };

  const categories = ['all', 'course', 'template', 'tool', 'licence'];
  const colorMap = {
    teal:  'linear-gradient(135deg,#e6f4f4,#b8e6e6)',
    amber: 'linear-gradient(135deg,#fef9ed,#fde8a8)',
    rose:  'linear-gradient(135deg,#fdf0f4,#f8c8d8)',
    slate: 'linear-gradient(135deg,#f0f2f8,#c8d0e8)',
    mint:  'linear-gradient(135deg,#eefaf4,#b8ecd0)',
    plum:  'linear-gradient(135deg,#f4f0f8,#d8c4f0)',
  };

  return (
    <>
      <Head>
        <title>PixelVault — Digital Products</title>
        <meta name="description" content="Premium digital products: courses, templates, tools and licences." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      {/* Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />

      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{
          --ink:#0d0d14;--paper:#f5f2ec;--cream:#ede9e0;
          --gold:#c8a96e;--gold-light:#e8d5a8;--gold-dark:#8a6d3e;
          --teal:#1a6b6b;--teal-light:#e6f4f4;--teal-dark:#0f4444;
          --red:#c0392b;--green:#1a7a4a;
          --text:#1a1a28;--muted:#7a7065;--border:#d8d0c4;
        }
        body{background:var(--paper);color:var(--text);font-family:Segoe UI,system-ui,sans-serif;min-height:100vh}
        a{color:inherit;text-decoration:none}

        nav{background:var(--ink);padding:0 1.5rem;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
        .logo{font-size:1.25rem;font-weight:700;color:var(--gold-light);letter-spacing:.02em}
        .logo em{font-style:italic;color:var(--gold)}
        .nav-right{display:flex;align-items:center;gap:6px}
        .nav-btn{background:none;border:none;color:#aaa;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:.85rem;transition:all .2s}
        .nav-btn:hover,.nav-btn.on{color:#fff;background:rgba(255,255,255,.09)}
        .cart-btn{background:var(--gold);color:var(--ink);border:none;padding:9px 18px;border-radius:30px;cursor:pointer;font-weight:700;font-size:.85rem;display:flex;align-items:center;gap:6px;transition:all .2s}
        .cart-btn:hover{background:var(--gold-light)}
        .badge{background:var(--ink);color:var(--gold);font-size:11px;padding:2px 7px;border-radius:20px;font-weight:700}
        .auth-link{color:#f5f2ec;border:1px solid rgba(255,255,255,.18);padding:8px 12px;border-radius:8px;font-size:.82rem;font-weight:700}
        .auth-link.primary{background:#f5f2ec;color:var(--ink);border-color:#f5f2ec}
        .user-pill{display:flex;align-items:center;gap:8px;color:#f5f2ec;font-size:.82rem}
        .logout-btn{background:none;border:none;color:var(--gold-light);cursor:pointer;font-size:.8rem}

        .hero{background:var(--ink);padding:4.5rem 1.5rem 3.5rem;text-align:center;position:relative;overflow:hidden}
        .hero-grid{position:absolute;inset:0;opacity:.04;background-image:repeating-linear-gradient(0deg,transparent,transparent 40px,var(--gold) 40px,var(--gold) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,var(--gold) 40px,var(--gold) 41px)}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(200,169,110,.15);border:1px solid rgba(200,169,110,.3);color:var(--gold);font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:5px 14px;border-radius:30px;margin-bottom:1.5rem}
        .hero h1{font-size:clamp(2rem,5vw,3.4rem);font-weight:300;color:#f5f2ec;line-height:1.08;margin-bottom:.75rem}
        .hero h1 em{font-style:italic;color:var(--gold)}
        .hero p{color:#8888a2;font-size:.95rem;max-width:440px;margin:0 auto 2rem;line-height:1.7}
        .hero-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .hero-stats{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:1px;max-width:620px;margin:2.25rem auto 0;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12)}
        .hero-stat{background:#12121c;padding:14px 12px;text-align:left}
        .hero-stat strong{display:block;color:#f5f2ec;font-size:1.05rem}
        .hero-stat span{display:block;color:#8f8fa5;font-size:.72rem;margin-top:3px}
        .btn-gold{background:var(--gold);color:var(--ink);border:none;padding:13px 26px;border-radius:8px;cursor:pointer;font-weight:700;font-size:.9rem;transition:all .2s}
        .btn-gold:hover{background:var(--gold-light);transform:translateY(-1px)}
        .btn-outline{background:none;border:1px solid rgba(255,255,255,.2);color:#f5f2ec;padding:13px 24px;border-radius:8px;cursor:pointer;font-size:.9rem;transition:all .2s}
        .btn-outline:hover{border-color:var(--gold);color:var(--gold)}

        .main{max-width:1180px;margin:0 auto;padding:2rem 1.5rem}
        .section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px}
        .section-lbl{font-size:1.3rem;font-weight:600;color:var(--ink)}
        .store-tools{display:grid;grid-template-columns:minmax(220px,1fr) 180px;gap:10px;margin-bottom:1rem}
        .search-input,.sort-select{width:100%;border:1px solid var(--border);background:#fff;color:var(--text);border-radius:8px;padding:11px 12px;font:inherit;outline:none}
        .search-input:focus,.sort-select:focus{border-color:var(--teal)}
        .trust-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:-.4rem 0 1.4rem}
        .trust-item{background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:.78rem;color:var(--muted)}
        .trust-item strong{display:block;color:var(--ink);font-size:.86rem;margin-bottom:2px}
        .collection-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 1.4rem}
        .collection{background:var(--ink);color:#f5f2ec;border-radius:10px;padding:16px;border:1px solid rgba(200,169,110,.25)}
        .collection span{display:block;color:var(--gold);font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;font-weight:800}
        .collection strong{display:block;font-size:1.05rem;margin-bottom:6px}
        .collection p{margin:0;color:#aaa;font-size:.82rem;line-height:1.45}

        .filters{display:flex;gap:7px;flex-wrap:wrap}
        .filt{background:none;border:1px solid var(--border);color:var(--muted);padding:6px 16px;border-radius:30px;cursor:pointer;font-size:.82rem;transition:all .2s;text-transform:capitalize}
        .filt.on{background:var(--ink);border-color:var(--ink);color:#f5f2ec}
        .filt:hover:not(.on){border-color:var(--teal);color:var(--teal)}

        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:1.25rem;margin-bottom:3rem}
        .pcard{background:#fff;border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:all .3s;position:relative}
        .pcard:hover{box-shadow:0 12px 40px rgba(13,13,20,.12);transform:translateY(-3px);border-color:var(--gold)}
        .pthumb{height:150px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
        .pthumb-emoji{font-size:3.2rem;position:relative;z-index:1}
        .pbadge{position:absolute;top:10px;left:10px;font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:20px}
        .pbadge-hot{background:var(--ink);color:var(--gold)}
        .pbadge-new{background:var(--teal);color:#fff}
        .pbadge-sale{background:var(--red);color:#fff}
        .pbody{padding:1.1rem}
        .pcat{font-size:.7rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:5px}
        .pname{font-size:1rem;font-weight:600;margin-bottom:5px;color:var(--ink);line-height:1.3}
        .pdesc{font-size:.78rem;color:var(--muted);line-height:1.45;margin-bottom:10px}
        .paudience{font-size:.7rem;color:var(--gold-dark);font-weight:700;margin-bottom:8px}
        .psolve{background:rgba(26,107,107,.08);border:1px solid rgba(26,107,107,.13);border-radius:8px;padding:8px 9px;margin-bottom:10px}
        .psolve-k{font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;color:var(--teal);font-weight:700;margin-bottom:3px}
        .psolve-v{font-size:.74rem;line-height:1.35;color:var(--text)}
        .pfeatures{display:flex;flex-direction:column;gap:4px;margin:0 0 12px;padding:0;list-style:none}
        .pfeat{font-size:.72rem;color:var(--muted);line-height:1.35;display:flex;gap:5px}
        .pfeat::before{content:"";width:5px;height:5px;background:var(--gold);border-radius:50%;margin-top:6px;flex-shrink:0}
        .poutcome{font-size:.72rem;color:var(--teal-dark);background:#edf8f4;border-radius:7px;padding:7px 8px;margin-bottom:10px;line-height:1.35}
        .prating{display:flex;align-items:center;gap:4px;margin-bottom:10px;font-size:.75rem;color:var(--muted)}
        .stars{color:var(--gold);letter-spacing:1px}
        .pfoot{display:flex;align-items:center;justify-content:space-between}
        .pprice{display:flex;flex-direction:column}
        .porig{font-size:.75rem;color:var(--muted);text-decoration:line-through}
        .pfinal{font-size:1.2rem;font-weight:700;color:var(--teal)}
        .pdiscount{font-size:.7rem;font-weight:600;color:var(--teal);background:rgba(26,107,107,.1);padding:2px 7px;border-radius:4px;margin-top:3px;display:inline-block}
        .pactions{display:flex;align-items:center;gap:7px}
        .view-btn{background:#fff;border:1px solid var(--border);color:var(--ink);height:36px;border-radius:9px;padding:0 11px;cursor:pointer;font-weight:700;font-size:.78rem}
        .view-btn:hover{border-color:var(--teal);color:var(--teal)}
        .padd-btn{background:var(--teal);border:none;color:#fff;width:36px;height:36px;border-radius:9px;cursor:pointer;font-size:1.2rem;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
        .padd-btn:hover{background:var(--teal-dark);transform:scale(1.08)}

        .spinner{display:flex;align-items:center;justify-content:center;padding:4rem;color:var(--muted);font-size:.9rem}
        .empty{text-align:center;padding:3rem;color:var(--muted);font-size:.9rem}

        /* Cart Drawer */
        .c-ov{position:fixed;inset:0;background:rgba(13,13,20,.55);z-index:200;backdrop-filter:blur(3px)}
        .c-panel{position:fixed;right:0;top:0;bottom:0;width:400px;max-width:100vw;background:var(--paper);border-left:1px solid var(--border);z-index:201;display:flex;flex-direction:column}
        .c-head{padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);background:var(--ink);display:flex;justify-content:space-between;align-items:center}
        .c-head h3{font-size:1.05rem;font-weight:600;color:#f5f2ec}
        .c-close{background:none;border:none;color:#aaa;cursor:pointer;font-size:1.4rem;line-height:1}
        .c-body{flex:1;overflow-y:auto;padding:.75rem 1rem}
        .c-item{display:flex;gap:10px;padding:.85rem 0;border-bottom:1px solid var(--border)}
        .c-ico{width:50px;height:50px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0}
        .c-info{flex:1;min-width:0}
        .c-name{font-weight:500;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
        .c-price{font-weight:700;color:var(--teal);font-size:.9rem}
        .c-qty{display:flex;align-items:center;gap:7px;margin-top:7px}
        .cq-btn{background:var(--cream);border:1px solid var(--border);color:var(--text);width:24px;height:24px;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;font-size:.9rem}
        .cq-btn:hover{border-color:var(--teal);color:var(--teal)}
        .cq-n{font-weight:600;font-size:.82rem;min-width:14px;text-align:center}
        .c-del{background:none;border:none;color:var(--red);cursor:pointer;font-size:.72rem;margin-left:auto}
        .c-foot{padding:1.25rem 1.5rem;border-top:1px solid var(--border);background:var(--cream)}
        .ctr{display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:6px}
        .ctr.big{font-size:1.05rem;font-weight:700;margin-top:9px;padding-top:9px;border-top:1px solid var(--border)}
        .c-pay-btn{width:100%;padding:14px;background:var(--ink);color:var(--gold-light);border:none;border-radius:9px;cursor:pointer;font-weight:700;font-size:.9rem;margin-top:.85rem;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
        .c-pay-btn:hover{background:#1a1a28}
        .c-pay-btn:disabled{opacity:.5;cursor:not-allowed}
        .empty-c{text-align:center;padding:2.5rem 1rem;color:var(--muted);font-size:.88rem}

        /* Payment Modal */
        .m-ov{position:fixed;inset:0;background:rgba(13,13,20,.75);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px)}
        .m-box{background:var(--paper);border-radius:16px;width:460px;max-width:96vw;overflow:hidden}
        .m-head{background:var(--ink);padding:1.25rem 1.5rem;display:flex;justify-content:space-between;align-items:center}
        .m-head h3{color:#f5f2ec;font-size:1rem;font-weight:600}
        .m-close{background:none;border:none;color:#aaa;cursor:pointer;font-size:1.4rem}
        .m-body{padding:1.5rem}
        .fg{margin-bottom:1rem}
        .fl{display:block;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:5px}
        .fi{width:100%;background:var(--cream);border:1px solid var(--border);color:var(--text);padding:11px 13px;border-radius:8px;font-size:.9rem;outline:none;transition:border-color .2s;font-family:inherit}
        .fi:focus{border-color:var(--teal)}
        .frow{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .order-summary{background:var(--cream);border:1px solid var(--border);border-radius:9px;padding:12px 14px;margin-bottom:1rem}
        .os-row{display:flex;justify-content:space-between;font-size:.83rem;margin-bottom:5px;color:var(--muted)}
        .os-row.total{font-size:1rem;font-weight:700;color:var(--teal);margin-top:7px;padding-top:7px;border-top:1px solid var(--border);margin-bottom:0}
        .confirm-btn{width:100%;padding:14px;background:var(--teal);color:#fff;border:none;border-radius:9px;cursor:pointer;font-weight:700;font-size:.92rem;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:7px}
        .confirm-btn:hover{background:var(--teal-dark)}
        .confirm-btn:disabled{opacity:.5;cursor:not-allowed}
        .secure-note{text-align:center;font-size:.72rem;color:var(--muted);margin-top:.6rem}
        .detail-grid{display:grid;grid-template-columns:130px 1fr;gap:16px}
        .detail-thumb{height:130px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;color:var(--ink)}
        .detail-copy h2{margin:0 0 7px;font-size:1.35rem}
        .detail-copy p{color:var(--muted);font-size:.88rem;line-height:1.55;margin:0 0 10px}
        .detail-list{margin:10px 0 16px;padding-left:18px;color:var(--text);font-size:.84rem;line-height:1.55}
        .detail-price{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--cream);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:12px}
        .detail-price strong{color:var(--teal);font-size:1.35rem}

        /* Success */
        .success-wrap{text-align:center;padding:2.5rem 1.5rem}
        .tick{font-size:3.5rem;animation:pop .5s ease;display:block;margin-bottom:.75rem}
        @keyframes pop{0%{transform:scale(0) rotate(-15deg)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
        .success-wrap h2{font-size:1.4rem;font-weight:600;margin-bottom:.5rem}
        .success-wrap p{color:var(--muted);font-size:.88rem;margin-bottom:1.25rem;line-height:1.5}
        .order-chip{background:var(--cream);border:1px solid var(--border);border-radius:7px;padding:9px 16px;font-family:monospace;font-size:.82rem;color:var(--teal);display:inline-block;margin-bottom:1.25rem}
        .dl-note{background:var(--teal-light);border:1px solid rgba(26,107,107,.2);border-radius:9px;padding:12px 14px;font-size:.82rem;color:var(--teal-dark);margin-bottom:1.25rem;text-align:left}

        /* Toast */
        .toast{position:fixed;bottom:1.5rem;right:1.5rem;background:var(--ink);color:#f5f2ec;padding:11px 16px;border-radius:9px;z-index:500;font-size:.82rem;display:flex;align-items:center;gap:7px;border-left:3px solid var(--gold);box-shadow:0 6px 20px rgba(0,0,0,.2);animation:slideUp .3s ease}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @media(max-width:760px){
          nav{height:auto;align-items:flex-start;gap:10px;padding:12px;flex-direction:column}
          .nav-right{width:100%;flex-wrap:wrap}
          .hero-stats,.trust-row,.store-tools,.collection-row,.detail-grid{grid-template-columns:1fr}
          .hero{padding:3.5rem 1rem 2.5rem}
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="logo"><em>Pixel</em>Vault ✦</div>
        <div className="nav-right">
          <button className={`nav-btn ${tab==='store'?'on':''}`} onClick={() => setTab('store')}>Store</button>
          {user && <Link className="auth-link" href="/dashboard">My Dashboard</Link>}
          <button className={`nav-btn ${tab==='dashboard'?'on':''}`} onClick={() => setTab('dashboard')}>Admin</button>
          {user ? (
            <div className="user-pill">
              <span>{user.name}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            <>
              <Link className="auth-link" href="/login">Login</Link>
              <Link className="auth-link primary" href="/signup">Sign up</Link>
            </>
          )}
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛍 Cart <span className="badge">{cartCount}</span>
          </button>
        </div>
      </nav>

      {/* ── STORE TAB ──────────────────────────────────────────────────── */}
      {tab === 'store' && (
        <>
          <div className="hero">
            <div className="hero-grid" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="hero-tag">✦ Digital Products · Instant Delivery</div>
              <h1>Digital products that solve <em>business</em><br />problems fast</h1>
              <p>Premium templates, trackers, scripts, and operating systems for creators, freelancers, founders, and small stores.</p>
              <div className="hero-btns">
                <button className="btn-gold" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>Browse Products ↓</button>
                {user ? (
                  <Link className="btn-outline" href="/dashboard">Open Dashboard</Link>
                ) : (
                  <Link className="btn-outline" href="/signup">Create Account</Link>
                )}
              </div>
              <div className="hero-stats">
                <div className="hero-stat"><strong>{products.length || '12'}+</strong><span>ready-to-use products</span></div>
                <div className="hero-stat"><strong>Instant</strong><span>email delivery after payment</span></div>
                <div className="hero-stat"><strong>Razorpay</strong><span>UPI, cards, wallets</span></div>
              </div>
            </div>
          </div>

          <div className="main" id="shop">
            <div className="section-hd">
              <div className="section-lbl">Problem-solving products</div>
              <div className="filters">
                {categories.map(c => (
                  <button key={c} className={`filt ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="store-tools">
              <input
                className="search-input"
                placeholder="Search payments, GST, WhatsApp, support, proposals..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>
            <div className="trust-row">
              <div className="trust-item"><strong>Protected delivery</strong>Paid orders get secure download links.</div>
              <div className="trust-item"><strong>Business-focused</strong>Every product targets a real workflow pain.</div>
              <div className="trust-item"><strong>Editable assets</strong>Use, copy, and adapt templates immediately.</div>
              <div className="trust-item"><strong>Customer account</strong>Login speeds up future checkout.</div>
            </div>
            <div className="collection-row">
              <div className="collection"><span>Revenue recovery</span><strong>Fix leaks before more ads</strong><p>Payments, checkout friction, reviews, and abandoned buyers.</p></div>
              <div className="collection"><span>Creator operations</span><strong>Ship content and offers faster</strong><p>Prompts, content systems, launch kits, and product stores.</p></div>
              <div className="collection"><span>Business systems</span><strong>Cleaner client and finance workflows</strong><p>Proposals, SOPs, onboarding, GST, and monthly tracking.</p></div>
            </div>

            {loading ? (
              <div className="spinner">Loading products…</div>
            ) : visibleProducts.length === 0 ? (
              <div className="empty">
                No products match your search.
              </div>
            ) : (
              <div className="pgrid">
                {visibleProducts.map(p => {
                  const disc = p.comparePrice ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
                  const bg = colorMap[p.color] || colorMap.teal;
                  return (
                    <div key={p._id} className="pcard">
                      {p.badge && (
                        <div className={`pbadge pbadge-${p.badge.toLowerCase() === 'hot' ? 'hot' : p.badge.toLowerCase() === 'new' ? 'new' : 'sale'}`}>
                          {p.badge.toLowerCase() === 'hot' ? '🔥 Hot' : p.badge.toLowerCase() === 'new' ? '✦ New' : `🏷 ${p.badge}`}
                        </div>
                      )}
                      <div className="pthumb" style={{ background: bg }}>
                        <div className="pthumb-emoji">{p.emoji || '📦'}</div>
                      </div>
                      <div className="pbody">
                        <div className="pcat">{p.category}</div>
                        <div className="pname">{p.name}</div>
                        {p.audience && <div className="paudience">For {p.audience}</div>}
                        <div className="pdesc">{p.description}</div>
                        {p.problem && (
                          <div className="psolve">
                            <div className="psolve-k">Solves</div>
                            <div className="psolve-v">{p.problem}</div>
                          </div>
                        )}
                        {p.outcome && <div className="poutcome"><strong>Outcome:</strong> {p.outcome}</div>}
                        {Array.isArray(p.features) && p.features.length > 0 && (
                          <ul className="pfeatures">
                            {p.features.slice(0, 3).map(feature => (
                              <li key={feature} className="pfeat">{feature}</li>
                            ))}
                          </ul>
                        )}
                        {p.reviewCount > 0 && (
                          <div className="prating">
                            <span className="stars">{'★'.repeat(Math.floor(p.rating || 0))}</span>
                            <span>{p.rating} ({p.reviewCount})</span>
                          </div>
                        )}
                        <div className="pfoot">
                          <div className="pprice">
                            {p.comparePrice && <span className="porig">₹{p.comparePrice.toLocaleString('en-IN')}</span>}
                            <span className="pfinal">₹{p.price.toLocaleString('en-IN')}</span>
                            {disc > 0 && <span className="pdiscount">Save {disc}%</span>}
                          </div>
                          <div className="pactions">
                            <button className="view-btn" onClick={() => setSelectedProduct(p)}>View</button>
                            <button className="padd-btn" onClick={() => addToCart(p)}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── DASHBOARD TAB ──────────────────────────────────────────────── */}
      {tab === 'dashboard' && <Dashboard />}

      {/* ── CART DRAWER ────────────────────────────────────────────────── */}
      {cartOpen && (
        <>
          <div className="c-ov" onClick={() => setCartOpen(false)} />
          <div className="c-panel">
            <div className="c-head">
              <h3>Your Cart 🛍</h3>
              <button className="c-close" onClick={() => setCartOpen(false)}>×</button>
            </div>
            <div className="c-body">
              {cart.length === 0 ? (
                <div className="empty-c">Cart is empty — add a product!</div>
              ) : cart.map(i => (
                <div key={i._id} className="c-item">
                  <div className="c-ico" style={{ background: colorMap[i.color] || colorMap.teal }}>{i.emoji || '📦'}</div>
                  <div className="c-info">
                    <div className="c-name">{i.name}</div>
                    <div className="c-price">₹{i.price.toLocaleString('en-IN')}</div>
                    <div className="c-qty">
                      <button className="cq-btn" onClick={() => changeQty(i._id, -1)}>−</button>
                      <span className="cq-n">{i.qty}</span>
                      <button className="cq-btn" onClick={() => changeQty(i._id, 1)}>+</button>
                      <button className="c-del" onClick={() => changeQty(i._id, -i.qty)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="c-foot">
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>GST (18%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>Shipping</span><span style={{ color: 'var(--green)' }}>FREE</span></div>
                <div className="ctr big"><span>Total</span><span style={{ color: 'var(--teal)' }}>₹{total.toLocaleString('en-IN')}</span></div>
                <button className="c-pay-btn" onClick={() => setPayModal(true)}>💳 Checkout — ₹{total.toLocaleString('en-IN')}</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── PAYMENT MODAL ──────────────────────────────────────────────── */}
      {payModal && !success && (
        <div className="m-ov">
          <div className="m-box">
            <div className="m-head">
              <h3>Complete Your Purchase</h3>
              <button className="m-close" onClick={() => setPayModal(false)}>×</button>
            </div>
            <div className="m-body">
              {user && (
                <div className="order-summary" style={{ marginBottom: 12 }}>
                  <div className="os-row total"><span>Account</span><span>{user.email}</span></div>
                </div>
              )}
              <div className="order-summary">
                {cart.map(i => (
                  <div key={i._id} className="os-row"><span>{i.name} ×{i.qty}</span><span>₹{(i.price * i.qty).toLocaleString('en-IN')}</span></div>
                ))}
                <div className="os-row"><span>GST (18%)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
                <div className="os-row total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
              </div>
              <div className="fg">
                <label className="fl">Full Name *</label>
                <input className="fi" placeholder="Your name" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div className="fg">
                <label className="fl">Email *</label>
                <input className="fi" type="email" placeholder="you@email.com" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} />
              </div>
              <div className="fg">
                <label className="fl">Phone (optional)</label>
                <input className="fi" placeholder="+91 9876543210" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} />
              </div>
              <button className="confirm-btn" onClick={handlePay} disabled={paying}>
                {paying ? '⏳ Opening Razorpay…' : `🔒 Pay ₹${total.toLocaleString('en-IN')} via Razorpay`}
              </button>
              <div className="secure-note">🔒 Payments secured by Razorpay · UPI · Cards · Wallets · EMI</div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="m-ov">
          <div className="m-box" style={{ width: 620 }}>
            <div className="m-head">
              <h3>Product Details</h3>
              <button className="m-close" onClick={() => setSelectedProduct(null)}>×</button>
            </div>
            <div className="m-body">
              <div className="detail-grid">
                <div className="detail-thumb" style={{ background: colorMap[selectedProduct.color] || colorMap.teal }}>
                  {selectedProduct.emoji || 'PK'}
                </div>
                <div className="detail-copy">
                  <div className="pcat">{selectedProduct.category}</div>
                  <h2>{selectedProduct.name}</h2>
                  {selectedProduct.audience && <div className="paudience">For {selectedProduct.audience}</div>}
                  <p>{selectedProduct.longDesc || selectedProduct.description}</p>
                  {selectedProduct.problem && <div className="psolve"><div className="psolve-k">Problem</div><div className="psolve-v">{selectedProduct.problem}</div></div>}
                  {selectedProduct.outcome && <div className="poutcome"><strong>Outcome:</strong> {selectedProduct.outcome}</div>}
                </div>
              </div>
              {Array.isArray(selectedProduct.features) && (
                <ul className="detail-list">
                  {selectedProduct.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
              )}
              <div className="detail-price">
                <div>
                  <strong>₹{selectedProduct.price.toLocaleString('en-IN')}</strong>
                  {selectedProduct.comparePrice && <span className="porig" style={{ marginLeft: 8 }}>₹{selectedProduct.comparePrice.toLocaleString('en-IN')}</span>}
                </div>
                <button className="confirm-btn" style={{ width: 'auto', padding: '12px 18px' }} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }}>
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS SCREEN ─────────────────────────────────────────────── */}
      {success && (
        <div className="m-ov">
          <div className="m-box">
            <div className="m-head"><h3>Order Confirmed</h3><button className="m-close" onClick={() => setSuccess(null)}>×</button></div>
            <div className="success-wrap">
              <span className="tick">✅</span>
              <h2>Payment Successful!</h2>
              <p>Your order is confirmed. Download links have been sent to <strong>{customer.email}</strong>.</p>
              <div className="order-chip">{success}</div>
              <div className="dl-note">
                <strong>📥 Check your email</strong><br />
                Your download links are in the confirmation email. Check your spam folder if you don't see it.
              </div>
              <button className="btn-gold" style={{ width: '100%' }} onClick={() => { setSuccess(null); setPayModal(false); }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      {toast && <div className="toast">✦ {toast}</div>}
    </>
  );
}

// ── Dashboard (embedded component, reads from /api/orders) ─────────────────
function Dashboard() {
  const [data, setData]       = useState(null);
  const [secret, setSecret]   = useState('');
  const [authed, setAuthed]   = useState(false);
  const [error, setError]     = useState('');

  const load = async (s) => {
    setError('');
    const res = await fetch('/api/orders', { headers: { 'x-admin-secret': s } });
    if (res.status === 401) { setError('Wrong admin secret'); return; }
    const json = await res.json();
    setData(json);
    setAuthed(true);
  };

  if (!authed) return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1.5rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Dashboard Login</h2>
      <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)', marginBottom: 5 }}>Admin Secret</label>
      <input style={{ width: '100%', background: 'var(--cream)', border: '1px solid var(--border)', padding: '11px 13px', borderRadius: 8, fontSize: '.9rem', marginBottom: 10, fontFamily: 'inherit', outline: 'none' }}
        type="password" placeholder="From ADMIN_SECRET in .env.local"
        value={secret} onChange={e => setSecret(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && load(secret)} />
      {error && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{error}</p>}
      <button className="btn-gold" style={{ width: '100%' }} onClick={() => load(secret)}>Unlock Dashboard</button>
      <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 10 }}>Set ADMIN_SECRET in your .env.local file.</p>
    </div>
  );

  const { orders = [], revenue = 0, count = 0 } = data || {};
  const aov = count ? Math.round(revenue / count) : 0;

  return (
    <div className="main">
      <div className="section-lbl" style={{ marginBottom: '1.5rem' }}>Earnings Dashboard</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Revenue', val: `₹${revenue.toLocaleString('en-IN')}`, color: 'var(--teal)' },
          { label: 'Paid Orders', val: count, color: 'var(--ink)' },
          { label: 'Avg Order Value', val: `₹${aov.toLocaleString('en-IN')}`, color: 'var(--gold-dark)' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem' }}>
            <div style={{ fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', marginBottom: 7 }}>{c.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>
      <div className="section-lbl" style={{ marginBottom: '1rem' }}>Recent Paid Orders</div>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {orders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.88rem' }}>No paid orders yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Order ID', 'Customer', 'Items', 'Amount', 'Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', padding: '11px 14px', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ padding: '11px 14px', fontSize: '.82rem', fontFamily: 'monospace', color: 'var(--teal)', borderBottom: '1px solid rgba(216,208,196,.4)' }}>{o.orderId}</td>
                  <td style={{ padding: '11px 14px', fontSize: '.82rem', borderBottom: '1px solid rgba(216,208,196,.4)' }}>{o.customer?.email}</td>
                  <td style={{ padding: '11px 14px', fontSize: '.78rem', color: 'var(--muted)', borderBottom: '1px solid rgba(216,208,196,.4)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.items?.map(i => i.name).join(', ')}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: '.85rem', fontWeight: 700, color: 'var(--teal)', borderBottom: '1px solid rgba(216,208,196,.4)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '11px 14px', fontSize: '.78rem', color: 'var(--muted)', borderBottom: '1px solid rgba(216,208,196,.4)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const session = readSession(req);

  return {
    props: {
      initialUser: session ? {
        id: session.userId,
        name: session.name,
        email: session.email,
      } : null,
    },
  };
}
