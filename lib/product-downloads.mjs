const productDownloads = {
  'payment-failure-recovery-kit': {
    filename: 'payment-failure-recovery-kit.md',
    content: `# Payment Failure Recovery Kit

Use this kit to recover customers who tried to pay but got blocked by failed UPI, card, or checkout issues.

## 30-minute setup

1. Open Razorpay Dashboard and export failed payments for the last 30 days.
2. Group failures by reason: bank failure, UPI timeout, customer abandoned, risk check, incorrect contact, insufficient funds.
3. Add each failed payment to the tracker below.
4. Send the matching recovery script within 15 minutes for fresh failures and within 24 hours for older failures.
5. Review recovery rate every Friday.

## Recovery tracker

| Date | Customer | Product | Amount | Failure reason | Contact | Follow-up stage | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Name | Product | 799 | UPI timeout | email/phone | Retry link sent | Pending |  |

## Customer scripts

### UPI failed

Hi {{name}}, your payment for {{product}} did not complete because UPI timed out. You can safely retry here: {{payment_link}}. I will confirm your order as soon as it succeeds.

### Card failed

Hi {{name}}, your card payment did not go through. You can retry with UPI, netbanking, or another card here: {{payment_link}}. Your cart amount is still locked at {{amount}}.

### Abandoned checkout

Hi {{name}}, just checking if anything blocked your purchase of {{product}}. Here is the checkout link again: {{payment_link}}. Reply if you want help before paying.

## Checkout audit

- Razorpay key is live, not test.
- Product price in database matches storefront price.
- Checkout opens within 2 seconds after clicking pay.
- Mobile number field accepts Indian formats.
- Error messages tell the user what to do next.
- A failed payment creates a manual follow-up task.
- The retry link is sent within 15 minutes.

## Weekly metrics

| Metric | Formula | Target |
| --- | --- | --- |
| Failed payment count | Count of failed attempts | Down week over week |
| Recovery rate | Recovered / failed attempts | 15%+ |
| Time to first follow-up | First message time - failed time | Under 15 minutes |
| Top failure reason | Highest count reason | Fix one each week |
`,
  },
  'freelancer-late-payment-rescue-kit': {
    filename: 'freelancer-late-payment-rescue-kit.md',
    content: `# Freelancer Late Payment Rescue Kit

Use this kit to collect overdue invoices without sounding desperate, angry, or unclear.

## Payment tracker

| Client | Invoice | Amount | Sent date | Due date | Days overdue | Last reminder | Next action | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Client name | INV-001 | 25000 | YYYY-MM-DD | YYYY-MM-DD | 0 | None | Friendly reminder | Unpaid |

## Follow-up sequence

### 3 days before due date

Subject: Upcoming payment for {{project}}

Hi {{name}}, quick reminder that invoice {{invoice_no}} for {{amount}} is due on {{due_date}}. Sharing the payment link again for convenience: {{payment_link}}.

### 1 day after due date

Subject: Payment reminder for {{invoice_no}}

Hi {{name}}, I noticed invoice {{invoice_no}} is now due. Could you confirm when payment will be processed? The payment link is here: {{payment_link}}.

### 7 days overdue

Subject: Action needed: overdue invoice {{invoice_no}}

Hi {{name}}, invoice {{invoice_no}} is now 7 days overdue. Please process payment by {{date}} or share the expected payment date today so I can update my schedule.

### 14 days overdue

Subject: Work pause notice for overdue invoice {{invoice_no}}

Hi {{name}}, because invoice {{invoice_no}} remains unpaid, I will pause active work from {{date}} until payment is received. I am happy to resume immediately after confirmation.

## Preventive contract clauses

- Payment due within 7 days of invoice unless agreed in writing.
- Work may pause when an invoice is more than 7 days overdue.
- Revisions begin after milestone payment is received.
- Additional scope is billed separately before implementation.

## Weekly routine

Every Monday, sort invoices by days overdue, send the next reminder, and move any unpaid 14-day invoices to paused status.
`,
  },
  'client-proposal-scope-kit': {
    filename: 'client-proposal-scope-kit.md',
    content: `# Client Proposal & Scope Kit

Use this kit to win better clients and protect your project margin before work starts.

## Proposal structure

1. Problem summary: What the client is trying to solve.
2. Outcome: The measurable result this project should create.
3. Scope: What is included.
4. Not included: What would require a separate quote.
5. Timeline: Milestones and response-time assumptions.
6. Investment: Price, payment schedule, and expiry date.
7. Next step: Payment link or signature step.

## Scope boundary checklist

- Number of pages/screens/deliverables is stated.
- Number of revisions is stated.
- Client content responsibilities are stated.
- Integrations and third-party costs are listed.
- Launch support window is defined.
- Change request process is included.

## Pricing calculator

| Item | Estimate |
| --- | --- |
| Delivery hours |  |
| Strategy hours |  |
| Revision hours |  |
| Admin/client calls |  |
| Hourly floor rate |  |
| Risk buffer % |  |
| Minimum profitable price |  |

Formula: (total hours * hourly floor rate) * (1 + risk buffer)

## Change request response

Hi {{name}}, this is a useful addition. It is outside the agreed scope, so I can add it as a separate change request. The estimate is {{price}} and {{timeline}}. Once approved, I will schedule it after the current milestone.

## Kickoff questions

- What business result should this project improve?
- Who approves final work?
- What content/assets are already ready?
- What deadline is fixed and why?
- What would make this project feel successful 30 days after launch?
`,
  },
  'solo-founder-finance-tracker': {
    filename: 'solo-founder-finance-tracker.md',
    content: `# Solo Founder Finance Tracker

Use this kit once a week to stop revenue, refunds, GST, fees, and subscriptions from becoming month-end chaos.

## Monthly dashboard

| Metric | Amount |
| --- | --- |
| Gross sales |  |
| Refunds |  |
| Payment gateway fees |  |
| Net revenue |  |
| Tool subscriptions |  |
| Contractor costs |  |
| Estimated GST |  |
| Owner payout |  |
| Cash remaining |  |

## Transaction log

| Date | Source | Description | Revenue | Expense | GST included? | Category | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Razorpay | Product sale | 799 | 0 | Yes | Sales |  |

## Razorpay settlement check

1. Export payments from Razorpay.
2. Export settlements.
3. Match payment IDs to settlements.
4. Mark fees, refunds, and failed payments separately.
5. Investigate any payment not settled after the expected settlement window.

## Subscription audit

| Tool | Monthly cost | Owner | Used this month? | Keep / cancel |
| --- | --- | --- | --- | --- |
| Tool name | 999 | You | Yes | Keep |

## Founder questions

- Which product created the highest net revenue?
- Which expense did not create measurable value?
- What should be reserved for tax before owner payout?
- What recurring cost can be reduced this month?
`,
  },
  'micro-saas-launch-ops-pack': {
    filename: 'micro-saas-launch-ops-pack.md',
    content: `# Micro SaaS Launch Ops Pack

Use this pack to move from idea to first paying users without hiding inside code for months.

## Validation scorecard

Score each item from 0 to 3.

| Question | Score |
| --- | --- |
| Buyer has this problem weekly |  |
| Problem costs time or money |  |
| Buyer already uses a workaround |  |
| You can reach 50 buyers directly |  |
| MVP can solve one narrow workflow |  |
| Buyer can pay without committee approval |  |

If total score is under 10, narrow the audience or problem.

## Landing page promise

For {{audience}} who struggle with {{pain}}, {{product}} helps them {{outcome}} without {{bad alternative}}.

## Pricing experiment

Start with three price tests:

| Plan | Price | Who it is for | Limit |
| --- | --- | --- | --- |
| Starter | 499/mo | Solo users | 1 project |
| Pro | 1499/mo | Small teams | 10 projects |
| Done-with-you setup | 4999 one-time | Busy founders | Setup call |

## Launch checklist

- 20 problem interviews completed.
- 5 people asked to pay before build is complete.
- One core workflow works end to end.
- Onboarding email is ready.
- Cancellation path is clear.
- Support macros are ready.
- Metrics dashboard tracks signups, activation, payment, churn.

## Support macros

### Feature request

Thanks for the idea. I am tracking this with similar requests. Can you tell me what job you were trying to finish when you needed it?

### Bug report

Thanks for reporting this. Please send the page URL, expected result, actual result, and a screenshot if possible. I will confirm once it is reproduced.
`,
  },
  'whatsapp-commerce-automation-kit': {
    filename: 'whatsapp-commerce-automation-kit.md',
    content: `# WhatsApp Commerce Automation Kit

Use this kit to convert chat interest into paid orders without rewriting the same replies all day.

## Daily chat-to-order tracker

| Date | Customer | Need | Product suggested | Payment link sent | Follow-up due | Status |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Name | Problem | Product | Yes | Tomorrow | Pending |

## Quick replies

### Product recommendation

Based on what you shared, I recommend {{product}} because it helps with {{outcome}}. It includes {{top_3_items}} and you can buy it here: {{payment_link}}.

### Price objection

I understand. The goal of this product is to save you {{time_or_money}} by giving you a ready system instead of starting from scratch. You can use it immediately after purchase.

### Payment nudge

Sharing the payment link again for convenience: {{payment_link}}. Once payment is complete, you will receive the download link by email.

## FAQ bank

- What do I receive after payment?
- Can I use this for my own business?
- Is this a one-time payment?
- Can I edit the templates?
- What if I need help after purchase?

## Follow-up timing

- 15 minutes after payment link: ask if anything blocked payment.
- 24 hours later: share one concrete benefit and resend link.
- 3 days later: final helpful reminder, then stop.
`,
  },
  'ai-support-macro-vault': {
    filename: 'ai-support-macro-vault.md',
    content: `# AI Support Macro Vault

Use this vault to answer customer questions quickly while keeping your tone calm and professional.

## Support categories

| Category | Use when |
| --- | --- |
| Pre-sale | Buyer asks if product fits their situation |
| Delivery | Buyer cannot find or open files |
| Refund | Buyer asks for money back |
| Bug | Buyer reports a broken link or file issue |
| Escalation | Buyer is upset or confused |

## Macros

### Delivery issue

Hi {{name}}, sorry for the trouble. I am checking the delivery link now. Please try this link first: {{download_link}}. If it still does not open, reply with the device/browser you are using and I will help.

### Refund request

Hi {{name}}, I understand. Please share what did not work for your use case so I can review it against the refund policy and resolve this fairly.

### Pre-sale fit

This is a good fit if you want {{outcome}} and you are currently struggling with {{problem}}. It may not be a fit if you need a custom service or done-for-you implementation.

## AI rewrite prompts

- Rewrite this support reply to sound calmer and more helpful: {{reply}}.
- Turn this angry customer message into the core issue and next action: {{message}}.
- Create three shorter versions of this refund reply: {{reply}}.

## Quality checklist

- Acknowledge the issue.
- Give one next step.
- Avoid blame.
- Include timeline if needed.
- Ask only one question at a time.
`,
  },
  'gst-invoice-compliance-starter-pack': {
    filename: 'gst-invoice-compliance-starter-pack.md',
    content: `# GST Invoice Compliance Starter Pack

Use this pack to keep monthly invoice and payment records tidy before accountant handoff.

## Invoice field checklist

- Seller legal name and address.
- Buyer name and address.
- GSTIN where applicable.
- Invoice number and date.
- Description of goods/services.
- Taxable value.
- GST rate and amount.
- Total invoice amount.
- Payment status and payment reference.

## Monthly folder structure

Create one folder per month:

- 01-invoices-issued
- 02-payment-proofs
- 03-refunds-credit-notes
- 04-expenses
- 05-accountant-notes

## Accountant handoff note

Month: {{month}}

Total sales: {{amount}}
Refunds: {{amount}}
Payment gateway fees: {{amount}}
Open questions:

1. {{question}}
2. {{question}}

## Payment proof tracker

| Invoice | Customer | Amount | Payment date | Payment ID | Proof saved? |
| --- | --- | --- | --- | --- | --- |
| INV-001 | Customer | 1000 | YYYY-MM-DD | pay_xxx | Yes |
`,
  },
  'ecommerce-conversion-audit-kit': {
    filename: 'ecommerce-conversion-audit-kit.md',
    content: `# E-commerce Conversion Audit Kit

Use this kit before spending more on ads. Fix the store leaks first.

## Audit scorecard

Score each item from 0 to 2.

| Area | Question | Score |
| --- | --- | --- |
| Offer | Is the product outcome clear in 5 seconds? |  |
| Trust | Are refund, delivery, and support details visible? |  |
| Proof | Are reviews, numbers, or examples shown? |  |
| Checkout | Can a mobile user pay without confusion? |  |
| Product page | Are features connected to real problems? |  |

## Checkout friction checklist

- Payment button is visible without hunting.
- Customer knows what happens after payment.
- Email and phone fields are clear.
- UPI, cards, and wallet options are enabled.
- Failed payment path gives a retry option.

## 7-day fix plan

Day 1: Rewrite headline and product promise.
Day 2: Add delivery/refund FAQ.
Day 3: Improve product cards and proof.
Day 4: Test checkout on mobile.
Day 5: Add failed-payment follow-up.
Day 6: Add post-purchase email clarity.
Day 7: Review analytics and repeat.
`,
  },
  'creator-content-repurposing-system': {
    filename: 'creator-content-repurposing-system.md',
    content: `# Creator Content Repurposing System

Use this system to turn one strong idea into a week of content.

## One idea input

Core idea:
Audience:
Pain:
Lesson:
Product tie-in:

## Repurposing map

| Format | Output |
| --- | --- |
| LinkedIn post | Personal lesson + practical takeaway |
| Instagram carousel | 5-step visual breakdown |
| Short video | Hook + 3 points + CTA |
| Email | Story + lesson + product link |
| Sales post | Problem + proof + offer |

## Hook bank

- Most {{audience}} lose time here: {{problem}}.
- I fixed {{problem}} by changing one workflow.
- Before you buy another tool, check this.
- Here is the checklist I wish I had earlier.

## AI prompts

- Turn this idea into five LinkedIn hooks: {{idea}}.
- Convert this post into a 7-slide carousel outline: {{post}}.
- Create a short video script with a strong first line: {{idea}}.
`,
  },
  'refund-policy-trust-kit': {
    filename: 'refund-policy-trust-kit.md',
    content: `# Refund Policy & Trust Kit

Use this kit to remove buyer hesitation and reduce disputes after purchase.

## Refund policy template

Because this is a digital product delivered instantly, refunds are reviewed case by case. If the file is broken, inaccessible, or not as described, contact us within 7 days with your order ID and we will fix the issue or provide a fair resolution.

## Delivery promise

After successful payment, your download link is sent to the email used at checkout. If it does not arrive within 10 minutes, check spam first, then contact support with your order ID.

## FAQ

### Can I edit the files?

Yes. The templates are designed to be copied, edited, and adapted for your own business.

### Is this a subscription?

No. It is a one-time payment.

### Can I resell the files?

No. You can use them for your own business, but you cannot resell or redistribute the original files.

## Dispute prevention checklist

- Product outcome is clear.
- File format is listed.
- Delivery method is explained.
- Refund rules are visible before payment.
- Support contact is easy to find.
`,
  },
  'ai-business-prompt-operating-system': {
    filename: 'ai-business-prompt-operating-system.md',
    content: `# AI Business Prompt Operating System

Use this operating system to turn AI from a random chat tool into repeatable workflows.

## Prompt library structure

| Folder | Use for |
| --- | --- |
| Sales | Outreach, objections, proposals, follow-ups |
| Support | Refunds, delivery issues, complaints, FAQs |
| Content | Hooks, outlines, emails, short videos |
| Operations | SOPs, checklists, meeting summaries |
| Strategy | Positioning, pricing, product ideas |

## Prompt formula

Role: Act as {{expert_role}}.
Context: Here is my business, audience, and goal: {{context}}.
Task: Create {{output}}.
Constraints: Keep it {{tone}}, {{length}}, and focused on {{business_outcome}}.
Review: Ask 3 questions if important details are missing.

## Reusable prompts

### Sales objection

Turn this customer objection into three helpful replies: {{objection}}. Keep the tone calm, specific, and non-pushy.

### SOP builder

Create a step-by-step SOP for {{task}}. Include owner, trigger, inputs, steps, quality checks, and completion criteria.

### Content repurpose

Turn this idea into one LinkedIn post, one email, one short video script, and one product CTA: {{idea}}.

## Output scorecard

- Is it specific to the audience?
- Does it include a clear next action?
- Is it usable without rewriting everything?
- Does it reduce time or improve revenue?
`,
  },
  'digital-product-store-launch-kit': {
    filename: 'digital-product-store-launch-kit.md',
    content: `# Digital Product Store Launch Kit

Use this kit to launch a store with multiple products, clear pricing, delivery, and promotion.

## Product ladder

| Tier | Price | Product | Goal |
| --- | --- | --- | --- |
| Starter | 499-799 | Small template | First purchase |
| Core | 999-1499 | Full workflow kit | Main revenue |
| Premium | 2499+ | Bundle or setup | Higher AOV |

## Store launch checklist

- Products solve different but related problems.
- Each product has a clear audience, problem, outcome, and deliverables.
- Checkout is tested with one real low-value payment.
- Delivery email includes download links.
- Refund, delivery, and support copy are visible.
- Search and categories help buyers find the right tool.

## 14-day launch calendar

Day 1: Announce the problem your store solves.
Day 2: Show product one and its outcome.
Day 3: Share a customer pain story.
Day 4: Show behind-the-scenes files.
Day 5: Compare before/after workflow.
Day 6: Answer objections.
Day 7: Soft launch offer.
Day 8-14: Repeat with proof, FAQs, and reminders.
`,
  },
  'small-business-sop-vault': {
    filename: 'small-business-sop-vault.md',
    content: `# Small Business SOP Vault

Use this vault to document repeatable work so your business stops relying on memory.

## SOP template

Title:
Owner:
Trigger:
Inputs needed:
Tools used:
Expected output:

### Steps

1. 
2. 
3. 

### Quality checks

- The output matches the required format.
- The customer/team has the next step.
- Files and notes are saved in the right place.

## SOP list

- New lead response
- Proposal creation
- Invoice follow-up
- Customer onboarding
- Product delivery
- Refund handling
- Weekly finance review
- Content publishing
- Review collection

## Delegation tracker

| SOP | Current owner | Backup owner | Last updated | Quality score |
| --- | --- | --- | --- | --- |
| Lead response | Owner | Assistant | YYYY-MM-DD |  |
`,
  },
  'seo-content-brief-factory': {
    filename: 'seo-content-brief-factory.md',
    content: `# SEO Content Brief Factory

Use this factory to create consistent briefs before writing or assigning articles.

## Brief template

Keyword:
Search intent:
Audience:
Reader problem:
Product/service tie-in:
Primary CTA:

## Article structure

1. Hook the reader with the pain.
2. Define the problem clearly.
3. Give practical steps.
4. Add examples or templates.
5. Answer FAQs.
6. Close with the next action.

## FAQ mining

| Question | Source | Answer angle |
| --- | --- | --- |
|  | Google/Reddit/Sales calls |  |

## AI outline prompt

Create an SEO content brief for {{keyword}} targeting {{audience}}. Include search intent, title options, H2 outline, FAQs, internal link suggestions, and a product CTA.
`,
  },
  'email-list-monetization-kit': {
    filename: 'email-list-monetization-kit.md',
    content: `# Email List Monetization Kit

Use this kit to guide subscribers toward useful products without spamming them.

## Welcome sequence

Email 1: Deliver the promised free value.
Email 2: Tell the audience problem story.
Email 3: Teach one quick win.
Email 4: Show the paid product outcome.
Email 5: Answer objections.
Email 6: Share proof or example.
Email 7: Make a direct offer.

## Offer email

Subject: A faster way to solve {{problem}}

Hi {{name}},

If you are trying to {{outcome}}, I built {{product}} to save you from {{bad_alternative}}.

Inside you get:
- {{deliverable_1}}
- {{deliverable_2}}
- {{deliverable_3}}

Get it here: {{link}}

## Revenue tracker

| Campaign | Subscribers | Opens | Clicks | Sales | Revenue |
| --- | --- | --- | --- | --- | --- |
`,
  },
  'local-business-review-growth-kit': {
    filename: 'local-business-review-growth-kit.md',
    content: `# Local Business Review Growth Kit

Use this kit to ask happy customers for reviews at the right moment.

## Review request script

Hi {{name}}, thank you for choosing us. If you were happy with the service, could you leave a quick review here? {{review_link}}. It helps other customers trust us.

## QR card copy

Loved the service?
Scan this code and leave a quick review. It takes less than one minute and helps a small local business grow.

## Negative review response

Hi {{name}}, thank you for sharing this. I am sorry the experience did not meet expectations. Please contact us at {{contact}} with your booking/order details so we can look into it properly.

## Weekly tracker

| Week | Requests sent | Reviews received | Average rating | Follow-ups needed |
| --- | --- | --- | --- | --- |
`,
  },
  'course-lesson-builder-kit': {
    filename: 'course-lesson-builder-kit.md',
    content: `# Course Lesson Builder Kit

Use this kit to turn expertise into a compact paid course.

## Course outcome

By the end of this course, the student can {{specific_result}} without {{painful_alternative}}.

## Lesson planner

| Lesson | Outcome | Teaching points | Exercise | Resource |
| --- | --- | --- | --- | --- |
| 1 |  |  |  |  |

## Lesson script

1. Name the problem.
2. Explain the concept.
3. Show one example.
4. Give the student an exercise.
5. Summarize the result.

## Worksheet builder

Prompt:
Student answer:
Example answer:
Common mistake:
Next step:
`,
  },
  'customer-retention-playbook': {
    filename: 'customer-retention-playbook.md',
    content: `# Customer Retention Playbook

Use this playbook to turn one-time buyers into repeat customers.

## Post-purchase journey

Day 0: Deliver product and explain next step.
Day 2: Ask if the customer could access everything.
Day 5: Send one quick-win usage tip.
Day 10: Ask for feedback.
Day 21: Recommend the next relevant product.
Day 45: Win-back or bundle offer.

## Repeat purchase email

Subject: Your next useful tool

Hi {{name}}, since you bought {{previous_product}}, the next product I recommend is {{next_product}} because it helps with {{related_problem}}.

You can view it here: {{link}}

## Retention dashboard

| Metric | Current | Goal |
| --- | --- | --- |
| Repeat purchase rate |  |  |
| Refund rate |  |  |
| Review rate |  |  |
| Support response time |  |  |
`,
  },
  'creator-sales-starter-kit': {
    filename: 'creator-sales-starter-kit.md',
    content: `# Creator Sales Starter Kit

Use this kit to turn one skill into a paid digital product offer.

## Offer planner

| Prompt | Answer |
| --- | --- |
| Who has the problem? |  |
| What painful job are they trying to finish? |  |
| What result can you help them reach quickly? |  |
| What assets will they receive? |  |
| What is the price? |  |
| What proof or credibility can you show? |  |

## Sales page copy

Headline: Get {{specific outcome}} without {{painful alternative}}.

Sections:

1. Problem: Name the costly frustration.
2. Promise: Show the result.
3. Product: List what is included.
4. Proof: Add examples, screenshots, or experience.
5. Price: Make the buying decision simple.
6. FAQ: Remove the top 5 objections.

## Launch checklist

- Product files are ready.
- Checkout is tested with a small real payment.
- Delivery email has the download link.
- Three launch posts are written.
- Ten direct outreach messages are ready.
- A refund/support email is ready.

## AI prompts

- Create 10 product names for a template that helps {{audience}} solve {{problem}}.
- Rewrite this product description to focus on time saved and money recovered: {{description}}.
- Create a 5-email launch sequence for {{product}}.
- List 20 objections a buyer might have before purchasing {{product}}.
`,
  },
};

export function getProductDownload(slug) {
  return productDownloads[slug] || null;
}
