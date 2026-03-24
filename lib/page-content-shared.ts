export const PAGE_BUILTIN_LAYOUT_DEFAULTS = {
  home: {
    hero: ["kicker", "title", "body", "actions"],
  },
  contact: {
    intro: ["kicker", "title", "body"],
    form: ["submitLabel"],
  },
  shop: {
    header: ["kicker", "title"],
    empty: ["emptyState"],
  },
} as const;

export const PAGE_BUILTIN_POSITION_DEFAULTS = {
  home: {
    hero: {
      kicker: { x: 8, y: 8 },
      title: { x: 8, y: 18 },
      body: { x: 8, y: 40 },
      actions: { x: 8, y: 62 },
    },
  },
  contact: {
    intro: {
      kicker: { x: 0, y: 0 },
      title: { x: 0, y: 12 },
      body: { x: 0, y: 34 },
    },
    form: {
      submitLabel: { x: 0, y: 0 },
    },
  },
  shop: {
    header: {
      kicker: { x: 36, y: 8 },
      title: { x: 28, y: 20 },
    },
    empty: {
      emptyState: { x: 24, y: 10 },
    },
  },
} as const;

export type PageKey = "home" | "contact" | "shop";
export type PageBuiltinPosition = { x: number; y: number };
export type PageBuiltinLayoutMap = Record<string, Record<string, PageBuiltinPosition>>;
