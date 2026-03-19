export type TrackedImageDefinition = {
  imageId: string;
  label: string;
  description: string;
};

export const KNOWN_TRACKED_IMAGES: TrackedImageDefinition[] = [
  {
    imageId: "footer-github-icon",
    label: "Footer GitHub Icon",
    description: "Global footer GitHub link icon.",
  },
];
