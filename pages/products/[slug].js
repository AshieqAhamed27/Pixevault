import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { connectDB } from '../../lib/mongoose';
import { Product, Review } from '../../lib/models';
import { getPublicStarterProducts, productCategoryLabels } from '../../lib/starter-products.mjs';
import { getProductValueContent } from '../../lib/product-intelligence.mjs';

function isMissing(value) {
  return !value || /xxxxx|your_|replace|example/i.test(value);
}

function money(value, freeLabel = false) {
  const numeric = Number(value || 0);
  if (freeLabel && numeric <= 0) return 'Free';
  return `Rs. ${numeric.toLocaleString('en-IN')}`;
}

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

function categoryName(product) {
  return product.categoryLabel || productCategoryLabels[product.category] || product.category;
}

function defaultCoachGoal(product) {
  if (product.category === 'ai-courses') return 'learn_skill';
  if (product.category === 'startup-ideas') return 'validate_startup';
  if (product.category === 'hackathons') return 'win_hackathon';
  return 'buy_first_product';
}

function buildProductGallery(product, starterProducts, related) {
  const companionCategories = {
    'ai-courses': ['ai-automation', 'career-placement', 'creator-products'],
    'student-projects': ['free-project-ideas', 'career-placement'],
    'career-placement': ['student-projects', 'code-templates'],
    'startup-ideas': ['hackathons', 'creator-products', 'ai-automation'],
    'hackathons': ['startup-ideas', 'student-projects', 'code-templates'],
    'stock-market-investing': ['product-bundles'],
    'creator-products': ['marketing-content', 'design-assets', 'ai-automation'],
    'client-services': ['business-documents', 'finance-compliance'],
  };

  const companionSet = new Set([product.category, ...(companionCategories[product.category] || [])]);
  const includedProducts = Array.isArray(product.includedProducts)
    ? product.includedProducts
        .map((slug) => starterProducts.find((item) => item.slug === slug))
        .filter(Boolean)
    : [];
  const companionProducts = starterProducts
    .filter((item) => item.slug !== product.slug && companionSet.has(item.category))
    .slice(0, 6);

  const seen = new Set();
  return [product, ...includedProducts, ...related, ...companionProducts, ...starterProducts]
    .filter((item) => item?.image)
    .filter((item) => {
      const key = `${item.slug}-${item.image}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6)
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      image: item.image,
      emoji: item.emoji,
      categoryLabel: item.categoryLabel || productCategoryLabels[item.category] || item.category,
    }));
}

export async function getServerSideProps({ params }) {
  const slug = params?.slug;
  const starterProducts = getPublicStarterProducts('all');
  let product = starterProducts.find((item) => item.slug === slug) || null;
  let reviews = [];

  if (!isMissing(process.env.MONGODB_URI)) {
    try {
      await connectDB();
      const dbProduct = await Product.findOne({ slug, active: true }).lean();
      if (dbProduct) product = dbProduct;

      reviews = await Review.find({
        productSlug: slug,
        verified: true,
        status: 'approved',
      }).sort({ createdAt: -1 }).limit(12).lean();
    } catch (err) {
      console.error('Product page data failed:', err.message);
    }
  }

  if (!product) return { notFound: true };

  const related = starterProducts
    .filter((item) => item.slug !== product.slug && item.category === product.category)
    .slice(0, 4);
  const gallery = buildProductGallery(product, starterProducts, related);

  const average = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0;

  return {
    props: {
      product: serialize(product),
      related: serialize(related),
      gallery: serialize(gallery),
      valueContent: serialize(getProductValueContent(product)),
      reviewSummary: serialize({ average, count: reviews.length, reviews }),
    },
  };
}

export default function ProductPage({ product, related, gallery, valueContent, reviewSummary }) {
  const isFree = Number(product.price || 0) <= 0;
  const productUrl = `https://pixevault.vercel.app/products/${product.slug}`;
  const title = `${product.name} | PixelVault`;
  const description = product.longDesc || product.description;
  const heroSlides = useMemo(() => (
    Array.isArray(gallery) && gallery.length > 0
      ? gallery
      : [{ slug: product.slug, name: product.name, image: product.image, emoji: product.emoji, categoryLabel: categoryName(product) }]
  ), [gallery, product]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [coachForm, setCoachForm] = useState({
    audience: 'student',
    goal: defaultCoachGoal(product),
    stage: 'beginner',
    budget: isFree ? 'free' : product.bundle ? 'bundle' : 'low',
  });
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState(null);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref');
    const cleanRef = String(urlRef || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 18);
    if (cleanRef) {
      window.localStorage.setItem('pixelvault_referral_code', cleanRef);
      setReferralCode(cleanRef);
    } else {
      setReferralCode(window.localStorage.getItem('pixelvault_referral_code') || '');
    }

    setLeadForm((form) => ({
      ...form,
      name: form.name || window.localStorage.getItem('pixelvault_lead_name') || '',
      email: form.email || window.localStorage.getItem('pixelvault_lead_email') || '',
    }));
  }, []);

  function moveSlide(direction) {
    setActiveSlide((current) => (
      (current + direction + heroSlides.length) % heroSlides.length
    ));
  }

  async function unlockFreeDownload(event) {
    event.preventDefault();
    setLeadMessage('');
    if (!leadForm.email.trim()) {
      setLeadMessage('Email is required to unlock the free download.');
      return;
    }

    setLeadSubmitting(true);
    try {
      const res = await fetch('/api/lead-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: product.slug,
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          referralCode,
          source: 'product-page',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to unlock download');

      window.localStorage.setItem('pixelvault_lead_email', leadForm.email.trim());
      window.localStorage.setItem('pixelvault_lead_name', leadForm.name.trim());
      window.location.href = data.downloadUrl;
      setLeadOpen(false);
    } catch (err) {
      setLeadMessage(err.message || 'Unable to unlock free download right now.');
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function runProductCoach(event) {
    event.preventDefault();
    setCoachLoading(true);
    setCoachResult(null);

    try {
      const res = await fetch('/api/product-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: product.slug, ...coachForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to score this product');
      setCoachResult(data.coach);
    } catch (err) {
      setCoachResult({
        fitScore: 0,
        verdict: err.message || 'Unable to score this product right now',
        reasons: ['Try again after a moment.'],
        recommendedPath: [],
        quickStartPlan: [],
        aiPrompts: [],
      });
    } finally {
      setCoachLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={productUrl} />
        <link rel="canonical" href={productUrl} />
      </Head>

      <main className="product-page">
        <nav className="topnav">
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <div>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/sell">Sell</Link>
          </div>
        </nav>

        <section className="hero">
          <div className="media">
            <div className="slider-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {heroSlides.map((slide, index) => (
                <div className="slide" key={`${slide.slug}-${index}`}>
                  {slide.image ? (
                    <img src={slide.image} alt={`${slide.name} product cover`} />
                  ) : (
                    <strong className="slide-fallback">{slide.emoji || 'PV'}</strong>
                  )}
                  <div className="slide-caption">
                    <span>{index === 0 ? 'Main product' : slide.categoryLabel}</span>
                    <strong>{slide.name}</strong>
                  </div>
                </div>
              ))}
            </div>
            {heroSlides.length > 1 && (
              <>
                <button className="slide-btn prev" type="button" aria-label="Previous image" onClick={() => moveSlide(-1)}>&lt;</button>
                <button className="slide-btn next" type="button" aria-label="Next image" onClick={() => moveSlide(1)}>&gt;</button>
                <div className="slide-dots" aria-label="Product image slides">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={`${slide.slug}-dot-${index}`}
                      className={`slide-dot ${activeSlide === index ? 'on' : ''}`}
                      type="button"
                      aria-label={`Show image ${index + 1}`}
                      onClick={() => setActiveSlide(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="copy">
            <Link href="/" className="crumb">Store / {categoryName(product)}</Link>
            <h1>{product.name}</h1>
            <p>{description}</p>
            {product.audience && <span className="audience">For {product.audience}</span>}
            <div className="price-row">
              <div>
                {product.comparePrice && <span className="compare">{money(product.comparePrice)}</span>}
                <strong>{money(product.price, true)}</strong>
              </div>
              <div className="actions">
                <a href={`/api/sample-download?slug=${encodeURIComponent(product.slug)}`}>Free sample</a>
                {isFree ? (
                  <button className="primary" type="button" onClick={() => setLeadOpen(true)}>Download free</button>
                ) : (
                  <Link className="primary" href={`/?product=${encodeURIComponent(product.slug)}`}>Buy on store</Link>
                )}
              </div>
            </div>
            <div className="trust">
              <span>Instant digital delivery</span>
              <span>Protected downloads</span>
              <span>Verified reviews only</span>
            </div>
          </div>
        </section>

        <section className="grid">
          <article className="panel">
            <p className="eyebrow">Product details</p>
            {product.problem && <Info title="Problem" text={product.problem} />}
            {product.outcome && <Info title="Outcome" text={product.outcome} />}
            <List title="What you get" items={product.features} />
            <List title="Files included" items={product.fileList} />
            <List title="Course curriculum" items={product.curriculum} />
            <List title="Real-world projects" items={product.realWorldProjects} />
            <List title="Preview notes" items={product.preview} />
            <List title="Why this is valuable" items={valueContent.valueHighlights} />
            <List title="7-day quick-start plan" items={valueContent.quickStartPlan} />
            <List title="Practical use cases" items={valueContent.practicalUseCases} />
            <List title="AI prompts to use with this product" items={valueContent.aiPrompts} />
            <List title="Success checklist" items={valueContent.successChecklist} />
          </article>

          <aside className="panel side">
            <p className="eyebrow">AI buying coach</p>
            <h2>Should I buy this?</h2>
            <p className="muted mini-copy">Get a fit score based on your audience, goal, skill level, and budget.</p>
            <form className="coach-form" onSubmit={runProductCoach}>
              <label>Buyer type
                <select value={coachForm.audience} onChange={(event) => setCoachForm({ ...coachForm, audience: event.target.value })}>
                  <option value="student">Student</option>
                  <option value="fresher">Fresher</option>
                  <option value="developer">Developer</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="creator">Creator</option>
                  <option value="business">Business owner</option>
                  <option value="investor">Market learner</option>
                  <option value="founder">Startup founder</option>
                  <option value="hackathon">Hackathon team</option>
                </select>
              </label>
              <label>Goal
                <select value={coachForm.goal} onChange={(event) => setCoachForm({ ...coachForm, goal: event.target.value })}>
                  <option value="buy_first_product">Buy first useful product</option>
                  <option value="complete_project">Complete a project</option>
                  <option value="improve_income">Improve income or sales</option>
                  <option value="learn_skill">Learn a skill</option>
                  <option value="save_time">Save time with templates</option>
                  <option value="validate_startup">Validate startup idea</option>
                  <option value="win_hackathon">Win a hackathon</option>
                </select>
              </label>
              <label>Level
                <select value={coachForm.stage} onChange={(event) => setCoachForm({ ...coachForm, stage: event.target.value })}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label>Budget style
                <select value={coachForm.budget} onChange={(event) => setCoachForm({ ...coachForm, budget: event.target.value })}>
                  <option value="free">Free only</option>
                  <option value="low">Low price single</option>
                  <option value="bundle">Best bundle value</option>
                  <option value="premium">Premium system</option>
                </select>
              </label>
              <button type="submit" disabled={coachLoading}>{coachLoading ? 'Checking...' : 'Get AI fit score'}</button>
            </form>
            {coachResult && (
              <div className="coach-result">
                <div className="score-row">
                  <strong>{coachResult.verdict}</strong>
                  <span>{coachResult.fitScore}/100</span>
                </div>
                <div className="score-track"><span style={{ width: `${Math.max(0, Math.min(100, coachResult.fitScore || 0))}%` }} /></div>
                <List title="Why it fits" items={coachResult.reasons} />
                <List title="Recommended path" items={coachResult.recommendedPath} />
                {coachResult.bundlePick && (
                  <Link className="bundle-link" href={`/bundles/${coachResult.bundlePick.slug}`}>
                    Compare with {coachResult.bundlePick.name}
                  </Link>
                )}
              </div>
            )}

            <div className="side-divider" />
            <p className="eyebrow">Buyer fit</p>
            <ul>
              <li><strong>Best for:</strong> {valueContent.bestFor}</li>
              <li><strong>Not for:</strong> {valueContent.notFor}</li>
              <li><strong>Buying tip:</strong> {valueContent.upgradeTip}</li>
            </ul>

            <div className="side-divider" />
            <p className="eyebrow">Delivery policy</p>
            <ul>
              <li>Digital product, no physical shipping.</li>
              <li>Paid files unlock after successful Razorpay payment.</li>
              <li>Downloads stay available from the buyer dashboard.</li>
              <li>Broken or wrong files are fixed or reviewed for refund support.</li>
            </ul>
          </aside>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Verified purchase reviews</p>
              <h2>{reviewSummary.count ? `${reviewSummary.average}/5 from ${reviewSummary.count} buyer reviews` : 'No verified reviews yet'}</h2>
            </div>
          </div>
          {reviewSummary.count === 0 ? (
            <p className="muted">Reviews appear only after real paid buyers submit feedback from their dashboard.</p>
          ) : (
            <div className="reviews">
              {reviewSummary.reviews.map((review) => (
                <article key={review._id} className="review">
                  <strong>{review.rating}/5 - {review.userName || 'Verified buyer'}</strong>
                  <p>{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        {related.length > 0 && (
          <section className="panel">
            <p className="eyebrow">Related products</p>
            <div className="related">
              {related.map((item) => (
                <Link href={`/products/${item.slug}`} key={item.slug} className="related-card">
                  {item.image && <img src={item.image} alt="" />}
                  <strong>{item.name}</strong>
                  <span>{money(item.price, true)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {leadOpen && (
          <div className="modal">
            <form className="modal-box" onSubmit={unlockFreeDownload}>
              <div className="modal-head">
                <h2>Unlock free download</h2>
                <button type="button" onClick={() => setLeadOpen(false)}>×</button>
              </div>
              <p className="lead-note">Enter your email to unlock <strong>{product.name}</strong>. This helps PixelVault build an email list for offers and future paid bundles.</p>
              {leadMessage && <p className="lead-error">{leadMessage}</p>}
              <label>Name<input value={leadForm.name} onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })} placeholder="Your name" /></label>
              <label>Email *<input type="email" required value={leadForm.email} onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })} placeholder="you@email.com" /></label>
              <label>Phone optional<input value={leadForm.phone} onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })} placeholder="+91 9876543210" /></label>
              <button className="unlock" type="submit" disabled={leadSubmitting}>{leadSubmitting ? 'Unlocking...' : 'Unlock download'}</button>
            </form>
          </div>
        )}
      </main>

      <style jsx>{`
        .product-page{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}
        .topnav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}
        .brand{font-weight:850;color:#e8d5a8;font-size:1.2rem}.brand em{font-style:italic;color:#c8a96e}
        .topnav div{display:flex;gap:14px;font-size:.88rem;color:#cfcbd8}
        .hero,.grid,.panel{max-width:1120px;margin:0 auto}
        .hero{display:grid;grid-template-columns:minmax(280px,430px) 1fr;gap:28px;padding:34px 20px 20px}
        .media{background:#111;border-radius:12px;overflow:hidden;min-height:360px;position:relative;color:#e8d5a8;font-size:3rem}
        .slider-track{height:100%;min-height:360px;display:flex;transition:transform .7s cubic-bezier(.22,.61,.36,1);will-change:transform}
        .slide{min-width:100%;position:relative;display:flex;align-items:center;justify-content:center;background:#111}
        .slide img{width:100%;height:100%;object-fit:cover;display:block}
        .slide-fallback{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:360px}
        .slide-caption{position:absolute;left:16px;right:16px;bottom:16px;background:rgba(13,13,20,.78);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:11px 12px;color:#fff;backdrop-filter:blur(8px)}
        .slide-caption span{display:block;font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:#e8d5a8;font-weight:850;margin-bottom:3px}
        .slide-caption strong{display:block;font-size:.92rem;line-height:1.25;color:#fff}
        .slide-btn{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border:none;border-radius:999px;background:rgba(13,13,20,.72);color:#fff;font-weight:850;cursor:pointer}
        .slide-btn:hover{background:#1a6b6b}.slide-btn.prev{left:12px}.slide-btn.next{right:12px}
        .slide-dots{position:absolute;right:14px;top:14px;display:flex;gap:6px;background:rgba(13,13,20,.42);border-radius:999px;padding:6px}
        .slide-dot{width:8px;height:8px;border-radius:999px;border:0;background:rgba(255,255,255,.45);padding:0;cursor:pointer}
        .slide-dot.on{background:#e8d5a8;width:20px}
        .copy{display:flex;flex-direction:column;justify-content:center}
        .crumb,.eyebrow{font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:#1a6b6b;font-weight:850}
        h1{font-size:clamp(2rem,4vw,3.8rem);line-height:1.03;margin:12px 0;color:#0d0d14}
        h2{margin:0;font-size:1.25rem;color:#0d0d14}
        p{line-height:1.6}.copy p{font-size:1.02rem;color:#605b55;max-width:660px}
        .audience{display:inline-flex;align-self:flex-start;background:#e6f4f4;color:#0f4444;border-radius:999px;padding:7px 11px;font-weight:800;font-size:.82rem;margin:8px 0 18px}
        .price-row{display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:16px;margin-top:8px}
        .price-row strong{display:block;color:#1a6b6b;font-size:1.9rem}.compare{text-decoration:line-through;color:#8b8178;font-size:.9rem}
        .actions{display:flex;gap:10px;flex-wrap:wrap}.actions a,.actions button{border:1px solid #d8d0c4;border-radius:8px;padding:11px 14px;font-weight:850;background:#fbfaf7;font:inherit;cursor:pointer}
        .actions .primary{background:#1a6b6b;color:#fff;border-color:#1a6b6b}
        .trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.trust span{background:#fff;border:1px solid #d8d0c4;border-radius:999px;padding:7px 10px;color:#605b55;font-size:.78rem;font-weight:800}
        .grid{display:grid;grid-template-columns:1fr 320px;gap:16px;padding:0 20px}
        .panel{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:20px;margin-bottom:16px}
        .panel ul{margin:10px 0 0;padding-left:20px;line-height:1.65;color:#2c2926}.panel li{margin-bottom:5px}
        .info{background:#fbfaf7;border:1px solid #ebe4da;border-radius:9px;padding:12px;margin:10px 0}.info strong{display:block;margin-bottom:4px;color:#0d0d14}.info p{margin:0;color:#625b54}
        .side{height:max-content;position:sticky;top:82px}.muted{color:#7a7065}
        .mini-copy{font-size:.84rem;margin:6px 0 12px}
        .coach-form{display:grid;gap:9px;margin:13px 0 14px}
        .coach-form label{display:grid;gap:5px;font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;color:#7a7065;font-weight:850}
        .coach-form select{width:100%;border:1px solid #d8d0c4;border-radius:8px;background:#fbfaf7;color:#171720;padding:10px;font:inherit;text-transform:none;letter-spacing:0;outline:none}
        .coach-form select:focus{border-color:#1a6b6b;background:#fff}
        .coach-form button{border:0;background:#1a6b6b;color:#fff;border-radius:9px;padding:12px;font-weight:850;cursor:pointer}
        .coach-form button:disabled{opacity:.6;cursor:not-allowed}
        .coach-result{border-top:1px solid #d8d0c4;border-bottom:1px solid #d8d0c4;padding:13px 0;margin:8px 0 14px}
        .score-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
        .score-row strong{font-size:.95rem;color:#0d0d14}.score-row span{font-weight:900;color:#1a6b6b}
        .score-track{height:8px;background:#ebe4da;border-radius:999px;overflow:hidden}.score-track span{display:block;height:100%;background:#1a6b6b;border-radius:999px}
        .coach-result .eyebrow{display:block;margin:13px 0 4px}.coach-result ul{font-size:.84rem;margin-top:5px}
        .bundle-link{display:block;border:1px solid #d8d0c4;background:#fbfaf7;border-radius:8px;padding:10px 11px;font-size:.82rem;font-weight:850;color:#1a6b6b;margin-top:10px}
        .side-divider{height:1px;background:#d8d0c4;margin:16px 0}
        .reviews,.related{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}
        .review,.related-card{border:1px solid #e4ddd4;background:#fbfaf7;border-radius:10px;padding:13px}
        .review p{margin:.4rem 0 0;color:#625b54;font-size:.9rem}.related-card{display:grid;gap:8px}.related-card img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;background:#111}.related-card span{color:#1a6b6b;font-weight:850}
        .modal{position:fixed;inset:0;background:rgba(13,13,20,.74);display:flex;align-items:center;justify-content:center;z-index:30;padding:18px;backdrop-filter:blur(6px)}
        .modal-box{width:min(460px,100%);background:#f5f2ec;border-radius:14px;overflow:hidden;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.32)}
        .modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.modal-head h2{font-size:1.1rem}.modal-head button{border:0;background:none;font-size:1.35rem;cursor:pointer}
        .lead-note{background:#edf8f4;border:1px solid rgba(26,107,107,.16);border-radius:9px;padding:11px 12px;color:#0f4444;font-size:.84rem}.lead-error{background:#fff3f1;border:1px solid #f0bbb3;color:#a33427;border-radius:8px;padding:9px 10px;font-size:.84rem}
        .modal-box label{display:grid;gap:5px;font-size:.76rem;font-weight:850;text-transform:uppercase;letter-spacing:.05em;color:#7a7065;margin-top:10px}.modal-box input{border:1px solid #d8d0c4;border-radius:8px;background:#fff;padding:11px;font:inherit;text-transform:none;letter-spacing:0;color:#171720}
        .unlock{width:100%;border:0;background:#1a6b6b;color:#fff;border-radius:9px;padding:13px;font-weight:850;margin-top:14px;cursor:pointer}.unlock:disabled{opacity:.6;cursor:not-allowed}
        @media(max-width:820px){.hero,.grid{grid-template-columns:1fr}.media,.slider-track,.slide-fallback{min-height:260px}.price-row{align-items:flex-start;flex-direction:column}.side{position:static}}
      `}</style>
    </>
  );
}

function Info({ title, text }) {
  if (!text) return null;
  return <div className="info"><strong>{title}</strong><p>{text}</p></div>;
}

function List({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <>
      <p className="eyebrow">{title}</p>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </>
  );
}
