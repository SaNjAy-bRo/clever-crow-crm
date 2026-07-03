import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      id: "bypass",
      name: "Bypass Login",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase() || "sanjay@clevercrow.in";
        
        // Find user in whitelist
        let whitelisted = await prisma.whitelist.findUnique({
          where: { email }
        });
        
        // Auto whitelist local users as Admin for testing ease
        if (!whitelisted) {
          whitelisted = await prisma.whitelist.create({
            data: {
              email,
              name: "Local Tester",
              role: "admin"
            }
          });
        }

        return {
          id: email,
          name: whitelisted.name || "Local Tester",
          email: email,
          image: "https://lh3.googleusercontent.com/a/default-user=s96-c"
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user || !user.email) {
        return false;
      }
      return true; // Allow all successful Google logins (organization security is configured on Google Console)
    },
    async jwt({ token, user }) {
      if (user && user.email) {
        try {
          const whitelisted = await prisma.whitelist.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          token.role = whitelisted?.role || "user";
        } catch (error) {
          console.error("Error fetching user role in jwt callback:", error);
          token.role = "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_must_be_changed_in_env_file",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
