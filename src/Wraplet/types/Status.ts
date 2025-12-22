export interface Status {
  readonly isInitialized: boolean;
  readonly isGettingInitialized: boolean;
  readonly isDestroyed: boolean;
  readonly isGettingDestroyed: boolean;
}

export type StatusWritable = { -readonly [K in keyof Status]: Status[K] };
