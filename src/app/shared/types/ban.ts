export interface BanState {
  isPermanentlyBanned: boolean;
  bannedUntil: string | null;
  isBanned: boolean;
}

export type BanRequest =
  | { isPermanent: true }
  | { isPermanent: false; until: string };

export interface BanMutationResult {
  id: string;
  isPermanentlyBanned: boolean;
  bannedUntil: string | null;
}
