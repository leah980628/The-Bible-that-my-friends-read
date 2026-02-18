
export interface Track {
  id: string;
  file: File;
  name: string;
  artist: string;
  duration: number;
  url: string;
}

export enum RepeatMode {
  NONE,
  ONE,
  ALL,
}
