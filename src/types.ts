export interface Photo {
  photoName: string;
  bigPhotoUrl: string;
  photoPath: string;
  photoIdStr: string;
}

export interface ReportData {
  photoList: Photo[];
  paintPhotoList: Photo[];
  markPhotoList: Photo[];
  defectPhotoList: Photo[];
}


export interface ReportParameters { reportCode: string; templateCode: string; reportVersion: string; }
export interface DownloadOptions { output?: string; noTranslate?: boolean; overwrite?: boolean; }
export interface DownloadSummary { downloaded: number; skipped: number; failed: number; outputDir: string; }
export type Fetcher = (url: string) => Promise<Response>;
