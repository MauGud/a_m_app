export type ImpactArea =
  | 'dates'
  | 'recuerdos'
  | 'calendario'
  | 'super'
  | 'finanzas'
  | 'pagos'
  | 'depto'
  | 'sync'
  | 'seguridad'
  | 'look'
  | 'pwa';

export interface ImpactReport {
  area: ImpactArea;
  title: string;
  summary: string;
  alsoTouches: ImpactArea[];
  keepLook: true;
}

const RULES: Array<{ keys: RegExp; report: Omit<ImpactReport, 'keepLook'> }> = [
  {
    keys: /s[uú]per|carrito|sku|chedraui|soriana|walmart|j[uü]sto|despensa/,
    report: {
      area: 'super',
      title: 'Súper y carrito',
      summary: 'Toca la lista presencial, las sucursales cerca de casa y los precios de caja.',
      alsoTouches: ['depto', 'pagos'],
    },
  },
  {
    keys: /cita|date|explorar|cat[aá]logo|qu[eé] hacemos/,
    report: {
      area: 'dates',
      title: 'Dates',
      summary: 'Toca explorar, la lista de 20 y el vínculo con Recuerdos.',
      alsoTouches: ['recuerdos', 'calendario'],
    },
  },
  {
    keys: /recuerdo|foto|zip|c[aá]mara|instagram/,
    report: {
      area: 'recuerdos',
      title: 'Recuerdos',
      summary: 'Toca fotos, el zip de Mau y el vinculo con Dates.',
      alsoTouches: ['dates'],
    },
  },
  {
    keys: /presupuesto|finanza|deuda|nu\b|quincena|caja de/,
    report: {
      area: 'finanzas',
      title: 'Presupuesto',
      summary: 'Toca el presupuesto que Mau registra en esta app.',
      alsoTouches: ['pagos', 'seguridad'],
    },
  },
  {
    keys: /pago|tarjeta|vault|m[eé]todo de pago|last4/,
    report: {
      area: 'pagos',
      title: 'Pagos y tarjetas',
      summary: 'Toca recordatorios y el vault. Nunca los 16 dígitos.',
      alsoTouches: ['finanzas', 'seguridad'],
    },
  },
  {
    keys: /sync|supabase|no carga|offline|se trab[oó]/,
    report: {
      area: 'sync',
      title: 'Sincronía',
      summary: 'Toca cómo se ven los datos en los dos teléfonos.',
      alsoTouches: ['dates', 'recuerdos', 'finanzas', 'super'],
    },
  },
  {
    keys: /logo|color|pastel|look|marca|tipograf/,
    report: {
      area: 'look',
      title: 'Look and feel',
      summary: 'Cualquier arreglo debe dejar el pastel y el isotipo igual.',
      alsoTouches: [],
    },
  },
  {
    keys: /instalar|iphone|pwa|notific/,
    report: {
      area: 'pwa',
      title: 'App en el iPhone',
      summary: 'Toca instalación, icono y avisos.',
      alsoTouches: ['look'],
    },
  },
];

export function mapImpact(text: string): ImpactReport {
  const lower = text.toLowerCase();
  const match = RULES.find((rule) => rule.keys.test(lower));
  const base = match?.report ?? {
    area: 'sync' as ImpactArea,
    title: 'Ecosistema',
    summary: 'No pude clasificarlo. Lo trato como algo que puede tocar varias pantallas.',
    alsoTouches: ['dates', 'super', 'finanzas'] as ImpactArea[],
  };
  return { ...base, keepLook: true };
}

export function impactPrompt(text: string, report: ImpactReport) {
  return [
    'A & M. Arregla SOLO esto, sin cambiar look pastel ni isotipo.',
    `Pedido de Mau: ${text.trim()}`,
    `Área: ${report.title}. ${report.summary}`,
    report.alsoTouches.length
      ? `También revisar: ${report.alsoTouches.join(', ')}.`
      : 'Sin colaterales obvios.',
    'No guardar PAN, CVV ni NIP. No tocar Amanda dash ni zip si no es el pedido.',
    'Al terminar, corre scripts/verify.mjs y prueba el flujo en el navegador.',
  ].join('\n');
}
