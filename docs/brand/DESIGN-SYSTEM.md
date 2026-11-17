# Design System: A & M (a_m_app)

Estado: v1.0.0 | La interfaz viva de la app es el sistema pastel original.
Los logos PNG se adaptan a esa UI (header, favicon, PWA). No se sustituye el look.

Stack: Next.js (TypeScript) + Tailwind CSS + Supabase.

## UI de la app (lo que se ve)

Definido en `tailwind.config.ts` y `src/app/globals.css`:

- Fondo: degradado `pastel-pink-50` → blanco → `pastel-blue-50`
- Tarjetas: blanco translúcido, `rounded-2xl`, borde `pastel-pink-100`
- Botón primario: `pastel-pink-100`
- Botón secundario: `pastel-blue-100`
- Texto: `gray-800` / `gray-600` / `gray-500`
- Theme PWA y barra: `#FFB5C5` sobre fondo `#FFF0F3`
- Tipo: Inter

## Logo (los PNG que se entregaron)

- Marca en header, setup e Instalar: `/logo-mark.png` (`docs/brand/logo-app-icon.png`)
- Favicon y PWA: `public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png`
- Variantes de referencia: `docs/brand/logo-on-light.jpg`, `logo-on-dark.jpg`, `logo-on-fuego.jpg`, `logo.svg`

El ícono de pantalla de inicio es el PNG oficial. El resto de pantallas siguen el pastel de siempre.
