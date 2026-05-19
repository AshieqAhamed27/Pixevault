import Head from 'next/head';
import Link from 'next/link';
import { getPublicStarterProducts, productCategoryLabels } from '../../lib/starter-products.mjs';
import { normalizeReferralCode } from '../../lib/referrals.mjs';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function bundleValue(bundle, products) {
  if (!Array.isArray(bundle.includedProducts)) return bundle.comparePrice || bundle.price;
  return bundle.includedProducts
    .map((slug) => products.find((product) => product.slug === slug))
    .filter(Boolean)
    .reduce((sum, product) => sum + Number(product.price || 0), 0) || bundle.comparePrice || bundle.price;
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

export async function getServerSideProps({ query }) {
  const products = getPublicStarterProducts('all');
  const referralCode = normalizeReferralCode(query?.ref);
  const bundles = products
    .filter(isBundleProduct)
    .map((bundle) => ({
      ...bundle,
      totalValue: bundleValue(bundle, products),
      categoryLabel: bundle.categoryLabel || productCategoryLabels[bundle.category] || bundle.category,
    }));

  return { props: { bundles: JSON.parse(JSON.stringify(bundles)), referralCode } };
}

export default function BundleIndex({ bundles, referralCode }) {
  return (
    <>
      <Head>
        <title>High-Value Digital Product Bundles | PixelVault</title>
        <meta name="description" content="Buy higher-value digital product bundles for placement, final year projects, AI productivity, stock market learning, code templates, and creators." />
      </Head>
      <main className="page">
        <nav>
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <div>
            <Link href="/">Store</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </nav>

        <section className="hero">
          <p className="eyebrow">Higher average order value</p>
          <h1>Bundles that join 3-4 useful products into one stronger purchase.</h1>
          <p>Single products are affordable. Bundles earn more because buyers get a complete outcome instead of one file.</p>
        </section>

        <section className="grid">
          {bundles.map((bundle) => {
            const savings = Math.max(0, Number(bundle.totalValue || bundle.comparePrice || 0) - Number(bundle.price || 0));
            return (
              <article className="card" key={bundle.slug}>
                {bundle.image && <img src={bundle.image} alt={`${bundle.name} cover`} />}
                <div className="copy">
                  <span>{bundle.categoryLabel}</span>
                  <h2>{bundle.name}</h2>
                  <p>{bundle.description}</p>
                  <ul>
                    {(bundle.features || []).slice(0, 4).map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <div className="price-row">
                    <div>
                      {bundle.totalValue > bundle.price && <small>Single product value {money(bundle.totalValue)}</small>}
                      <strong>{money(bundle.price)}</strong>
                      {savings > 0 && <b>Save {money(savings)}</b>}
                    </div>
                    <div className="actions">
                      <Link href={bundleHref(bundle.slug, referralCode)}>Landing page</Link>
                      <Link className="buy" href={storeHref(bundle.slug, referralCode)}>Buy bundle</Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <style jsx>{`
        .page{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}
        nav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}
        nav div{display:flex;gap:16px;color:#cfcbd8;font-size:.9rem}.brand{font-weight:850;color:#e8d5a8;font-size:1.2rem}.brand em{font-style:italic;color:#c8a96e}
        .hero{max-width:1120px;margin:0 auto;padding:46px 20px 22px}
        .eyebrow{margin:0 0 8px;color:#1a6b6b;font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;font-weight:850}
        h1{font-size:clamp(2.1rem,4vw,4rem);line-height:1.04;max-width:850px;margin:0 0 14px;color:#0d0d14}
        .hero p:not(.eyebrow){color:#625b54;max-width:660px;font-size:1.04rem;line-height:1.6}
        .grid{max-width:1120px;margin:0 auto;padding:0 20px 50px;display:grid;gap:18px}
        .card{display:grid;grid-template-columns:minmax(260px,360px) 1fr;gap:0;background:#fff;border:1px solid #d8d0c4;border-radius:12px;overflow:hidden}
        .card img{width:100%;height:100%;min-height:300px;object-fit:contain;background:#111;padding:14px}
        .copy{padding:22px;display:flex;flex-direction:column;gap:10px}.copy span{color:#1a6b6b;text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;font-weight:850}
        h2{font-size:1.65rem;line-height:1.15;margin:0;color:#0d0d14}.copy p{margin:0;color:#625b54;line-height:1.55}
        ul{display:grid;gap:7px;margin:4px 0 0;padding-left:18px;color:#2c2926;line-height:1.45}
        .price-row{margin-top:auto;border-top:1px solid #d8d0c4;padding-top:15px;display:flex;align-items:flex-end;justify-content:space-between;gap:14px}
        small{display:block;color:#8b8178;text-decoration:line-through;margin-bottom:2px}strong{display:block;color:#1a6b6b;font-size:1.75rem}b{display:inline-block;color:#1a7a4a;background:#edf8f4;border:1px solid rgba(26,122,74,.16);border-radius:999px;padding:5px 8px;font-size:.78rem;margin-top:5px}
        .actions{display:flex;gap:9px;flex-wrap:wrap}.actions a{border:1px solid #d8d0c4;border-radius:8px;padding:11px 13px;font-weight:850}.actions .buy{background:#1a6b6b;color:#fff;border-color:#1a6b6b}
        @media(max-width:760px){nav{height:auto;align-items:flex-start;flex-direction:column;gap:10px;padding:14px 20px}.card{grid-template-columns:1fr}.card img{min-height:240px}.price-row{align-items:flex-start;flex-direction:column}}
      `}</style>
    </>
  );
}
