const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    // Busca cosas como "(60 Serv)" o "(100 Servicios)"
    let newSize = p.size.replace(/\s*\(\d+\s*Serv[^)]*\)/gi, '').trim();
    if (newSize !== p.size) {
      console.log(`Updating ${p.brand} ${p.name}: ${p.size} -> ${newSize}`);
      await prisma.product.update({
        where: { id: p.id },
        data: { size: newSize }
      });
    }
  }
  console.log("Done");
  await prisma.$disconnect();
}

clean().catch(console.error);
