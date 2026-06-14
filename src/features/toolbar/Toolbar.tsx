import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";

interface ToolbarProps {
  onUpload: (file: File) => void;
  disabled: boolean;
}

export function Toolbar(props: ToolbarProps) {
  const { onUpload, disabled } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      role="toolbar"
      aria-label="Editor tools"
      className="flex items-center gap-2 bg-zinc-900 px-3 py-2"
    >
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Open image
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Open image file"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
