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

export type AdFileForUpload = {
  buffer: Buffer;
  fileType: string;
  multiplier: number;
};
