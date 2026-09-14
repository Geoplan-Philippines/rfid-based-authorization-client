export interface BanState {
  isPermanentlyBanned: boolean;
  bannedFrom?: string | null;
  bannedUntil: string | null;
  isBanned: boolean;
}

export type BanRequest =
  | { permanent: true; isPermanent?: boolean }
  | { permanent: false; from: string; to: string; isPermanent?: boolean; until?: string }
  | { isPermanent: true; permanent?: boolean }
  | { isPermanent: false; until: string; from?: string; to?: string; permanent?: boolean };

export interface BanMutationResult {
  id: string;
  isPermanentlyBanned: boolean;
  bannedFrom?: string | null;
  bannedUntil: string | null;
  isBanned?: boolean;
}
