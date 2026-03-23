import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { ensureDatabase } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { DeliveryType } from "@prisma/client";
import type { Permission, UserRole } from "@/lib/rbac";
import { ALL_PERMISSIONS } from "@/lib/rbac";
import {
  DEFAULT_SITE_THEME,
  normalizeGradientDirection,
  normalizeGradientIntensity,
  normalizeHexColor,
  normalizeThemeBackgroundStyle,
  type SiteThemeValues,
} from "@/lib/theme";
import { KNOWN_TRACKED_IMAGES } from "@/lib/tracked-images";
import { decryptSecret, encryptSecret } from "@/lib/secrets-crypto";

export type VisitorRecord = {
  id: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
};

export type SessionRecord = {
  id: string;
  visitorId: string;
  authenticatedUserIdentifier?: string;
  path: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  maxStillSeconds?: number;
  topStillPoint?: string;
};

export type ContactMessageReason =
  | "general_query"
  | "purchasing_query"
  | "admin_access_request";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  reason: ContactMessageReason;
  authenticatedUserIdentifier?: string;
  createdAt: string;
  adminMessage: boolean;
};

export type ImageViewRecord = {
  id: string;
  imageId: string;
  visitorId: string;
  authenticatedUserIdentifier?: string;
  path: string;
  viewedSeconds: number;
  createdAt: string;
};

export type AppErrorLogRecord = {
  id: string;
  source: string;
  message: string;
  stack?: string;
  context?: string;
  createdAt: string;
};

export type ImageSpotlightRecord = {
  imageId: string;
  label: string;
  description: string;
  enabled: boolean;
};

export type AdminUserRecord = {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: UserRole;
  roleRank: number;
  modifiable: boolean;
  createdAt?: string;
};

export type RoleRecord = {
  name: string;
  description: string | null;
  modifiable: boolean;
  rank: number;
  permissions: Permission[];
};

export type SiteThemeRecord = SiteThemeValues;

export type NotificationRecipientRecord = {
  id: string;
  name: string | null;
  username: string;
  email: string;
};

export type DailyNotificationConfigRecord = {
  id: string;
  enabled: boolean;
  sendHour: number;
  sendMinute: number;
  timezone: string;
  fromEmail: string;
  recipientUserIds: string[];
  recipients: NotificationRecipientRecord[];
};

export type EmailServerSecretRecord = {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  defaultFromEmail: string;
};

export type ShopItemRecord = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  costPence: number;
  deliveryTime: string;
  deliveryType: DeliveryType;
  displayOrder: number;
  quantityTracked: boolean;
  quantity?: number;
  createdAt: string;
};

export type ClearAnalyticsLogsTarget =
  | "analytics"
  | "sessions"
  | "image_views"
  | "messages"
  | "all";

type AdminStats = {
  totalVisitors: number;
  returningVisitors: number;
  totalSessions: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  recentSessions: SessionRecord[];
  contactMessages: ContactMessage[];
  imageViews: ImageViewRecord[];
  users: AdminUserRecord[];
  roles: RoleRecord[];
};

type UserRoleContext = {
  userId: string;
  role: string;
  rank: number;
};

function normalizeRole(role: string) {
  const normalizedRole = role.trim().toLowerCase();

  if (!normalizedRole) {
    throw new Error("Role is required.");
  }

  if (!/^[a-z0-9_-]+$/.test(normalizedRole)) {
    throw new Error(
      "Role can only contain lowercase letters, numbers, hyphens, and underscores.",
    );
  }

  return normalizedRole;
}

function normalizeContactMessageReason(reason: string, adminMessage = false): ContactMessageReason {
  const normalizedReason = reason.trim().toLowerCase();

  if (adminMessage) {
    return "admin_access_request";
  }

  if (
    normalizedReason === "general_query" ||
    normalizedReason == "general-contact" ||
    normalizedReason === "general query"
  ) {
    return "general_query";
  }

  if (
    normalizedReason === "purchasing_query" ||
    normalizedReason === "purchasing-query" ||
    normalizedReason === "purchase query" ||
    normalizedReason === "purchasing query"
  ) {
    return "purchasing_query";
  }

  if (
    normalizedReason === "admin_access_request" ||
    normalizedReason === "admin-access-request" ||
    normalizedReason === "admin access request"
  ) {
    return "admin_access_request";
  }

  throw new Error("Reason must be one of: General Query, Purchasing Query, Admin Access Request.");
}

function mapAppErrorLog(log: {
  id: string;
  source: string;
  message: string;
  stack: string | null;
  context: unknown;
  createdAt: Date;
}): AppErrorLogRecord {
  return {
    id: log.id,
    source: log.source,
    message: log.message,
    stack: log.stack ?? undefined,
    context: log.context == null ? undefined : JSON.stringify(log.context, null, 2),
    createdAt: log.createdAt.toISOString(),
  };
}
function normalizeUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedUsername) {
    throw new Error("Username is required.");
  }

  if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
    throw new Error(
      "Username can only contain lowercase letters, numbers, hyphens, and underscores.",
    );
  }

  return normalizedUsername;
}

function normalizePermissions(permissions: string[]) {
  const allowed = new Set<string>(ALL_PERMISSIONS);
  const uniquePermissions = Array.from(new Set(permissions.map((value) => value.trim())));

  for (const permission of uniquePermissions) {
    if (!allowed.has(permission)) {
      throw new Error(`Invalid permission: ${permission}`);
    }
  }

  return uniquePermissions as Permission[];
}

function normalizeRank(value: number | string | undefined) {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    throw new Error("Rank must be a valid number.");
  }

  return Math.trunc(numericValue);
}

function normalizeSiteTheme(
  input: Partial<Omit<SiteThemeValues, "backgroundStyle" | "gradientDirection" | "gradientIntensity">> & {
    backgroundStyle?: string | null;
    gradientDirection?: number | null;
    gradientIntensity?: number | null;
  },
  existing: SiteThemeValues = DEFAULT_SITE_THEME,
): SiteThemeValues {
  return {
    backgroundStyle: normalizeThemeBackgroundStyle(
      input.backgroundStyle ?? existing.backgroundStyle,
      existing.backgroundStyle,
    ),
    gradientStart: normalizeHexColor(
      input.gradientStart ?? existing.gradientStart,
      existing.gradientStart,
    ),
    gradientEnd: normalizeHexColor(
      input.gradientEnd ?? existing.gradientEnd,
      existing.gradientEnd,
    ),
    gradientDirection: normalizeGradientDirection(
      input.gradientDirection ?? existing.gradientDirection,
      existing.gradientDirection,
    ),
    gradientIntensity: normalizeGradientIntensity(
      input.gradientIntensity ?? existing.gradientIntensity,
      existing.gradientIntensity,
    ),
    accent: normalizeHexColor(input.accent ?? existing.accent, existing.accent),
    surface: normalizeHexColor(input.surface ?? existing.surface, existing.surface),
    surfaceStrong: normalizeHexColor(
      input.surfaceStrong ?? existing.surfaceStrong,
      existing.surfaceStrong,
    ),
    text: normalizeHexColor(input.text ?? existing.text, existing.text),
    mutedText: normalizeHexColor(input.mutedText ?? existing.mutedText, existing.mutedText),
  };
}

async function getRoleOrThrow(roleName: string) {
  const role = await prisma.role.findUnique({
    where: { name: roleName },
    select: { name: true, rank: true, modifiable: true },
  });

  if (!role) {
    throw new Error("Role does not exist.");
  }

  return role;
}

async function getUserRoleContext(userId: string): Promise<UserRoleContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const role = await getRoleOrThrow(user.role);

  return {
    userId: user.id,
    role: role.name,
    rank: role.rank,
  };
}

async function getManageableUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, modifiable: true, role: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.modifiable) {
    throw new Error("This user is locked and cannot be modified.");
  }

  const role = await getRoleOrThrow(user.role);

  return {
    ...user,
    roleRank: role.rank,
  };
}

async function assertActorCanAssignRole(actorUserId: string, roleName: string) {
  const [actorContext, targetRole] = await Promise.all([
    getUserRoleContext(actorUserId),
    getRoleOrThrow(roleName),
  ]);

  if (targetRole.rank >= actorContext.rank) {
    throw new Error("You cannot assign a role at or above your own rank.");
  }

  return { actorContext, targetRole };
}

async function assertActorCanManageUser(actorUserId: string, targetUserId: string) {
  const [actorContext, targetUser] = await Promise.all([
    getUserRoleContext(actorUserId),
    getManageableUser(targetUserId),
  ]);

  if (targetUser.roleRank >= actorContext.rank) {
    throw new Error("You cannot modify a user at or above your own rank.");
  }

  return { actorContext, targetUser };
}

function mapSession(session: {
  id: string;
  visitorId: string;
  authenticatedUserIdentifier: string | null;
  path: string;
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  maxStillSeconds: number | null;
  topStillPoint: string | null;
}): SessionRecord {
  return {
    id: session.id,
    visitorId: session.visitorId,
    authenticatedUserIdentifier: session.authenticatedUserIdentifier ?? undefined,
    path: session.path,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString(),
    durationSeconds: session.durationSeconds ?? undefined,
    maxStillSeconds: session.maxStillSeconds ?? undefined,
    topStillPoint: session.topStillPoint ?? undefined,
  };
}

function mapContactMessage(message: {
  id: string;
  name: string;
  email: string;
  message: string;
  reason: string;
  authenticatedUserIdentifier: string | null;
  createdAt: Date;
  adminMessage: boolean;
}): ContactMessage {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    message: message.message,
    reason: normalizeContactMessageReason(message.reason, message.adminMessage),
    authenticatedUserIdentifier: message.authenticatedUserIdentifier ?? undefined,
    createdAt: message.createdAt.toISOString(),
    adminMessage: message.adminMessage,
  };
}

function mapImageView(view: {
  id: string;
  imageId: string;
  visitorId: string;
  authenticatedUserIdentifier: string | null;
  path: string;
  viewedSeconds: number;
  createdAt: Date;
}): ImageViewRecord {
  return {
    id: view.id,
    imageId: view.imageId,
    visitorId: view.visitorId,
    authenticatedUserIdentifier: view.authenticatedUserIdentifier ?? undefined,
    path: view.path,
    viewedSeconds: view.viewedSeconds,
    createdAt: view.createdAt.toISOString(),
  };
}

function mapNotificationRecipient(user: {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
}): NotificationRecipientRecord {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email ?? "",
  };
}

function mapDailyNotificationConfig(config: {
  id: string;
  enabled: boolean;
  sendHour: number;
  sendMinute: number;
  timezone: string;
  fromEmail: string | null;
  recipients: {
    user: { id: string; name: string | null; username: string; email: string | null };
  }[];
}): DailyNotificationConfigRecord {
  const recipients = config.recipients.map((entry) => mapNotificationRecipient(entry.user));

  return {
    id: config.id,
    enabled: config.enabled,
    sendHour: config.sendHour,
    sendMinute: config.sendMinute,
    timezone: config.timezone,
    fromEmail: config.fromEmail ?? "",
    recipientUserIds: recipients.map((recipient) => recipient.id),
    recipients,
  };
}

function mapEmailServerSecret(secret: {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  encryptedPassword: string | null;
  defaultFromEmail: string | null;
}): EmailServerSecretRecord {
  return {
    id: secret.id,
    host: secret.host,
    port: secret.port,
    secure: secret.secure,
    username: secret.username ?? "",
    hasPassword: Boolean(secret.encryptedPassword),
    defaultFromEmail: secret.defaultFromEmail ?? "",
  };
}

function mapShopItem(item: {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  costPence: number;
  deliveryTime: string;
  deliveryType: DeliveryType;
  displayOrder: number;
  quantityTracked: boolean;
  quantity: number | null;
  createdAt: Date;
}): ShopItemRecord {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    costPence: item.costPence,
    deliveryTime: item.deliveryTime,
    deliveryType: item.deliveryType,
    displayOrder: item.displayOrder,
    quantityTracked: item.quantityTracked,
    quantity: item.quantity ?? undefined,
    createdAt: item.createdAt.toISOString(),
  };
}

function mapAdminUser(
  user: {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    role: string;
    modifiable: boolean;
  },
  roleRanks: Map<string, number>,
): AdminUserRecord {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email ?? "",
    role: user.role,
    roleRank: roleRanks.get(user.role) ?? 0,
    modifiable: user.modifiable,
  };
}

function mapRole(role: {
  name: string;
  description: string | null;
  modifiable: boolean;
  rank: number;
  permissions: { permission: string }[];
}): RoleRecord {
  return {
    name: role.name,
    description: role.description,
    modifiable: role.modifiable,
    rank: role.rank,
    permissions: role.permissions
      .map((entry) => entry.permission)
      .filter((permission): permission is Permission =>
        ALL_PERMISSIONS.includes(permission as Permission),
      )
      .sort(),
  };
}

function mapSiteTheme(theme: {
  backgroundStyle: string | null;
  gradientStart: string;
  gradientEnd: string;
  gradientDirection: number | null;
  gradientIntensity: number | null;
  accent: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  mutedText: string;
}): SiteThemeRecord {
  return normalizeSiteTheme({
    backgroundStyle: theme.backgroundStyle ?? DEFAULT_SITE_THEME.backgroundStyle,
    gradientStart: theme.gradientStart,
    gradientEnd: theme.gradientEnd,
    gradientDirection: theme.gradientDirection,
    gradientIntensity: theme.gradientIntensity,
    accent: theme.accent,
    surface: theme.surface,
    surfaceStrong: theme.surfaceStrong,
    text: theme.text,
    mutedText: theme.mutedText,
  });
}

function mapImageSpotlight(
  imageId: string,
  enabled: boolean,
  imageLabels: Map<string, { label: string; description: string }>,
): ImageSpotlightRecord {
  const knownImage = imageLabels.get(imageId);

  return {
    imageId,
    label: knownImage?.label ?? imageId,
    description: knownImage?.description ?? "Tracked image spotlight setting.",
    enabled,
  };
}

export async function getCurrentUserRoleContext(userId: string) {
  await ensureDatabase();
  return getUserRoleContext(userId);
}

export async function getSiteTheme() {
  await ensureDatabase();

  const theme = await prisma.siteTheme.findUnique({
    where: { id: "default" },
  });

  if (!theme) {
    return DEFAULT_SITE_THEME;
  }

  return mapSiteTheme(theme);
}

export async function updateSiteTheme(input: Partial<SiteThemeValues>) {
  await ensureDatabase();

  const existingTheme = await getSiteTheme();
  const nextTheme = normalizeSiteTheme(input, existingTheme);

  const savedTheme = await prisma.siteTheme.upsert({
    where: { id: "default" },
    update: nextTheme,
    create: {
      id: "default",
      ...nextTheme,
    },
  });

  return mapSiteTheme(savedTheme);
}

export async function getEnabledImageSpotlightIds() {
  await ensureDatabase();

  const enabledSpotlights = await prisma.imageSpotlightSetting.findMany({
    where: { enabled: true },
    select: { imageId: true },
    orderBy: { imageId: "asc" },
  });

  return enabledSpotlights.map((entry) => entry.imageId);
}

export async function listImageSpotlights() {
  await ensureDatabase();

  const [spotlightSettings, viewedImages] = await Promise.all([
    prisma.imageSpotlightSetting.findMany({
      select: { imageId: true, enabled: true },
      orderBy: { imageId: "asc" },
    }),
    prisma.imageView.findMany({
      distinct: ["imageId"],
      select: { imageId: true },
      orderBy: { imageId: "asc" },
    }),
  ]);

  const imageLabels = new Map(
    KNOWN_TRACKED_IMAGES.map((image) => [
      image.imageId,
      { label: image.label, description: image.description },
    ]),
  );
  const enabledById = new Map(
    spotlightSettings.map((setting) => [setting.imageId, setting.enabled]),
  );
  const imageIds = new Set<string>([
    ...KNOWN_TRACKED_IMAGES.map((image) => image.imageId),
    ...viewedImages.map((image) => image.imageId),
    ...spotlightSettings.map((setting) => setting.imageId),
  ]);

  return Array.from(imageIds)
    .sort((a, b) => a.localeCompare(b))
    .map((imageId) =>
      mapImageSpotlight(imageId, enabledById.get(imageId) ?? false, imageLabels),
    );
}

export async function setImageSpotlight(imageId: string, enabled: boolean) {
  await ensureDatabase();

  const normalizedImageId = imageId.trim();

  if (!normalizedImageId) {
    throw new Error("Image id is required.");
  }

  const spotlight = await prisma.imageSpotlightSetting.upsert({
    where: { imageId: normalizedImageId },
    update: { enabled },
    create: {
      imageId: normalizedImageId,
      enabled,
    },
  });

  const imageLabels = new Map(
    KNOWN_TRACKED_IMAGES.map((image) => [
      image.imageId,
      { label: image.label, description: image.description },
    ]),
  );

  return mapImageSpotlight(spotlight.imageId, spotlight.enabled, imageLabels);
}

export async function listNotificationUsers() {
  await ensureDatabase();

  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
    },
    orderBy: { username: "asc" },
  });

  return users.map(mapNotificationRecipient);
}

export async function getDailyNotificationConfig() {
  await ensureDatabase();

  const config = await prisma.dailyNotificationConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: false,
      sendHour: 9,
      sendMinute: 0,
      timezone: "Europe/London",
      fromEmail: null,
    },
    include: {
      recipients: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { userId: "asc" },
      },
    },
  });

  return mapDailyNotificationConfig(config);
}

export async function updateDailyNotificationConfig(input: {
  enabled: boolean;
  sendHour: number;
  sendMinute: number;
  timezone: string;
  fromEmail?: string;
  recipientUserIds: string[];
}) {
  await ensureDatabase();

  const sendHour = Math.max(0, Math.min(23, Math.trunc(Number(input.sendHour))));
  const sendMinute = Math.max(0, Math.min(59, Math.trunc(Number(input.sendMinute))));
  const timezone = input.timezone.trim() || "Europe/London";
  const fromEmail = input.fromEmail?.trim() ?? "";
  const recipientUserIds = Array.from(new Set(input.recipientUserIds.map((value) => value.trim()).filter(Boolean)));

  const recipients = await prisma.user.findMany({
    where: {
      id: { in: recipientUserIds },
      email: { not: null },
    },
    select: { id: true },
  });

  if (recipients.length !== recipientUserIds.length) {
    throw new Error("All notification recipients must be valid users with email addresses.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.dailyNotificationConfig.upsert({
      where: { id: "default" },
      update: {
        enabled: Boolean(input.enabled),
        sendHour,
        sendMinute,
        timezone,
        fromEmail: fromEmail || null,
      },
      create: {
        id: "default",
        enabled: Boolean(input.enabled),
        sendHour,
        sendMinute,
        timezone,
        fromEmail: fromEmail || null,
      },
    });

    await tx.dailyNotificationRecipient.deleteMany({
      where: { configId: "default" },
    });

    if (recipientUserIds.length > 0) {
      await tx.dailyNotificationRecipient.createMany({
        data: recipientUserIds.map((userId) => ({
          configId: "default",
          userId,
        })),
        skipDuplicates: true,
      });
    }
  });

  return getDailyNotificationConfig();
}

export async function getEmailServerSecret() {
  await ensureDatabase();

  const secret = await prisma.emailServerSecret.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      host: "",
      port: 587,
      secure: false,
      username: null,
      encryptedPassword: null,
      defaultFromEmail: null,
    },
  });

  return mapEmailServerSecret(secret);
}

export async function getEmailServerSecretForTransport() {
  await ensureDatabase();

  const secret = await prisma.emailServerSecret.findUnique({
    where: { id: "default" },
  });

  if (!secret) {
    return null;
  }

  return {
    host: secret.host,
    port: secret.port,
    secure: secret.secure,
    username: secret.username ?? "",
    password: secret.encryptedPassword ? decryptSecret(secret.encryptedPassword) : "",
    defaultFromEmail: secret.defaultFromEmail ?? "",
  };
}

export async function updateEmailServerSecret(input: {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
  defaultFromEmail?: string;
}) {
  await ensureDatabase();

  const host = input.host.trim();
  const port = Math.max(1, Math.min(65535, Math.trunc(Number(input.port))));
  const secure = Boolean(input.secure);
  const username = input.username?.trim() ?? "";
  const password = input.password ?? "";
  const defaultFromEmail = input.defaultFromEmail?.trim() ?? "";

  if (!host) {
    throw new Error("SMTP host is required.");
  }

  const existing = await prisma.emailServerSecret.findUnique({
    where: { id: "default" },
    select: { encryptedPassword: true },
  });

  const encryptedPassword = password
    ? encryptSecret(password)
    : existing?.encryptedPassword ?? null;

  const saved = await prisma.emailServerSecret.upsert({
    where: { id: "default" },
    update: {
      host,
      port,
      secure,
      username: username || null,
      encryptedPassword,
      defaultFromEmail: defaultFromEmail || null,
    },
    create: {
      id: "default",
      host,
      port,
      secure,
      username: username || null,
      encryptedPassword,
      defaultFromEmail: defaultFromEmail || null,
    },
  });

  return mapEmailServerSecret(saved);
}

export async function listUsers() {
  await ensureDatabase();
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        modifiable: true,
      },
      orderBy: { username: "asc" },
    }),
    prisma.role.findMany({
      select: { name: true, rank: true },
    }),
  ]);

  const roleRanks = new Map(roles.map((role) => [role.name, role.rank]));
  return users.map((user) => mapAdminUser(user, roleRanks));
}

async function ensureShopItemOrder() {
  const items = await prisma.shopItem.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, displayOrder: true },
  });

  const needsNormalization = items.some(
    (item, index) => item.displayOrder !== index,
  );

  if (!needsNormalization) {
    return;
  }

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.shopItem.update({
        where: { id: item.id },
        data: { displayOrder: index },
      }),
    ),
  );
}

export async function listShopItems() {
  await ensureDatabase();
  await ensureShopItemOrder();

  const items = await prisma.shopItem.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return items.map(mapShopItem);
}

export async function getShopItemById(itemId: string) {
  await ensureDatabase();
  await ensureShopItemOrder();

  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    return null;
  }

  const item = await prisma.shopItem.findUnique({
    where: { id: normalizedItemId },
  });

  return item ? mapShopItem(item) : null;
}

export async function createShopItem(actorUserId: string, input: {
  title: string;
  description: string;
  imageUrl: string;
  costPence: number;
  deliveryTime: string;
  deliveryType: DeliveryType;
  quantityTracked: boolean;
  quantity?: number | null;
}) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_shop"))) {
    throw new Error("Unauthorized.");
  }

  await ensureShopItemOrder();

  const title = input.title.trim();
  const description = input.description.trim();
  const imageUrl = input.imageUrl.trim();
  const deliveryTime = input.deliveryTime.trim();
  const costPence = Math.max(0, Math.trunc(Number(input.costPence)));
  const quantityTracked = Boolean(input.quantityTracked);
  const quantity = quantityTracked ? Math.max(0, Math.trunc(Number(input.quantity ?? 0))) : null;

  if (!title) {
    throw new Error("Item title is required.");
  }

  if (!imageUrl) {
    throw new Error("Image URL is required.");
  }

  if (!deliveryTime) {
    throw new Error("Delivery time is required.");
  }

  if (!Number.isFinite(costPence)) {
    throw new Error("Cost must be a valid number.");
  }

  const maxOrder = await prisma.shopItem.aggregate({
    _max: { displayOrder: true },
  });

  const item = await prisma.shopItem.create({
    data: {
      id: randomUUID(),
      title,
      description,
      imageUrl,
      costPence,
      deliveryTime,
      deliveryType: input.deliveryType,
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      quantityTracked,
      quantity,
    },
  });

  return mapShopItem(item);
}

export async function updateShopItem(actorUserId: string, itemId: string, input: {
  title: string;
  description: string;
  imageUrl: string;
  costPence: number;
  deliveryTime: string;
  deliveryType: DeliveryType;
  quantityTracked: boolean;
  quantity?: number | null;
  displayOrder?: number;
}) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_shop"))) {
    throw new Error("Unauthorized.");
  }

  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error("Item id is required.");
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const imageUrl = input.imageUrl.trim();
  const deliveryTime = input.deliveryTime.trim();
  const costPence = Math.max(0, Math.trunc(Number(input.costPence)));
  const quantityTracked = Boolean(input.quantityTracked);
  const quantity = quantityTracked ? Math.max(0, Math.trunc(Number(input.quantity ?? 0))) : null;

  if (!title) {
    throw new Error("Item title is required.");
  }

  if (!imageUrl) {
    throw new Error("Image URL is required.");
  }

  if (!deliveryTime) {
    throw new Error("Delivery time is required.");
  }

  if (!Number.isFinite(costPence)) {
    throw new Error("Cost must be a valid number.");
  }

  const item = await prisma.shopItem.update({
    where: { id: normalizedItemId },
    data: {
      title,
      description,
      imageUrl,
      costPence,
      deliveryTime,
      deliveryType: input.deliveryType,
      displayOrder:
        typeof input.displayOrder === "number" ? Math.max(0, Math.trunc(input.displayOrder)) : undefined,
      quantityTracked,
      quantity,
    },
  });

  return mapShopItem(item);
}

export async function moveShopItem(actorUserId: string, itemId: string, direction: "up" | "down") {
  await ensureDatabase();
  await ensureShopItemOrder();

  if (!(await userHasPermission(actorUserId, "manage_shop"))) {
    throw new Error("Unauthorized.");
  }

  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error("Item id is required.");
  }

  const items = await prisma.shopItem.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, displayOrder: true },
  });

  const currentIndex = items.findIndex((item) => item.id === normalizedItemId);
  if (currentIndex === -1) {
    throw new Error("Item not found.");
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    const current = await prisma.shopItem.findUnique({ where: { id: normalizedItemId } });
    if (!current) {
      throw new Error("Item not found.");
    }
    return mapShopItem(current);
  }

  const currentItem = items[currentIndex];
  const targetItem = items[targetIndex];

  await prisma.$transaction([
    prisma.shopItem.update({
      where: { id: currentItem.id },
      data: { displayOrder: targetItem.displayOrder },
    }),
    prisma.shopItem.update({
      where: { id: targetItem.id },
      data: { displayOrder: currentItem.displayOrder },
    }),
  ]);

  const movedItem = await prisma.shopItem.findUnique({ where: { id: normalizedItemId } });
  if (!movedItem) {
    throw new Error("Item not found.");
  }

  return mapShopItem(movedItem);
}

export async function deleteShopItem(actorUserId: string, itemId: string) {
  await ensureDatabase();

  if (!(await userHasPermission(actorUserId, "manage_shop"))) {
    throw new Error("Unauthorized.");
  }

  const normalizedItemId = itemId.trim();
  if (!normalizedItemId) {
    throw new Error("Item id is required.");
  }

  await prisma.shopItem.delete({
    where: { id: normalizedItemId },
  });
}

export async function listAppErrorLogs() {
  await ensureDatabase();
  const logs = await prisma.appErrorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return logs.map(mapAppErrorLog);
}
export async function listRoles() {
  await ensureDatabase();
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        select: { permission: true },
        orderBy: { permission: "asc" },
      },
    },
    orderBy: [{ rank: "desc" }, { name: "asc" }],
  });

  return roles.map(mapRole);
}

export async function createOrUpdateRole(
  actorUserId: string,
  input: {
    name: string;
    description?: string;
    permissions: string[];
    rank?: number;
  },
) {
  await ensureDatabase();

  const roleName = normalizeRole(input.name);
  const permissions = normalizePermissions(input.permissions);
  const description = input.description?.trim() || null;
  const rank = normalizeRank(input.rank);

  const existingRole = await prisma.role.findUnique({
    where: { name: roleName },
    select: { name: true, modifiable: true, rank: true },
  });

  const actorContext = await getUserRoleContext(actorUserId);

  if (rank >= actorContext.rank) {
    throw new Error("You cannot create or update a role at or above your own rank.");
  }

  if (existingRole) {
    if (!existingRole.modifiable) {
      throw new Error("This role is locked and cannot be modified.");
    }

    if (existingRole.rank >= actorContext.rank) {
      throw new Error("You cannot modify a role at or above your own rank.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.role.upsert({
      where: { name: roleName },
      update: { description, rank },
      create: {
        name: roleName,
        description,
        modifiable: true,
        rank,
      },
    });

    await tx.rolePermission.deleteMany({ where: { roleName } });

    if (permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleName, permission })),
        skipDuplicates: true,
      });
    }
  });

  const role = await prisma.role.findUnique({
    where: { name: roleName },
    include: {
      permissions: {
        select: { permission: true },
        orderBy: { permission: "asc" },
      },
    },
  });

  if (!role) {
    throw new Error("Failed to load role.");
  }

  return mapRole(role);
}

export async function deleteRole(actorUserId: string, roleName: string) {
  await ensureDatabase();

  const normalizedRoleName = normalizeRole(roleName);
  const actorContext = await getUserRoleContext(actorUserId);

  if (actorContext.role === normalizedRoleName) {
    throw new Error("You cannot delete the role currently assigned to your account.");
  }

  const existingRole = await prisma.role.findUnique({
    where: { name: normalizedRoleName },
    select: { name: true, modifiable: true, rank: true },
  });

  if (!existingRole) {
    throw new Error("Role does not exist.");
  }

  if (!existingRole.modifiable) {
    throw new Error("This role is locked and cannot be deleted.");
  }

  if (existingRole.rank >= actorContext.rank) {
    throw new Error("You cannot delete a role at or above your own rank.");
  }

  const assignedUsers = await prisma.user.count({
    where: { role: normalizedRoleName },
  });

  if (assignedUsers > 0) {
    throw new Error("This role is still assigned to one or more users and cannot be deleted.");
  }

  await prisma.rolePermission.deleteMany({ where: { roleName: normalizedRoleName } });
  await prisma.role.delete({ where: { name: normalizedRoleName } });
}

export async function createUser(
  actorUserId: string,
  input: {
    name?: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
  },
) {
  await ensureDatabase();

  const username = normalizeUsername(input.username);
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const role = normalizeRole(input.role);
  const name = input.name?.trim() || null;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  await assertActorCanAssignRole(actorUserId, role);

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      role,
      passwordHash,
      modifiable: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      modifiable: true,
    },
  });

  const assignedRole = await getRoleOrThrow(user.role);
  return mapAdminUser(user, new Map([[assignedRole.name, assignedRole.rank]]));
}

export async function updateUserRole(actorUserId: string, userId: string, role: UserRole) {
  await ensureDatabase();

  const normalizedRole = normalizeRole(role);
  await Promise.all([
    assertActorCanManageUser(actorUserId, userId),
    assertActorCanAssignRole(actorUserId, normalizedRole),
  ]);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: normalizedRole },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      modifiable: true,
    },
  });

  const assignedRole = await getRoleOrThrow(user.role);
  return mapAdminUser(user, new Map([[assignedRole.name, assignedRole.rank]]));
}

export async function updateUserPassword(actorUserId: string, userId: string, password: string) {
  await ensureDatabase();

  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Password is required.");
  }

  await assertActorCanManageUser(actorUserId, userId);

  const passwordHash = await hash(normalizedPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function deleteUser(actorUserId: string, userId: string) {
  await ensureDatabase();
  await assertActorCanManageUser(actorUserId, userId);
  await prisma.user.delete({ where: { id: userId } });
}

export async function getUserPermissions(userId: string) {
  await ensureDatabase();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    return [] as Permission[];
  }

  const permissions = await prisma.rolePermission.findMany({
    where: { roleName: user.role },
    select: { permission: true },
    orderBy: { permission: "asc" },
  });

  return permissions
    .map((entry) => entry.permission)
    .filter((permission): permission is Permission =>
      ALL_PERMISSIONS.includes(permission as Permission),
    );
}

export async function userHasPermission(userId: string, permission: Permission) {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

export async function startSession(visitorId: string, pagePath: string, authenticatedUserIdentifier?: string | null) {
  await ensureDatabase();

  const sessionId = randomUUID();
  const nowDate = new Date();

  await prisma.$transaction(async (tx) => {
    const existingVisitor = await tx.siteVisitor.findUnique({
      where: { id: visitorId },
      select: {
        id: true,
        lastSeenAt: true,
        visitCount: true,
      },
    });

    if (existingVisitor) {
      const minutesSinceLastSeen =
        (nowDate.getTime() - existingVisitor.lastSeenAt.getTime()) / 60000;
      const nextVisitCount =
        minutesSinceLastSeen > 30
          ? existingVisitor.visitCount + 1
          : existingVisitor.visitCount;

      await tx.siteVisitor.update({
        where: { id: visitorId },
        data: {
          lastSeenAt: nowDate,
          visitCount: nextVisitCount,
        },
      });
    } else {
      await tx.siteVisitor.create({
        data: {
          id: visitorId,
          firstSeenAt: nowDate,
          lastSeenAt: nowDate,
          visitCount: 1,
        },
      });
    }

    await tx.siteSession.create({
      data: {
        id: sessionId,
        visitorId,
        authenticatedUserIdentifier: authenticatedUserIdentifier?.trim() || null,
        path: pagePath,
        startedAt: nowDate,
      },
    });
  });

  return sessionId;
}

export async function endSession(
  sessionId: string,
  metrics?: { maxStillSeconds?: number; topStillPoint?: string },
) {
  await ensureDatabase();

  const session = await prisma.siteSession.findUnique({
    where: { id: sessionId },
    select: {
      startedAt: true,
      endedAt: true,
    },
  });

  if (!session || session.endedAt) {
    return;
  }

  const now = new Date();
  const durationMs = now.getTime() - session.startedAt.getTime();

  await prisma.siteSession.update({
    where: { id: sessionId },
    data: {
      endedAt: now,
      durationSeconds: Math.max(0, Math.round(durationMs / 1000)),
      maxStillSeconds:
        typeof metrics?.maxStillSeconds === "number"
          ? Math.max(0, Math.round(metrics.maxStillSeconds))
          : null,
      topStillPoint: metrics?.topStillPoint ?? null,
    },
  });
}

export async function addContactMessage(
  name: string,
  email: string,
  message: string,
  reason: string,
  adminMessage = false,
  authenticatedUserIdentifier?: string | null,
) {
  await ensureDatabase();

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();
  const normalizedReason = normalizeContactMessageReason(reason, adminMessage);

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    throw new Error("All fields are required.");
  }

  await prisma.contactMessage.create({
    data: {
      id: randomUUID(),
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      reason: normalizedReason,
      authenticatedUserIdentifier: authenticatedUserIdentifier?.trim() || null,
      createdAt: new Date(),
      adminMessage,
    },
  });
}

export async function addImageView(
  imageId: string,
  visitorId: string,
  pagePath: string,
  viewedSeconds: number,
  authenticatedUserIdentifier?: string | null,
) {
  await ensureDatabase();

  const cleanImageId = imageId.trim();
  const cleanVisitorId = visitorId.trim();
  const cleanPath = pagePath.trim() || "/";
  const normalizedSeconds = Math.max(0, Math.round(viewedSeconds));

  if (!cleanImageId || !cleanVisitorId || normalizedSeconds < 1) {
    return;
  }

  await prisma.imageView.create({
    data: {
      id: randomUUID(),
      imageId: cleanImageId,
      visitorId: cleanVisitorId,
      authenticatedUserIdentifier: authenticatedUserIdentifier?.trim() || null,
      path: cleanPath,
      viewedSeconds: normalizedSeconds,
      createdAt: new Date(),
    },
  });
}

export async function deleteContactMessage(messageId: string) {
  await ensureDatabase();

  const normalizedMessageId = messageId.trim();
  if (!normalizedMessageId) {
    throw new Error("Message id is required.");
  }

  await prisma.contactMessage.delete({
    where: { id: normalizedMessageId },
  });
}

export async function clearAnalyticsLogs(target: ClearAnalyticsLogsTarget = "analytics") {
  await ensureDatabase();

  return prisma.$transaction(async (tx) => {
    let deletedSessions = 0;
    let deletedMessages = 0;
    let deletedImageViews = 0;
    let deletedVisitors = 0;

    if (target === "sessions" || target === "analytics" || target === "all") {
      const result = await tx.siteSession.deleteMany();
      deletedSessions = result.count;
    }

    if (target === "image_views" || target === "analytics" || target === "all") {
      const result = await tx.imageView.deleteMany();
      deletedImageViews = result.count;
    }

    if (target === "messages" || target === "all") {
      const result = await tx.contactMessage.deleteMany();
      deletedMessages = result.count;
    }

    if (target === "analytics" || target === "all") {
      const result = await tx.siteVisitor.deleteMany();
      deletedVisitors = result.count;
    }

    return {
      target,
      deletedSessions,
      deletedMessages,
      deletedImageViews,
      deletedVisitors,
    };
  });
}

export async function getAdminStats(): Promise<AdminStats> {
  await ensureDatabase();

  const [
    totalVisitors,
    returningVisitors,
    totalSessions,
    durationStats,
    recentSessions,
    contactMessages,
    imageViews,
    users,
    roles,
  ] = await Promise.all([
    prisma.siteVisitor.count(),
    prisma.siteVisitor.count({ where: { visitCount: { gt: 1 } } }),
    prisma.siteSession.count(),
    prisma.siteSession.aggregate({
      where: { endedAt: { not: null } },
      _sum: { durationSeconds: true },
      _avg: { durationSeconds: true },
    }),
    prisma.siteSession.findMany({
      orderBy: { startedAt: "desc" },
      take: 500,
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.imageView.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        modifiable: true,
      },
      orderBy: { username: "asc" },
    }),
    prisma.role.findMany({
      include: {
        permissions: {
          select: { permission: true },
          orderBy: { permission: "asc" },
        },
      },
      orderBy: [{ rank: "desc" }, { name: "asc" }],
    }),
  ]);

  const roleRanks = new Map(roles.map((role) => [role.name, role.rank]));

  return {
    totalVisitors,
    returningVisitors,
    totalSessions,
    totalDurationSeconds: durationStats._sum.durationSeconds ?? 0,
    averageDurationSeconds: Math.round(durationStats._avg.durationSeconds ?? 0),
    recentSessions: recentSessions.map(mapSession),
    contactMessages: contactMessages.map(mapContactMessage),
    imageViews: imageViews.map(mapImageView),
    users: users.map((user) => mapAdminUser(user, roleRanks)),
    roles: roles.map(mapRole),
  };
}










