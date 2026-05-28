import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export const ROLE_ROUTES: Record<number, string> = {
  1: "/admin",
  2: "/admin",
  3: "/department",
  4: "/school",
  5: "/school",
  6: "/school",
  7: "/teacher",
  8: "/student",
  9: "/guard",
};

export const ROLE_LABELS: Record<number, string> = {
  1: "Super Admin",
  2: "Admin",
  3: "Department Head",
  4: "School Head",
  5: "School Planning",
  6: "School Admin",
  7: "Teacher",
  8: "Student",
  9: "Security Guard",
};

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "ANHS Portal",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const hashedPassword = md5(credentials.password);

        const user = await prisma.userAccount.findFirst({
          where: {
            username: credentials.username,
            password: hashedPassword,
            isActive: true,
          },
          include: {
            role: true,
            basicInfo: true,
          },
        });

        if (!user) return null;

        const fullName = [
          user.basicInfo.firstName,
          user.basicInfo.middleName,
          user.basicInfo.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        return {
          id: user.id.toString(),
          name: fullName,
          email: user.username,
          image: user.basicInfo.imgPath,
          role: user.role.level,
          roleLabel: ROLE_LABELS[user.role.level] || "User",
          changePwd: user.changePwd,
          basicInfoId: user.basicInfoId.toString(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.roleLabel = (user as any).roleLabel;
        token.changePwd = (user as any).changePwd;
        token.basicInfoId = (user as any).basicInfoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).roleLabel = token.roleLabel;
        (session.user as any).changePwd = token.changePwd;
        (session.user as any).basicInfoId = token.basicInfoId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
