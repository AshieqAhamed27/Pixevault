export const starterProducts = [
  {
    slug: 'creator-sales-starter-kit',
    name: 'Creator Sales Starter Kit',
    description: 'A ready-to-edit launch kit with offer planner, sales page copy, email templates, and AI prompts.',
    longDesc: 'Built for freelancers, creators, and solo founders who want to package their skills into a paid digital product fast.',
    category: 'template',
    price: 499,
    comparePrice: 999,
    emoji: '$',
    color: 'mint',
    badge: 'New',
    features: [
      'Offer planner worksheet',
      'Landing page copy template',
      'Launch checklist',
      'Customer email templates',
      '50 AI prompts for marketing and delivery',
    ],
    downloadUrl: 'https://drive.google.com/replace-with-your-private-zip-link',
    active: true,
    rating: 4.8,
    reviewCount: 0,
  },
];

export function getPublicStarterProducts(category = 'all') {
  return starterProducts
    .filter((product) => product.active && (category === 'all' || product.category === category))
    .map((product) => ({
      _id: product.slug,
      ...product,
      createdAt: '2026-05-18T00:00:00.000Z',
      updatedAt: '2026-05-18T00:00:00.000Z',
    }));
}
