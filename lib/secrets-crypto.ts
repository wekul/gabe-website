import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getEncryptionKey() {
  const source =
    process.env.SECRETS_ENCRYPTION_KEY ??
    (process.env.NODE_ENV === "development" ? "local-dev-secrets-key-change-me" : undefined);

  if (!source) {
    throw new Error("SECRETS_ENCRYPTION_KEY is required to store encrypted secrets.");
  }

  return createHash("sha256").update(source).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const [ivPart, authTagPart, encryptedPart] = value.split(":");

  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Stored secret is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivPart, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTagPart, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
