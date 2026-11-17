export const APARTMENT = {
  name: 'Depto A & M',
  street: 'Ocelotl 14',
  neighborhood: 'San Pablo Tepetlapa',
  borough: 'Coyoacán',
  postalCode: '04260',
  city: 'CDMX',
  country: 'México',
  lat: 19.3107,
  lng: -99.143,
} as const;

export const APARTMENT_ADDRESS = `${APARTMENT.street}, ${APARTMENT.neighborhood}, ${APARTMENT.borough}, ${APARTMENT.postalCode}, ${APARTMENT.city}`;

export const APARTMENT_ADDRESS_FULL =
  'Ocelotl 14, San Pablo Tepetlapa, Coyoacan, 04260, CDMX, San Pablo Tepetlapa, Coyoacan';

export function apartmentMapsUrl() {
  return `https://www.google.com/maps?q=${encodeURIComponent(APARTMENT_ADDRESS)}`;
}

export function apartmentAppleMapsUrl() {
  return `https://maps.apple.com/?ll=${APARTMENT.lat},${APARTMENT.lng}&q=${encodeURIComponent(APARTMENT.street)}`;
}

export function apartmentGeoUrl() {
  return `geo:${APARTMENT.lat},${APARTMENT.lng}?q=${encodeURIComponent(APARTMENT_ADDRESS)}`;
}

export function apartmentShareText() {
  return [
    'Depto A & M',
    APARTMENT_ADDRESS_FULL,
    apartmentMapsUrl(),
  ].join('\n');
}

export function apartmentWazeUrl() {
  return `https://waze.com/ul?ll=${APARTMENT.lat},${APARTMENT.lng}&navigate=yes`;
}

export function apartmentWhatsAppUrl() {
  return `https://wa.me/?text=${encodeURIComponent(apartmentShareText())}`;
}
