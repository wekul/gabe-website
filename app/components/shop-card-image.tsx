"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function ShopCardImage({ src, alt, className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="shop-card-image-shell">
      {!loaded ? <div className="shop-card-image-skeleton" aria-hidden="true" /> : null}
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={1600}
        unoptimized
        className={`${className} ${loaded ? "shop-card-image-loaded" : "shop-card-image-loading"}`.trim()}
        onLoad={() => {
          setLoaded(true);
        }}
      />
    </div>
  );
}
