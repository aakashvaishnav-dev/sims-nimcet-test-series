import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand" aria-label="SIMS Raipur home">
      <span className={`brand-mark ${compact ? "brand-mark-compact" : ""}`}>
        <Image
          src="/sims-raipur-logo.png"
          alt="SIMS Raipur"
          width={compact ? 54 : 64}
          height={compact ? 54 : 64}
          priority
        />
      </span>
      <span className="brand-copy">
        <span className="brand-title">SIMS RAIPUR</span>
        <span className="brand-subtitle">NIMCET Test Series</span>
      </span>
    </Link>
  );
}
