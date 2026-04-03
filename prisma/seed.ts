import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      displayName: "Admin",
      pin: "0000",
      role: "admin",
    },
  })

  console.log("Seeded admin user:", admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
