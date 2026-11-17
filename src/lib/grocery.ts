export interface GrocerySku {
  id: string;
  name: string;
  brand: string;
  department: string;
  category: string;
  unit: string;
  priceMxn: number;
  query: string;
  emoji: string;
  code?: string;
  image?: string;
  live?: boolean;
}

export type OnlinePartnerId = 'chedraui' | 'soriana' | 'walmart' | 'justo';

export interface OnlinePartner {
  id: OnlinePartnerId;
  name: string;
  searchUrl: (query: string) => string;
  homeUrl: string;
}

export const GROCERY_DEPARTMENTS = [
  'Frutas y verduras',
  'Carnes y pescados',
  'Lácteos y huevos',
  'Panadería',
  'Abarrotes',
  'Bebidas',
  'Congelados',
  'Limpieza',
  'Cuidado personal',
  'Mascotas',
  'Botanas',
  'Bebé',
] as const;

const ITEMS: Array<Omit<GrocerySku, 'id'>> = [
  { name: 'Plátano tabasco kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 29, query: 'banana', emoji: '🍌' },
  { name: 'Manzana golden kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 49, query: 'apple golden', emoji: '🍎' },
  { name: 'Aguacate hass kg', brand: 'Michoacán', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 69, query: 'avocado', emoji: '🥑' },
  { name: 'Limón con semilla kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 36, query: 'lemon', emoji: '🍋' },
  { name: 'Naranja valencia kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 24, query: 'orange fruit', emoji: '🍊' },
  { name: 'Fresa charola', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'pza', priceMxn: 55, query: 'strawberry', emoji: '🍓' },
  { name: 'Mango ataulfo kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 42, query: 'mango', emoji: '🥭' },
  { name: 'Papaya maradol kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Fruta', unit: 'kg', priceMxn: 28, query: 'papaya', emoji: '🧡' },
  { name: 'Jitomate saladette kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 32, query: 'tomato', emoji: '🍅' },
  { name: 'Cebolla blanca kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 26, query: 'onion', emoji: '🧅' },
  { name: 'Ajo red kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 89, query: 'garlic', emoji: '🧄' },
  { name: 'Chile serrano kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 48, query: 'chili pepper', emoji: '🌶️' },
  { name: 'Cilantro manojo', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'pza', priceMxn: 10, query: 'cilantro', emoji: '🌿' },
  { name: 'Lechuga orejona', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'pza', priceMxn: 18, query: 'lettuce', emoji: '🥬' },
  { name: 'Espinaca bolsa', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'pza', priceMxn: 22, query: 'spinach', emoji: '🥬' },
  { name: 'Papa blanca kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 27, query: 'potato', emoji: '🥔' },
  { name: 'Zanahoria kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 21, query: 'carrot', emoji: '🥕' },
  { name: 'Elote pieza', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'pza', priceMxn: 12, query: 'corn', emoji: '🌽' },
  { name: 'Nopal cambray kg', brand: 'De temporada', department: 'Frutas y verduras', category: 'Verdura', unit: 'kg', priceMxn: 25, query: 'cactus nopal', emoji: '🌵' },
  { name: 'Pechuga de pollo kg', brand: 'Bachoco', department: 'Carnes y pescados', category: 'Pollo', unit: 'kg', priceMxn: 129, query: 'chicken breast', emoji: '🍗' },
  { name: 'Muslo de pollo kg', brand: 'Bachoco', department: 'Carnes y pescados', category: 'Pollo', unit: 'kg', priceMxn: 72, query: 'chicken thigh', emoji: '🍗' },
  { name: 'Bistec de res kg', brand: 'SuKarne', department: 'Carnes y pescados', category: 'Res', unit: 'kg', priceMxn: 189, query: 'beef steak', emoji: '🥩' },
  { name: 'Carne molida de res kg', brand: 'SuKarne', department: 'Carnes y pescados', category: 'Res', unit: 'kg', priceMxn: 149, query: 'ground beef', emoji: '🥩' },
  { name: 'Chuleta de cerdo kg', brand: 'Keken', department: 'Carnes y pescados', category: 'Cerdo', unit: 'kg', priceMxn: 109, query: 'pork chop', emoji: '🥓' },
  { name: 'Tocino ahumado 250g', brand: 'Keken', department: 'Carnes y pescados', category: 'Cerdo', unit: 'pza', priceMxn: 62, query: 'bacon', emoji: '🥓' },
  { name: 'Salchicha de pavo 500g', brand: 'San Rafael', department: 'Carnes y pescados', category: 'Embutido', unit: 'pza', priceMxn: 48, query: 'sausage turkey', emoji: '🌭' },
  { name: 'Jamón de pavo 250g', brand: 'San Rafael', department: 'Carnes y pescados', category: 'Embutido', unit: 'pza', priceMxn: 52, query: 'turkey ham', emoji: '🥪' },
  { name: 'Tilapia filete kg', brand: 'Del mar', department: 'Carnes y pescados', category: 'Pescado', unit: 'kg', priceMxn: 119, query: 'tilapia', emoji: '🐟' },
  { name: 'Camarón mediano kg', brand: 'Del mar', department: 'Carnes y pescados', category: 'Mariscos', unit: 'kg', priceMxn: 249, query: 'shrimp', emoji: '🦐' },
  { name: 'Atún en agua 140g', brand: 'Dolores', department: 'Carnes y pescados', category: 'Enlatados', unit: 'pza', priceMxn: 24, query: 'dolores tuna', emoji: '🐟' },
  { name: 'Leche entera 1L', brand: 'Lala', department: 'Lácteos y huevos', category: 'Leche', unit: 'pza', priceMxn: 28, query: 'lala leche', emoji: '🥛' },
  { name: 'Leche deslactosada 1L', brand: 'Alpura', department: 'Lácteos y huevos', category: 'Leche', unit: 'pza', priceMxn: 32, query: 'alpura leche', emoji: '🥛' },
  { name: 'Yogurt natural 1kg', brand: 'Lala', department: 'Lácteos y huevos', category: 'Yogurt', unit: 'pza', priceMxn: 39, query: 'yogurt', emoji: '🥣' },
  { name: 'Yogurt griego 150g', brand: 'Chobani', department: 'Lácteos y huevos', category: 'Yogurt', unit: 'pza', priceMxn: 22, query: 'greek yogurt', emoji: '🥣' },
  { name: 'Queso panela 400g', brand: 'Lala', department: 'Lácteos y huevos', category: 'Queso', unit: 'pza', priceMxn: 58, query: 'queso panela', emoji: '🧀' },
  { name: 'Queso oaxaca 400g', brand: 'Chilchota', department: 'Lácteos y huevos', category: 'Queso', unit: 'pza', priceMxn: 72, query: 'queso oaxaca', emoji: '🧀' },
  { name: 'Queso manchego 400g', brand: 'Nochebuena', department: 'Lácteos y huevos', category: 'Queso', unit: 'pza', priceMxn: 89, query: 'manchego cheese', emoji: '🧀' },
  { name: 'Crema 450g', brand: 'Lala', department: 'Lácteos y huevos', category: 'Crema', unit: 'pza', priceMxn: 34, query: 'crema lala', emoji: '🥛' },
  { name: 'Mantequilla 90g', brand: 'Lala', department: 'Lácteos y huevos', category: 'Mantequilla', unit: 'pza', priceMxn: 22, query: 'butter', emoji: '🧈' },
  { name: 'Huevo blanco 18 pzas', brand: 'San Juan', department: 'Lácteos y huevos', category: 'Huevo', unit: 'pza', priceMxn: 62, query: 'eggs', emoji: '🥚' },
  { name: 'Bolillo 6 pzas', brand: 'Horno del súper', department: 'Panadería', category: 'Pan', unit: 'pza', priceMxn: 18, query: 'bolillo', emoji: '🥖' },
  { name: 'Pan de caja integral', brand: 'Bimbo', department: 'Panadería', category: 'Pan', unit: 'pza', priceMxn: 42, query: 'bimbo pan integral', emoji: '🍞' },
  { name: 'Tortillas de maíz 1kg', brand: 'Tía Rosa', department: 'Panadería', category: 'Tortilla', unit: 'pza', priceMxn: 24, query: 'tortillas maiz', emoji: '🌮' },
  { name: 'Tortillas de harina 10 pzas', brand: 'Tía Rosa', department: 'Panadería', category: 'Tortilla', unit: 'pza', priceMxn: 28, query: 'flour tortillas', emoji: '🌯' },
  { name: 'Conchas 4 pzas', brand: 'Horno del súper', department: 'Panadería', category: 'Dulce', unit: 'pza', priceMxn: 32, query: 'concha pan dulce', emoji: '🧁' },
  { name: 'Arroz super extra 1kg', brand: 'Verde Valle', department: 'Abarrotes', category: 'Granos', unit: 'pza', priceMxn: 32, query: 'arroz verde valle', emoji: '🍚' },
  { name: 'Frijol negro 1kg', brand: 'La Sierra', department: 'Abarrotes', category: 'Granos', unit: 'pza', priceMxn: 38, query: 'frijol negro', emoji: '🫘' },
  { name: 'Lenteja 500g', brand: 'Verde Valle', department: 'Abarrotes', category: 'Granos', unit: 'pza', priceMxn: 26, query: 'lentils', emoji: '🫘' },
  { name: 'Aceite de canola 1L', brand: 'Capullo', department: 'Abarrotes', category: 'Aceites', unit: 'pza', priceMxn: 48, query: 'capullo aceite', emoji: '🫒' },
  { name: 'Aceite de oliva 500ml', brand: 'Carbonell', department: 'Abarrotes', category: 'Aceites', unit: 'pza', priceMxn: 89, query: 'olive oil', emoji: '🫒' },
  { name: 'Azúcar estándar 1kg', brand: 'Great Value', department: 'Abarrotes', category: 'Endulzantes', unit: 'pza', priceMxn: 28, query: 'azucar', emoji: '🍬' },
  { name: 'Sal de grano 1kg', brand: 'La Fina', department: 'Abarrotes', category: 'Condimentos', unit: 'pza', priceMxn: 16, query: 'salt', emoji: '🧂' },
  { name: 'Pasta spaghetti 200g', brand: 'Barilla', department: 'Abarrotes', category: 'Pasta', unit: 'pza', priceMxn: 18, query: 'barilla spaghetti', emoji: '🍝' },
  { name: 'Sopa de pasta 200g', brand: 'La Moderna', department: 'Abarrotes', category: 'Pasta', unit: 'pza', priceMxn: 12, query: 'la moderna pasta', emoji: '🍜' },
  { name: 'Frijoles bayos 560g', brand: 'La Costeña', department: 'Abarrotes', category: 'Enlatados', unit: 'pza', priceMxn: 22, query: 'la costena frijoles', emoji: '🥫' },
  { name: 'Elote dorado 220g', brand: 'La Costeña', department: 'Abarrotes', category: 'Enlatados', unit: 'pza', priceMxn: 18, query: 'elote en lata', emoji: '🥫' },
  { name: 'Salsa cátsup 620g', brand: 'Heinz', department: 'Abarrotes', category: 'Salsas', unit: 'pza', priceMxn: 32, query: 'heinz ketchup', emoji: '🍅' },
  { name: 'Mayonesa 390g', brand: 'McCormick', department: 'Abarrotes', category: 'Salsas', unit: 'pza', priceMxn: 42, query: 'mccormick mayonesa', emoji: '🫙' },
  { name: 'Salsa Valentina 370ml', brand: 'Valentina', department: 'Abarrotes', category: 'Salsas', unit: 'pza', priceMxn: 18, query: 'valentina salsa', emoji: '🌶️' },
  { name: 'Café soluble 100g', brand: 'Nescafé', department: 'Abarrotes', category: 'Café', unit: 'pza', priceMxn: 68, query: 'nescafe', emoji: '☕' },
  { name: 'Café de grano 340g', brand: 'Café Legal', department: 'Abarrotes', category: 'Café', unit: 'pza', priceMxn: 95, query: 'cafe legal', emoji: '☕' },
  { name: 'Avena 1kg', brand: 'Quaker', department: 'Abarrotes', category: 'Cereales', unit: 'pza', priceMxn: 42, query: 'quaker oats', emoji: '🥣' },
  { name: 'Cereal 660g', brand: 'Kellogg\'s', department: 'Abarrotes', category: 'Cereales', unit: 'pza', priceMxn: 78, query: 'kelloggs cereal', emoji: '🥣' },
  { name: 'Harina de trigo 1kg', brand: 'Selecta', department: 'Abarrotes', category: 'Harinas', unit: 'pza', priceMxn: 24, query: 'wheat flour', emoji: '🌾' },
  { name: 'Masa harina 1kg', brand: 'Maseca', department: 'Abarrotes', category: 'Harinas', unit: 'pza', priceMxn: 22, query: 'maseca', emoji: '🌽' },
  { name: 'Agua 1.5L', brand: 'Bonafont', department: 'Bebidas', category: 'Agua', unit: 'pza', priceMxn: 16, query: 'bonafont', emoji: '💧' },
  { name: 'Agua 10L garrafón', brand: 'Bonafont', department: 'Bebidas', category: 'Agua', unit: 'pza', priceMxn: 38, query: 'garrafon agua', emoji: '💧' },
  { name: 'Refresco cola 3L', brand: 'Coca-Cola', department: 'Bebidas', category: 'Refresco', unit: 'pza', priceMxn: 42, query: 'coca cola 3l', emoji: '🥤' },
  { name: 'Jugo de naranja 1L', brand: 'Jumex', department: 'Bebidas', category: 'Jugo', unit: 'pza', priceMxn: 28, query: 'jumex naranja', emoji: '🧃' },
  { name: 'Cerveza 6 pack', brand: 'Corona', department: 'Bebidas', category: 'Cerveza', unit: 'pza', priceMxn: 119, query: 'corona extra', emoji: '🍺' },
  { name: 'Leche de almendra 946ml', brand: 'Silk', department: 'Bebidas', category: 'Vegetal', unit: 'pza', priceMxn: 48, query: 'silk almond', emoji: '🥛' },
  { name: 'Helado 1L', brand: 'Holanda', department: 'Congelados', category: 'Postre', unit: 'pza', priceMxn: 78, query: 'holanda ice cream', emoji: '🍦' },
  { name: 'Pizza congelada', brand: 'DiGiorno', department: 'Congelados', category: 'Comida', unit: 'pza', priceMxn: 119, query: 'frozen pizza', emoji: '🍕' },
  { name: 'Nuggets de pollo 700g', brand: 'Great Value', department: 'Congelados', category: 'Comida', unit: 'pza', priceMxn: 89, query: 'chicken nuggets', emoji: '🍗' },
  { name: 'Vegetales congelados 500g', brand: 'La Huerta', department: 'Congelados', category: 'Verdura', unit: 'pza', priceMxn: 42, query: 'frozen vegetables', emoji: '🥦' },
  { name: 'Detergente líquido 2.3L', brand: 'Roma', department: 'Limpieza', category: 'Ropa', unit: 'pza', priceMxn: 68, query: 'roma detergente', emoji: '🧴' },
  { name: 'Suavizante 750ml', brand: 'Downy', department: 'Limpieza', category: 'Ropa', unit: 'pza', priceMxn: 48, query: 'downy', emoji: '🧴' },
  { name: 'Lavatrastes 750ml', brand: 'Salvo', department: 'Limpieza', category: 'Cocina', unit: 'pza', priceMxn: 32, query: 'salvo lavatrastes', emoji: '🍽️' },
  { name: 'Cloro 1L', brand: 'Cloralex', department: 'Limpieza', category: 'Desinfectante', unit: 'pza', priceMxn: 22, query: 'cloralex', emoji: '🫧' },
  { name: 'Papel higiénico 12 rollos', brand: 'Pétalo', department: 'Limpieza', category: 'Papel', unit: 'pza', priceMxn: 89, query: 'petalo papel', emoji: '🧻' },
  { name: 'Servitoallas 2 rollos', brand: 'Pétalo', department: 'Limpieza', category: 'Papel', unit: 'pza', priceMxn: 38, query: 'paper towels', emoji: '🧻' },
  { name: 'Bolsas de basura 20 pzas', brand: 'Great Value', department: 'Limpieza', category: 'Desechables', unit: 'pza', priceMxn: 32, query: 'garbage bags', emoji: '🗑️' },
  { name: 'Jabón de tocador 4 pzas', brand: 'Palmolive', department: 'Cuidado personal', category: 'Cuerpo', unit: 'pza', priceMxn: 36, query: 'palmolive soap', emoji: '🧼' },
  { name: 'Shampoo 750ml', brand: 'Head & Shoulders', department: 'Cuidado personal', category: 'Cabello', unit: 'pza', priceMxn: 89, query: 'head and shoulders', emoji: '🧴' },
  { name: 'Pasta dental 150ml', brand: 'Colgate', department: 'Cuidado personal', category: 'Bucal', unit: 'pza', priceMxn: 32, query: 'colgate', emoji: '😁' },
  { name: 'Cepillo dental 2 pzas', brand: 'Oral-B', department: 'Cuidado personal', category: 'Bucal', unit: 'pza', priceMxn: 42, query: 'oral b toothbrush', emoji: '🪥' },
  { name: 'Desodorante', brand: 'Rexona', department: 'Cuidado personal', category: 'Cuerpo', unit: 'pza', priceMxn: 48, query: 'rexona', emoji: '🧊' },
  { name: 'Toallas femeninas 16 pzas', brand: 'Saba', department: 'Cuidado personal', category: 'Higiene', unit: 'pza', priceMxn: 42, query: 'saba', emoji: '🌸' },
  { name: 'Rastrillo 4 pzas', brand: 'Gillette', department: 'Cuidado personal', category: 'Afeitado', unit: 'pza', priceMxn: 68, query: 'gillette', emoji: '🪒' },
  { name: 'Croquetas perro 4kg', brand: 'Pedigree', department: 'Mascotas', category: 'Perro', unit: 'pza', priceMxn: 189, query: 'pedigree dog', emoji: '🐶' },
  { name: 'Croquetas gato 3kg', brand: 'Whiskas', department: 'Mascotas', category: 'Gato', unit: 'pza', priceMxn: 165, query: 'whiskas', emoji: '🐱' },
  { name: 'Arena para gato 10kg', brand: 'Minino', department: 'Mascotas', category: 'Gato', unit: 'pza', priceMxn: 129, query: 'cat litter', emoji: '🐱' },
  { name: 'Papas 42g', brand: 'Sabritas', department: 'Botanas', category: 'Frituras', unit: 'pza', priceMxn: 18, query: 'sabritas', emoji: '🍟' },
  { name: 'Totis 50g', brand: 'Barcel', department: 'Botanas', category: 'Frituras', unit: 'pza', priceMxn: 16, query: 'barcel totis', emoji: '🌽' },
  { name: 'Galletas marías 170g', brand: 'Gamesa', department: 'Botanas', category: 'Galletas', unit: 'pza', priceMxn: 18, query: 'gamesa marias', emoji: '🍪' },
  { name: 'Chocolate 90g', brand: 'Carlos V', department: 'Botanas', category: 'Dulce', unit: 'pza', priceMxn: 22, query: 'carlos v chocolate', emoji: '🍫' },
  { name: 'Cacahuates japoneses 180g', brand: 'Barcel', department: 'Botanas', category: 'Semillas', unit: 'pza', priceMxn: 28, query: 'cacahuates japoneses', emoji: '🥜' },
  { name: 'Pañales etapa 3 40 pzas', brand: 'Huggies', department: 'Bebé', category: 'Pañal', unit: 'pza', priceMxn: 219, query: 'huggies', emoji: '👶' },
  { name: 'Toallitas húmedas 80 pzas', brand: 'Huggies', department: 'Bebé', category: 'Higiene', unit: 'pza', priceMxn: 48, query: 'baby wipes', emoji: '👶' },
  { name: 'Fórmula 800g', brand: 'NAN', department: 'Bebé', category: 'Leche', unit: 'pza', priceMxn: 389, query: 'nan formula', emoji: '🍼' },
];

export const GROCERY_SKUS: GrocerySku[] = ITEMS.map((item, index) => ({
  ...item,
  id: `sku-${String(index + 1).padStart(3, '0')}`,
}));

export const GROCERY_CATEGORIES = Array.from(new Set(GROCERY_SKUS.map((s) => s.category))).sort();

export function searchGrocery(query: string, department?: string, category?: string) {
  const q = query.trim().toLowerCase();
  return GROCERY_SKUS.filter((sku) => {
    if (department && sku.department !== department) return false;
    if (category && sku.category !== category) return false;
    if (!q) return true;
    return `${sku.name} ${sku.brand} ${sku.department} ${sku.category} ${sku.query}`.toLowerCase().includes(q);
  });
}

export const ONLINE_PARTNERS: OnlinePartner[] = [
  {
    id: 'chedraui',
    name: 'Chedraui',
    homeUrl: 'https://www.chedraui.com.mx',
    searchUrl: (query) => `https://www.chedraui.com.mx/search?_q=${encodeURIComponent(query)}`,
  },
  {
    id: 'soriana',
    name: 'Soriana',
    homeUrl: 'https://www.soriana.com',
    searchUrl: (query) => `https://www.soriana.com/buscar?q=${encodeURIComponent(query)}`,
  },
  {
    id: 'walmart',
    name: 'Walmart',
    homeUrl: 'https://super.walmart.com.mx',
    searchUrl: (query) => `https://super.walmart.com.mx/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: 'justo',
    name: 'Jüsto',
    homeUrl: 'https://www.justo.mx',
    searchUrl: (query) => `https://www.justo.mx/search?q=${encodeURIComponent(query)}`,
  },
];
