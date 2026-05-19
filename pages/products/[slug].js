import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { connectDB } from '../../lib/mongoose';
import { Product, Review } from '../../lib/models';
import { getPublicStarterProducts, productCategoryLabels } from '../../lib/starter-products.mjs';

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

function buildProductGallery(product, starterProducts, related) {
  const companionCategories = {
    'ai-courses': ['ai-automation', 'career-placement', 'creator-products'],
    'student-projects': ['free-project-ideas', 'career-placement'],
    'career-placement': ['student-projects', 'code-templates'],
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
      reviewSummary: serialize({ average, count: reviews.length, reviews }),
    },
  };
}

export default function ProductPage({ product, related, gallery, reviewSummary }) {
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

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 3600);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  function moveSlide(direction) {
    setActiveSlide((current) => (
      (current + direction + heroSlides.length) % heroSlides.length
    ));
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
                  <a className="primary" href={`/api/free-download?slug=${encodeURIComponent(product.slug)}`}>Download free</a>
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
          </article>

          <aside className="panel side">
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
        .actions{display:flex;gap:10px;flex-wrap:wrap}.actions a{border:1px solid #d8d0c4;border-radius:8px;padding:11px 14px;font-weight:850;background:#fbfaf7}
        .actions .primary{background:#1a6b6b;color:#fff;border-color:#1a6b6b}
        .trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.trust span{background:#fff;border:1px solid #d8d0c4;border-radius:999px;padding:7px 10px;color:#605b55;font-size:.78rem;font-weight:800}
        .grid{display:grid;grid-template-columns:1fr 320px;gap:16px;padding:0 20px}
        .panel{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:20px;margin-bottom:16px}
        .panel ul{margin:10px 0 0;padding-left:20px;line-height:1.65;color:#2c2926}.panel li{margin-bottom:5px}
        .info{background:#fbfaf7;border:1px solid #ebe4da;border-radius:9px;padding:12px;margin:10px 0}.info strong{display:block;margin-bottom:4px;color:#0d0d14}.info p{margin:0;color:#625b54}
        .side{height:max-content;position:sticky;top:82px}.muted{color:#7a7065}
        .reviews,.related{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px}
        .review,.related-card{border:1px solid #e4ddd4;background:#fbfaf7;border-radius:10px;padding:13px}
        .review p{margin:.4rem 0 0;color:#625b54;font-size:.9rem}.related-card{display:grid;gap:8px}.related-card img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;background:#111}.related-card span{color:#1a6b6b;font-weight:850}
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
