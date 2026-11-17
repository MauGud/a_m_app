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
