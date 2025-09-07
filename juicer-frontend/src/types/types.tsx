export type Guild = {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  owner_name: string;
  owner_nick: string | null; // nick is server-specific. optional
  member_count: number;
};