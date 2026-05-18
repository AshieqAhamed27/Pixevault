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
