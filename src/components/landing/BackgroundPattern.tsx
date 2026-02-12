"use client";

/**
 * Creative plus-sign background pattern.
 * Thin lines, random sizes, varied animations.
 */
const plusSigns = [
  { size: 9, opacity: 0.09, top: "8%", left: "6%", delay: 0, hue: "coral" as const, anim: "float" as const },
  { size: 17, opacity: 0.07, top: "18%", right: "10%", delay: 2, hue: "coral" as const, anim: "plusDrift" as const },
  { size: 12, opacity: 0.08, top: "35%", left: "2%", delay: 4, hue: "coral" as const, anim: "plusFloatSlow" as const },
  { size: 23, opacity: 0.06, bottom: "40%", right: "4%", delay: 1, hue: "blue" as const, anim: "plusGentleSpin" as const },
  { size: 7, opacity: 0.10, top: "48%", left: "18%", delay: 3, hue: "coral" as const, anim: "plusPulse" as const },
  { size: 19, opacity: 0.07, top: "65%", right: "22%", delay: 5, hue: "coral" as const, anim: "float" as const },
  { size: 14, opacity: 0.08, bottom: "25%", left: "28%", delay: 2.5, hue: "coral" as const, anim: "plusDrift" as const },
  { size: 11, opacity: 0.09, top: "88%", right: "5%", delay: 1.5, hue: "blue" as const, anim: "plusFloatSlow" as const },
  { size: 6, opacity: 0.10, top: "32%", right: "35%", delay: 0.5, hue: "coral" as const, anim: "plusPulse" as const },
  { size: 26, opacity: 0.05, bottom: "52%", left: "4%", delay: 3.5, hue: "coral" as const, anim: "plusGentleSpin" as const },
  { size: 21, opacity: 0.06, top: "5%", right: "25%", delay: 0, hue: "blue" as const, anim: "float" as const },
  { size: 13, opacity: 0.08, top: "52%", right: "42%", delay: 3, hue: "coral" as const, anim: "plusDrift" as const },
  { size: 16, opacity: 0.07, top: "75%", left: "8%", delay: 1, hue: "blue" as const, anim: "plusFloatSlow" as const },
  { size: 8, opacity: 0.09, bottom: "22%", left: "45%", delay: 4, hue: "coral" as const, anim: "plusPulse" as const },
  { size: 24, opacity: 0.06, top: "42%", left: "92%", delay: 2, hue: "coral" as const, anim: "plusGentleSpin" as const },
  { size: 10, opacity: 0.08, bottom: "8%", left: "18%", delay: 5, hue: "coral" as const, anim: "float" as const },
  { size: 15, opacity: 0.07, top: "78%", right: "38%", delay: 1.5, hue: "blue" as const, anim: "plusDrift" as const },
  { size: 5, opacity: 0.10, top: "22%", left: "78%", delay: 2.8, hue: "coral" as const, anim: "plusPulse" as const },
  { size: 20, opacity: 0.06, bottom: "12%", right: "55%", delay: 0.7, hue: "coral" as const, anim: "plusFloatSlow" as const },
  { size: 18, opacity: 0.07, top: "62%", left: "55%", delay: 1.2, hue: "blue" as const, anim: "plusGentleSpin" as const },
];

function PlusIcon({
  size,
  opacity,
  hue = "coral",
  delay,
  anim,
  ...position
}: {
  size: number;
  opacity: number;
  hue?: "coral" | "blue";
  delay: number;
  anim: "float" | "plusDrift" | "plusFloatSlow" | "plusGentleSpin" | "plusPulse";
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}) {
  const fillColor =
    hue === "blue"
      ? `rgba(80,120,200,${opacity})`
      : `rgba(232,118,75,${opacity})`;

  const thickness = 1.5;
  const offset = (20 - thickness) / 2;

  const positionStyle: Record<string, string> = {};
  if ("top" in position) positionStyle.top = position.top as string;
  if ("bottom" in position) positionStyle.bottom = position.bottom as string;
  if ("left" in position) positionStyle.left = position.left as string;
  if ("right" in position) positionStyle.right = position.right as string;

  const duration = 6 + (size % 7);
  const animDuration = anim === "plusPulse" ? 4 + (size % 3) : duration;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className="absolute pointer-events-none"
      style={{
        ...positionStyle,
        animation: `${anim} ${animDuration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <rect x={offset} y="0" width={thickness} height="20" rx={thickness / 2} fill={fillColor} />
      <rect x="0" y={offset} width="20" height={thickness} rx={thickness / 2} fill={fillColor} />
    </svg>
  );
}

export default function BackgroundPattern() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      {plusSigns.map((sign, i) => (
        <PlusIcon key={i} {...sign} />
      ))}
    </div>
  );
}
