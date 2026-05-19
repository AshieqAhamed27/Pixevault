export const blogPosts = [
  {
    slug: 'best-final-year-project-ideas-for-students',
    title: 'Best Final Year Project Ideas for Students',
    description: 'How CSE, IT, ECE, EEE, mechanical, civil, commerce, and management students can choose practical final-year projects.',
    audience: 'College students',
    sections: [
      ['Choose a real problem', 'Pick a problem that exists in your college, local business, or daily life. Attendance tracking, lab records, appointment booking, inventory, billing, support, and placement prep are easier to explain in review.'],
      ['Match project difficulty to your team', 'A good project is not only advanced. It should be buildable, demo-ready, and explainable. Add one strong feature instead of ten weak features.'],
      ['Best categories', 'AI chat assistants, student management systems, IoT monitoring, renewable energy dashboards, e-commerce tools, finance planners, and healthcare appointment systems work well for final-year reviews.'],
      ['What to prepare', 'Keep abstract, architecture diagram, module list, database tables, screenshots, test cases, and future scope ready before the final review.'],
    ],
    relatedCategory: 'free-project-ideas',
  },
  {
    slug: 'how-to-sell-digital-products-as-a-student',
    title: 'How to Sell Digital Products as a Student',
    description: 'A practical path for students to sell notes, templates, source code, project guides, and AI workflows online.',
    audience: 'Students and beginner creators',
    sections: [
      ['Start with one audience', 'Do not sell random files. Choose students, freshers, developers, freelancers, or small businesses first. Clear audience creates clear products.'],
      ['Sell outcomes', 'A resume template is not only a file. It helps someone apply faster. A project bundle helps someone complete review work faster. Make the outcome obvious.'],
      ['Use samples', 'Offer a free sample so buyers understand quality before paying. This builds trust without fake ratings.'],
      ['Create bundles', 'After you have 3 or 4 related products, sell a bundle at a higher price. Bundles increase order value and feel more complete.'],
    ],
    relatedCategory: 'creator-products',
  },
  {
    slug: 'stock-market-learning-roadmap-for-beginners',
    title: 'Stock Market Learning Roadmap for Beginners',
    description: 'A safer beginner roadmap for learning trading, investing, risk management, SIPs, options basics, and journaling.',
    audience: 'Beginner stock-market learners',
    sections: [
      ['Learn before risking money', 'Beginners should understand market terms, order types, risk, position sizing, and emotional mistakes before using real capital.'],
      ['Separate trading and investing', 'Trading needs discipline, stop loss, journal review, and small risk. Investing needs goals, SIP discipline, asset allocation, and long-term review.'],
      ['Use a journal', 'A trading journal helps track entry, exit, reason, risk, outcome, and mistakes. It is more useful than random tips.'],
      ['Avoid guarantees', 'No product should promise profit. Educational products should teach process, risk, and decision-making.'],
    ],
    relatedCategory: 'stock-market-investing',
  },
];

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug) || null;
}
