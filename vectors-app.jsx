import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Compass, BookOpen, Brain, Calculator, ChevronRight, ChevronDown, RefreshCw, Check, X, Sparkles, Move, Equal, Trophy, RotateCcw } from 'lucide-react';

// ============ DESIGN TOKENS ============
const C = {
  bg: '#0a0e1a',
  bgSoft: '#111827',
  surface: 'rgba(20, 28, 48, 0.6)',
  surfaceSolid: '#141c30',
  border: 'rgba(148, 163, 184, 0.15)',
  borderStrong: 'rgba(148, 163, 184, 0.35)',
  ink: '#f1f5f9',
  inkDim: '#94a3b8',
  inkFaint: '#64748b',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  magenta: '#f472b6',
  green: '#34d399',
  red: '#f87171',
};

// ============ VECTOR PLAYGROUND ============
function VectorPlayground() {
  const canvasRef = useRef(null);
  const [u, setU] = useState({ x: 4, y: 3 });
  const [v, setV] = useState({ x: -2, y: 4 });
  const [show, setShow] = useState('sum'); // 'sum', 'diff', 'none'
  const [dragging, setDragging] = useState(null); // 'u', 'v', null
  const [size, setSize] = useState(420);

  // Math helpers
  const mag = (a) => Math.sqrt(a.x * a.x + a.y * a.y);
  const dot = (a, b) => a.x * b.x + a.y * b.y;
  const angleDeg = () => {
    const mu = mag(u), mv = mag(v);
    if (mu === 0 || mv === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot(u, v) / (mu * mv)));
    return (Math.acos(cos) * 180) / Math.PI;
  };
  const cross2D = () => u.x * v.y - u.y * v.x; // z-component of 3D cross
  const isParallel = () => Math.abs(cross2D()) < 0.5 && (mag(u) > 0.1 && mag(v) > 0.1);
  const isPerp = () => Math.abs(dot(u, v)) < 0.5 && mag(u) > 0.1 && mag(v) > 0.1;

  // Coordinate conversion: math units -> canvas pixels
  const SCALE = 18; // pixels per unit
  const RANGE = Math.floor((size / 2) / SCALE);
  const m2c = (mx, my) => ({
    x: size / 2 + mx * SCALE,
    y: size / 2 - my * SCALE, // flip y
  });
  const c2m = (cx, cy) => ({
    x: (cx - size / 2) / SCALE,
    y: -(cy - size / 2) / SCALE,
  });

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0d1322';
    ctx.fillRect(0, 0, size, size);

    // Grid - minor
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let i = -RANGE; i <= RANGE; i++) {
      const p = m2c(i, 0);
      ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, size); ctx.stroke();
      const q = m2c(0, i);
      ctx.beginPath(); ctx.moveTo(0, q.y); ctx.lineTo(size, q.y); ctx.stroke();
    }
    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    const c = m2c(0, 0);
    ctx.beginPath(); ctx.moveTo(0, c.y); ctx.lineTo(size, c.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x, 0); ctx.lineTo(c.x, size); ctx.stroke();

    // Axis numbers
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '10px ui-monospace, Menlo, monospace';
    for (let i = -RANGE; i <= RANGE; i += 2) {
      if (i === 0) continue;
      const px = m2c(i, 0);
      ctx.fillText(String(i), px.x + 3, c.y + 12);
      const py = m2c(0, i);
      ctx.fillText(String(i), c.x + 5, py.y + 4);
    }

    // Helper to draw arrow
    const arrow = (from, to, color, width = 2.5, dashed = false) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      const dx = to.x - from.x, dy = to.y - from.y;
      const ang = Math.atan2(dy, dx);
      const head = 10;
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(to.x - head * Math.cos(ang - Math.PI / 7), to.y - head * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(to.x - head * Math.cos(ang + Math.PI / 7), to.y - head * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    };

    const O = m2c(0, 0);

    // Resultant vector (drawn first, behind)
    if (show === 'sum') {
      const sum = { x: u.x + v.x, y: u.y + v.y };
      const sumP = m2c(sum.x, sum.y);
      arrow(O, sumP, C.magenta, 3);
      // parallelogram preview
      const uP = m2c(u.x, u.y);
      const vP = m2c(v.x, v.y);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.3)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(uP.x, uP.y); ctx.lineTo(sumP.x, sumP.y);
      ctx.moveTo(vP.x, vP.y); ctx.lineTo(sumP.x, sumP.y);
      ctx.stroke();
      ctx.setLineDash([]);
      // label
      ctx.fillStyle = C.magenta;
      ctx.font = 'italic 600 14px Georgia, serif';
      ctx.fillText('u+v', sumP.x + 8, sumP.y - 6);
    } else if (show === 'diff') {
      const diff = { x: u.x - v.x, y: u.y - v.y };
      const diffP = m2c(diff.x, diff.y);
      arrow(O, diffP, C.magenta, 3);
      // also show as v->u
      const uP = m2c(u.x, u.y);
      const vP = m2c(v.x, v.y);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(vP.x, vP.y); ctx.lineTo(uP.x, uP.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.magenta;
      ctx.font = 'italic 600 14px Georgia, serif';
      ctx.fillText('u−v', diffP.x + 8, diffP.y - 6);
    }

    // Vector u
    const uP = m2c(u.x, u.y);
    arrow(O, uP, C.cyan, 3);
    ctx.fillStyle = C.cyan;
    ctx.font = 'italic 700 16px Georgia, serif';
    ctx.fillText('u', uP.x + 8, uP.y - 6);
    // tip handle
    ctx.beginPath();
    ctx.arc(uP.x, uP.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = dragging === 'u' ? C.cyan : 'rgba(34, 211, 238, 0.4)';
    ctx.fill();
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vector v
    const vP = m2c(v.x, v.y);
    arrow(O, vP, C.amber, 3);
    ctx.fillStyle = C.amber;
    ctx.font = 'italic 700 16px Georgia, serif';
    ctx.fillText('v', vP.x + 8, vP.y - 6);
    ctx.beginPath();
    ctx.arc(vP.x, vP.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = dragging === 'v' ? C.amber : 'rgba(251, 191, 36, 0.4)';
    ctx.fill();
    ctx.strokeStyle = C.amber;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Angle arc
    if (mag(u) > 0.5 && mag(v) > 0.5) {
      const angU = Math.atan2(u.y, u.x);
      const angV = Math.atan2(v.y, v.x);
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // arc in canvas space (y is flipped)
      const r = 22;
      // pick smaller arc
      let a1 = -angU, a2 = -angV;
      let diff = a2 - a1;
      if (diff > Math.PI) a2 -= 2 * Math.PI;
      if (diff < -Math.PI) a2 += 2 * Math.PI;
      ctx.arc(O.x, O.y, r, Math.min(a1, a2), Math.max(a1, a2));
      ctx.stroke();
      // label
      const midA = (a1 + a2) / 2;
      ctx.fillStyle = C.magenta;
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(`${angleDeg().toFixed(0)}°`, O.x + (r + 6) * Math.cos(midA), O.y + (r + 6) * Math.sin(midA) + 4);
    }
  }, [u, v, show, dragging, size]);

  // Pointer handlers
  const getPointerPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };
  const handleDown = (e) => {
    e.preventDefault();
    const p = getPointerPos(e);
    const uP = m2c(u.x, u.y);
    const vP = m2c(v.x, v.y);
    const dU = Math.hypot(p.x - uP.x, p.y - uP.y);
    const dV = Math.hypot(p.x - vP.x, p.y - vP.y);
    if (dU < 18 && dU < dV) setDragging('u');
    else if (dV < 18) setDragging('v');
  };
  const handleMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const p = getPointerPos(e);
    const m = c2m(p.x, p.y);
    // snap to half units
    const snapped = { x: Math.round(m.x * 2) / 2, y: Math.round(m.y * 2) / 2 };
    if (dragging === 'u') setU(snapped);
    else setV(snapped);
  };
  const handleUp = () => setDragging(null);

  // Responsive sizing
  useEffect(() => {
    const onResize = () => {
      const w = Math.min(window.innerWidth - 40, 480);
      setSize(Math.max(280, w));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const muV = mag(u).toFixed(2);
  const mvV = mag(v).toFixed(2);
  const dotV = dot(u, v).toFixed(2);
  const angV2 = angleDeg().toFixed(1);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl mb-1" style={{ fontFamily: 'Georgia, serif', color: C.ink }}>Vector Playground</h2>
        <p style={{ color: C.inkDim, fontSize: 13 }}>Drag the colored dots. Watch the math respond.</p>
      </div>

      <div className="flex flex-col items-center">
        <div
          className="rounded-2xl overflow-hidden mb-4"
          style={{
            border: `1px solid ${C.borderStrong}`,
            boxShadow: '0 0 60px rgba(34, 211, 238, 0.08)',
            touchAction: 'none',
          }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
            style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab' }}
          />
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          {['none', 'sum', 'diff'].map((m) => (
            <button
              key={m}
              onClick={() => setShow(m)}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: show === m ? C.magenta : 'transparent',
                color: show === m ? '#0a0e1a' : C.inkDim,
                border: `1px solid ${show === m ? C.magenta : C.border}`,
              }}
            >
              {m === 'none' ? 'Just u, v' : m === 'sum' ? 'Show u + v' : 'Show u − v'}
            </button>
          ))}
        </div>

        {/* Live readout */}
        <div className="w-full grid grid-cols-2 gap-2 mb-3" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
          <ReadoutCard
            label="vector u"
            value={`(${u.x}, ${u.y})`}
            sub={`|u| = ${muV}`}
            color={C.cyan}
          />
          <ReadoutCard
            label="vector v"
            value={`(${v.x}, ${v.y})`}
            sub={`|v| = ${mvV}`}
            color={C.amber}
          />
          <ReadoutCard
            label="dot product"
            value={`u·v = ${dotV}`}
            sub={`= ${u.x}·${v.x} + ${u.y}·${v.y}`}
            color={C.magenta}
          />
          <ReadoutCard
            label="angle θ"
            value={`${angV2}°`}
            sub={`cosθ = ${(dot(u, v) / (mag(u) * mag(v) || 1)).toFixed(3)}`}
            color={C.magenta}
          />
        </div>

        {/* Status */}
        <div className="w-full flex gap-2 flex-wrap">
          {isPerp() && (
            <div className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ background: 'rgba(52, 211, 153, 0.15)', border: `1px solid ${C.green}`, color: C.green }}>
              <Check size={14} /> Perpendicular (u·v = 0)
            </div>
          )}
          {isParallel() && (
            <div className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5" style={{ background: 'rgba(34, 211, 238, 0.15)', border: `1px solid ${C.cyan}`, color: C.cyan }}>
              <Check size={14} /> Parallel (u = kv)
            </div>
          )}
          {!isPerp() && !isParallel() && (mag(u) > 0.5 && mag(v) > 0.5) && (
            <div className="px-3 py-1.5 rounded-lg text-xs" style={{ color: C.inkFaint }}>
              Try making them perpendicular or parallel
            </div>
          )}
        </div>

        {/* Quick presets */}
        <div className="mt-4 w-full">
          <div style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6, letterSpacing: 0.5 }}>QUICK PRESETS</div>
          <div className="flex flex-wrap gap-2">
            {[
              { lbl: 'Perp', u: { x: 3, y: 0 }, v: { x: 0, y: 4 } },
              { lbl: 'Parallel', u: { x: 2, y: 1 }, v: { x: 4, y: 2 } },
              { lbl: '60°', u: { x: 4, y: 0 }, v: { x: 2, y: 3.46 } },
              { lbl: 'Reset', u: { x: 4, y: 3 }, v: { x: -2, y: 4 } },
            ].map((p) => (
              <button
                key={p.lbl}
                onClick={() => { setU(p.u); setV(p.v); }}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.inkDim }}
              >
                {p.lbl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadoutCard({ label, value, sub, color }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ color: C.inkFaint, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontSize: 15, fontWeight: 600, marginTop: 2 }}>{value}</div>
      <div style={{ color: C.inkFaint, fontSize: 10, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ============ CONCEPTS ============
const CONCEPTS = [
  {
    id: 'scalar-vector',
    title: 'Scalars vs Vectors',
    summary: 'The fundamental distinction.',
    content: [
      { type: 'def', label: 'Scalar', body: 'Quantity with magnitude only (temperature, mass, time).' },
      { type: 'def', label: 'Vector', body: 'Quantity with both magnitude AND direction (velocity, force, displacement).' },
    ],
  },
  {
    id: 'representation',
    title: 'Representing Vectors',
    summary: 'From origin or between two points.',
    content: [
      { type: 'case', label: 'Case 1', body: 'From origin O(0,0) to Q(x, y):', formula: 'v = (x, y)   slope m = y/x' },
      { type: 'case', label: 'Case 2', body: 'From P(x₁, y₁) to Q(x₂, y₂):', formula: 'v = (x₂−x₁, y₂−y₁)\nm = (y₂−y₁)/(x₂−x₁)' },
      { type: 'note', body: 'Zero vector: v = (0, 0). Initial = terminal point.' },
    ],
  },
  {
    id: 'addition',
    title: 'Vector Addition',
    summary: 'Component-wise. Commutative & associative.',
    content: [
      { type: 'formula', body: '(x₁, y₁) + (x₂, y₂) = (x₁+x₂, y₁+y₂)' },
      { type: 'list', items: [
        'Commutative: u + v = v + u',
        'Associative: (u + v) + w = u + (v + w)',
        'Identity: u + 0 = u',
        'Inverse: v + (−v) = 0',
      ]},
    ],
  },
  {
    id: 'scalar-mult',
    title: 'Scalar Multiplication',
    summary: 'Stretch, shrink, or flip a vector.',
    content: [
      { type: 'formula', body: 'kv has magnitude |k|·|v|' },
      { type: 'list', items: [
        'k > 0 → same direction',
        'k < 0 → opposite direction',
        'k = 0 → zero vector',
        '(k₁ + k₂)u = k₁u + k₂u',
        'k₁(u + v) = k₁u + k₁v',
      ]},
    ],
  },
  {
    id: 'norm',
    title: 'Norm (Magnitude) & Unit Vectors',
    summary: 'Length of a vector and the unit-length version.',
    content: [
      { type: 'formula', body: '|u| = √(x² + y²)' },
      { type: 'formula', body: 'For AB: |u| = √((x₂−x₁)² + (y₂−y₁)²)' },
      { type: 'def', label: 'Unit vector', body: 'û = u / |u|. Has magnitude 1.' },
      { type: 'note', body: 'Standard unit vectors: i = (1, 0), j = (0, 1). Any u = ai + bj.' },
    ],
  },
  {
    id: 'dot',
    title: 'Dot Product (Scalar Product)',
    summary: 'Multiplies vectors → returns a scalar.',
    content: [
      { type: 'formula', body: 'u·v = u₁v₁ + u₂v₂' },
      { type: 'formula', body: 'u·v = |u||v| cosθ' },
      { type: 'formula', body: 'cosθ = (u·v) / (|u||v|)' },
      { type: 'list', items: [
        'i·j = 0, i·i = j·j = 1',
        'u·u = |u|²',
        'Perpendicular ⟺ u·v = 0',
        'Same direction parallel: u·v = |u||v|',
        'Opposite direction parallel: u·v = −|u||v|',
        'Commutative: u·v = v·u',
      ]},
    ],
  },
  {
    id: 'cross',
    title: 'Cross Product',
    summary: '3D only. Returns a perpendicular vector.',
    content: [
      { type: 'formula', body: 'u × v = (u₂v₃−u₃v₂)i − (u₁v₃−u₃v₁)j + (u₁v₂−u₂v₁)k' },
      { type: 'formula', body: '|u × v| = |u||v| sinθ = area of parallelogram' },
      { type: 'note', body: 'u × v is perpendicular to BOTH u and v.' },
      { type: 'list', items: [
        'Anticommutative: u × v = −(v × u)',
        'u × u = 0',
        'i×j = k, j×k = i, k×i = j',
        'j×i = −k, k×j = −i, i×k = −j',
      ]},
    ],
  },
  {
    id: 'lines',
    title: 'Vectors and Lines',
    summary: 'Three forms of a line equation.',
    content: [
      { type: 'def', label: 'Vector form', body: 'Through P₀ with direction V:', formula: 'P = P₀ + λV  (λ ∈ ℝ)' },
      { type: 'def', label: 'Parametric', body: '', formula: 'x = x₀ + λa\ny = y₀ + λb' },
      { type: 'def', label: 'Cartesian', body: '', formula: '(x − x₀)/a = (y − y₀)/b' },
    ],
  },
];

function Concepts() {
  const [open, setOpen] = useState(new Set(['scalar-vector']));
  const toggle = (id) => {
    const n = new Set(open);
    n.has(id) ? n.delete(id) : n.add(id);
    setOpen(n);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl mb-1" style={{ fontFamily: 'Georgia, serif', color: C.ink }}>Concepts</h2>
        <p style={{ color: C.inkDim, fontSize: 13 }}>Tap any section to expand.</p>
      </div>
      <div className="space-y-2">
        {CONCEPTS.map((concept, i) => (
          <div
            key={concept.id}
            className="rounded-xl overflow-hidden transition-all"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <button
              onClick={() => toggle(concept.id)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{ background: 'rgba(34, 211, 238, 0.1)', color: C.cyan, fontFamily: 'ui-monospace, monospace' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div style={{ color: C.ink, fontSize: 15, fontWeight: 500 }}>{concept.title}</div>
                  {!open.has(concept.id) && (
                    <div style={{ color: C.inkFaint, fontSize: 12, marginTop: 2 }}>{concept.summary}</div>
                  )}
                </div>
              </div>
              <ChevronDown
                size={18}
                style={{
                  color: C.inkDim,
                  transform: open.has(concept.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  flexShrink: 0,
                }}
              />
            </button>
            {open.has(concept.id) && (
              <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                {concept.content.map((c, ci) => (
                  <ConceptBlock key={ci} block={c} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConceptBlock({ block }) {
  if (block.type === 'def') {
    return (
      <div>
        <span style={{ color: C.amber, fontSize: 12, fontWeight: 600, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {block.label}.
        </span>
        <span style={{ color: C.inkDim, fontSize: 13, marginLeft: 6 }}>{block.body}</span>
        {block.formula && <FormulaBox text={block.formula} />}
      </div>
    );
  }
  if (block.type === 'case') {
    return (
      <div>
        <div style={{ color: C.amber, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
          {block.label}
        </div>
        <div style={{ color: C.inkDim, fontSize: 13 }}>{block.body}</div>
        {block.formula && <FormulaBox text={block.formula} />}
      </div>
    );
  }
  if (block.type === 'formula') {
    return <FormulaBox text={block.body} />;
  }
  if (block.type === 'note') {
    return (
      <div
        className="px-3 py-2 rounded-lg"
        style={{ background: 'rgba(251, 191, 36, 0.05)', borderLeft: `2px solid ${C.amber}`, color: C.inkDim, fontSize: 12 }}
      >
        {block.body}
      </div>
    );
  }
  if (block.type === 'list') {
    return (
      <ul className="space-y-1.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2" style={{ color: C.inkDim, fontSize: 13 }}>
            <span style={{ color: C.cyan }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

function FormulaBox({ text }) {
  return (
    <div
      className="my-2 px-3 py-2 rounded-md"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: `1px solid ${C.border}`,
        color: C.cyan,
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 13,
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </div>
  );
}

// ============ QUIZ ============
const QUESTIONS = [
  {
    q: 'Given u = (3, 4), what is |u|?',
    options: ['5', '7', '12', '25'],
    answer: 0,
    explain: '|u| = √(3² + 4²) = √25 = 5',
  },
  {
    q: 'If u = (2, −1) and v = (3, 5), what is u · v?',
    options: ['1', '13', '−1', '7'],
    answer: 0,
    explain: '(2)(3) + (−1)(5) = 6 − 5 = 1',
  },
  {
    q: 'Two non-zero vectors u and v are perpendicular when:',
    options: ['u + v = 0', 'u · v = 0', '|u| = |v|', 'u × v = 0'],
    answer: 1,
    explain: 'cos 90° = 0, so u·v = |u||v|·0 = 0',
  },
  {
    q: 'What is the unit vector in the direction of (6, 8)?',
    options: ['(0.6, 0.8)', '(3, 4)', '(6, 8)/14', '(1, 1)'],
    answer: 0,
    explain: '|u| = √(36+64) = 10. û = (6/10, 8/10) = (0.6, 0.8)',
  },
  {
    q: 'i × j equals:',
    options: ['0', 'i', 'j', 'k'],
    answer: 3,
    explain: 'Right-hand rule cycle: i×j = k, j×k = i, k×i = j',
  },
  {
    q: 'If u = (1, 2) and v = (4, 8), the vectors are:',
    options: ['Perpendicular', 'Parallel (same direction)', 'Parallel (opposite directions)', 'Neither'],
    answer: 1,
    explain: 'v = 4u, so they are parallel. k = 4 > 0 means same direction.',
  },
  {
    q: 'The angle between u = (1, 0) and v = (1, 1) is:',
    options: ['30°', '45°', '60°', '90°'],
    answer: 1,
    explain: 'cosθ = (1·1 + 0·1) / (1 · √2) = 1/√2, so θ = 45°',
  },
  {
    q: 'If u × v has magnitude 12, and |u| = 4, |v| = 6, then sinθ =',
    options: ['1/2', '1/3', '2/3', '12/24'],
    answer: 0,
    explain: '|u×v| = |u||v|sinθ → 12 = 24·sinθ → sinθ = 1/2 (so θ = 30°)',
  },
];

function Quiz() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);

  const q = QUESTIONS[idx];

  const submit = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore(score + 1);
    setHistory([...history, { idx, picked: i, correct: i === q.answer }]);
  };

  const next = () => {
    if (idx + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  const reset = () => {
    setIdx(0); setPicked(null); setScore(0); setDone(false); setHistory([]);
  };

  if (done) {
    const pct = Math.round((score / QUESTIONS.length) * 100);
    return (
      <div className="text-center py-8">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
          style={{ background: 'rgba(244, 114, 182, 0.15)', border: `2px solid ${C.magenta}` }}
        >
          <Trophy size={36} style={{ color: C.magenta }} />
        </div>
        <h2 className="text-3xl mb-1" style={{ fontFamily: 'Georgia, serif', color: C.ink }}>
          {score} / {QUESTIONS.length}
        </h2>
        <p style={{ color: C.inkDim, fontSize: 14, marginBottom: 24 }}>
          {pct === 100 ? 'Perfect. You own these.' : pct >= 75 ? 'Solid work — review the misses.' : pct >= 50 ? 'Decent start. Hit the concepts again.' : 'Worth another pass through the playground.'}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2"
          style={{ background: C.cyan, color: '#0a0e1a' }}
        >
          <RotateCcw size={14} /> Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl mb-1" style={{ fontFamily: 'Georgia, serif', color: C.ink }}>Practice</h2>
          <p style={{ color: C.inkDim, fontSize: 13 }}>Question {idx + 1} of {QUESTIONS.length}</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs"
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.inkDim, fontFamily: 'ui-monospace, monospace' }}
        >
          {score} ✓
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 rounded-full mb-6 overflow-hidden" style={{ background: 'rgba(148,163,184,0.1)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((idx) / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.magenta})` }}
        />
      </div>

      <div className="mb-5" style={{ color: C.ink, fontSize: 17, lineHeight: 1.5, fontFamily: 'Georgia, serif' }}>
        {q.q}
      </div>

      <div className="space-y-2 mb-4">
        {q.options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === q.answer;
          let bg = C.surface;
          let bd = C.border;
          let col = C.ink;
          if (picked !== null) {
            if (isCorrect) { bg = 'rgba(52, 211, 153, 0.15)'; bd = C.green; col = C.green; }
            else if (isPicked) { bg = 'rgba(248, 113, 113, 0.15)'; bd = C.red; col = C.red; }
            else { col = C.inkFaint; }
          }
          return (
            <button
              key={i}
              onClick={() => submit(i)}
              disabled={picked !== null}
              className="w-full p-3.5 rounded-xl text-left flex items-center gap-3 transition-all"
              style={{ background: bg, border: `1px solid ${bd}`, color: col, fontFamily: 'ui-monospace, monospace', fontSize: 14 }}
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-xs"
                style={{ background: 'rgba(148, 163, 184, 0.1)' }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {picked !== null && isCorrect && <Check size={16} />}
              {picked !== null && isPicked && !isCorrect && <X size={16} />}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <>
          <div
            className="p-3 rounded-lg mb-4"
            style={{ background: 'rgba(34, 211, 238, 0.07)', borderLeft: `2px solid ${C.cyan}` }}
          >
            <div style={{ color: C.cyan, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Why</div>
            <div style={{ color: C.inkDim, fontSize: 13, fontFamily: 'ui-monospace, monospace' }}>{q.explain}</div>
          </div>
          <button
            onClick={next}
            className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: C.cyan, color: '#0a0e1a' }}
          >
            {idx + 1 >= QUESTIONS.length ? 'See score' : 'Next question'}
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

// ============ FORMULA SHEET ============
const FORMULAS = [
  { lbl: 'Magnitude', f: '|u| = √(x² + y²)' },
  { lbl: 'Distance', f: '|AB| = √((x₂−x₁)² + (y₂−y₁)²)' },
  { lbl: 'Unit vector', f: 'û = u / |u|' },
  { lbl: 'Vector addition', f: 'u + v = (x₁+x₂, y₁+y₂)' },
  { lbl: 'Scalar mult', f: 'kv = (kx, ky)' },
  { lbl: 'Dot product', f: 'u·v = u₁v₁ + u₂v₂' },
  { lbl: 'Dot product (geo)', f: 'u·v = |u||v|cosθ' },
  { lbl: 'Angle between', f: 'cosθ = (u·v) / (|u||v|)' },
  { lbl: 'Perpendicular', f: 'u·v = 0' },
  { lbl: 'Parallel', f: 'u = kv' },
  { lbl: 'Cross magnitude', f: '|u×v| = |u||v|sinθ' },
  { lbl: 'Parallelogram area', f: 'A = |u×v|' },
  { lbl: 'Cross perp', f: '(u×v) ⊥ u  and  (u×v) ⊥ v' },
  { lbl: 'i × j cycle', f: 'i×j=k,  j×k=i,  k×i=j' },
  { lbl: 'Vector line', f: 'P = P₀ + λV' },
  { lbl: 'Parametric line', f: 'x = x₀+λa,  y = y₀+λb' },
  { lbl: 'Cartesian line', f: '(x−x₀)/a = (y−y₀)/b' },
];

function Formulas() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl mb-1" style={{ fontFamily: 'Georgia, serif', color: C.ink }}>Formula Sheet</h2>
        <p style={{ color: C.inkDim, fontSize: 13 }}>Everything in one place.</p>
      </div>
      <div className="grid gap-2">
        {FORMULAS.map((f, i) => (
          <div
            key={i}
            className="p-3 rounded-xl flex items-center justify-between gap-3"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            <span style={{ color: C.amber, fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic', flexShrink: 0 }}>
              {f.lbl}
            </span>
            <span
              style={{
                color: C.cyan,
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 12.5,
                textAlign: 'right',
              }}
            >
              {f.f}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function VectorsApp() {
  const [tab, setTab] = useState('play');

  const tabs = [
    { id: 'play', lbl: 'Playground', icon: Move },
    { id: 'concepts', lbl: 'Concepts', icon: BookOpen },
    { id: 'quiz', lbl: 'Quiz', icon: Brain },
    { id: 'formulas', lbl: 'Formulas', icon: Calculator },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 pt-6 pb-32">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.magenta})` }}
            >
              <Compass size={18} style={{ color: '#0a0e1a' }} />
            </div>
            <div style={{ color: C.inkFaint, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace' }}>
              Field notes · Vol 1
            </div>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 400, color: C.ink, lineHeight: 1, letterSpacing: -1 }}>
            Vectors.
          </h1>
          <p style={{ color: C.inkDim, fontSize: 14, marginTop: 6, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
            An interactive revision.
          </p>
        </header>

        {/* Content */}
        <main>
          {tab === 'play' && <VectorPlayground />}
          {tab === 'concepts' && <Concepts />}
          {tab === 'quiz' && <Quiz />}
          {tab === 'formulas' && <Formulas />}
        </main>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10"
        style={{
          background: 'rgba(10, 14, 26, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around p-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all flex-1"
                style={{ color: active ? C.cyan : C.inkFaint }}
              >
                <Icon size={20} />
                <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}>
                  {t.lbl}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
