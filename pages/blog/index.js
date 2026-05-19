import Head from 'next/head';
import Link from 'next/link';
import { blogPosts } from '../../lib/blog-posts.mjs';

export default function BlogIndex() {
  return (
    <>
      <Head>
        <title>PixelVault Guides</title>
        <meta name="description" content="Practical guides for digital products, student projects, career products, AI workflows, and stock-market education." />
      </Head>
      <main className="blog">
        <nav><Link href="/" className="brand"><em>Pixel</em>Vault</Link><Link href="/sell">Sell</Link></nav>
        <section>
          <p className="eyebrow">Guides</p>
          <h1>Helpful articles that bring buyers from Google and social sharing.</h1>
          <div className="posts">
            {blogPosts.map((post) => (
              <Link className="card" href={`/blog/${post.slug}`} key={post.slug}>
                <span>{post.audience}</span>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <style jsx>{`
        .blog{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}nav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}.brand{font-weight:850;color:#e8d5a8}.brand em{font-style:italic;color:#c8a96e}
        section{max-width:1040px;margin:0 auto;padding:42px 20px}.eyebrow{color:#1a6b6b;text-transform:uppercase;letter-spacing:.08em;font-weight:850;font-size:.72rem}h1{font-size:clamp(2rem,4vw,3.5rem);max-width:760px;line-height:1.05;margin:8px 0 24px}
        .posts{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.card{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:18px}.card span{color:#1a6b6b;font-weight:850;font-size:.78rem}.card h2{font-size:1.2rem;margin:10px 0;color:#0d0d14}.card p{color:#625b54;line-height:1.55}
      `}</style>
    </>
  );
}
