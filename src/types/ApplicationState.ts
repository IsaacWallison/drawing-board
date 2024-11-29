export type ApplicationState = {
  deviceType: 'mouse' | 'touch';
  toolSelected: string;
  isHoldingMouseButton: boolean;
  lineWidth: number;
  lineColor: null | string;
  colors: string[];
  doneHistory: number[][];
  undoneHistory: number[][];
};
