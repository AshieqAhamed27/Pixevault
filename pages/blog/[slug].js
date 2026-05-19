import Head from 'next/head';
import Link from 'next/link';
import { blogPosts, getBlogPost } from '../../lib/blog-posts.mjs';

export async function getStaticPaths() {
  return {
    paths: blogPosts.map((post) => ({ params: { slug: post.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return { props: { post: getBlogPost(params.slug) } };
}

export default function BlogPost({ post }) {
  return (
    <>
      <Head>
        <title>{post.title} | PixelVault</title>
        <meta name="description" content={post.description} />
      </Head>
      <main className="post">
        <nav><Link href="/" className="brand"><em>Pixel</em>Vault</Link><Link href="/blog">Guides</Link></nav>
        <article>
          <p className="eyebrow">{post.audience}</p>
          <h1>{post.title}</h1>
          <p className="desc">{post.description}</p>
          {post.sections.map(([title, body]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </section>
          ))}
          <Link className="cta" href={`/?category=${post.relatedCategory}`}>Shop related products</Link>
        </article>
      </main>
      <style jsx>{`
        .post{min-height:100vh;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
        a{text-decoration:none;color:inherit}nav{height:64px;background:#0d0d14;color:#eee;display:flex;align-items:center;justify-content:space-between;padding:0 24px}.brand{font-weight:850;color:#e8d5a8}.brand em{font-style:italic;color:#c8a96e}
        article{max-width:780px;margin:0 auto;padding:42px 20px}.eyebrow{color:#1a6b6b;text-transform:uppercase;letter-spacing:.08em;font-weight:850;font-size:.72rem}h1{font-size:clamp(2rem,4vw,3.4rem);line-height:1.05;margin:8px 0 14px}.desc{font-size:1.05rem;color:#625b54;line-height:1.65;margin-bottom:24px}
        section{background:#fff;border:1px solid #d8d0c4;border-radius:12px;padding:18px;margin-bottom:12px}h2{margin:0 0 8px;color:#0d0d14}section p{color:#625b54;line-height:1.7;margin:0}.cta{display:inline-flex;margin-top:12px;background:#1a6b6b;color:#fff;border-radius:8px;padding:12px 15px;font-weight:850}
      `}</style>
    </>
  );
}
