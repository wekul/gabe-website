import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSIONS } from "@/lib/rbac";
import { DEFAULT_SITE_THEME } from "@/lib/theme";

declare global {
  var __siteDataInitPromise__: Promise<void> | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  return databaseUrl;
}

function getBootstrapAdminEmail() {
  const adminUsername = process.env.ADMIN_USERNAME;
  return adminUsername ? `${adminUsername}@admin.local` : null;
}

async function ensureRolePermissions(roleName: string, permissions: readonly string[]) {
  const existingPermissions = await prisma.rolePermission.findMany({
    where: { roleName },
    select: { permission: true },
  });

  const existingPermissionSet = new Set(existingPermissions.map((entry) => entry.permission));
  const missingPermissions = permissions.filter(
    (permission) => !existingPermissionSet.has(permission),
  );

  if (missingPermissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: missingPermissions.map((permission) => ({ roleName, permission })),
      skipDuplicates: true,
    });
  }
}

async function seedRoles() {
  await prisma.role.upsert({
    where: { name: "system_administrator" },
    update: {
      description: "Locked system role with unrestricted access",
      modifiable: false,
      rank: 1000,
    },
    create: {
      name: "system_administrator",
      description: "Locked system role with unrestricted access",
      modifiable: false,
      rank: 1000,
    },
  });

  await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Full administrative access",
      modifiable: true,
      rank: 100,
    },
  });

  await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Read-only admin analytics access",
      modifiable: true,
      rank: 50,
    },
  });

  await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: {
      name: "viewer",
      description: "Standard site user",
      modifiable: true,
      rank: 10,
    },
  });

  await prisma.role.upsert({
    where: { name: "shop_management" },
    update: {},
    create: {
      name: "shop_management",
      description: "Manage shop configuration and operations",
      modifiable: true,
      rank: 40,
    },
  });

  const usedRoles = await prisma.user.findMany({
    distinct: ["role"],
    select: { role: true },
  });

  for (const usedRole of usedRoles) {
    await prisma.role.upsert({
      where: { name: usedRole.role },
      update: {},
      create: {
        name: usedRole.role,
        description: usedRole.role.charAt(0).toUpperCase() + usedRole.role.slice(1),
        modifiable: true,
        rank: 10,
      },
    });
  }

  await ensureRolePermissions("system_administrator", ALL_PERMISSIONS);

  const adminPermissionsExist = await prisma.rolePermission.findFirst({
    where: { roleName: "admin" },
    select: { roleName: true },
  });

  if (!adminPermissionsExist) {
    await prisma.rolePermission.createMany({
      data: ALL_PERMISSIONS.map((permission) => ({
        roleName: "admin",
        permission,
      })),
      skipDuplicates: true,
    });
  }

  const editorPermissionsExist = await prisma.rolePermission.findFirst({
    where: { roleName: "editor" },
    select: { roleName: true },
  });

  if (!editorPermissionsExist) {
    await prisma.rolePermission.createMany({
      data: [
        "access_admin",
        "view_analytics",
        "view_sessions",
        "view_contact_messages",
        "view_image_views",
      ].map((permission) => ({
        roleName: "editor",
        permission,
      })),
      skipDuplicates: true,
    });
  }

  const shopManagementPermissionsExist = await prisma.rolePermission.findFirst({
    where: { roleName: "shop_management" },
    select: { roleName: true },
  });

  if (!shopManagementPermissionsExist) {
    await prisma.rolePermission.createMany({
      data: ["manage_shop"].map((permission) => ({
        roleName: "shop_management",
        permission,
      })),
      skipDuplicates: true,
    });
  }
}

async function ensureDailyNotificationConfig() {
  await prisma.dailyNotificationConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: false,
      sendHour: 9,
      sendMinute: 0,
      timezone: "Europe/London",
    },
  });
}

async function ensureEmailServerSecret() {
  await prisma.emailServerSecret.upsert({
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
}

async function ensureSiteTheme() {
  await prisma.siteTheme.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      ...DEFAULT_SITE_THEME,
    },
  });
}

async function ensureBootstrapAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = getBootstrapAdminEmail();

  if (!adminUsername || !adminPassword || !adminEmail) {
    return;
  }

  const normalizedUsername = adminUsername.trim().toLowerCase();
  const passwordHash = hashSync(adminPassword, 10);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { username: normalizedUsername }],
    },
    select: { id: true },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: adminUsername,
        username: normalizedUsername,
        email: adminEmail,
        role: "system_administrator",
        passwordHash,
        modifiable: false,
      },
    });

    return;
  }

  await prisma.user.create({
    data: {
      name: adminUsername,
      username: normalizedUsername,
      email: adminEmail,
      role: "system_administrator",
      passwordHash,
      modifiable: false,
    },
  });
}

async function initializeDatabase() {
  getDatabaseUrl();
  await seedRoles();
  await ensureSiteTheme();
  await ensureDailyNotificationConfig();
  await ensureEmailServerSecret();
  await ensureBootstrapAdmin();
}

export async function ensureDatabase() {
  if (!global.__siteDataInitPromise__) {
    global.__siteDataInitPromise__ = initializeDatabase().catch((error) => {
      global.__siteDataInitPromise__ = undefined;
      throw error;
    });
  }

  await global.__siteDataInitPromise__;
}
