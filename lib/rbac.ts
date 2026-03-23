export const ALL_PERMISSIONS = [
  "access_admin",
  "view_analytics",
  "clear_anayltics",
  "view_sessions",
  "view_contact_messages",
  "view_admin_messages",
  "view_image_views",
  "view_error_logs",
  "manage_theme",
  "manage_users",
  "manage_roles",
  "manage_notifications",
  "manage_secrets",
  "manage_shop",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];
export type UserRole = string;
