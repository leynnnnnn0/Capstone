export function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function metersToCentimeters(value: number) {
  return round(value * 100);
}

export function metersToMillimeters(value: number) {
  return round(value * 1000);
}
