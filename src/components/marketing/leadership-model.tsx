/**
 * The TLC Leadership Operating System — EQ · IQ · MQ™ with ELQ™ at the core.
 *
 * A responsive SVG reproduction of Tri's operating-system diagram: three
 * overlapping arcs (EQ, IQ, MQ) inside a segmented ring of nine leadership
 * behaviors, with ELQ™ at the intersection. Colors are self-contained to the
 * model (the blue venn from the source art) and do not affect the site palette.
 *
 * To use the exact exported artwork instead, drop the PNG/SVG into
 * /public/brand and replace this component's <svg> with an <Image>.
 */

// model-local palette (matches the source diagram, independent of site tokens)
const EQ_FILL = "#bcd8e8";
const IQ_FILL = "#6aa6cc";
const MQ_FILL = "#0e4a93";
const ELQ_FILL = "#15407c";
const RING_FILL = "#e9edf2";
const RING_DIV = "#d4dbe4";
const LABEL_INK = "#2a3340";

// global geometry
const CX = 360;
const CY = 338;

// nine ring labels, evenly spaced; rotation keeps each tangent but upright
const LABELS: { text: string; x: number; y: number; rot: number }[] = [
  { text: "Connect Authentically", x: 462.6, y: 58, rot: 20 },
  { text: "Drive Collaboration", x: 619.8, y: 190, rot: 60 },
  { text: "Build Unity", x: 655.4, y: 392, rot: -80 },
  { text: "Cultivate Culture", x: 552.8, y: 570, rot: -40 },
  { text: "Guide Impact", x: 360, y: 640, rot: 0 },
  { text: "Inspire Potential", x: 167.2, y: 570, rot: 40 },
  { text: "Be You", x: 64.6, y: 392, rot: 80 },
  { text: "Be Wise", x: 100.2, y: 190, rot: -60 },
  { text: "Be Bold", x: 257.4, y: 58, rot: -20 },
];

// radial dividers between adjacent labels
const DIVIDERS = [90, 50, 10, 330, 290, 250, 210, 170, 130];

function dividerLine(angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const inner = 232;
  const outer = 320;
  return {
    x1: CX + inner * Math.cos(a),
    y1: CY - inner * Math.sin(a),
    x2: CX + outer * Math.cos(a),
    y2: CY - outer * Math.sin(a),
  };
}

export function LeadershipModel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 700"
      className={className}
      role="img"
      aria-label="The TLC Leadership Operating System: EQ, IQ, and MQ overlapping with ELQ at the core, surrounded by nine leadership behaviors."
    >
      <defs>
        <filter id="lm-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#1b2a44" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* segmented grey ring (trefoil behind the venn) */}
      <g filter="url(#lm-shadow)">
        <circle cx={275} cy={258} r={212} fill={RING_FILL} />
        <circle cx={445} cy={258} r={212} fill={RING_FILL} />
        <circle cx={360} cy={410} r={212} fill={RING_FILL} />
      </g>
      <g stroke={RING_DIV} strokeWidth={2}>
        {DIVIDERS.map((d, i) => {
          const l = dividerLine(d);
          return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />;
        })}
      </g>

      {/* the three overlapping pillars */}
      <g stroke="#ffffff" strokeWidth={2.5}>
        <circle cx={275} cy={258} r={128} fill={EQ_FILL} />
        <circle cx={445} cy={258} r={128} fill={IQ_FILL} />
        <circle cx={360} cy={410} r={128} fill={MQ_FILL} />
      </g>

      {/* ELQ core medallion */}
      <path
        d="M360,286 Q408,300 400,348 Q360,372 320,348 Q312,300 360,286 Z"
        fill={ELQ_FILL}
        stroke="#ffffff"
        strokeWidth={2}
      />

      {/* EQ — hearts */}
      <g fill="#ffffff" transform="translate(232,232)">
        <path d="M0,9 C-6,2 -12,-2 -12,-8 C-12,-13 -5,-14 0,-8 C5,-14 12,-13 12,-8 C12,-2 6,2 0,9 Z" />
        <path transform="translate(22,12) scale(0.7)" d="M0,9 C-6,2 -12,-2 -12,-8 C-12,-13 -5,-14 0,-8 C5,-14 12,-13 12,-8 C12,-2 6,2 0,9 Z" />
        <path transform="translate(-4,18) scale(0.55)" d="M0,9 C-6,2 -12,-2 -12,-8 C-12,-13 -5,-14 0,-8 C5,-14 12,-13 12,-8 C12,-2 6,2 0,9 Z" />
      </g>
      <text x={300} y={272} fill="#ffffff" fontStyle="italic" fontWeight="700" fontSize="38" fontFamily="var(--font-aptos), sans-serif">EQ</text>

      {/* IQ — open book */}
      <g transform="translate(412,250)" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M0,-16 C-8,-21 -20,-21 -26,-17 L-26,15 C-20,11 -8,11 0,16 Z" />
        <path d="M0,-16 C8,-21 20,-21 26,-17 L26,15 C20,11 8,11 0,16 Z" />
        <line x1={0} y1={-16} x2={0} y2={16} />
      </g>
      <text x={470} y={272} fill="#ffffff" fontStyle="italic" fontWeight="700" fontSize="38" fontFamily="var(--font-aptos), sans-serif">IQ</text>

      {/* MQ — mentorship up the steps */}
      <g transform="translate(300,392)" fill="#ffffff" stroke="#ffffff">
        <path d="M-2,40 L-2,22 L16,22 L16,10 L34,10 L34,40 Z" stroke="none" />
        <circle cx={6} cy={2} r={6} stroke="none" />
        <path d="M6,9 L6,24 M6,14 L-6,20 M6,14 L16,12" strokeWidth={4} fill="none" strokeLinecap="round" />
        <circle cx={30} cy={-12} r={6} stroke="none" />
        <path d="M30,-5 L30,8 M30,0 L20,8 M30,0 L40,4" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
      <text x={388} y={430} fill="#ffffff" fontStyle="italic" fontWeight="700" fontSize="40" fontFamily="var(--font-aptos), sans-serif">MQ</text>
      <text x={446} y={414} fill="#ffffff" fontWeight="600" fontSize="15" fontFamily="var(--font-aptos), sans-serif">TM</text>

      {/* ELQ core label + figure */}
      <text x={360} y={312} textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="20" fontFamily="var(--font-aptos), sans-serif">
        ELQ
        <tspan fontSize="10" dy="-8">TM</tspan>
      </text>
      <g transform="translate(360,338)" fill="#ffffff" stroke="#ffffff">
        <circle cx={0} cy={-2} r={4.5} stroke="none" />
        <path d="M0,3 L0,14 M0,7 L-7,12 M0,7 L7,12" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>

      {/* nine ring labels */}
      <g fill={LABEL_INK} fontFamily="var(--font-roboto), sans-serif" fontWeight="600" fontSize="17">
        {LABELS.map((l) => (
          <text
            key={l.text}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            transform={`rotate(${l.rot} ${l.x} ${l.y})`}
          >
            {l.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
