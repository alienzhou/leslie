export const ASSET_TYPES = [
  'plan',
  'progress',
  'design',
  'learnings',
  'discuss',
  'transcript',
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export interface AssetDescriptor {
  type: AssetType;
  path: string;
}
