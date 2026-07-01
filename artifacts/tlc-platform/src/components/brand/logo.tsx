import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  href?: string;
  variant?: "light" | "dark"; // dark = on dark surfaces (white chip behind)
  className?: string;
  subtitle?: string;
}

/** The Wisdom Tri tree logo. On dark surfaces a white chip sits behind it. */
export function Logo({
  size = 40,
  withWordmark = false,
  href = "/",
  variant = "light",
  className,
  subtitle,
}: LogoProps) {
  const img = (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        variant === "dark" && "rounded-[7px] bg-white p-0.5",
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/brand/wisdomtri-logo.png"
        alt="The Wisdom Tri"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: "100%", height: "100%" }}
      />
    </span>
  );

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {img}
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-sans text-[13px] font-semibold",
              variant === "dark" ? "text-white" : "text-indigo",
            )}
          >
            The Wisdom Tri
          </span>
          {subtitle && (
            <span className="mt-0.5 font-sans text-[10px] font-medium uppercase tracking-[.06em] text-muted-3">
              {subtitle}
            </span>
          )}
        </span>
      )}
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
