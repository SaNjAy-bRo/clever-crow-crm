import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Whitelisted Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "name@gmail.com" },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email) {
          console.log("Credentials authorization rejected: No email provided.");
          return null;
        }
        
        const emailLower = credentials.email.toLowerCase();
        
        try {
          // Verify if the email is on the whitelist database
          const whitelisted = await prisma.whitelist.findUnique({
            where: { email: emailLower },
          });
          
          if (whitelisted) {
            console.log(`Credentials sign in allowed for whitelisted email: ${emailLower}`);
            return {
              id: whitelisted.id,
              email: whitelisted.email,
              name: whitelisted.name || emailLower.split("@")[0],
            };
          }
          
          console.log(`Credentials sign in rejected: Email not in whitelist: ${emailLower}`);
          return null;
        } catch (error) {
          console.error("Error in credentials authorize callback:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
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
    error: "/", // Redirect authentication errors back to the login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_must_be_changed_in_env_file",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
