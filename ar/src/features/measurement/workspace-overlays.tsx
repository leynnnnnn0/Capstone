import {
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  CircleHelp,
  Minus,
  MousePointerClick,
  Move3D,
  Plus,
  RotateCcwSquare,
  RotateCwSquare,
  ScanLine,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  nudgeV2Object,
  rotateV2ObjectAxes,
} from "./placement-helpers";
import {
  V2_DEFAULT_WIDTH_CM,
  V2_NUDGE_METERS,
  V2_ROTATE_RADIANS,
  type AnchorTrackingState,
  type V2PlacedObject,
} from "./workspace-types";
import { V2DimensionControl } from "./workspace-components";

interface ArGuidanceOverlaysProps {
  isV2: boolean;
  showGuide: boolean;
  showMovementCoach: boolean;
  anchorTrackingState: AnchorTrackingState;
  onPointerDown: () => void;
  onDismissGuide: () => void;
}

export function ArGuidanceOverlays({
  isV2,
  showGuide,
  showMovementCoach,
  anchorTrackingState,
  onPointerDown,
  onDismissGuide,
}: ArGuidanceOverlaysProps) {
  return (
    <>
      {showGuide && (
        <section
          className="ar-guide-backdrop"
          data-xr-ui="true"
          onPointerDown={onPointerDown}
        >
          <Card className="ar-guide-card">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Quick guide</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Scan, wait for green, then tap
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-white hover:bg-white/10"
                  aria-label="Close guide"
                  onClick={onDismissGuide}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="guide-step-list">
                <article>
                  <Smartphone className="size-5" />
                  <span>
                    <strong>1. Point at the surface</strong>
                    {isV2
                      ? "Point your phone at the wall where the product will be installed."
                      : "Point your phone at the wall or floor where the product should go."}
                  </span>
                </article>
                <article>
                  <Move3D className="size-5" />
                  <span>
                    <strong>2. Move slowly</strong>
                    Move the phone gently from side to side so Android can
                    understand the surface.
                  </span>
                </article>
                <article>
                  <ScanLine className="size-5" />
                  <span>
                    <strong>3. Wait for green</strong>
                    Red means no surface. Yellow means keep moving. Green means
                    the surface is ready.
                  </span>
                </article>
                <article>
                  <MousePointerClick className="size-5" />
                  <span>
                    <strong>4. Tap to place</strong>
                    When the circle is green, tap it to place the product.
                  </span>
                </article>
              </div>

              <div className="ar-guide-note">
                Keep the surface well lit and avoid covering the camera. You can
                adjust the product after placing it.
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full rounded-2xl"
                onClick={onDismissGuide}
              >
                Start scanning
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {showMovementCoach &&
        !showGuide &&
        anchorTrackingState !== "recovering" && (
          <section
            className="movement-coach"
            data-xr-ui="true"
            onPointerDown={onPointerDown}
          >
            <div className="movement-phone" aria-hidden="true">
              <span className="movement-arrow movement-arrow--left" />
              <Smartphone className="movement-phone-icon" />
              <span className="movement-arrow movement-arrow--right" />
            </div>
            <div>
              <p className="eyebrow">Need a surface</p>
              <h2>Move your phone slowly</h2>
              <p>
                Pan side to side and slightly up or down. This disappears as soon
                as movement is detected.
              </p>
            </div>
          </section>
        )}

      {anchorTrackingState === "recovering" && !showGuide && (
        <section
          className="anchor-tracking-alert is-recovering"
          role="status"
          aria-live="assertive"
        >
          <RotateCwSquare className="size-5" aria-hidden="true" />
          <div>
            <strong>Restoring the anchor</strong>
            <span>
              Move slowly and point back toward the placed product. It is frozen
              until tracking returns.
            </span>
          </div>
        </section>
      )}

      {anchorTrackingState === "unavailable" && !showGuide && (
        <section className="anchor-tracking-alert is-unavailable" role="alert">
          <CircleHelp className="size-5" aria-hidden="true" />
          <div>
            <strong>Stable anchor unavailable</strong>
            <span>
              Keep the surface in view, move slowly, and wait for green before
              trying again.
            </span>
          </div>
        </section>
      )}
    </>
  );
}

interface PlacementEditorProps {
  object: V2PlacedObject;
  modelLabel: string;
  onClose: () => void;
  onChangeModel: () => void;
  onAddProduct: () => void;
  onDimensionsChange: (
    objectId: number,
    dimensions: Partial<V2PlacedObject["dimensions"]>,
  ) => void;
  onTransform: (
    objectId: number,
    transform: (
      object: V2PlacedObject,
    ) => Partial<
      Pick<
        V2PlacedObject,
        "anchor" | "anchorOffset" | "widthDir" | "heightDir" | "depthDir"
      >
    >,
  ) => void;
  onPointerDown: () => void;
}

export function PlacementEditor({
  object,
  modelLabel,
  onClose,
  onChangeModel,
  onAddProduct,
  onDimensionsChange,
  onTransform,
  onPointerDown,
}: PlacementEditorProps) {
  const transform = (
    change: (
      object: V2PlacedObject,
    ) => Partial<
      Pick<
        V2PlacedObject,
        "anchor" | "anchorOffset" | "widthDir" | "heightDir" | "depthDir"
      >
    >,
  ) =>
    onTransform(object.id, change);

  return (
    <section
      className="v2-size-panel"
      data-xr-ui="true"
      onPointerDown={onPointerDown}
    >
      <div className="v2-size-panel-actions">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button" onClick={onChangeModel}>
          Change Model
        </button>
        <button type="button" onClick={onAddProduct}>
          Add New Product
        </button>
      </div>
      <div className="v2-size-panel-header">
        <div>
          <small>Glass</small>
          <strong>{modelLabel}</strong>
        </div>
        <span>
          {object.dimensions.segmentsCm[0]}x{object.dimensions.heightCm}
        </span>
      </div>
      <V2DimensionControl
        label="Height"
        value={object.dimensions.heightCm}
        onChange={(heightCm) => onDimensionsChange(object.id, { heightCm })}
      />
      <V2DimensionControl
        label="Width"
        value={object.dimensions.segmentsCm[0] ?? V2_DEFAULT_WIDTH_CM}
        onChange={(widthCm) =>
          onDimensionsChange(object.id, { segmentsCm: [widthCm] })
        }
      />
      <div className="v2-transform-grid">
        <TransformButton
          label="Rotate L"
          icon={<RotateCcwSquare className="size-4" />}
          onClick={() =>
            transform((item) => rotateV2ObjectAxes(item, V2_ROTATE_RADIANS))
          }
        />
        <TransformButton
          label="Rotate R"
          icon={<RotateCwSquare className="size-4" />}
          onClick={() =>
            transform((item) => rotateV2ObjectAxes(item, -V2_ROTATE_RADIANS))
          }
        />
        <TransformButton
          label="Left"
          icon={<ChevronsLeft className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.widthDir, -V2_NUDGE_METERS),
            )
          }
        />
        <TransformButton
          label="Right"
          icon={<ChevronsRight className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.widthDir, V2_NUDGE_METERS),
            )
          }
        />
        <TransformButton
          label="Up"
          icon={<ChevronsUp className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.heightDir, V2_NUDGE_METERS),
            )
          }
        />
        <TransformButton
          label="Down"
          icon={<ChevronsDown className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.heightDir, -V2_NUDGE_METERS),
            )
          }
        />
        <TransformButton
          label="In"
          icon={<Minus className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.depthDir, -V2_NUDGE_METERS),
            )
          }
        />
        <TransformButton
          label="Out"
          icon={<Plus className="size-4" />}
          onClick={() =>
            transform((item) =>
              nudgeV2Object(item, item.depthDir, V2_NUDGE_METERS),
            )
          }
        />
      </div>
    </section>
  );
}

function TransformButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={label}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
