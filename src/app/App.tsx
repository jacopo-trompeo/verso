import { useCallback, useRef, useState } from "react";
import { EditorCanvas } from "@/features/editor-canvas/EditorCanvas";
import { Toolbar } from "@/features/toolbar/Toolbar";
import { CanvasEngine } from "@/rendering/pixi/CanvasEngine";
import { fileToTexture } from "@/rendering/pixi/textures";

export function App() {
  const engineRef = useRef<CanvasEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new CanvasEngine();
  }
  const engine = engineRef.current;

  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  async function handleUpload(file: File) {
    try {
      const texture = await fileToTexture(file);
      engine.setImage(texture);
    } catch (err) {
      console.error("Failed to load image", err);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Toolbar
        onUpload={handleUpload}
        onFit={() => engine.fitToScreen()}
        disabled={!ready}
      />

      <main className="relative min-h-0 flex-1">
        <EditorCanvas engine={engine} onReady={handleReady} />
      </main>
    </div>
  );
}
