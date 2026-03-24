import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isPageEditorBetaEnabled } from "@/lib/site-data";
import { ensureDatabase } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { logAdminAuditEvent } from "@/lib/audit-logging";
import { userHasPermission } from "@/lib/site-data";

export const PAGE_CONTENT_DEFAULTS = {
  home: {
    kicker: "Studio Archive",
    title: "Matthaus Addy",
    body: "Artwork, objects, and digital editions presented with a quieter editorial structure. Browse current pieces, make purchase enquiries, or get in touch directly.",
    primaryLinkLabel: "Enter Shop",
    secondaryLinkLabel: "Contact",
  },
  contact: {
    kicker: "Correspondence",
    title: "Contact",
    body: "Use this form for purchase enquiries or general communication. Messages are routed directly into the site admin panel.",
    submitLabel: "Send Message",
  },
  shop: {
    kicker: "Selected Works",
    title: "Shop",
    emptyState: "No items are available yet.",
  },
} as const;

export const PAGE_CONTENT_FIELD_LABELS = {
  home: {
    kicker: "Eyebrow",
    title: "Title",
    body: "Intro copy",
    primaryLinkLabel: "Primary button label",
    secondaryLinkLabel: "Secondary button label",
  },
  contact: {
    kicker: "Eyebrow",
    title: "Title",
    body: "Intro copy",
    submitLabel: "Submit button label",
  },
  shop: {
    kicker: "Eyebrow",
    title: "Title",
    emptyState: "Empty state copy",
  },
} as const;

export const PAGE_CONTENT_SLOT_LABELS = {
  home: {
    hero_end: "After hero",
    page_end: "Bottom of page",
  },
  contact: {
    intro_end: "After intro",
    form_end: "Below form",
  },
  shop: {
    header_end: "After shop heading",
    grid_end: "Below shop grid",
  },
} as const;

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

export const PAGE_BUILTIN_LAYOUT_LABELS = {
  home: {
    kicker: "Eyebrow",
    title: "Title",
    body: "Intro Copy",
    actions: "Action Links",
  },
  contact: {
    kicker: "Eyebrow",
    title: "Title",
    body: "Intro Copy",
    submitLabel: "Submit Button",
  },
  shop: {
    kicker: "Eyebrow",
    title: "Title",
    emptyState: "Empty State",
  },
} as const;

export type PageKey = keyof typeof PAGE_CONTENT_DEFAULTS;
export type PageContentMap<K extends PageKey = PageKey> = (typeof PAGE_CONTENT_DEFAULTS)[K];
export type PageSlotKey<K extends PageKey = PageKey> = keyof (typeof PAGE_CONTENT_SLOT_LABELS)[K];
export type PageBuiltinPosition = { x: number; y: number };
export type PageBuiltinLayoutMap = Record<string, Record<string, PageBuiltinPosition>>;

export type PageContentItemRecord = {
  id: string;
  pageKey: PageKey;
  slotKey: string;
  title: string;
  body: string;
  imageUrl?: string;
  linkLabel?: string;
  linkHref?: string;
  displayOrder: number;
};

export type PageContentSnapshot = {
  pageKey: PageKey;
  content: Record<string, string>;
  items: PageContentItemRecord[];
  layout: PageBuiltinLayoutMap;
};

export type PageContentVersionRecord = {
  id: string;
  pageKey: PageKey;
  label?: string;
  createdAt: string;
  createdByIdentifier?: string;
};

function isPageKey(value: string): value is PageKey {
  return value in PAGE_CONTENT_DEFAULTS;
}

function isValidSlot(pageKey: PageKey, slotKey: string) {
  return slotKey in PAGE_CONTENT_SLOT_LABELS[pageKey];
}

function getLayoutBlockKey(regionKey: string) {
  return `__position__:${regionKey}`;
}

function normalizePageContentValue(value: string) {
  const nextValue = value.trim();
  if (!nextValue) {
    throw new Error("Content value is required.");
  }
  return nextValue;
}

function mapPageContentItem(item: {
  id: string;
  pageKey: string;
  slotKey: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkLabel: string | null;
  linkHref: string | null;
  displayOrder: number;
}): PageContentItemRecord {
  return {
    id: item.id,
    pageKey: item.pageKey as PageKey,
    slotKey: item.slotKey,
    title: item.title,
    body: item.body,
    imageUrl: item.imageUrl ?? undefined,
    linkLabel: item.linkLabel ?? undefined,
    linkHref: item.linkHref ?? undefined,
    displayOrder: item.displayOrder,
  };
}

function normalizeSnapshotItems(pageKey: PageKey, items: PageContentItemRecord[]) {
  const grouped = new Map<string, PageContentItemRecord[]>();

  for (const item of items) {
    if (!isValidSlot(pageKey, item.slotKey)) {
      throw new Error(`Unknown page slot: ${item.slotKey}.`);
    }

    const title = item.title.trim();
    const body = item.body.trim();

    if (!title) {
      throw new Error("Item title is required.");
    }

    if (!body) {
      throw new Error("Item body is required.");
    }

    const normalizedItem: PageContentItemRecord = {
      id: item.id,
      pageKey,
      slotKey: item.slotKey,
      title,
      body,
      imageUrl: item.imageUrl?.trim() || undefined,
      linkLabel: item.linkLabel?.trim() || undefined,
      linkHref: item.linkHref?.trim() || undefined,
      displayOrder: 0,
    };

    const group = grouped.get(normalizedItem.slotKey) ?? [];
    group.push(normalizedItem);
    grouped.set(normalizedItem.slotKey, group);
  }

  const normalized: PageContentItemRecord[] = [];
  for (const [slotKey, slotItems] of grouped) {
    slotItems.forEach((item, index) => {
      normalized.push({ ...item, slotKey, displayOrder: index });
    });
  }

  return normalized.sort((a, b) => a.slotKey.localeCompare(b.slotKey) || a.displayOrder - b.displayOrder);
}

function normalizeSnapshotContent(pageKey: PageKey, content: Record<string, string>) {
  const defaults = PAGE_CONTENT_DEFAULTS[pageKey] as Record<string, string>;
  const allowedKeys = Object.keys(defaults);
  return Object.fromEntries(
    allowedKeys.map((key) => [key, normalizePageContentValue(content[key] ?? defaults[key])]),
  );
}

function normalizeBuiltinLayout(pageKey: PageKey, layout?: PageBuiltinLayoutMap): PageBuiltinLayoutMap {
  const defaults = PAGE_BUILTIN_POSITION_DEFAULTS[pageKey] as Record<string, Record<string, PageBuiltinPosition>>;
  const normalized: PageBuiltinLayoutMap = {};

  for (const [regionKey, defaultPositions] of Object.entries(defaults)) {
    const requestedRegion = layout?.[regionKey];
    const regionPositions: Record<string, PageBuiltinPosition> = {};

    for (const [blockKey, defaultPosition] of Object.entries(defaultPositions)) {
      const requestedPosition = requestedRegion?.[blockKey];
      const x = typeof requestedPosition?.x === "number" ? requestedPosition.x : defaultPosition.x;
      const y = typeof requestedPosition?.y === "number" ? requestedPosition.y : defaultPosition.y;
      regionPositions[blockKey] = {
        x: Math.max(0, Math.min(x, 92)),
        y: Math.max(0, Math.min(y, 92)),
      };
    }

    normalized[regionKey] = regionPositions;
  }

  return normalized;
}

async function getActorIdentifier(actorUserId: string) {
  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { username: true, email: true, name: true },
  });

  if (!user) {
    return undefined;
  }

  return user.username ? `@${user.username}` : user.email ?? user.name ?? actorUserId;
}

async function getCurrentPageSnapshot<K extends PageKey>(pageKey: K): Promise<PageContentSnapshot> {
  const [content, items, layout] = await Promise.all([
    getPageContent(pageKey),
    getPageContentItems(pageKey),
    getPageBuiltinLayout(pageKey),
  ]);
  return {
    pageKey,
    content: { ...content },
    items,
    layout,
  };
}

function serializeSnapshot(snapshot: PageContentSnapshot) {
  return JSON.stringify({
    pageKey: snapshot.pageKey,
    content: snapshot.content,
    items: normalizeSnapshotItems(snapshot.pageKey, snapshot.items),
    layout: normalizeBuiltinLayout(snapshot.pageKey, snapshot.layout),
  });
}

async function createPageContentVersionEntry(
  pageKey: PageKey,
  snapshot: PageContentSnapshot,
  options?: { actorUserId?: string; label?: string },
) {
  const createdByIdentifier = options?.actorUserId ? await getActorIdentifier(options.actorUserId) : undefined;

  return prisma.pageContentVersion.create({
    data: {
      pageKey,
      snapshot: JSON.parse(serializeSnapshot(snapshot)),
      label: options?.label,
      createdByUserId: options?.actorUserId,
      createdByIdentifier,
    },
  });
}

export function getPageContentFieldLabels(pageKey: PageKey) {
  return PAGE_CONTENT_FIELD_LABELS[pageKey];
}

export function getPageContentSlotLabels(pageKey: PageKey) {
  return PAGE_CONTENT_SLOT_LABELS[pageKey];
}

export function getPageBuiltinLayoutLabels(pageKey: PageKey) {
  return PAGE_BUILTIN_LAYOUT_LABELS[pageKey];
}

export async function getPageBuiltinLayout(pageKey: PageKey): Promise<PageBuiltinLayoutMap> {
  await ensureDatabase();

  const defaults = PAGE_BUILTIN_POSITION_DEFAULTS[pageKey] as Record<string, Record<string, PageBuiltinPosition>>;
  const blocks = await prisma.pageContentBlock.findMany({
    where: {
      pageKey,
      blockKey: { startsWith: "__position__:" },
    },
  });

  const rawLayout: PageBuiltinLayoutMap = {};
  for (const block of blocks) {
    const regionKey = block.blockKey.replace("__position__:", "");
    try {
      const parsed = JSON.parse(block.value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const region: Record<string, PageBuiltinPosition> = {};
        for (const [blockKey, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (blockKey in (defaults[regionKey] ?? {}) && value && typeof value === "object") {
            const nextValue = value as { x?: unknown; y?: unknown };
            region[blockKey] = {
              x: typeof nextValue.x === "number" ? nextValue.x : defaults[regionKey][blockKey].x,
              y: typeof nextValue.y === "number" ? nextValue.y : defaults[regionKey][blockKey].y,
            };
          }
        }
        rawLayout[regionKey] = region;
      }
    } catch {
      rawLayout[regionKey] = defaults[regionKey] ?? {};
    }
  }

  return normalizeBuiltinLayout(pageKey, rawLayout);
}

export async function getPageContent<K extends PageKey>(pageKey: K): Promise<PageContentMap<K>> {
  await ensureDatabase();

  const defaults = PAGE_CONTENT_DEFAULTS[pageKey];
  const allowedKeys = new Set(Object.keys(defaults));
  const blocks = await prisma.pageContentBlock.findMany({
    where: { pageKey },
    orderBy: { blockKey: "asc" },
  });

  const overrides = Object.fromEntries(
    blocks.filter((block) => allowedKeys.has(block.blockKey)).map((block) => [block.blockKey, block.value]),
  );

  return {
    ...defaults,
    ...overrides,
  } as PageContentMap<K>;
}

export async function getPageContentItems<K extends PageKey>(pageKey: K) {
  await ensureDatabase();

  const items = await prisma.pageContentItem.findMany({
    where: { pageKey },
    orderBy: [{ slotKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
  });

  return items.map(mapPageContentItem);
}

export async function ensurePageContentVersionBaseline<K extends PageKey>(pageKey: K) {
  await ensureDatabase();

  const existingCount = await prisma.pageContentVersion.count({ where: { pageKey } });
  if (existingCount > 0) {
    return;
  }

  const snapshot = await getCurrentPageSnapshot(pageKey);
  await createPageContentVersionEntry(pageKey, snapshot, { label: "Initial published state" });
}

export async function listPageContentVersions<K extends PageKey>(pageKey: K): Promise<PageContentVersionRecord[]> {
  await ensureDatabase();

  const versions = await prisma.pageContentVersion.findMany({
    where: { pageKey },
    orderBy: { createdAt: "desc" },
  });

  return versions.map((version) => ({
    id: version.id,
    pageKey: version.pageKey as PageKey,
    label: version.label ?? undefined,
    createdAt: version.createdAt.toISOString(),
    createdByIdentifier: version.createdByIdentifier ?? undefined,
  }));
}

export async function canCurrentUserManagePages() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return false;
    }

    if (!(await isPageEditorBetaEnabled())) {
      return false;
    }

    return userHasPermission(userId, "manage_pages");
  } catch {
    return false;
  }
}

export async function updatePageContentBlock(
  actorUserId: string,
  pageKey: string,
  blockKey: string,
  value: string,
) {
  await ensureDatabase();

  if (!isPageKey(pageKey)) {
    throw new Error("Unknown page.");
  }

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  const defaults = PAGE_CONTENT_DEFAULTS[pageKey] as Record<string, string>;
  if (!(blockKey in defaults)) {
    throw new Error("Unknown page block.");
  }

  const nextValue = normalizePageContentValue(value);

  const savedBlock = await prisma.pageContentBlock.upsert({
    where: {
      pageKey_blockKey: {
        pageKey,
        blockKey,
      },
    },
    update: { value: nextValue },
    create: {
      pageKey,
      blockKey,
      value: nextValue,
    },
  });

  await logAdminAuditEvent(actorUserId, {
    action: "update_page_content",
    section: `page_editor:${pageKey}`,
    targetType: "page_block",
    targetId: `${pageKey}:${blockKey}`,
    details: { value: nextValue },
  });

  return savedBlock;
}

export async function createPageContentItem(
  actorUserId: string,
  input: {
    pageKey: string;
    slotKey: string;
    title: string;
    body: string;
    imageUrl?: string;
    linkLabel?: string;
    linkHref?: string;
  },
) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  if (!isPageKey(input.pageKey)) {
    throw new Error("Unknown page.");
  }

  if (!isValidSlot(input.pageKey, input.slotKey)) {
    throw new Error("Unknown page slot.");
  }

  const title = input.title.trim();
  const body = input.body.trim();
  const imageUrl = input.imageUrl?.trim() || null;
  const linkLabel = input.linkLabel?.trim() || null;
  const linkHref = input.linkHref?.trim() || null;

  if (!title) {
    throw new Error("Item title is required.");
  }

  if (!body) {
    throw new Error("Item body is required.");
  }

  const maxOrder = await prisma.pageContentItem.aggregate({
    where: { pageKey: input.pageKey, slotKey: input.slotKey },
    _max: { displayOrder: true },
  });

  const item = await prisma.pageContentItem.create({
    data: {
      pageKey: input.pageKey,
      slotKey: input.slotKey,
      title,
      body,
      imageUrl,
      linkLabel,
      linkHref,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  });

  await logAdminAuditEvent(actorUserId, {
    action: "create_page_item",
    section: `page_editor:${input.pageKey}`,
    targetType: "page_item",
    targetId: item.id,
    details: { slotKey: input.slotKey, title },
  });

  return mapPageContentItem(item);
}

export async function updatePageContentItem(
  actorUserId: string,
  itemId: string,
  input: {
    pageKey: string;
    slotKey: string;
    title: string;
    body: string;
    imageUrl?: string;
    linkLabel?: string;
    linkHref?: string;
    displayOrder?: number;
  },
) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  if (!isPageKey(input.pageKey)) {
    throw new Error("Unknown page.");
  }

  if (!isValidSlot(input.pageKey, input.slotKey)) {
    throw new Error("Unknown page slot.");
  }

  const title = input.title.trim();
  const body = input.body.trim();
  const imageUrl = input.imageUrl?.trim() || null;
  const linkLabel = input.linkLabel?.trim() || null;
  const linkHref = input.linkHref?.trim() || null;

  if (!title) {
    throw new Error("Item title is required.");
  }

  if (!body) {
    throw new Error("Item body is required.");
  }

  const item = await prisma.pageContentItem.update({
    where: { id: itemId },
    data: {
      pageKey: input.pageKey,
      slotKey: input.slotKey,
      title,
      body,
      imageUrl,
      linkLabel,
      linkHref,
      ...(typeof input.displayOrder === "number" ? { displayOrder: input.displayOrder } : {}),
    },
  });

  await logAdminAuditEvent(actorUserId, {
    action: "update_page_item",
    section: `page_editor:${input.pageKey}`,
    targetType: "page_item",
    targetId: itemId,
    details: { slotKey: input.slotKey, title, displayOrder: input.displayOrder },
  });

  return mapPageContentItem(item);
}

export async function movePageContentItem(actorUserId: string, itemId: string, direction: "up" | "down") {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  const currentItem = await prisma.pageContentItem.findUnique({
    where: { id: itemId },
    select: { id: true, pageKey: true, slotKey: true, displayOrder: true },
  });

  if (!currentItem) {
    throw new Error("Item not found.");
  }

  const items = await prisma.pageContentItem.findMany({
    where: { pageKey: currentItem.pageKey, slotKey: currentItem.slotKey },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, displayOrder: true },
  });

  const currentIndex = items.findIndex((item: { id: string; displayOrder: number }) => item.id === itemId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex === -1 || nextIndex < 0 || nextIndex >= items.length) {
    return currentItem;
  }

  const swapItem = items[nextIndex];

  await prisma.$transaction([
    prisma.pageContentItem.update({
      where: { id: currentItem.id },
      data: { displayOrder: swapItem.displayOrder },
    }),
    prisma.pageContentItem.update({
      where: { id: swapItem.id },
      data: { displayOrder: currentItem.displayOrder },
    }),
  ]);

  await logAdminAuditEvent(actorUserId, {
    action: "move_page_item",
    section: `page_editor:${currentItem.pageKey}`,
    targetType: "page_item",
    targetId: itemId,
    details: { direction, slotKey: currentItem.slotKey },
  });

  const movedItem = await prisma.pageContentItem.findUnique({ where: { id: itemId } });
  if (!movedItem) {
    throw new Error("Item not found.");
  }

  return mapPageContentItem(movedItem);
}

export async function deletePageContentItem(actorUserId: string, itemId: string) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  const existing = await prisma.pageContentItem.findUnique({
    where: { id: itemId },
    select: { pageKey: true, slotKey: true },
  });

  if (!existing) {
    throw new Error("Item not found.");
  }

  await prisma.pageContentItem.delete({ where: { id: itemId } });

  await logAdminAuditEvent(actorUserId, {
    action: "delete_page_item",
    section: `page_editor:${existing.pageKey}`,
    targetType: "page_item",
    targetId: itemId,
    details: { slotKey: existing.slotKey },
  });
}

export async function publishPageContentSnapshot(
  actorUserId: string,
  input: {
    pageKey: string;
    content: Record<string, string>;
    items: PageContentItemRecord[];
    layout: PageBuiltinLayoutMap;
  },
) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  if (!isPageKey(input.pageKey)) {
    throw new Error("Unknown page.");
  }

  const pageKey = input.pageKey;
  const normalizedContent = normalizeSnapshotContent(pageKey, input.content);
  const normalizedItems = normalizeSnapshotItems(pageKey, input.items);
  const normalizedLayout = normalizeBuiltinLayout(pageKey, input.layout);
  const currentSnapshot = await getCurrentPageSnapshot(pageKey);
  const nextSnapshot: PageContentSnapshot = {
    pageKey,
    content: normalizedContent,
    items: normalizedItems,
    layout: normalizedLayout,
  };

  if (serializeSnapshot(currentSnapshot) !== serializeSnapshot(nextSnapshot)) {
    const versionCount = await prisma.pageContentVersion.count({ where: { pageKey } });
    if (versionCount === 0) {
      await createPageContentVersionEntry(pageKey, currentSnapshot, { label: "Initial published state" });
    }
  }

  await prisma.$transaction(async (tx) => {
    const blockKeys = Object.keys(normalizedContent);
    const layoutKeys = Object.keys(normalizedLayout).map(getLayoutBlockKey);
    await tx.pageContentBlock.deleteMany({
      where: {
        pageKey,
        OR: [
          { blockKey: { notIn: [...blockKeys, ...layoutKeys] } },
          { blockKey: { startsWith: "__layout__:", notIn: layoutKeys } },
        ],
      },
    });

    for (const [blockKey, value] of Object.entries(normalizedContent)) {
      await tx.pageContentBlock.upsert({
        where: { pageKey_blockKey: { pageKey, blockKey } },
        update: { value },
        create: { pageKey, blockKey, value },
      });
    }

    for (const [regionKey, order] of Object.entries(normalizedLayout)) {
      const blockKey = getLayoutBlockKey(regionKey);
      await tx.pageContentBlock.upsert({
        where: { pageKey_blockKey: { pageKey, blockKey } },
        update: { value: JSON.stringify(order) },
        create: { pageKey, blockKey, value: JSON.stringify(order) },
      });
    }

    const itemIds = normalizedItems.map((item) => item.id);
    await tx.pageContentItem.deleteMany({
      where: {
        pageKey,
        ...(itemIds.length > 0 ? { id: { notIn: itemIds } } : {}),
      },
    });

    if (itemIds.length === 0) {
      await tx.pageContentItem.deleteMany({ where: { pageKey } });
    }

    for (const item of normalizedItems) {
      await tx.pageContentItem.upsert({
        where: { id: item.id },
        update: {
          pageKey,
          slotKey: item.slotKey,
          title: item.title,
          body: item.body,
          imageUrl: item.imageUrl ?? null,
          linkLabel: item.linkLabel ?? null,
          linkHref: item.linkHref ?? null,
          displayOrder: item.displayOrder,
        },
        create: {
          id: item.id,
          pageKey,
          slotKey: item.slotKey,
          title: item.title,
          body: item.body,
          imageUrl: item.imageUrl ?? null,
          linkLabel: item.linkLabel ?? null,
          linkHref: item.linkHref ?? null,
          displayOrder: item.displayOrder,
        },
      });
    }
  });

  await createPageContentVersionEntry(pageKey, nextSnapshot, {
    actorUserId,
    label: "Published changes",
  });

  await logAdminAuditEvent(actorUserId, {
    action: "publish_page_content",
    section: `page_editor:${pageKey}`,
    targetType: "page",
    targetId: pageKey,
    details: {
      blockCount: Object.keys(normalizedContent).length,
      itemCount: normalizedItems.length,
      layoutRegions: Object.keys(normalizedLayout),
    },
  });

  return nextSnapshot;
}

export async function restorePageContentVersion(actorUserId: string, versionId: string) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_pages"))) {
    throw new Error("Unauthorized.");
  }

  const version = await prisma.pageContentVersion.findUnique({ where: { id: versionId } });
  if (!version || !isPageKey(version.pageKey)) {
    throw new Error("Version not found.");
  }

  const snapshotValue = version.snapshot as {
    pageKey?: string;
    content?: Record<string, string>;
    items?: PageContentItemRecord[];
    layout?: PageBuiltinLayoutMap;
  };
  if (!snapshotValue.content || !Array.isArray(snapshotValue.items)) {
    throw new Error("Version snapshot is invalid.");
  }

  await publishPageContentSnapshot(actorUserId, {
    pageKey: version.pageKey,
    content: snapshotValue.content,
    items: snapshotValue.items,
    layout: snapshotValue.layout ?? normalizeBuiltinLayout(version.pageKey),
  });

  await prisma.pageContentVersion.update({
    where: { id: versionId },
    data: {
      label: version.label ?? "Restored version",
    },
  });

  await logAdminAuditEvent(actorUserId, {
    action: "restore_page_content_version",
    section: `page_editor:${version.pageKey}`,
    targetType: "page_version",
    targetId: versionId,
    details: { restoredVersionId: versionId },
  });

  return version.pageKey;
}










