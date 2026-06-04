export type Coordinates = {
  latitude?: number;
  longitude?: number;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (
  origin: Coordinates | undefined,
  destination: Coordinates | undefined,
) => {
  if (
    origin?.latitude === undefined ||
    origin.longitude === undefined ||
    destination?.latitude === undefined ||
    destination.longitude === undefined
  ) {
    return undefined;
  }

  const originLat = Number(origin.latitude);
  const originLng = Number(origin.longitude);
  const destinationLat = Number(destination.latitude);
  const destinationLng = Number(destination.longitude);

  if (
    !Number.isFinite(originLat) ||
    !Number.isFinite(originLng) ||
    !Number.isFinite(destinationLat) ||
    !Number.isFinite(destinationLng)
  ) {
    return undefined;
  }

  const latDelta = toRadians(destinationLat - originLat);
  const lngDelta = toRadians(destinationLng - originLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(destinationLat)) *
      Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((EARTH_RADIUS_KM * c).toFixed(2));
};
