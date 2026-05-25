const goalProfiles = {
  placement: {
    label: 'Get job or placement ready',
    categories: ['career-placement', 'product-bundles'],
    keywords: ['resume', 'linkedin', 'interview', 'placement', 'portfolio', 'job', 'career'],
  },
  final_year_project: {
    label: 'Choose or complete a final-year project',
    categories: ['student-projects', 'free-project-ideas', 'product-bundles'],
    keywords: ['project', 'final year', 'viva', 'report', 'ppt', 'github', 'demo', 'ieee'],
  },
  startup_ideas: {
    label: 'Find and validate startup ideas',
    categories: ['startup-ideas', 'creator-products', 'product-bundles'],
    keywords: ['startup', 'idea', 'validation', 'mvp', 'customer', 'founder', 'saas', 'launch'],
  },
  hackathon_win: {
    label: 'Prepare hackathon ideas and winning strategy',
    categories: ['hackathons', 'student-projects', 'code-templates', 'product-bundles'],
    keywords: ['hackathon', 'idea', 'mvp', 'pitch', 'demo', 'judge', 'submission', 'team'],
  },
  ai_mastery: {
    label: 'Learn AI tools from beginner to advanced',
    categories: ['ai-courses', 'ai-automation', 'product-bundles'],
    keywords: ['ai', 'claude', 'chatgpt', 'prompt', 'automation', 'workflow', 'course'],
  },
  stock_market: {
    label: 'Learn stock market basics safely',
    categories: ['stock-market-investing', 'product-bundles'],
    keywords: ['stock', 'trading', 'investing', 'sip', 'risk', 'journal', 'technical analysis'],
  },
  freelance: {
    label: 'Start freelancing or get clients',
    categories: ['client-services', 'business-documents', 'creator-products'],
    keywords: ['freelance', 'client', 'proposal', 'contract', 'invoice', 'onboarding', 'payment'],
  },
  creator_business: {
    label: 'Sell digital products or grow as a creator',
    categories: ['creator-products', 'marketing-content', 'design-assets'],
    keywords: ['creator', 'digital product', 'bundle', 'email', 'content', 'launch', 'canva', 'design'],
  },
  coding_templates: {
    label: 'Build websites or coding projects faster',
    categories: ['code-templates', 'student-projects', 'product-bundles'],
    keywords: ['react', 'website', 'dashboard', 'template', 'source code', 'portfolio', 'java', 'android'],
  },
  business_growth: {
    label: 'Improve sales, checkout, support, or operations',
    categories: ['sales-checkout', 'customer-support', 'operations-team', 'local-business', 'finance-compliance'],
    keywords: ['sales', 'checkout', 'support', 'operations', 'invoice', 'customer', 'refund', 'revenue'],
  },
};

const audienceKeywords = {
  student: ['student', 'college', 'fresher', 'placement', 'project', 'viva', 'exam'],
  fresher: ['fresher', 'resume', 'linkedin', 'interview', 'job', 'placement'],
  freelancer: ['freelancer', 'client', 'proposal', 'contract', 'invoice', 'portfolio'],
  creator: ['creator', 'content', 'digital product', 'canva', 'youtube', 'instagram', 'launch'],
  developer: ['developer', 'code', 'react', 'java', 'android', 'portfolio', 'website'],
  business: ['business', 'sales', 'checkout', 'customer', 'operations', 'finance'],
  investor: ['stock', 'trading', 'investing', 'sip', 'market'],
  founder: ['startup', 'founder', 'mvp', 'validation', 'launch', 'saas'],
  hackathon: ['hackathon', 'team', 'mvp', 'pitch', 'demo', 'judge'],
};

const budgetCaps = {
  free: 0,
  under199: 199,
  under499: 499,
  premium: 999999,
};

function normalizedText(product) {
  return [
    product.name,
    product.description,
    product.longDesc,
    product.audience,
    product.problem,
    product.outcome,
    product.category,
    product.categoryLabel,
    product.format,
    ...(product.features || []),
    ...(product.curriculum || []),
    ...(product.realWorldProjects || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isBundle(product) {
  return product.bundle === true || product.category === 'product-bundles' || /bundle/i.test(`${product.format || ''} ${product.name || ''}`);
}

function priceScore(product, budget) {
  const price = Number(product.price || 0);
  if (budget === 'bundle') return isBundle(product) ? 24 : price >= 499 ? 8 : 0;
  const cap = budgetCaps[budget];
  if (cap == null) return 8;
  if (price <= cap) return 24;
  if (budget === 'free') return -28;
  return price <= cap + 150 ? 8 : -8;
}

function scoreProduct(product, answers = {}) {
  const text = normalizedText(product);
  const profile = goalProfiles[answers.goal] || goalProfiles.placement;
  const audienceTerms = audienceKeywords[answers.audience] || [];
  let score = 0;
  const reasons = [];

  if (profile.categories.includes(product.category)) {
    score += 36;
    reasons.push(`Matches: ${profile.label}`);
  }

  const matchedGoalTerms = profile.keywords.filter((keyword) => text.includes(keyword));
  if (matchedGoalTerms.length > 0) {
    score += Math.min(28, matchedGoalTerms.length * 7);
    reasons.push(`Covers ${matchedGoalTerms.slice(0, 3).join(', ')}`);
  }

  const matchedAudienceTerms = audienceTerms.filter((keyword) => text.includes(keyword));
  if (matchedAudienceTerms.length > 0) {
    score += Math.min(18, matchedAudienceTerms.length * 6);
    reasons.push(`Good for ${answers.audience || 'your audience'}`);
  }

  const budgetScore = priceScore(product, answers.budget);
  score += budgetScore;
  if (budgetScore > 0) reasons.push(answers.budget === 'bundle' ? 'Bundle value pick' : 'Fits selected budget');

  if (answers.format === 'course' && product.category === 'ai-courses') {
    score += 20;
    reasons.push('Course-style learning path');
  }
  if (answers.format === 'template' && /template|kit|pack|bundle/i.test(`${product.format || ''} ${product.name || ''}`)) {
    score += 12;
    reasons.push('Ready-to-use templates');
  }
  if (answers.format === 'source_code' && /code|java|android|react|website|dashboard/i.test(text)) {
    score += 16;
    reasons.push('Includes coding/project assets');
  }
  if (answers.format === 'guide' && /guide|roadmap|notes|planner|journal/i.test(text)) {
    score += 12;
    reasons.push('Guide or planner format');
  }

  if (product.badge === 'Hot') score += 4;
  if (product.premium) score += answers.budget === 'premium' ? 8 : 0;

  return {
    score,
    reasons: [...new Set(reasons)].slice(0, 4),
  };
}

export function getAdvisorRecommendations(products, answers = {}) {
  const scored = products
    .filter((product) => product && product.active !== false)
    .map((product) => {
      const result = scoreProduct(product, answers);
      return {
        ...product,
        advisorScore: result.score,
        advisorReasons: result.reasons.length ? result.reasons : ['Useful match for your selected need'],
      };
    })
    .filter((product) => product.advisorScore > 0)
    .sort((a, b) => b.advisorScore - a.advisorScore);

  const top = scored.slice(0, 5);
  const primary = top[0] || null;
  const bundlePick = scored.find((product) => isBundle(product)) || null;
  const freeStarter = scored.find((product) => Number(product.price || 0) <= 0) || null;

  return {
    profile: goalProfiles[answers.goal]?.label || 'Best product match',
    primary,
    bundlePick,
    freeStarter,
    recommendations: top,
  };
}
