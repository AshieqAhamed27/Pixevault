const defaultPlaybook = {
  buyerIntent: 'Practical digital workflow',
  bestFor: 'Students, freelancers, creators, and small business owners who want reusable digital assets.',
  notFor: 'Buyers expecting physical shipping or one-to-one done-for-you service.',
  useCases: (product) => [
    `Use ${product.name} as a ready starting point instead of building from a blank page.`,
    'Customize the included files for one real project, client, subject, or business workflow.',
    'Create a repeatable process you can reuse whenever the same problem appears again.',
  ],
  success: [
    'You can explain the problem this product solves.',
    'You customized at least one included template or checklist.',
    'You completed one practical output from the product.',
    'You saved the finished version for reuse.',
  ],
  prompts: (product) => [
    `Act as a practical mentor. Help me use ${product.name} for my situation and create a first action plan.`,
    `Review this output from ${product.name} and tell me what is missing, unclear, or weak.`,
    `Convert the main steps in ${product.name} into a 7-day checklist for a beginner.`,
  ],
};

const categoryPlaybooks = {
  'career-placement': {
    buyerIntent: 'Career outcome',
    bestFor: 'Students, freshers, interns, and junior professionals preparing for placement or off-campus jobs.',
    notFor: 'Experienced candidates who already have a polished resume, portfolio, and interview system.',
    useCases: (product) => [
      `Prepare a job-ready version of your resume or profile using ${product.name}.`,
      'Turn one college or freelance project into strong interview talking points.',
      'Build a weekly placement routine for applications, LinkedIn updates, and mock interviews.',
    ],
    success: [
      'Resume or profile is tailored to one target role.',
      'Project explanations are clear in problem, stack, role, and result format.',
      'You have at least one interview practice sheet ready.',
      'Applications are tracked instead of sent randomly.',
    ],
    prompts: (product) => [
      `Act as a placement mentor. Use ${product.name} to improve my resume for a fresher software role.`,
      'Rewrite these project bullets with action, technology, and measurable result.',
      'Ask me 10 HR and technical interview questions based on my resume.',
    ],
  },
  'student-projects': {
    buyerIntent: 'Academic project completion',
    bestFor: 'College students and project teams who need a practical way to plan, document, present, and explain projects.',
    notFor: 'Students looking for copied final submissions without learning or customization.',
    useCases: (product) => [
      `Use ${product.name} to convert a raw topic into modules, report sections, PPT flow, and viva answers.`,
      'Prepare a review-day checklist for faculty, demo, GitHub, and documentation.',
      'Create a project explanation that works for both college reviews and placement interviews.',
    ],
    success: [
      'Project topic has a clear problem statement and scope.',
      'Modules, users, database or workflow are written down.',
      'Report, PPT, demo script, and viva answers are aligned.',
      'The team can explain what was built and why.',
    ],
    prompts: (product) => [
      `Act as a final-year project guide. Use ${product.name} to create a review plan for my topic.`,
      'Create modules, objectives, and data flow for this project idea.',
      'Generate viva questions and answers for this project explanation.',
    ],
  },
  'free-project-ideas': {
    buyerIntent: 'Free lead magnet and topic selection',
    bestFor: 'Students who are still choosing a final-year or mini-project topic.',
    notFor: 'Teams that already finalized their topic and need complete implementation files immediately.',
    useCases: (product) => [
      `Use ${product.name} to shortlist project ideas by department, difficulty, and review value.`,
      'Pick one idea and convert it into problem statement, objectives, modules, and demo scope.',
      'Use the free pack before upgrading to a report, PPT, viva, or full project builder product.',
    ],
    success: [
      'You shortlisted 3 practical ideas.',
      'You picked one idea with clear scope and review difficulty.',
      'You wrote the first abstract and module list.',
      'You know which paid kit is useful only if you need deeper execution support.',
    ],
    prompts: (product) => [
      `Help me choose the best final-year project idea from ${product.name} for my department and skill level.`,
      'Turn this project idea into abstract, modules, users, and expected output.',
      'Rate these project ideas by difficulty, uniqueness, and review presentation value.',
    ],
  },
  'startup-ideas': {
    buyerIntent: 'Startup idea validation',
    bestFor: 'Students, first-time founders, creators, and developers who want practical startup ideas with validation steps.',
    notFor: 'Founders expecting guaranteed funding, guaranteed customers, or a done-for-you startup.',
    useCases: (product) => [
      `Use ${product.name} to shortlist startup ideas by pain, buyer, build difficulty, and monetization.`,
      'Turn one raw idea into a validated MVP plan before building.',
      'Create interview questions, landing page copy, and a first launch test.',
    ],
    success: [
      'You selected one clear customer segment.',
      'The problem is painful and specific enough to test.',
      'You interviewed or surveyed real users before building.',
      'MVP scope is small enough to launch quickly.',
      'You have a monetization or waitlist test ready.',
    ],
    prompts: (product) => [
      `Act as a startup mentor. Use ${product.name} to validate my idea before I build.`,
      'Score this startup idea by pain, buyer budget, competition, and MVP difficulty.',
      'Write 10 customer interview questions for this startup idea.',
      'Turn this idea into a one-page lean canvas and 7-day validation plan.',
    ],
  },
  'hackathons': {
    buyerIntent: 'Hackathon idea and winning strategy',
    bestFor: 'College hackathon teams, student developers, designers, and first-time founders preparing for competitions.',
    notFor: 'Teams looking for copied submissions or guaranteed prizes without building and pitching well.',
    useCases: (product) => [
      `Use ${product.name} to pick a demo-friendly hackathon idea and plan the sprint.`,
      'Map the project to judging criteria before writing code.',
      'Prepare a clear pitch, demo script, README, and final submission package.',
    ],
    success: [
      'Idea has a clear user, problem, and visible demo outcome.',
      'MVP is small enough for the hackathon timeline.',
      'Team roles and deadlines are assigned early.',
      'Pitch deck, demo flow, and judge Q&A are prepared.',
      'Submission assets are clean and complete.',
    ],
    prompts: (product) => [
      `Act as a hackathon mentor. Use ${product.name} to help my team choose a winning idea.`,
      'Reduce this hackathon idea into a 24-hour MVP with roles and timeline.',
      'Create a 3-minute pitch script with problem, solution, impact, tech, and demo flow.',
      'Predict judge questions and help me prepare strong answers.',
    ],
  },
  'product-bundles': {
    buyerIntent: 'Higher-value bundle purchase',
    bestFor: 'Buyers who want the complete workflow instead of a single isolated template.',
    notFor: 'Buyers with only one tiny task and no need for the joined products.',
    useCases: (product) => [
      `Use ${product.name} as a complete system, starting from the first included product and ending with a final output.`,
      'Save money compared with buying the same related products separately.',
      'Follow the bundle sequence to complete a larger goal like placement, final-year project, AI productivity, or market learning.',
    ],
    success: [
      'You know the order in which to use the included products.',
      'You completed one output from each part of the bundle.',
      'You used the bundle as a workflow, not a random file dump.',
      'You can reuse the system for the next project, application, or client.',
    ],
    prompts: (product) => [
      `Create a 14-day action plan for using every part of ${product.name}.`,
      'Help me choose which included product to use first based on my goal.',
      'Review my completed outputs from this bundle and find gaps.',
    ],
  },
  'code-templates': {
    buyerIntent: 'Faster development',
    bestFor: 'Developers, students, and freelancers who need reusable website, dashboard, or script foundations.',
    notFor: 'Buyers expecting a fully hosted custom app without setup or editing.',
    useCases: (product) => [
      `Use ${product.name} to start a portfolio, client website, dashboard, or project demo faster.`,
      'Study the structure and customize pages, data, copy, and styling for your own use case.',
      'Convert the template into a portfolio proof item or client delivery starter.',
    ],
    success: [
      'Project runs locally or is clearly ready to customize.',
      'Branding, content, and sample data are replaced.',
      'README or demo explanation is prepared.',
      'You understand where to change layout, content, and core behavior.',
    ],
    prompts: (product) => [
      `Act as a senior developer. Help me customize ${product.name} for my use case.`,
      'Review this template structure and explain what each folder or section does.',
      'Create a deployment and README checklist for this project.',
    ],
  },
  'design-assets': {
    buyerIntent: 'Faster design production',
    bestFor: 'Creators, students, freelancers, and small businesses that need editable design assets.',
    notFor: 'Buyers needing exclusive custom branding created from scratch.',
    useCases: (product) => [
      `Use ${product.name} to create social posts, thumbnails, logos, UI screens, or visual assets quickly.`,
      'Adapt the included design files to one brand, campaign, or content series.',
      'Build a consistent visual style without designing every asset from zero.',
    ],
    success: [
      'Colors, fonts, and text are customized to your brand.',
      'At least 3 finished assets are exported.',
      'Templates are saved for repeated content creation.',
      'The design looks consistent across platforms.',
    ],
    prompts: (product) => [
      `Create a brand customization plan for ${product.name}.`,
      'Give me 20 content ideas that fit these Canva or design templates.',
      'Review this design copy for clarity, readability, and conversion.',
    ],
  },
  'stock-market-investing': {
    buyerIntent: 'Risk-first market education',
    bestFor: 'Students and beginners who want to understand trading and investing before risking real money.',
    notFor: 'Anyone looking for buy/sell calls, guaranteed profit, signals, or financial advice.',
    useCases: (product) => [
      `Use ${product.name} to learn concepts, trading types, investing paths, and risk rules before real decisions.`,
      'Build a paper-trading or study routine instead of following random tips.',
      'Compare intraday, swing, delivery, options, SIP, and long-term investing by risk and time requirement.',
    ],
    success: [
      'You can explain the difference between trading and investing.',
      'You understand risk, stop loss, position size, and time horizon.',
      'You keep a journal or planner before using real money.',
      'You avoid treating this product as investment advice.',
    ],
    prompts: (product) => [
      `Act as an education-only stock market tutor. Use ${product.name} to explain this concept simply.`,
      'Create a 30-day paper-trading learning plan with risk rules and review questions.',
      'Compare these trading types by capital risk, skill needed, and beginner suitability.',
    ],
  },
  'ai-courses': {
    buyerIntent: 'AI skill building',
    bestFor: 'Students, freelancers, creators, developers, and business owners who want structured AI learning with projects.',
    notFor: 'Buyers expecting official certification from the AI company or instant expert results without practice.',
    useCases: (product) => [
      `Follow ${product.name} module by module to build real AI workflows instead of random chatting.`,
      'Complete the projects to create proof for study, freelance, creator, coding, or business use.',
      'Reuse the prompts and assignments to keep improving after finishing the course.',
    ],
    success: [
      'You finished the beginner setup and safety basics.',
      'You built at least two real-world AI workflows.',
      'You can write structured prompts with context, constraints, and output format.',
      'You created a capstone or portfolio artifact.',
    ],
    prompts: (product) => [
      `Act as my AI course tutor. Turn ${product.name} into a weekly study plan for my level.`,
      'Create a project brief, acceptance checklist, and grading rubric for this AI assignment.',
      'Review my prompt and make it more specific, structured, and reusable.',
    ],
  },
  'sales-checkout': {
    buyerIntent: 'Revenue recovery',
    bestFor: 'Digital sellers, local businesses, creators, and founders who need more completed orders from existing traffic.',
    notFor: 'Businesses that have no product, no checkout, and no customer conversations yet.',
    useCases: (product) => [
      `Use ${product.name} to find where buyers drop off and create a recovery workflow.`,
      'Improve payment follow-up, abandoned carts, offers, trust signals, or product launch steps.',
      'Turn sales conversations into a repeatable checkout and follow-up system.',
    ],
    success: [
      'Checkout and payment failure points are listed.',
      'Recovery messages or follow-ups are ready.',
      'Trust and pricing gaps are prioritized.',
      'Recovered orders are tracked weekly.',
    ],
    prompts: (product) => [
      `Act as an e-commerce conversion advisor. Use ${product.name} to audit my store.`,
      'Write WhatsApp and email follow-ups for abandoned checkout recovery.',
      'Score this product page for trust, offer clarity, and checkout friction.',
    ],
  },
  'finance-compliance': {
    buyerIntent: 'Money control',
    bestFor: 'Founders, freelancers, and small sellers who need cleaner finance tracking and compliance habits.',
    notFor: 'Businesses needing legal, tax, or accounting advice from a licensed professional.',
    useCases: (product) => [
      `Use ${product.name} to organize revenue, expenses, invoices, taxes, settlements, or subscriptions.`,
      'Create a monthly money review habit before costs and refunds become messy.',
      'Share cleaner records with an accountant or internal team when needed.',
    ],
    success: [
      'Revenue and expenses are tracked in one place.',
      'Important documents or invoices are organized.',
      'Monthly review date is fixed.',
      'Professional advice is used for legal or tax decisions.',
    ],
    prompts: (product) => [
      `Help me use ${product.name} to create a simple monthly finance review checklist.`,
      'Find missing fields in this invoice, tracker, or settlement sheet.',
      'Create questions I should ask my accountant based on these records.',
    ],
  },
  'client-services': {
    buyerIntent: 'Professional client delivery',
    bestFor: 'Freelancers, agencies, service providers, and students taking client work.',
    notFor: 'People who do not currently offer any service or client-facing work.',
    useCases: (product) => [
      `Use ${product.name} to improve proposals, onboarding, scope, retainers, delivery, or payment follow-up.`,
      'Create clearer client communication before work begins.',
      'Reduce rework by defining deliverables, timeline, approvals, and responsibilities.',
    ],
    success: [
      'Proposal and scope are clear before starting.',
      'Client onboarding questions are answered.',
      'Payment and revision terms are documented.',
      'Delivery checklist is used before handoff.',
    ],
    prompts: (product) => [
      `Act as a freelance operations mentor. Use ${product.name} for my next client project.`,
      'Rewrite this proposal so scope, deliverables, and timeline are clearer.',
      'Create client onboarding questions for this service.',
    ],
  },
  'marketing-content': {
    buyerIntent: 'Consistent lead generation',
    bestFor: 'Creators, marketers, founders, and service businesses that need repeatable content or campaign systems.',
    notFor: 'Buyers expecting viral results without publishing, testing, and follow-up.',
    useCases: (product) => [
      `Use ${product.name} to plan content, SEO, outreach, email, launches, or social media with less guesswork.`,
      'Create reusable content batches and campaign assets.',
      'Connect content to email capture, conversations, and sales pages.',
    ],
    success: [
      'Campaign goal and audience are clear.',
      'Content is planned before publishing.',
      'CTA and follow-up flow are written.',
      'Results are reviewed and improved.',
    ],
    prompts: (product) => [
      `Turn ${product.name} into a 30-day content plan for my niche.`,
      'Create hooks, captions, CTAs, and follow-up messages for this offer.',
      'Review this content plan for clarity, buyer intent, and conversion.',
    ],
  },
  'ai-automation': {
    buyerIntent: 'Productivity automation',
    bestFor: 'Students, freelancers, creators, and teams that want repeatable AI workflows.',
    notFor: 'Buyers expecting AI to replace all thinking, checking, or domain expertise.',
    useCases: (product) => [
      `Use ${product.name} to create reusable prompts, workflows, templates, or productivity systems.`,
      'Turn repeated study, content, coding, support, or business tasks into AI-assisted routines.',
      'Improve output quality using checklists, examples, and review prompts.',
    ],
    success: [
      'Prompts are saved and grouped by workflow.',
      'Outputs are reviewed before use.',
      'One repeated task is made faster or cleaner.',
      'You know what AI should not decide alone.',
    ],
    prompts: (product) => [
      `Use ${product.name} to automate or speed up this repeated task.`,
      'Improve this prompt with role, context, constraints, examples, and output format.',
      'Create a reusable workflow checklist for this AI task.',
    ],
  },
};

const audienceTerms = {
  student: ['student', 'college', 'fresher', 'project', 'viva', 'exam', 'placement'],
  fresher: ['fresher', 'resume', 'linkedin', 'interview', 'job', 'placement'],
  developer: ['developer', 'code', 'website', 'react', 'java', 'android', 'dashboard'],
  freelancer: ['freelancer', 'client', 'proposal', 'contract', 'invoice', 'service'],
  creator: ['creator', 'content', 'digital product', 'canva', 'youtube', 'instagram'],
  business: ['business', 'sales', 'checkout', 'customer', 'finance', 'operations'],
  investor: ['stock', 'trading', 'investing', 'market', 'sip', 'risk'],
  founder: ['startup', 'founder', 'mvp', 'validation', 'saas', 'launch', 'idea'],
  hackathon: ['hackathon', 'team', 'mvp', 'pitch', 'demo', 'judge', 'submission'],
};

const goalTerms = {
  buy_first_product: ['starter', 'beginner', 'guide', 'roadmap', 'template', 'kit'],
  complete_project: ['project', 'report', 'ppt', 'viva', 'github', 'demo'],
  improve_income: ['sales', 'client', 'checkout', 'revenue', 'launch', 'freelance'],
  learn_skill: ['course', 'guide', 'notes', 'roadmap', 'learning', 'curriculum'],
  save_time: ['template', 'automation', 'workflow', 'checklist', 'system'],
  validate_startup: ['startup', 'idea', 'validation', 'mvp', 'customer', 'monetization', 'saas'],
  win_hackathon: ['hackathon', 'mvp', 'pitch', 'demo', 'judge', 'submission', 'team'],
};

const bundleByCategory = {
  'career-placement': 'career-placement-master-bundle',
  'student-projects': 'final-year-project-builder-bundle',
  'free-project-ideas': 'final-year-project-builder-bundle',
  'startup-ideas': 'startup-hackathon-builder-bundle',
  'hackathons': 'startup-hackathon-builder-bundle',
  'stock-market-investing': 'stock-market-beginner-bundle',
  'ai-courses': 'ai-student-productivity-bundle',
  'ai-automation': 'ai-student-productivity-bundle',
  'code-templates': 'developer-website-template-bundle',
  'design-assets': 'creator-marketing-design-bundle',
  'creator-products': 'creator-marketing-design-bundle',
  'marketing-content': 'creator-marketing-design-bundle',
  'client-services': 'freelance-proposal-contract-bundle',
};

function getPlaybook(product) {
  return categoryPlaybooks[product?.category] || defaultPlaybook;
}

function textBlob(product) {
  return [
    product?.name,
    product?.description,
    product?.longDesc,
    product?.audience,
    product?.problem,
    product?.outcome,
    product?.category,
    product?.format,
    ...(product?.features || []),
    ...(product?.curriculum || []),
    ...(product?.realWorldProjects || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function unique(items, limit = 4) {
  const seen = new Set();
  return items
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function includedCount(product) {
  if (Array.isArray(product?.includedProducts) && product.includedProducts.length) return product.includedProducts.length;
  if (product?.bundle === true) return 3;
  return 1;
}

function buildQuickStartPlan(product, playbook) {
  const firstFeature = product?.features?.[0];
  const secondFeature = product?.features?.[1];
  return unique([
    `Day 1: Read the overview and define your exact goal for ${product.name}.`,
    firstFeature && `Day 2: Customize the first asset: ${firstFeature}.`,
    secondFeature && `Day 3: Apply the next asset: ${secondFeature}.`,
    product?.realWorldProjects?.[0] && `Day 4-5: Complete the project: ${product.realWorldProjects[0]}.`,
    product?.outcome && `Day 6: Compare your output with the expected outcome: ${product.outcome}.`,
    'Day 7: Save your final version, checklist, and next improvement task.',
    ...playbook.success.slice(0, 1),
  ], 6);
}

export function getProductValueContent(product = {}) {
  const playbook = getPlaybook(product);
  const featureCount = Array.isArray(product.features) ? product.features.length : 0;
  const projectCount = Array.isArray(product.realWorldProjects) ? product.realWorldProjects.length : 0;
  const fileCount = Array.isArray(product.fileList) ? product.fileList.length : 0;
  const bundleCount = includedCount(product);
  const practicalUseCases = Array.isArray(product.realWorldProjects) && product.realWorldProjects.length
    ? product.realWorldProjects
    : playbook.useCases(product);

  return {
    buyerIntent: playbook.buyerIntent,
    valueSummary: product.outcome || product.longDesc || product.description || 'A practical digital product for a focused workflow.',
    bestFor: product.audience || playbook.bestFor,
    notFor: product.category === 'stock-market-investing'
      ? categoryPlaybooks['stock-market-investing'].notFor
      : playbook.notFor,
    valueHighlights: unique([
      product.problem && `Solves a real problem: ${product.problem}`,
      product.outcome && `Expected outcome: ${product.outcome}`,
      featureCount > 0 && `${featureCount} practical included assets or lessons.`,
      projectCount > 0 && `${projectCount} real-world project examples or assignments.`,
      fileCount > 0 && `${fileCount} downloadable files prepared for instant access.`,
      product.bundle === true && `Bundle value: ${bundleCount} joined products in one purchase.`,
    ], 5),
    quickStartPlan: buildQuickStartPlan(product, playbook),
    practicalUseCases: unique(practicalUseCases, 4),
    successChecklist: unique(playbook.success, 5),
    aiPrompts: unique(playbook.prompts(product), 4),
    upgradeTip: product.bundle === true
      ? 'Best choice when you want the full workflow in one purchase.'
      : 'Buy this single product first if the exact problem matches. Upgrade to a bundle only when you need the full workflow.',
  };
}

function scoreTermMatches(text, terms, points) {
  return terms.filter((term) => text.includes(term)).length * points;
}

export function buildProductCoach(product = {}, answers = {}, catalog = []) {
  const valueContent = getProductValueContent(product);
  const text = textBlob(product);
  let score = 48;
  const reasons = [];

  const audience = answers.audience || 'student';
  const audienceMatches = scoreTermMatches(text, audienceTerms[audience] || [], 6);
  if (audienceMatches > 0) {
    score += Math.min(24, audienceMatches);
    reasons.push(`Strong audience fit for ${audience}.`);
  }

  const goal = answers.goal || 'buy_first_product';
  const goalMatches = scoreTermMatches(text, goalTerms[goal] || [], 7);
  if (goalMatches > 0) {
    score += Math.min(22, goalMatches);
    reasons.push('Matches your selected buying goal.');
  }

  const price = Number(product.price || 0);
  if (answers.budget === 'free' && price === 0) {
    score += 18;
    reasons.push('Free starter product, good for testing the platform.');
  } else if (answers.budget === 'low' && price <= 299) {
    score += 14;
    reasons.push('Low-cost single product.');
  } else if (answers.budget === 'bundle' && product.bundle === true) {
    score += 18;
    reasons.push('Bundle purchase gives more complete value.');
  } else if (answers.budget === 'premium' && (product.premium || product.bundle || price >= 699)) {
    score += 12;
    reasons.push('Premium learning or system product.');
  }

  if (answers.stage === 'beginner' && /beginner|basics|starter|roadmap|zero/i.test(text)) {
    score += 12;
    reasons.push('Beginner-friendly starting point.');
  }
  if (answers.stage === 'advanced' && /advanced|expert|complete|automation|system|bundle/i.test(text)) {
    score += 12;
    reasons.push('Deeper system for advanced use.');
  }

  score = Math.max(18, Math.min(98, score));
  const bundleSlug = bundleByCategory[product.category];
  const bundlePick = bundleSlug
    ? catalog.find((item) => item.slug === bundleSlug && item.slug !== product.slug)
    : null;

  let verdict = 'Good fit';
  if (score >= 82) verdict = 'Excellent fit';
  if (score < 58) verdict = 'Useful, but check fit before buying';

  return {
    fitScore: score,
    verdict,
    reasons: unique(reasons.length ? reasons : valueContent.valueHighlights, 4),
    recommendedPath: unique([
      Number(product.price || 0) > 0 && 'Download the free sample first to inspect the style and structure.',
      `Use the product for this first outcome: ${product.outcome || product.description}`,
      bundlePick && `If you need the complete workflow, compare it with ${bundlePick.name}.`,
      product.category === 'stock-market-investing' && 'Use this as education only, not financial advice or trade calls.',
      'After purchase, save the product in your dashboard and complete the quick-start plan.',
    ], 5),
    quickStartPlan: valueContent.quickStartPlan,
    aiPrompts: valueContent.aiPrompts,
    bundlePick: bundlePick ? {
      slug: bundlePick.slug,
      name: bundlePick.name,
      price: Number(bundlePick.price || 0),
      comparePrice: Number(bundlePick.comparePrice || 0),
    } : null,
  };
}
