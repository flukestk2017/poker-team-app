import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      displayName: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}
