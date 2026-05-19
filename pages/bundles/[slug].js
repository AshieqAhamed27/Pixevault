import Head from 'next/head';
import Link from 'next/link';
import { getPublicStarterProducts, productCategoryLabels } from '../../lib/starter-products.mjs';
import { normalizeReferralCode } from '../../lib/referrals.mjs';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function categoryName(product) {
  return product.categoryLabel || productCategoryLabels[product.category] || product.category;
}

function buildIncluded(bundle, products) {
  return (bundle.includedProducts || [])
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean);
}

function isBundleProduct(product) {
  return (
    product.bundle === true ||
    product.category === 'product-bundles' ||
    /bundle/i.test(`${product.format || ''} ${product.name || ''}`)
  );
}

function storeHref(slug, referralCode) {
  const params = new URLSearchParams({ product: slug });
  if (referralCode) params.set('ref', referralCode);
  return `/?${params.toString()}`;
}

function bundleHref(slug, referralCode) {
  return referralCode ? `/bundles/${slug}?ref=${encodeURIComponent(referralCode)}` : `/bundles/${slug}`;
}

export async function getServerSideProps({ params, query }) {
  const products = getPublicStarterProducts('all');
  const referralCode = normalizeReferralCode(query?.ref);
  const bundle = products.find((product) => product.slug === params.slug && isBundleProduct(product));

  if (!bundle) return { notFound: true };

  const included = buildIncluded(bundle, products);
  const totalValue = included.reduce((sum, product) => sum + Number(product.price || 0), 0) || bundle.comparePrice || bundle.price;
  const related = products
    .filter((product) => isBundleProduct(product) && product.slug !== bundle.slug)
    .slice(0, 3);

  return {
    props: {
      bundle: JSON.parse(JSON.stringify({ ...bundle, totalValue })),
      included: JSON.parse(JSON.stringify(included)),
      related: JSON.parse(JSON.stringify(related)),
      referralCode,
    },
  };
}

export default function BundleLanding({ bundle, included, related, referralCode }) {
  const savings = Math.max(0, Number(bundle.totalValue || 0) - Number(bundle.price || 0));
  const pageTitle = `${bundle.name} Bundle | PixelVault`;
  const buyHref = storeHref(bundle.slug, referralCode);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={bundle.longDesc || bundle.description} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={bundle.description} />
        <meta property="og:image" content={bundle.image} />
      </Head>
      <main className="page">
        <nav>
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <div>
            <Link href="/bundles">All bundles</Link>
            <Link href="/">Store</Link>
          </div>
        </nav>

        <section className="hero">
          <div className="media">
            {bundle.image ? <img src={bundle.image} alt={`${bundle.name} cover`} /> : <strong>{bundle.emoji || 'PV'}</strong>}
          </div>
          <div className="copy">
            <p className="eyebrow">{categoryName(bundle)} bundle</p>
            <h1>{bundle.name}</h1>
            <p>{bundle.longDesc || bundle.description}</p>
            <div className="price-box">
              <div>
                {bundle.totalValue > bundle.price && <span>Single product value {money(bundle.totalValue)}</span>}
                <strong>{money(bundle.price)}</strong>
                {savings > 0 && <b>Save {money(savings)}</b>}
              </div>
              <Link href={buyHref} className="buy">Buy complete bundle</Link>
            </div>
            <div className="trust">
              <span>3-4 joined products</span>
              <span>Instant digital delivery</span>
              <span>Higher value than singles</span>
            </div>
          </div>
        </section>

        <section className="content">
          <article className="panel">
            <p className="eyebrow">Why this sells</p>
            <h2>One bundle, one complete outcome.</h2>
            <div className="info-grid">
              {bundle.problem && <Info title="Buyer problem" text={bundle.problem} />}
              {bundle.outcome && <Info title="Outcome" text={bundle.outcome} />}
              {bundle.audience && <Info title="Best for" text={bundle.audience} />}
            </div>
            {bundle.features?.length > 0 && (
              <>
                <p className="eyebrow">What buyers get</p>
                <ul>{bundle.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              </>
            )}
          </article>

          <aside className="panel sticky">
            <p className="eyebrow">Bundle offer</p>
            <strong className="side-price">{money(bundle.price)}</strong>
            {savings > 0 && <p className="saving">Saves {money(savings)} versus buying singles.</p>}
            <Link href={buyHref} className="side-buy">Buy bundle</Link>
          </aside>
        </section>

        {included.length > 0 && (
          <section className="panel included">
            <p className="eyebrow">Products included</p>
            <div className="included-grid">
              {included.map((product) => (
                <article key={product.slug}>
                  {product.image && <img src={product.image} alt={`${product.name} cover`} />}
                  <span>{categoryName(product)}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <strong>{money(product.price)}</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="panel related">
            <p className="eyebrow">Other bundles</p>
            <div className="related-grid">
              {related.map((item) => (
                <Link key={item.slug} href={bundleHref(item.slug, referralCode)}>
                  {item.image && <img src={item.image} alt="" />}
                  <strong>{item.name}</strong>
                  <span>{money(item.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .page{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}
        nav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}
        nav div{display:flex;gap:16px;color:#cfcbd8;font-size:.9rem}.brand{font-weight:850;color:#e8d5a8;font-size:1.2rem}.brand em{font-style:italic;color:#c8a96e}
        .hero,.content,.panel{max-width:1120px;margin:0 auto}.hero{display:grid;grid-template-columns:minmax(300px,440px) 1fr;gap:28px;padding:34px 20px 20px}
        .media{background:#111;border-radius:14px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:420px;color:#e8d5a8;font-size:3rem}.media img{width:100%;height:100%;object-fit:contain;padding:16px}
        .copy{display:flex;flex-direction:column;justify-content:center}.eyebrow{margin:0 0 8px;color:#1a6b6b;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;font-weight:850}
        h1{font-size:clamp(2.2rem,4vw,4rem);line-height:1.03;margin:0 0 14px;color:#0d0d14}h2{font-size:1.55rem;margin:0 0 12px;color:#0d0d14}h3{margin:8px 0;color:#0d0d14}
        .copy>p:not(.eyebrow){color:#625b54;line-height:1.65;font-size:1.02rem}.price-box{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:10px}
        .price-box span{display:block;text-decoration:line-through;color:#8b8178;font-size:.9rem}.price-box strong,.side-price{display:block;color:#1a6b6b;font-size:2rem}.price-box b{display:inline-block;color:#1a7a4a;background:#edf8f4;border:1px solid rgba(26,122,74,.16);border-radius:999px;padding:5px 8px;font-size:.78rem;margin-top:5px}
        .buy,.side-buy{background:#1a6b6b;color:#fff;border-radius:9px;padding:13px 16px;font-weight:850;text-align:center}.trust{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.trust span{background:#fff;border:1px solid #d8d0c4;border-radius:999px;padding:7px 10px;color:#605b55;font-size:.78rem;font-weight:800}
        .content{display:grid;grid-template-columns:1fr 300px;gap:16px;padding:0 20px}.panel{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:20px;margin-bottom:16px}.sticky{height:max-content;position:sticky;top:82px}
        .info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-bottom:16px}.info{background:#fbfaf7;border:1px solid #ebe4da;border-radius:9px;padding:12px}.info strong{display:block;margin-bottom:5px;color:#0d0d14}.info p{margin:0;color:#625b54;line-height:1.5}
        ul{margin:0;padding-left:20px;line-height:1.65;color:#2c2926}.saving{color:#625b54;line-height:1.5}.side-buy{display:block;margin-top:14px}
        .included,.related{padding:20px}.included-grid,.related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:12px}.included article,.related a{border:1px solid #e4ddd4;background:#fbfaf7;border-radius:10px;padding:13px}.included img,.related img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;background:#111}.included span,.related span{color:#1a6b6b;font-size:.76rem;font-weight:850}.included p{color:#625b54;font-size:.88rem;line-height:1.45}.included strong{color:#1a6b6b}
        @media(max-width:820px){nav{height:auto;align-items:flex-start;flex-direction:column;gap:10px;padding:14px 20px}.hero,.content{grid-template-columns:1fr}.media{min-height:280px}.price-box{align-items:flex-start;flex-direction:column}.sticky{position:static}}
      `}</style>
    </>
  );
}

function Info({ title, text }) {
  return <div className="info"><strong>{title}</strong><p>{text}</p></div>;
}
