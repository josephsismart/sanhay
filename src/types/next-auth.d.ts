import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: number;
      roleLabel: string;
      changePwd: boolean;
      basicInfoId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: number;
    roleLabel: string;
    changePwd: boolean;
    basicInfoId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: number;
    roleLabel: string;
    changePwd: boolean;
    basicInfoId: string;
  }
}
