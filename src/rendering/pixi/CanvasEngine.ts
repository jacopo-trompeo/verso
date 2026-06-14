import { Application, Container, Sprite, type Texture } from "pixi.js";
import { clamp } from "@/shared/utils/math";

export class CanvasEngine {
  private app?: Application;
  private container?: Container;
  private sprite?: Sprite;
  private host?: HTMLElement;

  private generation = 0;
  private renderScheduled = false;

  private isPanning = false;
  private lastPannedX = 0;
  private lastPannedY = 0;

  private readonly minZoomScale = 0.05;
  private readonly maxZoomScale = 40;
  private readonly zoomSensitivity = 0.0015;
  private readonly fitMargin = 0.95;

  private resizeObserver?: ResizeObserver;

  async mount(host: HTMLElement, onReady?: () => void) {
    const generation = ++this.generation;
    this.host = host;

    const app = new Application();
    await app.init({
      preference: "webgpu",
      antialias: true,
      backgroundColor: 0x0f0f12,
      resolution: window.devicePixelRatio ?? 1,
      autoDensity: true,
      autoStart: false,
      powerPreference: "high-performance",
      resizeTo: host,
    });

    if (generation !== this.generation) {
      app.destroy(true, { children: true });
      return;
    }

    this.app = app;
    this.container = new Container();
    app.stage.addChild(this.container);

    host.appendChild(app.canvas);

    const { canvas } = app;
    canvas.setAttribute("aria-label", "Image canvas");
    canvas.style.cursor = "grab";
    canvas.style.display = "block";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(host);

    this.handleResize();
    this.requestRender();
    onReady?.();
  }

  destroy() {
    this.generation++;
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (!this.app) {
      return;
    }

    const { canvas } = this.app;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerUp);
    canvas.removeEventListener("wheel", this.onWheel);

    this.app.destroy(true, { children: true });
    this.app = undefined;
    this.container = undefined;
    this.sprite = undefined;
  }

  private requestRender() {
    if (this.renderScheduled || !this.app) return;
    this.renderScheduled = true;

    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.app?.render();
    });
  }

  setImage(texture: Texture) {
    if (!this.container) {
      throw new Error(
        "CanvasEngine.setImage() called before mount() completed",
      );
    }

    if (this.sprite) {
      this.container.removeChild(this.sprite);
      this.sprite.destroy();
      this.sprite = undefined;
    }

    this.sprite = new Sprite(texture);
    this.container.addChild(this.sprite);
    this.fitToScreen();
  }

  fitToScreen() {
    if (!this.app || !this.container || !this.sprite) {
      return;
    }

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const textureWidth = this.sprite.texture.width;
    const textureHeight = this.sprite.texture.height;

    if (textureWidth === 0 || textureHeight === 0) {
      return;
    }

    const widthScale = screenWidth / textureWidth;
    const heightScale = screenHeight / textureHeight;

    const scale = Math.min(widthScale, heightScale) * this.fitMargin;
    this.container.scale.set(scale);

    const xPosition = (screenWidth - textureWidth * scale) / 2;
    const yPosition = (screenHeight - textureHeight * scale) / 2;

    this.container.position.set(xPosition, yPosition);
    this.requestRender();
  }

  private handleResize = () => {
    if (!this.app || !this.host) {
      return;
    }

    const { clientWidth, clientHeight } = this.host;

    if (clientWidth === 0 || clientHeight === 0) {
      return;
    }

    this.app.renderer.resize(clientWidth, clientHeight);
    this.requestRender();
  };

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    event.preventDefault();

    this.isPanning = true;
    this.lastPannedX = event.clientX;
    this.lastPannedY = event.clientY;

    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

    if (this.app) {
      this.app.canvas.style.cursor = "grabbing";
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.isPanning || !this.container) {
      return;
    }

    this.container.x += event.clientX - this.lastPannedX;
    this.container.y += event.clientY - this.lastPannedY;
    this.lastPannedX = event.clientX;
    this.lastPannedY = event.clientY;
    this.requestRender();
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.isPanning) {
      return;
    }

    this.isPanning = false;

    try {
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId,
      );
    } catch {}

    if (this.app) {
      this.app.canvas.style.cursor = "grab";
    }
  };

  private onWheel = (event: WheelEvent) => {
    if (!this.app || !this.container) return;
    event.preventDefault();

    const canvasBounds = this.app.canvas.getBoundingClientRect();
    const pointerCanvasX = event.clientX - canvasBounds.left;
    const pointerCanvasY = event.clientY - canvasBounds.top;

    const currentScale = this.container.scale.x;

    const pointerLocalX = (pointerCanvasX - this.container.x) / currentScale;
    const pointerLocalY = (pointerCanvasY - this.container.y) / currentScale;

    const zoomMultiplier = Math.exp(-event.deltaY * this.zoomSensitivity);
    const nextScale = clamp(
      currentScale * zoomMultiplier,
      this.minZoomScale,
      this.maxZoomScale,
    );

    this.container.scale.set(nextScale);

    this.container.x = pointerCanvasX - pointerLocalX * nextScale;
    this.container.y = pointerCanvasY - pointerLocalY * nextScale;

    this.requestRender();
  };
}
