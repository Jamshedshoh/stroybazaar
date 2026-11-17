import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const t = (en: string, ru: string, tj: string) => ({ en, ru, tj });

const categories = [
  { id: "cement", icon: "layers", name: t("Cement", "Цемент", "Семент") },
  { id: "rebar", icon: "grid", name: t("Rebar", "Арматура", "Арматура") },
  { id: "bricks", icon: "box", name: t("Bricks & blocks", "Кирпич и блоки", "Хишт ва блок") },
  { id: "tiles", icon: "square", name: t("Tiles", "Плитка", "Сафол") },
  { id: "paint", icon: "droplet", name: t("Paint", "Краска", "Ранг") },
  { id: "plumbing", icon: "tool", name: t("Plumbing", "Сантехника", "Сантехника") },
  { id: "electrical", icon: "zap", name: t("Electrical", "Электрика", "Барқ") },
  { id: "timber", icon: "trello", name: t("Timber", "Пиломатериалы", "Тахта") },
  { id: "tools", icon: "hammer", name: t("Tools", "Инструменты", "Асбобҳо") },
];

async function main() {
  for (const [sortOrder, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name, icon: category.icon, sortOrder },
      create: { ...category, sortOrder },
    });
  }

  if ((await prisma.supplier.count()) === 0) {
    await prisma.supplier.create({
      data: {
        name: "Ghafurov Cement Yard",
        status: "verified",
        location: t("Ghafurov district, Khujand", "Гафуровский район, Худжанд", "Ноҳияи Ғафуров, Хуҷанд"),
        phones: ["+992 92 555 0101"],
        languages: ["ru", "tj"],
        products: {
          create: [
            {
              categoryId: "cement",
              name: t("Portland cement M400, 50 kg", "Портландцемент М400, 50 кг", "Семент М400, 50 кг"),
              unit: t("bag", "мешок", "халта"),
              attributes: t("Grade M400", "Марка М400", "Навъи М400"),
              price: 78,
              stock: 2400,
              wholesaleTiers: { create: [{ minQty: 100, pricePerUnit: 72 }, { minQty: 500, pricePerUnit: 68 }] },
            },
            {
              categoryId: "cement",
              name: t("Portland cement M500, 50 kg", "Портландцемент М500, 50 кг", "Семент М500, 50 кг"),
              unit: t("bag", "мешок", "халта"),
              attributes: t("Grade M500", "Марка М500", "Навъи М500"),
              price: 88,
              stock: 1200,
              wholesaleTiers: { create: [{ minQty: 100, pricePerUnit: 82 }] },
            },
          ],
        },
      },
    });

    await prisma.supplier.create({
      data: {
        name: "Sughd Metal",
        status: "verified",
        location: t("Panjshanbe market, Khujand", "Рынок Панчшанбе, Худжанд", "Бозори Панҷшанбе, Хуҷанд"),
        phones: ["+992 92 555 0202"],
        languages: ["ru", "tj", "en"],
        products: {
          create: [
            {
              categoryId: "rebar",
              name: t("Rebar A500C, 12 mm", "Арматура А500С, 12 мм", "Арматура А500С, 12 мм"),
              unit: t("ton", "тонна", "тонна"),
              attributes: t("Diameter 12 mm", "Диаметр 12 мм", "Қутр 12 мм"),
              price: 9800,
              stock: 40,
              wholesaleTiers: { create: [{ minQty: 5, pricePerUnit: 9500 }] },
            },
            {
              categoryId: "tools",
              name: t("Angle grinder 125 mm", "Болгарка 125 мм", "Болгарка 125 мм"),
              unit: t("piece", "шт.", "дона"),
              attributes: t("900 W", "900 Вт", "900 Вт"),
              price: 650,
              stock: 25,
            },
          ],
        },
      },
    });

    await prisma.supplier.create({
      data: {
        name: "Khujand Tile House",
        status: "pending",
        location: t("Lenin Street, Khujand", "Улица Ленина, Худжанд", "Кӯчаи Ленин, Хуҷанд"),
        phones: ["+992 92 555 0303"],
        languages: ["ru"],
        products: {
          create: [
            {
              categoryId: "tiles",
              name: t("Ceramic floor tile 60x60", "Керамогранит 60x60", "Сафоли фарш 60x60"),
              unit: t("m²", "м²", "м²"),
              attributes: t("60 × 60 cm, matte", "60 × 60 см, матовая", "60 × 60 см, ғубор"),
              price: 95,
              stock: 800,
            },
          ],
        },
      },
    });
  }

  const adminPhone = process.env.ADMIN_PHONE;
  if (adminPhone) {
    await prisma.user.upsert({
      where: { phone: adminPhone },
      update: { role: "admin" },
      create: { phone: adminPhone, role: "admin", name: "Admin" },
    });
  }
}

main()
  .then(() => console.log("Seed complete"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
