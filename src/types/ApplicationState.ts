import { DrawState } from './DrawState';

export type ApplicationState = {
  deviceType: 'mouse' | 'touch';
  toolSelected: string;
  isHoldingMouseButton: boolean;
  doneHistory: DrawState[];
  undoneHistory: DrawState[];
};
