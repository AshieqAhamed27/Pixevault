import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      router.push('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - PixelVault</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthStyles />
      <main className="auth-page">
        <Link href="/" className="brand"><em>Pixel</em>Vault</Link>
        <form className="auth-card" onSubmit={submit}>
          <p className="eyebrow">Customer account</p>
          <h1>Welcome back</h1>
          <p className="sub">Log in to speed through checkout and access your purchases.</p>
          {error && <div className="error">{error}</div>}
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Your password"
            autoComplete="current-password"
          />
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
          <p className="switch">New here? <Link href="/signup">Create an account</Link></p>
        </form>
      </main>
    </>
  );
}

function AuthStyles() {
  return (
    <style jsx global>{`
      *{box-sizing:border-box}
      body{margin:0;background:#f5f2ec;color:#171720;font-family:Segoe UI,system-ui,sans-serif}
      .auth-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 18px;background:linear-gradient(180deg,#0d0d14 0,#0d0d14 36%,#f5f2ec 36%)}
      .brand{color:#e8d5a8;text-decoration:none;font-weight:800;font-size:1.35rem;margin-bottom:22px}
      .brand em{color:#c8a96e;font-style:italic}
      .auth-card{width:min(430px,100%);background:#fff;border:1px solid #d8d0c4;border-radius:10px;padding:28px;box-shadow:0 18px 50px rgba(13,13,20,.18)}
      .eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:.72rem;color:#1a6b6b;font-weight:800;margin:0 0 8px}
      h1{font-size:1.8rem;margin:0 0 8px;color:#0d0d14}
      .sub{margin:0 0 22px;color:#7a7065;line-height:1.55;font-size:.92rem}
      label{display:block;margin:14px 0 6px;color:#4f4942;font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
      input{width:100%;border:1px solid #d8d0c4;background:#f5f2ec;border-radius:8px;padding:12px 13px;font:inherit;outline:none}
      input:focus{border-color:#1a6b6b;background:#fff}
      button{width:100%;border:0;background:#1a6b6b;color:#fff;font-weight:800;border-radius:8px;padding:13px 16px;margin-top:20px;cursor:pointer}
      button:disabled{opacity:.65;cursor:not-allowed}
      .error{background:#fff3f1;border:1px solid #f0bbb3;color:#a33427;border-radius:8px;padding:10px 12px;font-size:.86rem;margin-bottom:12px}
      .switch{text-align:center;color:#7a7065;font-size:.88rem;margin:18px 0 0}
      .switch a{color:#1a6b6b;font-weight:800;text-decoration:none}
    `}</style>
  );
}
