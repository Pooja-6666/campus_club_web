const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.create({
    data: {
      name: "Pooja",
      email: "pooja@test.com",
      password: "1234"
    }
  });

  console.log(student);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());