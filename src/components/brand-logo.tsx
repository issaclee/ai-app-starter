import Image from "next/image";
import { appConfig } from "@/config/app";

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  className?: string;
};

export function BrandLogo({ size = 32, showWordmark = true, className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Image
        src={appConfig.logo.src}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
      {showWordmark && (
        <span className="truncate font-semibold tracking-[-0.02em]">
          <span>{appConfig.logo.primaryText}</span><span className="text-brand"> {appConfig.logo.accentText}</span>
        </span>
      )}
      <span className="sr-only">{appConfig.name}</span>
    </span>
  );
}
