import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      centerId: string;  // Match User model spelling
      centerName: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    centerId: string;  // Match User model spelling
    centerName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    centerId: string;  // Match User model spelling
    centerName: string;
  }
}
