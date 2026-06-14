import { useEffect, useRef } from "react";
import type { CanvasEngine } from "@/rendering/pixi/CanvasEngine";

interface EditorCanvasProps {
  engine: CanvasEngine;
}

export function EditorCanvas(props: EditorCanvasProps) {
  const { engine } = props;
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    void engine.mount(host);

    return () => {
      engine.destroy();
    };
  }, [engine]);

  return <div ref={hostRef} className="absolute inset-0 select-none" />;
}
