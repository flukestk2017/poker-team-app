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

        try {
          // ดึง User จาก Database
          const user = await db.user.findUnique({
            where: { 
              username: String(credentials.username) 
            },
          })

          // LOG เพื่อเช็คใน Vercel (ถ้าหาไม่เจอจะขึ้น null)
          console.log("Login Attempt - User found:", user ? user.username : "NOT FOUND")

          if (!user) return null

          // เทียบ PIN (ใช้ String() เพื่อป้องกันปัญหาเรื่อง Type ของเลข 0)
          const isPinValid = String(user.pin) === String(credentials.pin)
          
          console.log("PIN Validation:", isPinValid ? "SUCCESS" : "FAILED")

          if (!isPinValid) return null

          return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          }
        } catch (error) {
          console.error("Auth Error:", error)
          return null
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
  // เพิ่ม secret เพื่อความชัวร์เวลาอยู่บน Vercel
  secret: process.env.NEXTAUTH_SECRET, 
})