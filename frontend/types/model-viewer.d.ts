import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        scale?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "camera-orbit"?: string;
        "camera-target"?: string;
        "field-of-view"?: string;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        "interaction-prompt"?: string;
      };
    }
  }
}
