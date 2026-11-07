import type { ReportData } from "./types.js";

export const CATEGORIES: Array<{ folderName: string; key: keyof ReportData }> = [
  { folderName: "Exterior Photos", key: "photoList" },
  { folderName: "Paint Photos", key: "paintPhotoList" },
  { folderName: "Annotated Photos", key: "markPhotoList" },
  { folderName: "Defect Photos", key: "defectPhotoList" },
];
