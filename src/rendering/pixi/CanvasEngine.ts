import { Application, Container, Sprite, type Texture } from "pixi.js";

export class CanvasEngine {
  private app?: Application;
  private container?: Container;
  private sprite?: Sprite;
  private host?: HTMLElement;

  private generation = 0;
  private renderScheduled = false;

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

    this.requestRender();
    onReady?.();
  }

  destroy() {
    this.generation++;

    if (!this.app) {
      return;
    }

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
  }
}
