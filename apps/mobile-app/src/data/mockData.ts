import type { Category, Product, Supplier, Review, RFQ, Order } from '@/types';

export const categories: Category[] = [
  {
    id: 'cement',
    name: { en: 'Cement', ru: 'Цемент', tj: 'Семент' },
    icon: 'layers',
  },
  {
    id: 'rebar',
    name: { en: 'Rebar', ru: 'Арматура', tj: 'Арматура' },
    icon: 'grid',
  },
  {
    id: 'bricks',
    name: { en: 'Bricks & blocks', ru: 'Кирпич и блоки', tj: 'Хишт ва блокҳо' },
    icon: 'rectangle',
  },
  {
    id: 'tiles',
    name: { en: 'Tiles', ru: 'Плитка', tj: 'Плитка' },
    icon: 'apps',
  },
  {
    id: 'paint',
    name: { en: 'Paint', ru: 'Краска', tj: 'Ранг' },
    icon: 'color-palette',
  },
  {
    id: 'plumbing',
    name: { en: 'Plumbing', ru: 'Сантехника', tj: 'Сантехника' },
    icon: 'water',
  },
  {
    id: 'electrical',
    name: { en: 'Electrical', ru: 'Электрика', tj: 'Электрика' },
    icon: 'flash',
  },
  {
    id: 'timber',
    name: { en: 'Timber', ru: 'Дерево', tj: 'Чӯб' },
    icon: 'leaf',
  },
  {
    id: 'tools',
    name: { en: 'Tools', ru: 'Инструменты', tj: 'Асбобҳо' },
    icon: 'construct',
  },
];

export const suppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Ghafurov Cement Yard',
    verified: true,
    rating: 4.8,
    reviewCount: 126,
    location: { en: 'Ghafurov district', ru: 'Гафуровский район', tj: 'Ноҳияи Ғафуров' },
    phones: ['+992 92 555 0101'],
    languages: ['tj', 'ru'],
    joinedAt: '2024-03-12',
  },
  {
    id: 'sup-2',
    name: 'Khujand Metal Supply',
    verified: true,
    rating: 4.6,
    reviewCount: 84,
    location: { en: 'Khujand industrial zone', ru: 'Промзона Худжанда', tj: 'Минтақаи саноатии Хуҷанд' },
    phones: ['+992 93 411 2200'],
    languages: ['ru', 'en'],
    joinedAt: '2024-05-02',
  },
  {
    id: 'sup-3',
    name: 'Somon Build Materials',
    verified: true,
    rating: 4.7,
    reviewCount: 63,
    location: { en: 'Somoniyon street', ru: 'ул. Сомониён', tj: 'Кӯчаи Сомониён' },
    phones: ['+992 91 700 4455'],
    languages: ['tj', 'ru', 'en'],
    joinedAt: '2024-07-19',
  },
  {
    id: 'sup-4',
    name: 'Panj Timber & Tools',
    verified: false,
    rating: 4.4,
    reviewCount: 21,
    location: { en: 'Panjakent road', ru: 'Панджакентская дорога', tj: 'Роҳи Панҷакент' },
    phones: ['+992 94 120 8899'],
    languages: ['tj', 'ru'],
    joinedAt: '2025-01-08',
  },
];

const ton = { en: 'ton', ru: 'т', tj: 'т' };
const bag = { en: '50 kg bag', ru: 'мешок 50 кг', tj: 'халта 50 кг' };
const piece = { en: 'piece', ru: 'шт', tj: 'дона' };
const sqm = { en: 'm²', ru: 'м²', tj: 'м²' };
const bucket = { en: 'bucket', ru: 'ведро', tj: 'сатил' };

export const products: Product[] = [
  // Cement
  {
    id: 'p-1',
    name: { en: 'Portland cement M400', ru: 'Цемент ПЦ М400', tj: 'Сементи портланд М400' },
    categoryId: 'cement',
    supplierId: 'sup-1',
    price: 78,
    unit: bag,
    image: '',
    stock: 2400,
    attributes: { en: '50 kg bag, grade M400', ru: 'Мешок 50 кг, марка М400', tj: 'Халта 50 кг, навъи М400' },
    wholesaleTiers: [
      { minQty: 100, pricePerUnit: 72 },
      { minQty: 500, pricePerUnit: 68 },
    ],
  },
  {
    id: 'p-2',
    name: { en: 'Cement M500 (fast set)', ru: 'Цемент М500 (быстротвердеющий)', tj: 'Сементи М500 (тез сахтшаванда)' },
    categoryId: 'cement',
    supplierId: 'sup-3',
    price: 92,
    unit: bag,
    image: '',
    stock: 800,
    attributes: { en: 'High strength', ru: 'Высокая прочность', tj: 'Қуввати баланд' },
    wholesaleTiers: [{ minQty: 200, pricePerUnit: 86 }],
  },
  // Rebar
  {
    id: 'p-3',
    name: { en: 'Steel rebar Ø12 mm', ru: 'Арматура Ø12 мм', tj: 'Арматура Ø12 мм' },
    categoryId: 'rebar',
    supplierId: 'sup-2',
    price: 860,
    unit: ton,
    image: '',
    stock: 120,
    attributes: { en: 'A500C grade, 11.7 m rods', ru: 'Класс А500С, прутки 11,7 м', tj: 'Синфи А500С, чӯбҳо 11,7 м' },
    wholesaleTiers: [
      { minQty: 5, pricePerUnit: 830 },
      { minQty: 20, pricePerUnit: 805 },
    ],
  },
  {
    id: 'p-4',
    name: { en: 'Steel rebar Ø16 mm', ru: 'Арматура Ø16 мм', tj: 'Арматура Ø16 мм' },
    categoryId: 'rebar',
    supplierId: 'sup-2',
    price: 845,
    unit: ton,
    image: '',
    stock: 90,
    attributes: { en: 'A500C grade', ru: 'Класс А500С', tj: 'Синфи А500С' },
    wholesaleTiers: [{ minQty: 10, pricePerUnit: 815 }],
  },
  // Bricks
  {
    id: 'p-5',
    name: { en: 'Red clay brick', ru: 'Кирпич керамический', tj: 'Хишти сурхи гилин' },
    categoryId: 'bricks',
    supplierId: 'sup-3',
    price: 1.4,
    unit: piece,
    image: '',
    stock: 45000,
    attributes: { en: '250×120×65 mm, M150', ru: '250×120×65 мм, М150', tj: '250×120×65 мм, М150' },
    wholesaleTiers: [{ minQty: 5000, pricePerUnit: 1.25 }],
  },
  {
    id: 'p-6',
    name: { en: 'Aerated concrete block', ru: 'Газобетонный блок', tj: 'Блоки газобетонӣ' },
    categoryId: 'bricks',
    supplierId: 'sup-3',
    price: 48,
    unit: { en: 'm³', ru: 'м³', tj: 'м³' },
    image: '',
    stock: 600,
    attributes: { en: 'D500, 600×250×200 mm', ru: 'D500, 600×250×200 мм', tj: 'D500, 600×250×200 мм' },
    wholesaleTiers: [{ minQty: 20, pricePerUnit: 44 }],
  },
  // Tiles
  {
    id: 'p-7',
    name: { en: 'Ceramic floor tile 60×60', ru: 'Керамическая плитка 60×60', tj: 'Плиткаи сафолӣ 60×60' },
    categoryId: 'tiles',
    supplierId: 'sup-3',
    price: 12.5,
    unit: sqm,
    image: '',
    stock: 3200,
    attributes: { en: 'Matte, gradeAAA', ru: 'Матовый, сорт ААА', tj: 'Мат, дараҷаи ААА' },
    wholesaleTiers: [{ minQty: 100, pricePerUnit: 11 }],
  },
  {
    id: 'p-8',
    name: { en: 'Wall tile 25×40', ru: 'Настенная плитка 25×40', tj: 'Плиткаи деворӣ 25×40' },
    categoryId: 'tiles',
    supplierId: 'sup-3',
    price: 8.2,
    unit: sqm,
    image: '',
    stock: 1800,
    attributes: { en: 'Glossy white', ru: 'Глянцевая белая', tj: 'Ҷилоди сафед' },
    wholesaleTiers: [],
  },
  // Paint
  {
    id: 'p-9',
    name: { en: 'Interior acrylic paint', ru: 'Акриловая краска для интерьера', tj: 'Ранги акрилии дохилӣ' },
    categoryId: 'paint',
    supplierId: 'sup-3',
    price: 145,
    unit: bucket,
    image: '',
    stock: 300,
    attributes: { en: 'White, 10 L', ru: 'Белая, 10 л', tj: 'Сафед, 10 л' },
    wholesaleTiers: [{ minQty: 20, pricePerUnit: 132 }],
  },
  // Plumbing
  {
    id: 'p-10',
    name: { en: 'PP-R pipe 25 mm', ru: 'Труба ПП-Р 25 мм', tj: 'Қубури ПП-Р 25 мм' },
    categoryId: 'plumbing',
    supplierId: 'sup-3',
    price: 6.5,
    unit: { en: 'meter', ru: 'м.п.', tj: 'метр' },
    image: '',
    stock: 5000,
    attributes: { en: 'PN20, cold/hot water', ru: 'PN20, холодная/горячая вода', tj: 'PN20, оби сард/гарм' },
    wholesaleTiers: [{ minQty: 500, pricePerUnit: 5.8 }],
  },
  // Electrical
  {
    id: 'p-11',
    name: { en: 'Copper cable 3×2.5 mm²', ru: 'Кабель медный 3×2,5 мм²', tj: 'Кабели мисӣ 3×2,5 мм²' },
    categoryId: 'electrical',
    supplierId: 'sup-2',
    price: 4.8,
    unit: { en: 'meter', ru: 'м.п.', tj: 'метр' },
    image: '',
    stock: 9000,
    attributes: { en: 'VVG-ng(A)-FRLS', ru: 'ВВГнг(A)-FRLS', tj: 'ВВГнг(A)-FRLS' },
    wholesaleTiers: [{ minQty: 1000, pricePerUnit: 4.3 }],
  },
  {
    id: 'p-12',
    name: { en: 'LED bulb 12 W', ru: 'Лампа LED 12 Вт', tj: 'Чароғаки LED 12 Вт' },
    categoryId: 'electrical',
    supplierId: 'sup-4',
    price: 18,
    unit: piece,
    image: '',
    stock: 1500,
    attributes: { en: 'E27, 4000K', ru: 'E27, 4000K', tj: 'E27, 4000K' },
    wholesaleTiers: [],
  },
  // Timber
  {
    id: 'p-13',
    name: { en: 'Pine timber board', ru: 'Доска сосновая', tj: 'Тахтаи санавбар' },
    categoryId: 'timber',
    supplierId: 'sup-4',
    price: 32,
    unit: { en: 'm²', ru: 'м²', tj: 'м²' },
    image: '',
    stock: 700,
    attributes: { en: '50×150×6000 mm, dried', ru: '50×150×6000 мм, сухая', tj: '50×150×6000 мм, хушк' },
    wholesaleTiers: [{ minQty: 100, pricePerUnit: 29 }],
  },
  // Tools
  {
    id: 'p-14',
    name: { en: 'Angle grinder 125 mm', ru: 'Углошлифмашина 125 мм', tj: 'Дастгоҳи суфтакунӣ 125 мм' },
    categoryId: 'tools',
    supplierId: 'sup-4',
    price: 320,
    unit: piece,
    image: '',
    stock: 45,
    attributes: { en: '1200 W, 11000 rpm', ru: '1200 Вт, 11000 об/мин', tj: '1200 Вт, 11000 гард/дақ' },
    wholesaleTiers: [],
  },
];

export const reviews: Review[] = [
  {
    id: 'rev-1',
    supplierId: 'sup-1',
    author: 'A. Rahimov',
    rating: 5,
    comment: 'Delivered 300 bags of cement to the site on time. Good price.',
    createdAt: '2025-09-14',
  },
  {
    id: 'rev-2',
    supplierId: 'sup-2',
    author: 'S. Karimova',
    rating: 5,
    comment: 'Rebar quality was as described, weighed correctly.',
    createdAt: '2025-10-02',
  },
  {
    id: 'rev-3',
    supplierId: 'sup-3',
    author: 'M. Yusupov',
    rating: 4,
    comment: 'Tiles arrived intact, one palette was slightly delayed.',
    createdAt: '2025-10-21',
  },
];

export const seedRFQs: RFQ[] = [
  {
    id: 'rfq-1',
    items: [
      {
        productId: 'p-1',
        productName: products[0].name,
        unit: products[0].unit,
        quantity: 500,
      },
      {
        productId: 'p-3',
        productName: products[2].name,
        unit: products[2].unit,
        quantity: 8,
      },
    ],
    deliveryLocation: 'Site X, Ghafurov district',
    neededBy: '2025-11-25',
    status: 'quoted',
    createdAt: '2025-11-14',
    quotes: [
      {
        id: 'q-1',
        supplierId: 'sup-1',
        total: 34000,
        deliveryDays: 2,
        note: {
          en: 'Cement in stock, rebar can be delivered together.',
          ru: 'Цемент в наличии, арматуру привезём вместе.',
          tj: 'Семент мавҷуд аст, арматураро якҷоя мерасонем.',
        },
        createdAt: '2025-11-14',
      },
      {
        id: 'q-2',
        supplierId: 'sup-2',
        total: 35200,
        deliveryDays: 1,
        note: {
          en: 'Fast delivery, price includes unloading.',
          ru: 'Быстрая доставка, цена включает разгрузку.',
          tj: 'Расонидани зуд, нарх борбардорӣро дар бар мегирад.',
        },
        createdAt: '2025-11-15',
      },
    ],
  },
];

export const seedOrders: Order[] = [
  {
    id: 'A7X2',
    supplierId: 'sup-3',
    lines: [
      {
        productId: 'p-7',
        productName: products[6].name,
        unit: products[6].unit,
        quantity: 60,
        unitPrice: 12.5,
      },
    ],
    total: 750,
    paymentMethod: 'cod',
    status: 'out_for_delivery',
    deliveryAddress: '12 Lenin Street, Khujand',
    createdAt: '2025-11-15',
    hasReview: false,
  },
];
