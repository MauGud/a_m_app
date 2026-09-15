# 💕 Espacio de Pareja

Aplicación web privada para parejas. Comparte momentos, organiza actividades y mantente conectado.

## Características

- 🏠 **Dashboard** - Vista general del estado de la pareja
- 💕 **Dates y Metas Juntos** - Dates y metas compartidos, sincronizados con el calendario
- 📅 **Calendario** - Actividades ordinarias con repetición (diario, semanal, mensual, anual, personalizado)
- 📸 **Recuerdos** - Captura dual (lo que ven + ustedes), con fecha, lugar y guardado a la galería
- ✨ **Spark** - Foto diaria simultánea
- 😊 **Mood** - Estado de ánimo con notas (se guarda ~30 días)

## Tecnologías

## Tecnologías

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS (paleta pastel)
- Zustand (estado local)
- Supabase (backend + realtime)

## Despliegue Rápido

### 1. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y abre tu proyecto
2. Ve a **SQL Editor** y ejecuta `supabase-schema.sql` (proyecto nuevo) o `supabase-migration.sql` (proyecto existente). Sin esa migración, el INSERT falla por RLS y los teléfonos no sincronizan.
3. Ve a **Storage** y crea 2 buckets: `memories` y `sparks` (ambos públicos)
4. Copia tu URL y anon key de **Settings > API**

### 2. Configurar Variables de Entorno

Crea `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Desplegar en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Seguir las instrucciones y agregar las variables de entorno
```

## Desarrollo Local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
src/
├── app/                 # Páginas (App Router)
│   ├── page.tsx        # Home
│   ├── setup/          # Onboarding
│   ├── dates/          # Dates y Metas Juntos
│   ├── calendario/     # Actividades
│   ├── recuerdos/      # Galería y captura
│   ├── spark/          # Foto diaria
│   └── mood/           # Estado de ánimo
├── components/
│   ├── ui/             # Componentes base
│   └── layout/         # Layout y navegación
├── stores/             # Zustand stores
└── lib/                # Utilidades y Supabase
```

## Licencia

Privado - Solo para uso personal
