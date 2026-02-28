export interface Outing {
  id: string;
  place: string;
  outing_date: string;
  comment: string | null;
  image_url: string | null;
  created_at: string;
}

export interface OutingWithDolls extends Outing {
  doll_ids: string[];
  image_urls: string[];
  dolls?: { id: string; name: string; color: string; image_url: string | null }[];
}
