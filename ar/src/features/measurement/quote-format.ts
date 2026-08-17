export function formatQuoteDimensions(widthCm: number, heightCm: number) {
  return `${formatCentimeters(widthCm)} x ${formatCentimeters(heightCm)}`;
}

function formatCentimeters(valueCm: number) {
  const formatted = new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 1,
  }).format(valueCm);

  return `${formatted} cm`;
}
