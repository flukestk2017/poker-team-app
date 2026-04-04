import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        try {
          const user = await db.user.findUnique({
            where: {
              username: String(credentials.username),
            },
          })

          console.log("Login Attempt - User found:", user ? user.username : "NOT FOUND")

          if (!user) return null

          // เช็ค isActive (เฉพาะ user ที่ใช้ email registration)
          if (user.email && !user.isActive) {
            throw new Error("กรุณายืนยัน email ก่อน login")
          }

          // ถ้ามี password hash (ใหม่) ใช้ bcrypt
          if (user.password) {
            const isValid = await bcrypt.compare(
              String(credentials.password),
              user.password
            )
            console.log("Password Validation:", isValid ? "SUCCESS" : "FAILED")
            if (!isValid) return null
          } else {
            // backward compat — ใช้ PIN เดิม
            const isPinValid = String(user.pin) === String(credentials.password)
            console.log("PIN Validation:", isPinValid ? "SUCCESS" : "FAILED")
            if (!isPinValid) return null
          }

          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth Error:", error)
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.displayName = (user as any).displayName
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
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
  secret: process.env.NEXTAUTH_SECRET,
})
