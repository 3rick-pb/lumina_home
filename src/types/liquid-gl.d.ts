declare module "liquid-gl" {
  export interface LiquidGLOptions {
    engine?: "auto" | "webgpu" | "webgl2" | "webgl";
    snapshot?: string;
    target: string;
    resolution?: number;
    zIndex?: number;
    content?: string | boolean;
    refraction?: number;
    aberration?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    shadow?: boolean;
    specular?: boolean;
    reveal?: "fade" | "none";
    tilt?: boolean;
    tiltFactor?: number;
    tiltEase?: number;
    draggable?: boolean;
    interaction?: "none" | "fluid";
    interactionStrength?: number;
    interactionRadius?: number;
    interactionViscosity?: number;
    magnify?: number;
    tint?: string | null;
    helper?: boolean;
    on?: {
      init?: (instance: unknown) => void;
      dragstart?: (instance: unknown, info: unknown) => void;
      drag?: (instance: unknown, info: unknown) => void;
      dragend?: (instance: unknown, info: unknown) => void;
    };
  }

  export interface LiquidGLLens {
    destroy: () => void;
    updateMetrics: () => void;
    setTint: (color: string) => void;
    setDraggable: (draggable: boolean) => void;
    el: HTMLElement;
  }

  function liquidGL(options?: LiquidGLOptions): LiquidGLLens | LiquidGLLens[] | undefined;

  export default liquidGL;
}
