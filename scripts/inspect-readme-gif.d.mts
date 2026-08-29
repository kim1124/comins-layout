export type ReadmeGifMetadata = {
  duration: number;
  frameCount: number;
  height: number;
  loopCount: number | null;
  signature: "GIF87a" | "GIF89a";
  size: number;
  width: number;
};

export function inspectReadmeGif(path: string): Promise<ReadmeGifMetadata>;
