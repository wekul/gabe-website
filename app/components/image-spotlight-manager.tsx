"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Props = {
  enabledImageIds: string[];
};

export default function ImageSpotlightManager({ enabledImageIds }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    const allTrackedImages = document.querySelectorAll<HTMLElement>("[data-track-image]");
    const enabledSet = new Set(enabledImageIds);

    allTrackedImages.forEach((imageElement) => {
      const imageId = imageElement.getAttribute("data-track-image");
      if (!imageId) {
        return;
      }

      imageElement.classList.toggle("spotlight-image", enabledSet.has(imageId));
    });
  }, [enabledImageIds, pathname]);

  return null;
}
