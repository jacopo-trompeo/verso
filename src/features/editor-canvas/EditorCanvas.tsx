import { useEffect, useRef } from "react";
import type { CanvasEngine } from "@/rendering/pixi/CanvasEngine";

interface EditorCanvasProps {
  engine: CanvasEngine;
  onReady?: () => void;
}

export function EditorCanvas(props: EditorCanvasProps) {
  const { engine, onReady } = props;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    void engine.mount(host, onReady).catch(console.error);

    return () => {
      engine.destroy();
    };
  }, [engine, onReady]);

  return <div ref={hostRef} className="absolute inset-0 select-none" />;
}
