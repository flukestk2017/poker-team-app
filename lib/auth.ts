import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pin) return null

        const user = await db.user.findUnique({
          where: { username: credentials.username as string },
        })

        if (!user) return null

        // Plain text PIN comparison (internal tool)
        if (user.pin !== credentials.pin) return null

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username: string }).username
        token.displayName = (user as { displayName: string }).displayName
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.displayName = token.displayName as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
