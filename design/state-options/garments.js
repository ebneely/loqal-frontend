/* Generated from src/components/garment.tsx. One source of truth for the
   twelve drawings; regenerate rather than editing by hand. */
export const GARMENTS = {
  tee: '<path d="M40 26 L30 34 L22 52 L34 58 L38 50 L38 96 L82 96 L82 50 L86 58 L98 52 L90 34 L80 26 L70 26 Q60 38 50 26 Z" />',
  shirt:
    '<path d="M42 24 L30 32 L22 52 L33 58 L37 50 L37 98 L83 98 L83 50 L87 58 L98 52 L90 32 L78 24 L60 34 Z" /><path d="M60 34 L60 98" /><path d="M42 24 L60 34 L78 24" /><rect data-solid="true" x="66" y="50" width="12" height="14" />',
  knit: '<path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Q60 34 44 26 Z" /><path d="M44 26 Q60 20 76 26" /><path d="M36 90 L84 90" />',
  sweat:
    '<path d="M44 26 L26 36 L18 60 L30 66 L36 54 L36 98 L84 98 L84 54 L90 66 L102 60 L94 36 L76 26 Z" /><path d="M46 26 Q60 40 74 26" /><path data-solid="true" d="M36 92 L84 92 L84 98 L36 98 Z" /><path d="M30 92 L90 92" />',
  pants:
    '<path data-solid="true" d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z" /><path d="M40 20 L80 20 L84 62 L78 104 L64 104 L60 60 L56 104 L42 104 L36 62 Z" /><path d="M40 30 L80 30" />',
  shorts:
    '<path d="M38 24 L82 24 L86 56 L80 84 L64 84 L60 56 L56 84 L40 84 L34 56 Z" /><path d="M38 34 L82 34" />',
  jacket:
    '<path d="M42 22 L28 30 L20 56 L32 62 L36 52 L36 102 L84 102 L84 52 L88 62 L100 56 L92 30 L78 22 Z" /><path d="M60 22 L60 102" /><path d="M42 22 L60 30 L78 22" /><rect x="40" y="62" width="14" height="16" /><rect x="66" y="62" width="14" height="16" />',
  shoe: '<path data-solid="true" d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z" /><path d="M18 78 Q20 58 40 56 L72 56 Q98 58 100 78 L100 86 L18 86 Z" /><path d="M40 56 L46 68 L74 68" />',
  bag: '<path d="M34 44 L86 44 L92 100 L28 100 Z" /><path d="M46 44 L46 32 Q60 20 74 32 L74 44" /><path d="M28 58 L92 58" />',
  cap: '<path d="M32 74 Q32 34 60 34 Q88 34 88 74 Z" /><path data-solid="true" d="M28 74 L92 74 L92 88 L28 88 Z" /><path d="M28 74 L92 74 L92 88 L28 88 Z" />',
  dress:
    '<path d="M46 24 L38 34 L30 100 L90 100 L82 34 L74 24 Q60 34 46 24 Z" /><path d="M38 48 L82 48" />',
  socks:
    '<path d="M46 24 L62 24 L62 66 L84 84 L72 98 L44 76 L44 24 Z" /><path d="M46 34 L62 34" />',
};
export const KINDS = Object.keys(GARMENTS);
export const garmentSvg = (kind, cls = "") =>
  `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">${GARMENTS[kind]}</svg>`;
