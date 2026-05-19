import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { productCategories } from '../lib/starter-products.mjs';

const empty = {
  creatorName: '',
  email: '',
  productName: '',
  category: 'student-projects',
  description: '',
  targetPrice: '',
  sampleUrl: '',
  downloadUrl: '',
};

export default function SellPage() {
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setStatus('Submitting your product for review...');
    try {
      const res = await fetch('/api/creator-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit product');
      setForm(empty);
      setStatus('Submitted. PixelVault will review the product before it appears in the store.');
    } catch (err) {
      setStatus(err.message || 'Unable to submit product.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Head>
        <title>Sell Digital Products - PixelVault</title>
        <meta name="description" content="Submit student projects, templates, courses, design assets, and digital products for PixelVault review." />
      </Head>
      <main className="sell">
        <nav>
          <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        <section className="hero">
          <div>
            <p className="eyebrow">Creator marketplace</p>
            <h1>Sell useful digital products to students, freelancers, creators, and businesses.</h1>
            <p>Submit your product for review. Approved products can be published later with protected delivery, order tracking, and commission-based sales.</p>
          </div>
          <div className="rules">
            <strong>Good products to submit</strong>
            <span>Final-year projects, source-code packs, resume templates, AI workflows, design kits, business documents, and practical courses.</span>
          </div>
        </section>

        <form onSubmit={submit} className="form">
          <input required placeholder="Your name" value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Product name" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {productCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}
          </select>
          <input type="number" placeholder="Target price in INR" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} />
          <input placeholder="Sample URL (Google Drive, GitHub, Canva, etc.)" value={form.sampleUrl} onChange={(e) => setForm({ ...form, sampleUrl: e.target.value })} />
          <input placeholder="Private download URL for review" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} />
          <textarea required placeholder="Explain the problem this product solves and what files are included." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button disabled={sending}>{sending ? 'Submitting...' : 'Submit product'}</button>
          {status && <p className="status">{status}</p>}
        </form>
      </main>

      <style jsx>{`
        .sell{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}nav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}
        .brand{font-weight:850;color:#e8d5a8}.brand em{font-style:italic;color:#c8a96e}
        .hero{max-width:1080px;margin:0 auto;padding:42px 20px 22px;display:grid;grid-template-columns:1fr 330px;gap:24px;align-items:center}
        .eyebrow{margin:0 0 8px;color:#1a6b6b;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:850}
        h1{font-size:clamp(2rem,4vw,3.6rem);line-height:1.04;margin:0 0 12px;color:#0d0d14}.hero p{color:#625b54;line-height:1.65;font-size:1rem}
        .rules{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:18px}.rules strong{display:block;margin-bottom:8px}.rules span{color:#625b54;line-height:1.55}
        .form{max-width:840px;margin:0 auto 40px;background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
        input,select,textarea{border:1px solid #d8d0c4;border-radius:8px;padding:12px;font-family:inherit}textarea{grid-column:1/-1;min-height:120px}button{grid-column:1/-1;border:none;background:#1a6b6b;color:#fff;border-radius:9px;padding:13px;font-weight:850;cursor:pointer}
        .status{grid-column:1/-1;margin:0;color:#625b54;background:#fbfaf7;border:1px solid #e7ded3;border-radius:8px;padding:11px}
        @media(max-width:760px){.hero,.form{grid-template-columns:1fr}}
      `}</style>
    </>
  );
}
