// pages/index.js
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { readSession } from '../lib/auth';
import { productCategories, productCategoryLabels } from '../lib/starter-products.mjs';
import { applyCouponToCart } from '../lib/coupons.mjs';

const categoryOptions = [{ slug: 'all', label: 'All products' }, ...productCategories];

function formatCategory(category) {
  return productCategoryLabels[category] || category;
}

function productMeta(product) {
  return [product.categoryLabel || formatCategory(product.category), product.format].filter(Boolean).join(' / ');
}

function formatPrice(value, { freeLabel = false } = {}) {
  const numericValue = Number(value || 0);
  if (freeLabel && numericValue <= 0) return 'Free';
  return `Rs. ${numericValue.toLocaleString('en-IN')}`;
}

function isFreeProduct(product) {
  return Number(product?.price || 0) <= 0;
}

function formatProductPrice(product) {
  return formatPrice(product?.price, { freeLabel: true });
}

const categorySummaries = {
  'career-placement': 'Resume, LinkedIn, portfolio, interview, and placement bundles for freshers.',
  'student-projects': 'Mini projects, reports, viva PDFs, seminar assets, and beginner notes.',
  'free-project-ideas': 'Free department-wise final-year project ideas for students choosing practical topics.',
  'product-bundles': 'Higher-value bundles that combine 3-4 related products into one purchase.',
  'code-templates': 'React, portfolio, landing page, website, and script templates for developers.',
  'design-assets': 'Canva kits, thumbnails, logos, UI kits, and creator design assets.',
  'stock-market-investing': 'Educational stock-market, trading, investing, SIP, risk, and journal products.',
  'ai-courses': 'Complete AI courses with curriculum, assignments, and real-world projects.',
  'sales-checkout': 'Fix checkout leaks, abandoned carts, payment failures, and store launches.',
  'finance-compliance': 'Track GST, cash flow, subscriptions, settlements, and founder finance.',
  'client-services': 'Improve onboarding, proposals, delivery, retainers, and client communication.',
  'marketing-content': 'Plan content, SEO, email, launches, and social campaigns that convert.',
  'ai-automation': 'Prompt packs, Notion systems, and AI workflows for study and freelance work.',
  'customer-support': 'Reduce tickets, improve reviews, and retain customers with better support.',
  'local-business': 'Bring salons, clinics, coaches, and local teams into smoother digital systems.',
  'creator-products': 'Package knowledge into paid products, bundles, courses, and launch assets.',
  'business-documents': 'Invoices, proposals, contracts, business plans, and client-ready documents.',
  'operations-team': 'Build SOPs, dashboards, hiring kits, and repeatable management systems.',
};

const heroProductSlug = 'complete-placement-success-pack';
const starterStackSlugs = [
  'freshers-ats-resume-bundle',
  'linkedin-optimization-template-pack',
  'technical-interview-question-bank',
];

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
  const [couponCode, setCouponCode] = useState('');
  const [heroSlide, setHeroSlide]   = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [leadProduct, setLeadProduct] = useState(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [advisorForm, setAdvisorForm] = useState({
    audience: 'student',
    goal: 'placement',
    budget: 'under199',
    format: 'any',
  });
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResults, setAdvisorResults] = useState(null);

  // Load products from DB
  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
          setLeadForm(prev => ({
            ...prev,
            name: prev.name || data.user.name || '',
            email: prev.email || data.user.email || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref');
    const cleanRef = String(urlRef || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
    if (cleanRef) {
      window.localStorage.setItem('pixelvault_referral_code', cleanRef);
      setReferralCode(cleanRef);
      return;
    }

    setReferralCode(window.localStorage.getItem('pixelvault_referral_code') || '');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || products.length === 0) return;
    const slug = new URLSearchParams(window.location.search).get('product');
    const category = new URLSearchParams(window.location.search).get('category');
    if (category && categoryOptions.some((item) => item.slug === category)) setFilter(category);
    if (!slug) return;
    const product = products.find((item) => item.slug === slug);
    if (product) setSelectedProduct(product);
  }, [products]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const addToCart = (product) => {
    if (isFreeProduct(product)) {
      downloadFreeProduct(product);
      return;
    }

    setCart(prev => {
      const id = product._id || product.slug;
      const ex = prev.find(i => (i._id || i.slug) === id);
      if (ex) return prev.map(i => (i._id || i.slug) === id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`${product.emoji} ${product.name} added to cart`);
  };

  const addManyToCart = (items) => {
    const paidItems = items.filter(product => !isFreeProduct(product));
    if (!paidItems.length) return;
    setCart(prev => {
      const next = [...prev];
      paidItems.forEach(product => {
        const id = product._id || product.slug;
        const index = next.findIndex(i => (i._id || i.slug) === id);
        if (index >= 0) {
          next[index] = { ...next[index], qty: next[index].qty + 1 };
        } else {
          next.push({ ...product, qty: 1 });
        }
      });
      return next;
    });
    showToast(`${paidItems.length} products added to cart`);
  };

  const downloadFreeProduct = (product) => {
    if (!product?.slug) return;
    const savedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('pixelvault_lead_email') : '';
    const savedName = typeof window !== 'undefined' ? window.localStorage.getItem('pixelvault_lead_name') : '';
    setLeadForm(prev => ({
      name: prev.name || customer.name || user?.name || savedName || '',
      email: prev.email || customer.email || user?.email || savedEmail || '',
      phone: prev.phone || customer.phone || '',
    }));
    setLeadProduct(product);
  };

  const unlockFreeDownload = async (event) => {
    event.preventDefault();
    if (!leadProduct?.slug) return;
    if (!leadForm.email.trim()) {
      showToast('Enter your email to unlock the free download');
      return;
    }

    setLeadSubmitting(true);
    try {
      const res = await fetch('/api/lead-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: leadProduct.slug,
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          referralCode,
          source: 'storefront',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to unlock download');

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pixelvault_lead_email', leadForm.email.trim());
        window.localStorage.setItem('pixelvault_lead_name', leadForm.name.trim());
        window.location.href = data.downloadUrl;
      }
      showToast(`${leadProduct.name} download started`);
      setLeadProduct(null);
    } catch (err) {
      showToast(err.message || 'Unable to unlock free download');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const updateAdvisor = (patch) => {
    setAdvisorForm(prev => ({ ...prev, ...patch }));
  };

  const runProductAdvisor = async (event) => {
    event.preventDefault();
    setAdvisorLoading(true);
    try {
      const res = await fetch('/api/product-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advisorForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to find recommendations');
      setAdvisorResults(data);
      if (data.primary?.category) setFilter(data.primary.category);
      showToast('AI product finder picked the best matches');
    } catch (err) {
      showToast(err.message || 'Unable to find recommendations');
    } finally {
      setAdvisorLoading(false);
    }
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
  const couponResult = couponCode.trim() ? applyCouponToCart(couponCode, cart, products) : { valid: false, discount: 0, message: '' };
  const discount   = couponResult.valid ? couponResult.discount : 0;
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const gst        = Math.round(taxableSubtotal * 0.18);
  const total      = taxableSubtotal + gst;
  const visibleProducts = products
    .filter((product) => {
      if (filter !== 'all' && product.category !== filter) return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [
        product.name,
        product.description,
        product.problem,
        product.outcome,
        product.audience,
        product.category,
        product.categoryLabel,
        product.format,
        formatCategory(product.category),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    })
    .sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      return 0;
    });
  const categoryCounts = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  const selectedCategory = categoryOptions.find(c => c.slug === filter) || categoryOptions[0];
  const heroProduct = products.find(product => product.slug === heroProductSlug) || products[0];
  const featuredProducts = products
    .filter(product => product.badge === 'Hot')
    .slice(0, 4);
  const starterStack = starterStackSlugs
    .map(slug => products.find(product => product.slug === slug))
    .filter(Boolean);
  const heroOfferSlides = useMemo(() => {
    const seen = new Set();
    return [heroProduct, ...starterStack, ...featuredProducts, ...products]
      .filter(product => product?.image)
      .filter(product => {
        const key = product.slug || product._id || product.image;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [heroProduct, starterStack, featuredProducts, products]);
  const activeHeroOffer = heroOfferSlides[heroSlide] || heroProduct;
  const starterTotal = starterStack.reduce((sum, product) => sum + product.price, 0);
  const starterCompare = starterStack.reduce((sum, product) => sum + (product.comparePrice || product.price), 0);
  const starterSavings = Math.max(0, starterCompare - starterTotal);

  useEffect(() => {
    setHeroSlide(0);
  }, [heroProduct?.slug]);

  useEffect(() => {
    if (heroOfferSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroSlide(current => (current + 1) % heroOfferSlides.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [heroOfferSlides.length]);

  useEffect(() => {
    if (heroOfferSlides.length && heroSlide >= heroOfferSlides.length) {
      setHeroSlide(0);
    }
  }, [heroOfferSlides.length, heroSlide]);

  const changeHeroSlide = (direction) => {
    if (heroOfferSlides.length <= 1) return;
    setHeroSlide(current => (current + direction + heroOfferSlides.length) % heroOfferSlides.length);
  };

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
          couponCode,
          referralCode: referralCode || (typeof window !== 'undefined' ? window.localStorage.getItem('pixelvault_referral_code') : ''),
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
        <meta name="description" content="Practical digital products for sales, finance, marketing, support, local business, creators, and operations." />
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

        .hero{background:#0e0f17;padding:2.1rem 1.5rem 1.2rem;position:relative;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.08)}
        .hero-grid{position:absolute;inset:0;opacity:.06;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:52px 52px}
        .hero-wrap{position:relative;z-index:1;max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.95fr);gap:24px;align-items:center}
        .hero-tag{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:var(--gold-light);font-size:.7rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-bottom:1rem}
        .hero h1{font-size:clamp(2rem,4vw,3.35rem);font-weight:650;color:#f8f6f0;line-height:1.04;margin-bottom:.75rem;max-width:680px}
        .hero h1 em{font-style:normal;color:#8fd2c6}
        .hero p{color:#b7b4c8;font-size:1rem;max-width:590px;margin:0 0 1.35rem;line-height:1.65}
        .hero-btns{display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap;margin-bottom:1.3rem}
        .hero-stats{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:8px;max-width:650px}
        .hero-stat{background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:12px;text-align:left}
        .hero-stat strong{display:block;color:#f5f2ec;font-size:1.05rem}
        .hero-stat span{display:block;color:#a4a2b8;font-size:.72rem;margin-top:3px;line-height:1.35}
        .hero-offer{background:#f8f6f0;color:var(--ink);border:1px solid rgba(255,255,255,.18);border-radius:14px;overflow:hidden;box-shadow:0 22px 70px rgba(0,0,0,.28)}
        .hero-offer-top{display:grid;grid-template-columns:minmax(250px,.95fr) minmax(0,1fr);min-height:330px}
        .hero-offer-media{background:#151722;min-height:330px;position:relative;overflow:hidden}
        .hero-offer-track{height:100%;min-height:330px;display:flex;transition:transform .65s cubic-bezier(.22,.61,.36,1);will-change:transform}
        .hero-offer-slide{position:relative;min-width:100%;height:330px;background:radial-gradient(circle at 50% 42%,rgba(232,213,168,.18),transparent 34%),#151722;display:flex;align-items:center;justify-content:center}
        .hero-offer-slide img{width:100%;height:100%;object-fit:contain;display:block;padding:14px}
        .hero-slide-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#e8d5a8;font-weight:900;font-size:2.1rem}
        .hero-slide-btn{position:absolute;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;border-radius:999px;background:rgba(13,13,20,.68);color:#fff;font-weight:900;cursor:pointer;z-index:2}
        .hero-slide-btn:hover{background:var(--teal)}
        .hero-slide-btn.prev{left:8px}.hero-slide-btn.next{right:8px}
        .hero-slide-dots{position:absolute;top:10px;right:10px;display:flex;gap:5px;background:rgba(13,13,20,.45);border-radius:999px;padding:5px;z-index:2}
        .hero-slide-dot{width:7px;height:7px;border:0;border-radius:999px;background:rgba(255,255,255,.42);padding:0;cursor:pointer}
        .hero-slide-dot.on{width:18px;background:#e8d5a8}
        .hero-offer-copy{padding:22px;display:flex;flex-direction:column;gap:10px;animation:offerFade .34s ease}
        @keyframes offerFade{from{opacity:.72;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .offer-kicker{font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--teal);font-weight:850}
        .hero-offer h2{font-size:1.28rem;line-height:1.18;margin:0;color:var(--ink)}
        .hero-offer p{font-size:.84rem;color:#625b54;margin:0;line-height:1.5}
        .offer-list{display:flex;flex-direction:column;gap:7px;margin:2px 0 0;padding:0;list-style:none}
        .offer-list li{font-size:.78rem;color:#342f2b;display:flex;gap:7px;line-height:1.35}
        .offer-list li::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--teal);margin-top:6px;flex:0 0 6px}
        .offer-price-row{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--border);padding-top:12px}
        .offer-price{font-size:1.45rem;font-weight:850;color:var(--teal)}
        .offer-actions{display:flex;gap:8px;flex-wrap:wrap}
        .btn-gold{background:var(--gold);color:var(--ink);border:none;padding:13px 26px;border-radius:8px;cursor:pointer;font-weight:700;font-size:.9rem;transition:all .2s}
        .btn-gold:hover{background:var(--gold-light);transform:translateY(-1px)}
        .btn-outline{background:none;border:1px solid rgba(255,255,255,.2);color:#f5f2ec;padding:13px 24px;border-radius:8px;cursor:pointer;font-size:.9rem;transition:all .2s}
        .btn-outline:hover{border-color:var(--gold);color:var(--gold)}

        .main{max-width:1180px;margin:0 auto;padding:2rem 1.5rem}
        .merch-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:14px;margin-bottom:1.4rem}
        .rail,.category-shop,.catalog-head{background:transparent;border:0;border-radius:0;padding:0}
        .bundle-panel{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px}
        .catalog-head{margin-bottom:1.25rem}
        .rail-head,.bundle-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
        .rail-title,.bundle-title{font-size:1rem;font-weight:800;color:var(--ink)}
        .rail-sub,.bundle-sub{font-size:.78rem;color:var(--muted);margin-top:4px;line-height:1.4}
        .rail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .mini-product{display:grid;grid-template-columns:74px 1fr;gap:10px;align-items:center;border:1px solid rgba(216,208,196,.7);border-radius:9px;padding:8px;background:#fbfaf7;cursor:pointer;text-align:left}
        .mini-product:hover{border-color:var(--teal);background:#f5fbf9}
        .mini-product img,.mini-fallback{width:74px;height:74px;object-fit:cover;border-radius:7px;background:#111;color:#f8f6f0;display:flex;align-items:center;justify-content:center;font-weight:800}
        .mini-copy strong{display:block;font-size:.82rem;line-height:1.25;color:var(--ink);margin-bottom:4px}
        .mini-copy span{display:block;font-size:.72rem;color:var(--muted);line-height:1.35}
        .mini-price{display:inline-block;margin-top:5px;font-weight:850;color:var(--teal);font-size:.86rem}
        .bundle-lines{display:flex;flex-direction:column;gap:8px;margin:13px 0}
        .bundle-line{display:flex;justify-content:space-between;gap:12px;font-size:.78rem;color:var(--text);border-bottom:1px solid rgba(216,208,196,.6);padding-bottom:8px}
        .bundle-line span:last-child{font-weight:800;color:var(--teal)}
        .bundle-total{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}
        .bundle-total small{display:block;color:var(--muted);font-size:.72rem;margin-bottom:2px}
        .bundle-total strong{font-size:1.35rem;color:var(--teal)}
        .bundle-save{font-size:.76rem;font-weight:800;color:var(--green);background:#edf8f4;border:1px solid rgba(26,122,74,.16);padding:5px 8px;border-radius:999px}
        .category-shop{margin-bottom:1.4rem}
        .category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px}
        .category-tile{background:#fbfaf7;border:1px solid rgba(216,208,196,.8);border-radius:10px;padding:13px;text-align:left;cursor:pointer;transition:all .2s;min-height:126px;display:flex;flex-direction:column;gap:8px}
        .category-tile:hover,.category-tile.on{border-color:var(--teal);background:#f0fbf8;box-shadow:0 8px 24px rgba(26,107,107,.08)}
        .category-tile strong{font-size:.94rem;color:var(--ink);line-height:1.25}
        .category-tile p{font-size:.76rem;color:var(--muted);line-height:1.45;margin:0}
        .category-count{margin-top:auto;display:inline-flex;align-self:flex-start;font-size:.7rem;color:var(--teal);font-weight:850;background:#e6f4f4;border-radius:999px;padding:4px 8px}
        .section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:10px}
        .section-lbl{font-size:1.3rem;font-weight:600;color:var(--ink)}
        .section-note{font-size:.82rem;color:var(--muted);line-height:1.5;max-width:520px}
        .store-tools{display:grid;grid-template-columns:minmax(220px,1fr) 180px;gap:10px;margin-bottom:1rem}
        .search-input,.sort-select{width:100%;border:1px solid var(--border);background:#fff;color:var(--text);border-radius:8px;padding:11px 12px;font:inherit;outline:none}
        .search-input:focus,.sort-select:focus{border-color:var(--teal)}
        .trust-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 1.4rem}
        .trust-item{background:#fff;border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:.78rem;color:var(--muted)}
        .trust-item strong{display:block;color:var(--ink);font-size:.86rem;margin-bottom:2px}
        .money-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 1.6rem}
        .money-card{border:1px solid var(--border);border-radius:10px;background:#fff;padding:15px;text-align:left;cursor:pointer;min-height:138px;display:flex;flex-direction:column;gap:8px;transition:all .18s}
        .money-card:hover{border-color:var(--teal);box-shadow:0 10px 28px rgba(26,107,107,.1);transform:translateY(-2px)}
        .money-card span{color:var(--teal);font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:850}
        .money-card strong{font-size:1.05rem;color:var(--ink)}
        .money-card p{color:var(--muted);font-size:.82rem;line-height:1.5;margin:0}
        .advisor-panel{background:#fff;border:1px solid var(--border);border-radius:12px;padding:18px;margin:0 0 1.6rem}
        .advisor-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
        .advisor-head h2{font-size:1.25rem;margin:0;color:var(--ink)}
        .advisor-head p{font-size:.84rem;color:var(--muted);line-height:1.55;max-width:620px;margin:5px 0 0}
        .advisor-chip{background:#0d0d14;color:#e8d5a8;border-radius:999px;padding:7px 10px;font-size:.72rem;font-weight:850;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        .advisor-form{display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:10px;align-items:end}
        .advisor-field label{display:block;font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:850;margin-bottom:5px}
        .advisor-field select{width:100%;border:1px solid var(--border);background:#fbfaf7;border-radius:8px;padding:10px;font:inherit;color:var(--text);outline:none}
        .advisor-field select:focus{border-color:var(--teal);background:#fff}
        .advisor-btn{border:0;background:var(--teal);color:#fff;border-radius:8px;padding:11px 15px;font-weight:850;cursor:pointer;height:41px;white-space:nowrap}
        .advisor-btn:disabled{opacity:.6;cursor:not-allowed}
        .advisor-results{display:grid;grid-template-columns:minmax(250px,.95fr) minmax(0,1fr);gap:14px;margin-top:16px;border-top:1px solid var(--border);padding-top:16px}
        .advisor-primary,.advisor-list{background:#fbfaf7;border:1px solid #e6ded3;border-radius:10px;padding:13px}
        .advisor-primary{display:grid;grid-template-columns:104px 1fr;gap:12px;align-items:start}
        .advisor-primary img,.advisor-fallback{width:104px;height:104px;border-radius:8px;background:#111;color:#e8d5a8;display:flex;align-items:center;justify-content:center;font-weight:900;object-fit:cover}
        .advisor-label{font-size:.68rem;text-transform:uppercase;letter-spacing:.07em;color:var(--teal);font-weight:850;margin-bottom:5px}
        .advisor-primary h3{font-size:1.05rem;line-height:1.25;margin:0 0 5px;color:var(--ink)}
        .advisor-primary p{font-size:.8rem;color:var(--muted);line-height:1.45;margin:0 0 8px}
        .advisor-score{margin:8px 0 9px}
        .advisor-score-row{display:flex;justify-content:space-between;gap:8px;font-size:.72rem;font-weight:850;color:var(--teal);margin-bottom:5px}
        .advisor-score-track{height:7px;background:#ebe4da;border-radius:999px;overflow:hidden}
        .advisor-score-track span{display:block;height:100%;background:var(--teal);border-radius:999px}
        .advisor-reasons{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
        .advisor-reasons span{font-size:.68rem;color:#4c4943;background:#f0ede6;border:1px solid rgba(216,208,196,.8);border-radius:999px;padding:4px 7px}
        .advisor-path{margin:8px 0 0;padding-left:16px;color:var(--text);font-size:.76rem;line-height:1.45}
        .advisor-path li{margin-bottom:3px}
        .advisor-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
        .advisor-actions a,.advisor-actions button{border:1px solid var(--border);background:#fff;color:var(--ink);border-radius:8px;padding:9px 11px;font-weight:850;font-size:.78rem;cursor:pointer}
        .advisor-actions button{background:var(--teal);color:#fff;border-color:var(--teal)}
        .advisor-list h3{font-size:.95rem;margin:0 0 9px;color:var(--ink)}
        .advisor-mini{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;border-top:1px solid rgba(216,208,196,.65);padding:9px 0}
        .advisor-mini:first-of-type{border-top:0;padding-top:0}
        .advisor-mini strong{font-size:.84rem;color:var(--ink);line-height:1.25}
        .advisor-mini span{display:block;font-size:.72rem;color:var(--muted);margin-top:3px}
        .advisor-mini a{font-size:.76rem;color:var(--teal);font-weight:850}

        .filters{display:flex;gap:7px;flex-wrap:wrap}
        .filt{background:none;border:1px solid var(--border);color:var(--muted);padding:6px 16px;border-radius:30px;cursor:pointer;font-size:.82rem;transition:all .2s}
        .filt.on{background:var(--ink);border-color:var(--ink);color:#f5f2ec}
        .filt:hover:not(.on){border-color:var(--teal);color:var(--teal)}

        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:1.25rem;margin-bottom:3rem}
        .pcard{background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:all .3s;position:relative;display:flex;flex-direction:column;min-height:100%}
        .pcard:hover{box-shadow:0 12px 40px rgba(13,13,20,.12);transform:translateY(-3px);border-color:var(--gold)}
        .pthumb{height:176px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:#111}
        .pimage{width:100%;height:100%;object-fit:cover;display:block}
        .pthumb-emoji{font-size:3.2rem;position:relative;z-index:1}
        .pbadge{position:absolute;top:10px;left:10px;font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:20px}
        .pbadge-hot{background:var(--ink);color:var(--gold)}
        .pbadge-new{background:var(--teal);color:#fff}
        .pbadge-sale{background:var(--red);color:#fff}
        .pbadge-free{background:#edf8f4;color:var(--green);border:1px solid rgba(26,122,74,.18)}
        .pbody{padding:1.1rem;display:flex;flex-direction:column;flex:1}
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
        .project-strip{font-size:.72rem;color:#4c3f18;background:#fff6d8;border:1px solid rgba(200,169,110,.25);border-radius:7px;padding:7px 8px;margin-bottom:10px;line-height:1.35}
        .project-strip strong{color:#8a6d3e}
        .value-preview{border-left:3px solid var(--teal);padding:7px 0 7px 9px;margin-bottom:10px;font-size:.72rem;color:#4c4943;line-height:1.38;background:#fbfaf7}
        .value-preview strong,.ai-prompt-strip strong{color:var(--ink)}
        .ai-prompt-strip{font-size:.7rem;color:#5f5570;background:#f5f0fb;border:1px solid rgba(95,85,112,.12);border-radius:7px;padding:7px 8px;margin-bottom:10px;line-height:1.35}
        .delivery-row{display:flex;gap:6px;flex-wrap:wrap;margin:auto 0 12px}
        .delivery-chip{font-size:.66rem;font-weight:800;color:#4c4943;background:#f0ede6;border:1px solid rgba(216,208,196,.8);border-radius:999px;padding:4px 7px}
        .pfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid rgba(216,208,196,.65);padding-top:12px;margin-top:auto}
        .pprice{display:flex;flex-direction:column}
        .porig{font-size:.75rem;color:var(--muted);text-decoration:line-through}
        .pfinal{font-size:1.2rem;font-weight:700;color:var(--teal)}
        .pdiscount{font-size:.7rem;font-weight:600;color:var(--teal);background:rgba(26,107,107,.1);padding:2px 7px;border-radius:4px;margin-top:3px;display:inline-block}
        .pactions{display:flex;align-items:center;gap:7px}
        .view-btn{background:#fff;border:1px solid var(--border);color:var(--ink);height:36px;border-radius:9px;padding:0 11px;cursor:pointer;font-weight:700;font-size:.78rem;display:inline-flex;align-items:center;justify-content:center}
        .view-btn:hover{border-color:var(--teal);color:var(--teal)}
        .padd-btn{background:var(--teal);border:none;color:#fff;height:36px;border-radius:9px;cursor:pointer;font-size:.78rem;font-weight:850;padding:0 12px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;white-space:nowrap}
        .padd-btn:hover{background:var(--teal-dark);transform:translateY(-1px)}

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
        .c-img{width:50px;height:50px;border-radius:9px;object-fit:cover;display:block;flex-shrink:0;background:#111}
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
        .lead-note{background:#edf8f4;border:1px solid rgba(26,107,107,.16);border-radius:9px;padding:11px 12px;color:#0f4444;font-size:.82rem;line-height:1.5;margin-bottom:1rem}
        .detail-grid{display:grid;grid-template-columns:130px 1fr;gap:16px}
        .detail-thumb{height:130px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;color:var(--ink);overflow:hidden;background:#111}
        .detail-image{width:100%;height:100%;object-fit:cover;display:block}
        .detail-copy h2{margin:0 0 7px;font-size:1.35rem}
        .detail-copy p{color:var(--muted);font-size:.88rem;line-height:1.55;margin:0 0 10px}
        .detail-section-title{font-size:.72rem;text-transform:uppercase;letter-spacing:.07em;color:var(--teal);font-weight:850;margin:14px 0 4px}
        .detail-list{margin:10px 0 16px;padding-left:18px;color:var(--text);font-size:.84rem;line-height:1.55}
        .detail-price{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--cream);border:1px solid var(--border);border-radius:10px;padding:12px;margin-top:12px}
        .detail-price strong{color:var(--teal);font-size:1.35rem}
        .detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .detail-actions a{border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-weight:800;font-size:.82rem;color:var(--teal);background:#fff}
        .coupon-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin:0 0 1rem}
        .coupon-row input{background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-family:inherit}
        .coupon-row button{border:none;background:var(--ink);color:var(--gold-light);border-radius:8px;padding:10px 12px;font-weight:800;cursor:pointer}
        .coupon-msg{font-size:.78rem;margin:-.5rem 0 1rem;color:var(--muted)}
        .coupon-msg.ok{color:var(--green)}
        .verified-review{font-size:.72rem;color:var(--teal-dark);background:#edf8f4;border:1px solid rgba(26,107,107,.12);border-radius:7px;padding:7px 8px;margin-bottom:10px}

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
          .hero-wrap,.hero-stats,.hero-offer-top,.trust-row,.money-row,.advisor-form,.advisor-results,.advisor-primary,.store-tools,.merch-grid,.rail-grid,.detail-grid{grid-template-columns:1fr}
          .hero{padding:2rem 1rem 1.2rem}
          .hero h1{font-size:2.1rem}
          .advisor-head{flex-direction:column}
          .hero-offer-media,.hero-offer-track{height:260px;min-height:260px}
          .hero-offer-slide{height:260px}
          .main{padding:1.2rem 1rem}
          .category-grid{grid-template-columns:1fr}
          .pgrid{grid-template-columns:1fr}
          .pfoot{align-items:flex-start;flex-direction:column}
          .pactions{width:100%}
          .view-btn,.padd-btn{flex:1}
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="logo"><em>Pixel</em>Vault ✦</div>
        <div className="nav-right">
          <button className={`nav-btn ${tab==='store'?'on':''}`} onClick={() => setTab('store')}>Store</button>
          <Link className="auth-link" href="/bundles">Bundles</Link>
          <Link className="auth-link" href="/blog">Guides</Link>
          <Link className="auth-link" href="/sell">Sell</Link>
          {user && <Link className="auth-link" href="/dashboard">My Dashboard</Link>}
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
          <section className="hero">
            <div className="hero-grid" />
            <div className="hero-wrap">
              <div>
                  <div className="hero-tag">AI courses / Low-price singles / High-value bundles</div>
                  <h1>Digital products students, creators, and freelancers can use <em>today</em>.</h1>
                  <p>PixelVault now sells complete AI courses, affordable single products for quick buying, and higher-value bundles that join 3-4 products for career, projects, AI, stock-market learning, code templates, and creator workflows.</p>
                <div className="hero-btns">
                  <button className="btn-gold" onClick={() => document.getElementById('advisor')?.scrollIntoView({ behavior: 'smooth' })}>Find my product</button>
                  <button className="btn-gold" onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}>Shop products</button>
                  <button className="btn-outline" onClick={() => document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })}>Featured picks</button>
                  {user && <Link className="btn-outline" href="/dashboard">My dashboard</Link>}
                </div>
                <div className="hero-stats">
                  <div className="hero-stat"><strong>{products.length || '36'}+</strong><span>problem-solving products</span></div>
                  <div className="hero-stat"><strong>{productCategories.length} categories</strong><span>singles, bundles, projects, stock market</span></div>
                  <div className="hero-stat"><strong>Secure checkout</strong><span>Razorpay UPI, cards, wallets</span></div>
                </div>
              </div>

              {activeHeroOffer && (
                <aside className="hero-offer">
                  <div className="hero-offer-top">
                    <div className="hero-offer-media">
                      <div className="hero-offer-track" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
                        {(heroOfferSlides.length ? heroOfferSlides : [heroProduct]).map((slide, index) => (
                          <div className="hero-offer-slide" key={`${slide.slug || slide._id || slide.name}-${index}`}>
                            {slide.image ? (
                              <img src={slide.image} alt={`${slide.name} product cover`} />
                            ) : (
                              <div className="hero-slide-fallback">{slide.emoji || 'PV'}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      {heroOfferSlides.length > 1 && (
                        <>
                          <button className="hero-slide-btn prev" type="button" aria-label="Previous featured product" onClick={() => changeHeroSlide(-1)}>&lt;</button>
                          <button className="hero-slide-btn next" type="button" aria-label="Next featured product" onClick={() => changeHeroSlide(1)}>&gt;</button>
                          <div className="hero-slide-dots" aria-label="Featured product slides">
                            {heroOfferSlides.map((slide, index) => (
                              <button
                                key={`${slide.slug || slide._id || slide.name}-dot-${index}`}
                                className={`hero-slide-dot ${heroSlide === index ? 'on' : ''}`}
                                type="button"
                                aria-label={`Show ${slide.name}`}
                                onClick={() => setHeroSlide(index)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="hero-offer-copy" key={activeHeroOffer.slug || activeHeroOffer._id || activeHeroOffer.name}>
                      <div className="offer-kicker">{activeHeroOffer.categoryLabel || formatCategory(activeHeroOffer.category) || 'Featured digital product'}</div>
                      <h2>{activeHeroOffer.name}</h2>
                      <p>{activeHeroOffer.description}</p>
                      {(activeHeroOffer.features || []).length > 0 && (
                        <ul className="offer-list">
                          {(activeHeroOffer.features || []).slice(0, 3).map(feature => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      )}
                      <div className="offer-price-row">
                        <div>
                          {activeHeroOffer.comparePrice && <span className="porig">{formatPrice(activeHeroOffer.comparePrice)}</span>}
                          <div className="offer-price">{formatProductPrice(activeHeroOffer)}</div>
                        </div>
                        <div className="offer-actions">
                          <Link className="view-btn" href={`/products/${activeHeroOffer.slug}`}>Details</Link>
                          <button className="padd-btn" onClick={() => isFreeProduct(activeHeroOffer) ? downloadFreeProduct(activeHeroOffer) : addToCart(activeHeroOffer)}>
                            {isFreeProduct(activeHeroOffer) ? 'Download free' : 'Add to cart'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </section>

          <main className="main" id="shop">
            <div className="trust-row">
              <div className="trust-item"><strong>Instant access</strong>Downloads after payment, plus free student packs.</div>
              <div className="trust-item"><strong>Real workflows</strong>Built around actual business problems.</div>
              <div className="trust-item"><strong>Editable assets</strong>Copy, customize, and launch quickly.</div>
              <div className="trust-item"><strong>Secure payments</strong>UPI, cards, wallets, and Razorpay checkout.</div>
            </div>
            <div className="money-row">
              <Link className="money-card" href="/bundles">
                <span>Higher order value</span>
                <strong>Bundle landing pages</strong>
                <p>Sell 3-4 joined products together, show savings, and push buyers toward bigger purchases.</p>
              </Link>
              <button className="money-card" onClick={() => setFilter('free-project-ideas')}>
                <span>Email list growth</span>
                <strong>Free lead magnets</strong>
                <p>Offer project ideas and starter guides free after email capture, then sell paid bundles.</p>
              </button>
              <Link className="money-card" href={user ? '/dashboard#referrals' : '/signup'}>
                <span>Referral sales</span>
                <strong>Let users promote</strong>
                <p>Logged-in users get a referral link and can earn commission for real paid conversions.</p>
              </Link>
            </div>

            <section className="advisor-panel" id="advisor">
              <div className="advisor-head">
                <div>
                  <div className="section-lbl">AI Product Finder</div>
                  <p>Answer four quick questions and get a focused recommendation for the course, bundle, or single product that fits your need.</p>
                </div>
                <span className="advisor-chip">Smart buyer guide</span>
              </div>
              <form className="advisor-form" onSubmit={runProductAdvisor}>
                <div className="advisor-field">
                  <label>Who are you?</label>
                  <select value={advisorForm.audience} onChange={e => updateAdvisor({ audience: e.target.value })}>
                    <option value="student">College student</option>
                    <option value="fresher">Fresher / job seeker</option>
                    <option value="developer">Developer</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="creator">Creator</option>
                    <option value="business">Business owner</option>
                    <option value="investor">Market learner</option>
                  </select>
                </div>
                <div className="advisor-field">
                  <label>Main goal</label>
                  <select value={advisorForm.goal} onChange={e => updateAdvisor({ goal: e.target.value })}>
                    <option value="placement">Get job / placement ready</option>
                    <option value="final_year_project">Final-year project help</option>
                    <option value="ai_mastery">Master AI tools</option>
                    <option value="stock_market">Learn stock market</option>
                    <option value="freelance">Start freelancing</option>
                    <option value="creator_business">Sell digital products</option>
                    <option value="coding_templates">Build code/templates</option>
                    <option value="business_growth">Improve business growth</option>
                  </select>
                </div>
                <div className="advisor-field">
                  <label>Budget</label>
                  <select value={advisorForm.budget} onChange={e => updateAdvisor({ budget: e.target.value })}>
                    <option value="free">Free starter</option>
                    <option value="under199">Under Rs. 199</option>
                    <option value="under499">Under Rs. 499</option>
                    <option value="bundle">Best bundle value</option>
                    <option value="premium">Premium course/system</option>
                  </select>
                </div>
                <div className="advisor-field">
                  <label>Product type</label>
                  <select value={advisorForm.format} onChange={e => updateAdvisor({ format: e.target.value })}>
                    <option value="any">Any format</option>
                    <option value="course">Course</option>
                    <option value="template">Template / kit</option>
                    <option value="source_code">Source code</option>
                    <option value="guide">Guide / notes</option>
                  </select>
                </div>
                <button className="advisor-btn" disabled={advisorLoading}>{advisorLoading ? 'Finding...' : 'Recommend'}</button>
              </form>

              {advisorResults?.primary && (
                <div className="advisor-results">
                  <article className="advisor-primary">
                    {advisorResults.primary.image ? (
                      <img src={advisorResults.primary.image} alt={`${advisorResults.primary.name} cover`} />
                    ) : (
                      <div className="advisor-fallback">{advisorResults.primary.emoji || 'PV'}</div>
                    )}
                    <div>
                      <div className="advisor-label">Best match: {advisorResults.profile}</div>
                      <h3>{advisorResults.primary.name}</h3>
                      <p>{advisorResults.primary.outcome || advisorResults.primary.description}</p>
                      <div className="advisor-score">
                        <div className="advisor-score-row">
                          <span>AI fit score</span>
                          <span>{Math.min(100, Math.max(0, Math.round(advisorResults.primary.advisorScore || 0)))}/100</span>
                        </div>
                        <div className="advisor-score-track">
                          <span style={{ width: `${Math.min(100, Math.max(0, Math.round(advisorResults.primary.advisorScore || 0)))}%` }} />
                        </div>
                      </div>
                      <div className="advisor-reasons">
                        {(advisorResults.primary.advisorReasons || []).map(reason => <span key={reason}>{reason}</span>)}
                      </div>
                      {Array.isArray(advisorResults.primary.quickStartPreview) && advisorResults.primary.quickStartPreview.length > 0 && (
                        <ul className="advisor-path">
                          {advisorResults.primary.quickStartPreview.map(item => <li key={item}>{item}</li>)}
                        </ul>
                      )}
                      <strong className="pfinal">{formatProductPrice(advisorResults.primary)}</strong>
                      <div className="advisor-actions">
                        <Link href={`/products/${advisorResults.primary.slug}`}>Details</Link>
                        <button type="button" onClick={() => isFreeProduct(advisorResults.primary) ? downloadFreeProduct(advisorResults.primary) : addToCart(advisorResults.primary)}>
                          {isFreeProduct(advisorResults.primary) ? 'Get free' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </article>

                  <aside className="advisor-list">
                    <h3>Other good matches</h3>
                    {(advisorResults.recommendations || []).slice(1, 5).map(product => (
                      <div className="advisor-mini" key={product.slug}>
                        <div>
                          <strong>{product.name}</strong>
                          <span>{formatProductPrice(product)} / {(product.advisorReasons || [])[0]}</span>
                        </div>
                        <Link href={`/products/${product.slug}`}>View</Link>
                      </div>
                    ))}
                    {advisorResults.bundlePick && advisorResults.bundlePick.slug !== advisorResults.primary.slug && (
                      <div className="advisor-mini">
                        <div>
                          <strong>Bundle option: {advisorResults.bundlePick.name}</strong>
                          <span>{formatProductPrice(advisorResults.bundlePick)} / higher value pack</span>
                        </div>
                        <Link href={`/bundles/${advisorResults.bundlePick.slug}`}>Bundle</Link>
                      </div>
                    )}
                  </aside>
                </div>
              )}
            </section>

            {!loading && products.length > 0 && (
              <>
                <div className="merch-grid" id="featured-products">
                  <section className="rail">
                    <div className="rail-head">
                      <div>
                        <div className="rail-title">Featured products for quick wins</div>
                        <div className="rail-sub">Start with products that solve urgent money, launch, and customer problems.</div>
                      </div>
                      <button className="filt" onClick={() => { setFilter('all'); setSort('featured'); }}>Featured</button>
                    </div>
                    <div className="rail-grid">
                      {(featuredProducts.length ? featuredProducts : products.slice(0, 4)).map(product => (
                        <button key={product._id || product.slug} className="mini-product" onClick={() => setSelectedProduct(product)}>
                          {product.image ? (
                            <img src={product.image} alt={`${product.name} product cover`} loading="lazy" />
                          ) : (
                            <div className="mini-fallback">{product.emoji || 'PV'}</div>
                          )}
                          <span className="mini-copy">
                            <strong>{product.name}</strong>
                            <span>{product.outcome || product.description}</span>
                            <span className="mini-price">{formatProductPrice(product)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {starterStack.length > 0 && (
                    <aside className="bundle-panel">
                      <div className="bundle-head">
                        <div>
                          <div className="bundle-title">Career starter stack</div>
                          <div className="bundle-sub">A focused bundle for freshers who need resume, LinkedIn, and interview prep assets.</div>
                        </div>
                      </div>
                      <div className="bundle-lines">
                        {starterStack.map(product => (
                          <div key={product._id || product.slug} className="bundle-line">
                            <span>{product.name}</span>
                            <span>{formatProductPrice(product)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bundle-total">
                        <div>
                          <small>Total stack value</small>
                          <strong>{formatPrice(starterTotal)}</strong>
                        </div>
                        {starterSavings > 0 && <span className="bundle-save">Save {formatPrice(starterSavings)}</span>}
                      </div>
                      <button className="confirm-btn" onClick={() => { addManyToCart(starterStack); setCartOpen(true); }}>Add full stack</button>
                    </aside>
                  )}
                </div>

                <section className="category-shop">
                  <div className="section-hd">
                    <div>
                      <div className="section-lbl">Shop by business problem</div>
                      <div className="section-note">Choose the category that matches what the buyer needs to fix first.</div>
                    </div>
                    <button className={`filt ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>View all</button>
                  </div>
                  <div className="category-grid">
                    {categoryOptions.filter(c => c.slug !== 'all').map(category => (
                      <button
                        key={category.slug}
                        className={`category-tile ${filter === category.slug ? 'on' : ''}`}
                        onClick={() => setFilter(category.slug)}
                      >
                        <strong>{category.label}</strong>
                        <p>{categorySummaries[category.slug] || 'Curated digital products for this workflow.'}</p>
                        <span className="category-count">{categoryCounts[category.slug] || 0} products</span>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            <section className="catalog-head">
              <div className="section-hd">
                <div>
                  <div className="section-lbl">{filter === 'all' ? 'All digital products' : selectedCategory.label}</div>
                  <div className="section-note">{filter === 'all' ? 'Browse AI courses, low-price singles, high-value bundles, free project ideas, stock-market education, source code, AI packs, and design assets.' : categorySummaries[filter]}</div>
                </div>
                <div className="filters">
                  {categoryOptions.map(c => (
                    <button key={c.slug} className={`filt ${filter === c.slug ? 'on' : ''}`} onClick={() => setFilter(c.slug)}>{c.label}</button>
                  ))}
                </div>
              </div>
              <div className="store-tools">
                <input
                  className="search-input"
                  placeholder="Search Claude, AI course, trading, project ideas, resume..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>
            </section>

            {loading ? (
              <div className="spinner">Loading products...</div>
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
                    <div key={p._id || p.slug} className="pcard">
                      {p.badge && (
                        <div className={`pbadge pbadge-${p.badge.toLowerCase() === 'hot' ? 'hot' : p.badge.toLowerCase() === 'new' ? 'new' : p.badge.toLowerCase() === 'free' ? 'free' : 'sale'}`}>
                          {p.badge}
                        </div>
                      )}
                      <div className="pthumb" style={{ background: bg }}>
                        {p.image ? (
                          <img className="pimage" src={p.image} alt={`${p.name} product cover`} loading="lazy" />
                        ) : (
                          <div className="pthumb-emoji">{p.emoji || 'PK'}</div>
                        )}
                      </div>
                      <div className="pbody">
                        <div className="pcat">{productMeta(p)}</div>
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
                        {Array.isArray(p.valuePreview) && p.valuePreview.length > 0 && (
                          <div className="value-preview"><strong>Value:</strong> {p.valuePreview[0]}</div>
                        )}
                        {Array.isArray(p.features) && p.features.length > 0 && (
                          <ul className="pfeatures">
                            {p.features.slice(0, 3).map(feature => (
                              <li key={feature} className="pfeat">{feature}</li>
                            ))}
                          </ul>
                        )}
                        {Array.isArray(p.realWorldProjects) && p.realWorldProjects.length > 0 && (
                          <div className="project-strip">
                            <strong>Projects:</strong> {p.realWorldProjects.slice(0, 2).join(' / ')}
                          </div>
                        )}
                        {p.aiPromptPreview && (
                          <div className="ai-prompt-strip"><strong>AI use:</strong> {p.aiPromptPreview}</div>
                        )}
                        {p.verifiedReviewCount > 0 && (
                          <div className="verified-review">
                            {p.verifiedRatingAverage}/5 from {p.verifiedReviewCount} verified purchase reviews
                          </div>
                        )}
                        <div className="delivery-row">
                          <span className="delivery-chip">{isFreeProduct(p) ? 'Free download' : 'Instant download'}</span>
                          <span className="delivery-chip">Editable</span>
                          <span className="delivery-chip">Commercial use</span>
                        </div>
                        <div className="pfoot">
                          <div className="pprice">
                            {p.comparePrice && <span className="porig">{formatPrice(p.comparePrice)}</span>}
                            <span className="pfinal">{formatProductPrice(p)}</span>
                            {disc > 0 && <span className="pdiscount">Save {disc}%</span>}
                          </div>
                          <div className="pactions">
                            <Link className="view-btn" href={`/products/${p.slug}`}>Details</Link>
                            <button className="padd-btn" onClick={() => isFreeProduct(p) ? downloadFreeProduct(p) : addToCart(p)}>
                              {isFreeProduct(p) ? 'Get free' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
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
                  {i.image ? (
                    <img className="c-img" src={i.image} alt="" />
                  ) : (
                    <div className="c-ico" style={{ background: colorMap[i.color] || colorMap.teal }}>{i.emoji || 'PK'}</div>
                  )}
                  <div className="c-info">
                    <div className="c-name">{i.name}</div>
                    <div className="c-price">{formatPrice(i.price)}</div>
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
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="ctr"><span style={{ color: 'var(--muted)' }}>Discount</span><span style={{ color: 'var(--green)' }}>-{formatPrice(discount)}</span></div>}
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>GST (18%)</span><span>{formatPrice(gst)}</span></div>
                <div className="ctr"><span style={{ color: 'var(--muted)' }}>Shipping</span><span style={{ color: 'var(--green)' }}>FREE</span></div>
                <div className="ctr big"><span>Total</span><span style={{ color: 'var(--teal)' }}>{formatPrice(total)}</span></div>
                <button className="c-pay-btn" onClick={() => setPayModal(true)}>💳 Checkout — {formatPrice(total)}</button>
              </div>
            )}
          </div>
        </>
      )}

      {leadProduct && (
        <div className="m-ov">
          <div className="m-box">
            <div className="m-head">
              <h3>Unlock Free Download</h3>
              <button className="m-close" onClick={() => setLeadProduct(null)}>×</button>
            </div>
            <form className="m-body" onSubmit={unlockFreeDownload}>
              <div className="lead-note">
                <strong>{leadProduct.name}</strong><br />
                Enter your email to get the free file. We use this to send useful product updates and bundle offers.
              </div>
              <div className="fg">
                <label className="fl">Name</label>
                <input className="fi" placeholder="Your name" value={leadForm.name} onChange={e => setLeadForm(form => ({ ...form, name: e.target.value }))} />
              </div>
              <div className="fg">
                <label className="fl">Email *</label>
                <input className="fi" type="email" required placeholder="you@email.com" value={leadForm.email} onChange={e => setLeadForm(form => ({ ...form, email: e.target.value }))} />
              </div>
              <div className="fg">
                <label className="fl">Phone optional</label>
                <input className="fi" placeholder="+91 9876543210" value={leadForm.phone} onChange={e => setLeadForm(form => ({ ...form, phone: e.target.value }))} />
              </div>
              <button className="confirm-btn" type="submit" disabled={leadSubmitting}>
                {leadSubmitting ? 'Unlocking...' : 'Unlock free download'}
              </button>
              <div className="secure-note">No physical shipping. Your download starts instantly after unlock.</div>
            </form>
          </div>
        </div>
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
                  <div key={i._id} className="os-row"><span>{i.name} ×{i.qty}</span><span>{formatPrice(i.price * i.qty)}</span></div>
                ))}
                {discount > 0 && <div className="os-row"><span>Discount ({couponResult.code})</span><span>-{formatPrice(discount)}</span></div>}
                <div className="os-row"><span>GST (18%)</span><span>{formatPrice(gst)}</span></div>
                <div className="os-row total"><span>Total</span><span>{formatPrice(total)}</span></div>
              </div>
              <div className="coupon-row">
                <input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <button type="button" onClick={() => showToast(couponResult.message || 'Try PIXEL10, STUDENT15, or BUNDLE20')}>Apply</button>
              </div>
              {couponCode.trim() && (
                <div className={`coupon-msg ${couponResult.valid ? 'ok' : ''}`}>{couponResult.message}</div>
              )}
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
                {paying ? '⏳ Opening Razorpay…' : `🔒 Pay ${formatPrice(total)} via Razorpay`}
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
                  {selectedProduct.image ? (
                    <img className="detail-image" src={selectedProduct.image} alt={`${selectedProduct.name} product cover`} />
                  ) : (
                    selectedProduct.emoji || 'PK'
                  )}
                </div>
                <div className="detail-copy">
                  <div className="pcat">{productMeta(selectedProduct)}</div>
                  <h2>{selectedProduct.name}</h2>
                  {selectedProduct.audience && <div className="paudience">For {selectedProduct.audience}</div>}
                  <p>{selectedProduct.longDesc || selectedProduct.description}</p>
                  {selectedProduct.problem && <div className="psolve"><div className="psolve-k">Problem</div><div className="psolve-v">{selectedProduct.problem}</div></div>}
                  {selectedProduct.outcome && <div className="poutcome"><strong>Outcome:</strong> {selectedProduct.outcome}</div>}
                  {Array.isArray(selectedProduct.valuePreview) && selectedProduct.valuePreview.length > 0 && (
                    <div className="value-preview"><strong>Value:</strong> {selectedProduct.valuePreview[0]}</div>
                  )}
                </div>
              </div>
              <div className="detail-actions">
                <Link href={`/products/${selectedProduct.slug}`}>Open full product page</Link>
                <a href={`/api/sample-download?slug=${encodeURIComponent(selectedProduct.slug)}`}>Download free sample</a>
              </div>
              {Array.isArray(selectedProduct.features) && (
                <>
                  <div className="detail-section-title">What is included</div>
                <ul className="detail-list">
                  {selectedProduct.features.map(feature => <li key={feature}>{feature}</li>)}
                </ul>
                </>
              )}
              {Array.isArray(selectedProduct.fileList) && selectedProduct.fileList.length > 0 && (
                <>
                  <div className="detail-section-title">Files included</div>
                  <ul className="detail-list">
                  {selectedProduct.fileList.map(file => <li key={file}>{file}</li>)}
                  </ul>
                </>
              )}
              {Array.isArray(selectedProduct.quickStartPreview) && selectedProduct.quickStartPreview.length > 0 && (
                <>
                  <div className="detail-section-title">Quick-start plan</div>
                  <ul className="detail-list">
                    {selectedProduct.quickStartPreview.map(step => <li key={step}>{step}</li>)}
                  </ul>
                </>
              )}
              {selectedProduct.aiPromptPreview && (
                <>
                  <div className="detail-section-title">AI prompt starter</div>
                  <div className="ai-prompt-strip">{selectedProduct.aiPromptPreview}</div>
                </>
              )}
              {Array.isArray(selectedProduct.curriculum) && selectedProduct.curriculum.length > 0 && (
                <>
                  <div className="detail-section-title">Course curriculum</div>
                  <ul className="detail-list">
                    {selectedProduct.curriculum.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </>
              )}
              {Array.isArray(selectedProduct.realWorldProjects) && selectedProduct.realWorldProjects.length > 0 && (
                <>
                  <div className="detail-section-title">Real-world projects</div>
                  <ul className="detail-list">
                    {selectedProduct.realWorldProjects.map(project => <li key={project}>{project}</li>)}
                  </ul>
                </>
              )}
              <div className="detail-price">
                <div>
                  <strong>{formatProductPrice(selectedProduct)}</strong>
                  {selectedProduct.comparePrice && <span className="porig" style={{ marginLeft: 8 }}>{formatPrice(selectedProduct.comparePrice)}</span>}
                </div>
                <button className="confirm-btn" style={{ width: 'auto', padding: '12px 18px' }} onClick={() => {
                  if (isFreeProduct(selectedProduct)) {
                    downloadFreeProduct(selectedProduct);
                    setSelectedProduct(null);
                    return;
                  }
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                  setCartOpen(true);
                }}>
                  {isFreeProduct(selectedProduct) ? 'Download free' : 'Add to cart'}
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
          { label: 'Total Revenue', val: formatPrice(revenue), color: 'var(--teal)' },
          { label: 'Paid Orders', val: count, color: 'var(--ink)' },
          { label: 'Avg Order Value', val: formatPrice(aov), color: 'var(--gold-dark)' },
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
                  <td style={{ padding: '11px 14px', fontSize: '.85rem', fontWeight: 700, color: 'var(--teal)', borderBottom: '1px solid rgba(216,208,196,.4)' }}>{formatPrice(o.total)}</td>
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
