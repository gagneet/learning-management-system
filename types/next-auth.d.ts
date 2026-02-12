import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      centerId: string;  // Match User model spelling
      centerName: string;
      themePreference?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    centerId: string;  // Match User model spelling
    centerName: string;
    themePreference?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    centerId: string;  // Match User model spelling
    centerName: string;
    themePreference?: string;
  }
}
