import { metersToCentimeters } from "../../lib/format";
import type { MeasurementDimensions, MeasurementPoint } from "./types";

export function computeDimensions(points: MeasurementPoint[]): MeasurementDimensions {
  const segmentPoints = points.slice(0, -1);
  const heightStart = points[points.length - 2].position;
  const heightEnd = points[points.length - 1].position;

  return {
    segmentsCm: segmentPoints.slice(0, -1).map((point, index) =>
      metersToCentimeters(point.position.distanceTo(segmentPoints[index + 1].position)),
    ),
    heightCm: metersToCentimeters(heightStart.distanceTo(heightEnd)),
  };
}

export function formatDimensions(dimensions: MeasurementDimensions) {
  const segments = dimensions.segmentsCm.length
    ? dimensions.segmentsCm.map((segment) => `${segment} cm`).join(" x ")
    : "No width segments";

  return `${segments} x ${dimensions.heightCm} cm`;
}
