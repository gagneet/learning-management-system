import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import {
  createAdminLoginLog,
  extractAdminLoginContext,
  isAdminRole,
} from "@/lib/admin-login-log";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { center: true },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        const context = extractAdminLoginContext(request);

        if (!isPasswordValid) {
          if (isAdminRole(user.role as Role)) {
            await createAdminLoginLog({
              userId: user.id,
              userName: user.name,
              email: user.email,
              role: user.role as Role,
              centreId: user.centerId,
              success: false,
              failureReason: "INVALID_PASSWORD",
              context,
            });
          }
          return null;
        }

        if (isAdminRole(user.role as Role)) {
          await createAdminLoginLog({
            userId: user.id,
            userName: user.name,
            email: user.email,
            role: user.role as Role,
            centreId: user.centerId,
            success: true,
            context,
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          centerId: user.centerId,
          centerName: user.center.name,
          themePreference: user.themePreference,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.centerId = user.centerId;
        token.centerName = user.centerName;
        token.themePreference = user.themePreference;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.centerId = token.centerId as string;
        session.user.centerName = token.centerName as string;
        session.user.themePreference = token.themePreference as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
