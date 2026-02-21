export interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  file?: File;
  fileName?: string;
}
