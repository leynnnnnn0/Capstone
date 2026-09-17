import {
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  CircleHelp,
  Lightbulb,
  Minus,
  Plus,
  RotateCcwSquare,
  RotateCwSquare,
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
            <CardContent className="p-0">
              <div className="ar-guide-handle" aria-hidden="true" />

              <div className="ar-guide-heading">
                <div className="ar-guide-illustration" aria-hidden="true">
                  <span className="ar-guide-scan-line" />
                  <Smartphone />
                </div>
                <div>
                  <p className="ar-guide-kicker">Before you place</p>
                  <h2>Find the surface</h2>
                  <p>
                    {isV2
                      ? "Point your camera at the wall where the product will go."
                      : "Point your camera at the wall or floor where the product will go."}
                  </p>
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
                  <span className="guide-step-number">1</span>
                  <strong>Move slowly</strong>
                  <span>Sweep side to side</span>
                </article>
                <article>
                  <span className="guide-step-number">2</span>
                  <strong>Watch the target</strong>
                  <span>Green means ready</span>
                </article>
                <article>
                  <span className="guide-step-number">3</span>
                  <strong>Place the product</strong>
                  <span>Tap the center button</span>
                </article>
              </div>

              <div className="ar-guide-note" role="note">
                <Lightbulb className="size-4" aria-hidden="true" />
                <span>Good lighting helps your phone find the surface faster.</span>
              </div>

              <Button
                type="button"
                size="lg"
                className="ar-guide-action"
                onClick={onDismissGuide}
              >
                Got it, start scanning
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
            <div className="movement-copy">
              <h2>Scan the surface</h2>
              <p>Move slowly from side to side</p>
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
            <strong>Finding your product again</strong>
            <span>Point back to where you placed it and move slowly.</span>
          </div>
        </section>
      )}

      {anchorTrackingState === "unavailable" && !showGuide && (
        <section className="anchor-tracking-alert is-unavailable" role="alert">
          <CircleHelp className="size-5" aria-hidden="true" />
          <div>
            <strong>Surface lost</strong>
            <span>Keep it in view and move slowly until the target turns green.</span>
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
