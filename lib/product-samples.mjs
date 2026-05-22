import { getProductValueContent } from './product-intelligence.mjs';

function linesFrom(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function buildProductSample(product) {
  const features = linesFrom(product.features).slice(0, 4);
  const curriculum = linesFrom(product.curriculum).slice(0, 4);
  const projects = linesFrom(product.realWorldProjects).slice(0, 3);
  const preview = linesFrom(product.preview).slice(0, 5);
  const valueContent = getProductValueContent(product);

  return `# ${product.name} - Free Sample

This is a sample preview from PixelVault. The full product is delivered digitally after checkout and may include templates, guides, checklists, scripts, source-code structure, or project workflows depending on the product.

## Who this helps
${product.audience || 'Students, freelancers, creators, and small business owners'}

## Problem solved
${product.problem || product.description}

## Expected outcome
${product.outcome || 'A practical workflow or asset you can customize and use.'}

## Why this product is valuable
${valueContent.valueHighlights.map((item) => `- ${item}`).join('\n')}

## Quick-start plan
${valueContent.quickStartPlan.slice(0, 4).map((item) => `- ${item}`).join('\n')}

${features.length ? `## Included in the full product
${features.map((feature) => `- ${feature}`).join('\n')}
` : ''}
${curriculum.length ? `## Course preview
${curriculum.map((item) => `- ${item}`).join('\n')}
` : ''}
${projects.length ? `## Project preview
${projects.map((project) => `- ${project}`).join('\n')}
` : ''}
${preview.length ? `## Sample notes
${preview.map((item) => `- ${item}`).join('\n')}
` : ''}
## AI prompts to use with this product
${valueContent.aiPrompts.slice(0, 3).map((item) => `- ${item}`).join('\n')}

## Delivery and support
- Instant digital access after payment.
- Download access is protected by order token.
- If a file is broken or not as described, contact support with your order ID.
`;
}

export function buildDefaultFileList(product) {
  const slug = product.slug || 'product';
  const files = [`${slug}-main-guide.md`];

  if (Array.isArray(product.features) && product.features.length > 3) files.push(`${slug}-templates.md`);
  if (Array.isArray(product.curriculum) && product.curriculum.length > 0) files.push(`${slug}-course-curriculum.md`);
  if (Array.isArray(product.realWorldProjects) && product.realWorldProjects.length > 0) files.push(`${slug}-project-workbook.md`);
  if (product.bundle === true || Array.isArray(product.includedProducts)) files.push(`${slug}-bundle-index.md`);

  return [...new Set(files)];
}

export function buildDefaultPreview(product) {
  return [
    product.problem && `Problem: ${product.problem}`,
    product.outcome && `Outcome: ${product.outcome}`,
    Array.isArray(product.features) && product.features[0] && `First asset: ${product.features[0]}`,
    Array.isArray(product.realWorldProjects) && product.realWorldProjects[0] && `Project: ${product.realWorldProjects[0]}`,
  ].filter(Boolean);
}
