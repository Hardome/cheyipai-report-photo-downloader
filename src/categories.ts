import type { ReportData } from "./types.js";

export const CATEGORIES: Array<{ folderName: string; label: string; key: keyof ReportData }> = [
  { folderName: "Exterior Photos", label: "Общий вид", key: "photoList" },
  { folderName: "Paint Photos", label: "Кузовные панели", key: "paintPhotoList" },
  { folderName: "Annotated Photos", label: "Фотографии с пометками", key: "markPhotoList" },
  { folderName: "Defect Photos", label: "Дефекты", key: "defectPhotoList" },
];
