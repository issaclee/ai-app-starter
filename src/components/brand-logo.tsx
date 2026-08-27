import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function BrandLogo({ size = 32, showWordmark = true, className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Image
        src="/aiappstarter-mark.svg"
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
      {showWordmark && (
        <span className="truncate font-semibold tracking-[-0.02em]">
          <span>AIApp</span><span className="text-brand">Starter</span>
        </span>
      )}
      <span className="sr-only">AIAppStarter</span>
    </span>
  );
}
