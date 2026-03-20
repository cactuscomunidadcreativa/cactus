/**
 * SVG sanitization and data-URI utilities for safe inline rendering.
 */

/**
 * Sanitize an SVG string by removing dangerous elements and attributes.
 * - Strips <script> tags
 * - Strips event handler attributes (onclick, onload, onerror, etc.)
 * - Strips <foreignObject> tags
 * - Strips XML comments
 * - Strips <filter> and <fe*> elements (they break img rendering)
 * - Ensures proper xmlns attribute on root <svg>
 */
export function sanitizeSVG(svgString: string): string {
  let svg = svgString;

  // Remove XML comments
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');

  // Remove <script> tags and their contents
  svg = svg.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  // Also remove self-closing <script /> tags
  svg = svg.replace(/<script\b[^>]*\/>/gi, '');

  // Remove <foreignObject> tags and their contents
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '');
  svg = svg.replace(/<foreignObject\b[^>]*\/>/gi, '');

  // Remove <filter> elements and their contents
  svg = svg.replace(/<filter[\s\S]*?<\/filter\s*>/gi, '');
  svg = svg.replace(/<filter\b[^>]*\/>/gi, '');

  // Remove <fe*> elements (feGaussianBlur, feDropShadow, feColorMatrix, etc.)
  svg = svg.replace(/<fe[A-Za-z]+[\s\S]*?<\/fe[A-Za-z]+\s*>/gi, '');
  svg = svg.replace(/<fe[A-Za-z]+\b[^>]*\/>/gi, '');

  // Remove event handler attributes (on*)
  svg = svg.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove filter="url(...)" references since we stripped <filter> defs
  svg = svg.replace(/\s+filter\s*=\s*(?:"[^"]*"|'[^']*')/gi, '');

  // Ensure the root <svg> element has the xmlns attribute
  if (/<svg\b/i.test(svg) && !/xmlns\s*=/i.test(svg)) {
    svg = svg.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svg.trim();
}

/**
 * Convert an SVG string to a base64-encoded data URI for use in <img src>.
 * The SVG is sanitized before encoding.
 */
export function svgToDataUri(svgString: string): string {
  const sanitized = sanitizeSVG(svgString);
  const base64 = Buffer.from(sanitized, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
