// lib/mailer.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildDownloadLink(order, item) {
  if (order.downloadToken && item.slug) {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pixevault.vercel.app').replace(/\/$/, '');
    const params = new URLSearchParams({
      orderId: order.orderId,
      token: order.downloadToken,
      slug: item.slug,
    });

    return `${baseUrl}/api/download?${params.toString()}`;
  }

  return item.downloadUrl;
}

export async function sendOrderConfirmation({ order }) {
  const itemRows = order.items.map(i =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">₹${i.price.toLocaleString('en-IN')}</td>
    </tr>`
  ).join('');

  const downloadSection = order.items
    .map(i => ({ item: i, href: buildDownloadLink(order, i) }))
    .filter(({ href }) => href)
    .map(({ item, href }) =>
      `<div style="margin:12px 0;padding:14px;background:#f0faf6;border-radius:8px;border-left:4px solid #1a6b6b">
        <strong>${item.name}</strong><br/>
        <a href="${href}" style="color:#1a6b6b;font-size:14px">Download your product</a>
       </div>`
    ).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#1a1a28">
  <div style="background:#0d0d14;padding:28px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#e8d5a8;font-size:22px;margin:0">PixelVault ✦</h1>
    <p style="color:#888;margin:6px 0 0;font-size:14px">Digital Products Store</p>
  </div>
  <div style="padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 8px;font-size:20px">Payment Confirmed 🎉</h2>
    <p style="color:#555;margin:0 0 24px">Hi ${order.customer.name}, your purchase was successful.</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr><th style="text-align:left;padding:8px 0;border-bottom:2px solid #eee;font-size:13px;color:#888">PRODUCT</th>
            <th style="text-align:right;padding:8px 0;border-bottom:2px solid #eee;font-size:13px;color:#888">PRICE</th></tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    ${order.discount ? `<div style="text-align:right;font-size:13px;color:#1a7a4a;margin-bottom:4px">Discount -₹${order.discount.toLocaleString('en-IN')}</div>` : ''}
    <div style="text-align:right;font-size:13px;color:#888;margin-bottom:4px">GST (18%) ₹${order.gst.toLocaleString('en-IN')}</div>
    <div style="text-align:right;font-size:18px;font-weight:700;color:#1a6b6b;margin-bottom:24px">Total ₹${order.total.toLocaleString('en-IN')}</div>

    <div style="background:#f5f5f5;border-radius:8px;padding:12px 16px;font-size:13px;color:#555;margin-bottom:24px">
      Order ID: <strong>${order.orderId}</strong><br/>
      Payment ID: <strong>${order.razorpayPaymentId || '—'}</strong>
    </div>

    ${downloadSection ? `<h3 style="margin:0 0 12px;font-size:16px">📥 Your Downloads</h3>${downloadSection}` : ''}

    <p style="font-size:13px;color:#888;margin-top:24px">
      Download links are protected by your paid order. You can also log in to your PixelVault dashboard to download again.<br/>
      Questions? Reply to this email.
    </p>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to:   order.customer.email,
    subject: `✅ Order Confirmed — ${order.orderId} | PixelVault`,
    html,
  });
}
