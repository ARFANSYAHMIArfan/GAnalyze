export interface HistoryItem {
  order: number;
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS or HH:MM
  title: string;
  category: string; // e.g. "YouTube", "Google Search", "Chrome", "Drive", or external source
  fileType: 'JSON' | 'CSV';
  rawDate?: Date; // used for accurate sorting and range calculation
}

export interface FileSummary {
  name: string;
  size: number;
  itemCount: number;
  fileType: 'JSON' | 'CSV';
}

export interface ChartDayData {
  date: string;
  count: number;
  formattedDate: string;
}

export interface ChartHourData {
  hour: string; // "00:00", "01:00", etc.
  count: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}
