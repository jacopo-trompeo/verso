import { Texture } from "pixi.js";

export async function fileToTexture(file: File) {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return Texture.from(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}
