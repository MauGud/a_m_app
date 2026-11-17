# Manual de Identidad de Marca: A & M (a_m_app)

> "Uniendo el Fuego y el Agua para crear un refugio único."

Este manual define y norma la identidad visual y la filosofía de **A & M**, una aplicación privada y compartida diseñada para conectar a una pareja a través de sus vivencias, planes y emociones cotidianas.

Versión del sistema: **v1.0.0**. Tokens en `tailwind.config.ts`. Componentes en `src/components/ui`.

---

## 1. El Propósito y la Filosofía

La aplicación **A & M** no es solo una herramienta de organización; es un diario vivo, un calendario de memorias y un catalizador para mantener encendida la relación.

### El Concepto "Fuego y Agua" (Nuestra Dualidad)

- **El Fuego (Spark / La Chispa):** Representa la pasión, el juego, los retos diarios y la energía dinámica. Es la fuerza que impulsa las dinámicas compartidas (`/spark`).
- **El Agua (Mood y Recuerdos / El Sentimiento):** Representa la calma, el almacenamiento seguro de la memoria y la empatía. Es el espacio receptivo y fluido que acuna el día a día (`/mood`, `/recuerdos`).

---

## 2. El Logotipo

El logotipo de la marca representa la fusión de estos dos elementos, formando un ecosistema que se retroalimenta.

- **La Base (Las Olas):** Con trazo envolvente, genera la forma de la letra **M**. Es la estabilidad del agua que protege y acuna la relación.
- **El Núcleo (La Chispa):** Una flama vertical que integra una **A** oculta por medio de un calado de espacio negativo. Representa la elevación y el dinamismo del fuego.

Archivos:

- `logo.svg` — vector escalable
- `logo-app-icon.png` — ícono de app con la A visible
- `logo-on-dark.jpg` / `logo-on-light.jpg` / `logo-on-fuego.jpg` — aplicaciones
- `favicon.ico` — variante cuadrada para el navegador

### Área de Aislamiento

El logo siempre debe contar con un espacio libre a su alrededor equivalente al **15%** de su tamaño total.

---

## 3. Paleta de Colores Oficial

### El Fuego (Dynamic & Warm)

- Warm Amber (brillo superior): `#FFAE42`
- Vibrant Coral (tono intermedio): `#FF5E3A`
- Passionate Red (base de flama): `#E53E3E`

### El Agua (Trust & Flow)

- Bright Cyan (crestas y olas): `#38BDF8`
- Ocean Blue (fluidez central): `#0284C7`
- Deep Navy (cuerpo y profundidad): `#0F52BA`

### Tonos de Interfaz

- Midnight Dark (fondo de la app): `#0B1120`
- Off-White (tipografía y fondos ligeros): `#F8FAFC`

---

## 4. Tipografía

Definida en `src/app/layout.tsx`.

### Primaria: Geist Sans

Títulos, estados de ánimo (`/mood`), botones y encabezados. Voz moderna y natural.

### Secundaria: Geist Mono

Fechas (`/calendario`), recuerdos y configuración (`/setup`). Diario digital.

---

## 5. Aplicación Digital (UX/UI y Favicon)

### Favicon y PWA (`/public/manifest.json`)

El logo PNG oficial es el favicon y el ícono de pantalla de inicio. La UI de la app conserva el sistema pastel original (`#FFF0F3` / `#FFB5C5`).

### Animaciones

1. **El Latido de la Chispa:** en `/spark`, la flama tiene una animación de respiración (`animate-fire-float`).
2. **El Vaivén del Agua:** en el inicio, oleaje sutil (`animate-water-ambient`).

---

## 6. Usos Permitidos e Incorrectos

**Permitido**

- Logo en color plano (blanco) cuando se requiera minimalismo.
- Degradado en pantallas de alta resolución.

**Prohibido**

- Rotar o deformar la flama o las olas.
- Cambiar la orientación del calado que forma la "A".
- Emplear colores fuera de la paleta aprobada.
