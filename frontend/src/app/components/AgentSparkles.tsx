/**
 * AgentSparkles — decorative starlight / sparkle particles around the Agent character.
 *
 * Renders three layers of animation:
 *  1. Twinkling stars (4-point star SVGs) at fixed positions
 *  2. Orbiting glow dots circling the Agent
 * 3. Drifting dust motes floating gently
 *
 * All particles are purely decorative (pointer-events-none) and absolutely
 * positioned within the parent container.
 */

interface AgentSparklesProps {
  /** Scale factor to match the parent container size. Default 1 (for ~192px). */
  scale?: number;
}

export function AgentSparkles({ scale = 1 }: AgentSparklesProps) {
  const s = (v: number) => `${v * scale}px`;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* ── Twinkling stars ── */}
      {[
        { top: "5%", left: "15%", size: 10, delay: "0s", dur: "2.5s" },
        { top: "12%", left: "82%", size: 8, delay: "0.8s", dur: "3s" },
        { top: "75%", left: "8%", size: 12, delay: "1.2s", dur: "2.8s" },
        { top: "85%", left: "88%", size: 7, delay: "0.3s", dur: "3.2s" },
        { top: "30%", left: "95%", size: 6, delay: "1.5s", dur: "2.2s" },
        { top: "60%", left: "3%", size: 9, delay: "0.6s", dur: "3.5s" },
        { top: "0%", left: "50%", size: 8, delay: "2s", dur: "2.6s" },
        { top: "92%", left: "45%", size: 6, delay: "1.8s", dur: "3s" },
      ].map((star, i) => (
        <svg
          key={`twinkle-${i}`}
          className="absolute animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: s(star.size),
            height: s(star.size),
            animationDelay: star.delay,
            animationDuration: star.dur,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* 4-point sparkle star */}
          <path
            d="M12 0 C13 6, 18 11, 24 12 C18 13, 13 18, 12 24 C11 18, 6 13, 0 12 C6 11, 11 6, 12 0 Z"
            fill="oklch(0.82 0.12 85)"
            opacity="0.9"
          />
        </svg>
      ))}

      {/* ── Orbiting glow dots ── */}
      <div
        className="absolute top-1/2 left-1/2 animate-orbit-cw"
        style={
          {
            "--orbit-r": s(75),
            "--orbit-dur": "9s",
            marginLeft: `-${scale * 2}px`,
            marginTop: `-${scale * 2}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="rounded-full bg-accent/60"
          style={{ width: s(4), height: s(4), boxShadow: `0 0 ${s(6)} oklch(0.82 0.12 85 / 0.5)` }}
        />
      </div>
      <div
        className="absolute top-1/2 left-1/2 animate-orbit-ccw"
        style={
          {
            "--orbit-r": s(90),
            "--orbit-dur": "12s",
            marginLeft: `-${scale * 2}px`,
            marginTop: `-${scale * 2}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="rounded-full bg-primary/50"
          style={{ width: s(3), height: s(3), boxShadow: `0 0 ${s(5)} oklch(0.6 0.15 250 / 0.4)` }}
        />
      </div>
      <div
        className="absolute top-1/2 left-1/2 animate-orbit-cw"
        style={
          {
            "--orbit-r": s(60),
            "--orbit-dur": "7s",
            animationDelay: "2s",
            marginLeft: `-${scale * 1.5}px`,
            marginTop: `-${scale * 1.5}px`,
          } as React.CSSProperties
        }
      >
        <div
          className="rounded-full bg-accent/40"
          style={{ width: s(3), height: s(3) }}
        />
      </div>

      {/* ── Drifting dust motes ── */}
      {[
        { top: "20%", left: "25%", dx: "12px", dy: "-18px", dur: "4s", delay: "0s", size: 3 },
        { top: "70%", left: "70%", dx: "-10px", dy: "-15px", dur: "5s", delay: "1s", size: 2 },
        { top: "40%", left: "90%", dx: "-15px", dy: "-10px", dur: "4.5s", delay: "2s", size: 3 },
        { top: "55%", left: "15%", dx: "8px", dy: "-12px", dur: "3.8s", delay: "0.5s", size: 2 },
        { top: "15%", left: "60%", dx: "-6px", dy: "-20px", dur: "5.5s", delay: "1.5s", size: 3 },
      ].map((mote, i) => (
        <div
          key={`drift-${i}`}
          className="absolute rounded-full bg-accent/30 animate-drift"
          style={
            {
              top: mote.top,
              left: mote.left,
              width: s(mote.size),
              height: s(mote.size),
              "--drift-x": mote.dx,
              "--drift-y": mote.dy,
              "--drift-dur": mote.dur,
              animationDelay: mote.delay,
              boxShadow: `0 0 ${s(4)} oklch(0.82 0.12 85 / 0.3)`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* ── Shimmer pulse dots (soft glow) ── */}
      {[
        { top: "25%", left: "75%", size: 5, delay: "0s" },
        { top: "80%", left: "30%", size: 4, delay: "1.5s" },
        { top: "10%", left: "40%", size: 3, delay: "0.8s" },
      ].map((dot, i) => (
        <div
          key={`shimmer-${i}`}
          className="absolute rounded-full bg-accent/20 animate-shimmer-pulse"
          style={{
            top: dot.top,
            left: dot.left,
            width: s(dot.size),
            height: s(dot.size),
            animationDelay: dot.delay,
            boxShadow: `0 0 ${s(8)} oklch(0.82 0.12 85 / 0.25)`,
          }}
        />
      ))}
    </div>
  );
}
