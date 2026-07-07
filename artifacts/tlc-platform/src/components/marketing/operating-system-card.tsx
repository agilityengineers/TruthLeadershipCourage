import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The "Operating System" summary card: three numbered builds (EQ · IQ · MQ)
 * resolving into one gradient result. Icons mirror the EQ·IQ·MQ diagram
 * (hearts / open book / two-figure climb). Replaces the old static formula
 * card and keeps the same footprint (right column, beside the diagram).
 */

const HEX = { eq: "#024794", iq: "#262161", mq: "#662d91" } as const;
type Pillar = keyof typeof HEX;

// The MQ "lift others / climb together" silhouette, taken from the diagram itself
// and recoloured via a CSS mask so it stays crisp and exactly on-brand.
const MQ_MASK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE4AAAA/CAYAAABO1P55AAAD10lEQVR4nO2bMWjWQBTHf60KXRwUnKQiFUGwiFAopZSCOLhZCh2FIghVKIiCg0MpdOggRR3EQZAPhCooItTB6UNFBEEQQSyCVAqKg0VBcXAoxiHfh2n6LrlL7nLXNn94Q3LvXv7vn8vlcrmDGjVq1CiMQWAS6PJNZKPgPRAJttsnqdAhCZa0o96YBYwz5AsXeWMXMHREi4AeXwTT6PRNwBBDwrku4A1qsW9Xxs4DdFtcf8F6bRt0nEfleIJZHzei6b8l+sq8ZKdbfmVFa9utCnKqDKok72v4tG0WeAQsa/j+cJxPpRgAmsAKMJMq02lJvULMiZw6mxq9lO/DuhT+E85YB4AV7L0Afqd8h91QDgOmnf+fnHizLb8bjvgGgW3Ub85CaFB82NHnglCHi6AOUPbNZz3PjfCtekhx3mSSc9MPOSRIj990q2xEUS7ZaqWsPWMv+UONOwofyQYqYR0ApOTvCX4/Fb5b7isB4ApmidfCtSAlfaxAneCEGwdGHcUumnRHRl2vwqlmGf5avEaZhC9l1Pcm3FAFpD4q4uqO2YJ8VHVIPSsRv08RUxefNTlWCtV4yiax00Ks/Qb1g3yrjlZErGictwKPFw74GeOggoR3Yi2oeATBL1ThjggclltlIfDjlIJIEVLNAnVUeCDwaM/BvRTKVLMtTnFTINK2cwZxkvUmS3LKuoHjQtnTktcrhSnga4vIY8O6i6xNZKokl7yWH8TjagO2k0jH+5BTbuW6Vc8AV3G3l1LHBxR+pbiYCNcDvEK+e++Aq6g73gYy0X0G19fFt9TxJ+C7wjfC8e/BL+gPR3StaYlbOu6Cpl/SjG+gTouLiD+5bOIXcNxyzDb2KM5n/emyzsV2K4uIhzSuOdr0t0KojC3aJpjBMw8zCd9CeylUzfc8cL1gvB3AGP+XW90l3r/gCpJQ3n60F21VPpD8fGubtEYuiQZmec3pEJHmxSLiDRohCjcm8EgvSGxjQfC11jCkCs2MMt/CSbzSCwV1fuI4ES6rLAThrmXwuEB5wTatcCosYU+0NfltT11IejWbzn6EAqc3Mv3lII26510ScIB+PLT+w6xvnvsT5TrNuQHsrIzxWrzW5Gi9j+sWnJOPr8mqoIj4B3MVS6tUC3QqEw7BOSmcyV6DtF00FAPgMvHulypEsS5cd6q8zCBSF74FyuWvM610InV8EtgFPNeom4bOvJeJwN6gI5y0K3mY+Guik3hU3gGcJd5wm4U8UTb0prQ5sh9VWL/udpV4ViQJ00d1UFEnJMvFw5bjtKJ8Xgia/j8qrVXLgm9RrAhXo0aNoPAPiOt/xGKaSj4AAAAASUVORK5CYII=";

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M11.9 20.6c-.3-.24-6.4-4.55-8.5-8.02C1.55 9.4 2.9 6.35 5.65 5.7c1.7-.4 3.45.3 4.5 1.75l.35.48c.35.48 1.05.48 1.4 0l.35-.48c1.05-1.45 2.8-2.15 4.5-1.75 2.75.65 4.1 3.7 2.25 6.88-2.1 3.47-8.2 7.78-8.5 8.02a.9.9 0 0 1-1.05 0z" />
      <path d="M18.6 3.1c1.35.32 2.02 1.82 1.12 3.38-.5.83-1.6 1.78-2.63 2.55-1-.86-2.03-1.86-2.53-2.7.9-2.1 2.67-3.55 4.04-3.23z" opacity=".55" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M11.35 6.7C9.7 5.55 7.35 4.95 4.9 4.95c-.78 0-1.55.06-2.25.2a.85.85 0 0 0-.65.83v10.4c0 .55.5.96 1.04.85.6-.12 1.25-.18 1.86-.18 2.2 0 4.35.52 5.8 1.6a.6.6 0 0 0 .65.05z" />
      <path d="M12.65 6.7C14.3 5.55 16.65 4.95 19.1 4.95c.78 0 1.55.06 2.25.2a.85.85 0 0 1 .65.83v10.4c0 .55-.5.96-1.04.85-.6-.12-1.25-.18-1.86-.18-2.2 0-4.35.52-5.8 1.6a.6.6 0 0 1-.65.05z" />
    </svg>
  );
}

function MqIcon() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: 15,
        height: 12,
        backgroundColor: HEX.mq,
        WebkitMaskImage: `url("${MQ_MASK}")`,
        maskImage: `url("${MQ_MASK}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

type Stage = { n: string; tag: string; label: string; pillar: Pillar; icon: ReactNode };

const STAGES: Stage[] = [
  { n: "1", tag: "EQ", label: "Build the Leader", pillar: "eq", icon: <HeartIcon /> },
  { n: "2", tag: "IQ", label: "Build the Team", pillar: "iq", icon: <BookIcon /> },
  { n: "3", tag: "MQ™", label: "Build Future Leaders", pillar: "mq", icon: <MqIcon /> },
];

const BADGE_SOFT: Record<Pillar, string> = { eq: "bg-eq/10", iq: "bg-iq/10", mq: "bg-mq/10" };
const BADGE_BOLD: Record<Pillar, string> = { eq: "bg-eq", iq: "bg-iq", mq: "bg-mq" };
const PILLAR_TEXT: Record<Pillar, string> = { eq: "text-eq", iq: "text-iq", mq: "text-mq" };

export function OperatingSystemCard({
  className,
  variant = "soft",
  result = "Authentic Connection + Performance",
}: {
  className?: string;
  /** "soft" = tinted number badges (default); "bold" = solid brand-colour badges. */
  variant?: "soft" | "bold";
  result?: string;
}) {
  const bold = variant === "bold";
  return (
    <div className={cn("rounded-[16px] border border-hair-2 bg-white p-[22px] shadow-card", className)}>
      <div className="flex flex-col gap-3.5 min-[440px]:flex-row min-[440px]:items-start min-[440px]:gap-1.5">
        {STAGES.map((s, i) => (
          <Fragment key={s.tag}>
            {i > 0 && (
              <span
                aria-hidden="true"
                className="hidden self-center px-1 pt-1 font-display text-[16px] text-muted-3 min-[440px]:block"
              >
                +
              </span>
            )}
            <div className="flex min-w-0 items-start gap-[9px] min-[440px]:flex-1">
              <span
                className={cn(
                  "relative flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px]",
                  bold ? BADGE_BOLD[s.pillar] : BADGE_SOFT[s.pillar],
                )}
              >
                <span
                  className={cn(
                    "font-display text-[17px] font-bold leading-none tracking-[-0.02em]",
                    bold ? "text-white" : PILLAR_TEXT[s.pillar],
                  )}
                >
                  {s.n}
                </span>
                <span
                  className="absolute -bottom-[5px] -right-[5px] flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-white shadow-[0_1px_4px_rgba(26,24,48,0.16)]"
                  style={{ color: HEX[s.pillar] }}
                >
                  {s.icon}
                </span>
              </span>
              <span className="flex min-w-0 flex-col gap-[2px] pt-px">
                <span
                  className={cn(
                    "font-eyebrow text-[9.5px] font-bold uppercase tracking-[0.1em]",
                    PILLAR_TEXT[s.pillar],
                  )}
                >
                  {s.tag}
                </span>
                <span className="font-display text-[12.5px] font-semibold leading-[1.14] tracking-[-0.008em] text-ink">
                  {s.label}
                </span>
              </span>
            </div>
          </Fragment>
        ))}
      </div>
      <div
        className="mt-4 flex items-center gap-3 rounded-[12px] bg-[linear-gradient(100deg,#024794_0%,#262161_52%,#662d91_100%)] px-[15px] py-[11px] text-white"
        style={{ boxShadow: "0 10px 24px rgba(38,33,97,0.20)" }}
      >
        <span className="flex-none font-display text-[20px] font-bold leading-none opacity-90">=</span>
        <span className="font-display text-[15px] font-bold leading-[1.25] tracking-[-0.01em]">{result}</span>
      </div>
    </div>
  );
}
