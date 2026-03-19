import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentAuthenticatedLogIdentifier() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      name: true,
    },
  });

  if (user?.username) {
    return `@${user.username}`;
  }

  if (user?.email) {
    return user.email;
  }

  if (user?.name) {
    return user.name;
  }

  return userId;
}
