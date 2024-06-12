export type ThumbnailForUpload = {
  buffer: Buffer;
  multiplier: number;
  fileType: string;
  filenameBase: string;
};

export type PageForUpload = {
  buffer: Buffer;
  fileType: string;
  newFileName: string;
};
