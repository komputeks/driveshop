/* =========================
   CORE / SHARED
========================= */

export type ID = string;
export type ISODate = string;

export type SlugProps = {
  slug: string;
};

/* =========================
   USER
========================= */

export type UserProfile = {
  email: string;
  name: string;
  photo: string;
};

export type UserSyncPayload = {
  action: "login";
  email: string;
  name: string;
  photo: string;
};

/* =========================
   CATEGORIES
========================= */

export type Category = {
  id: ID;
  slug: string;
  title: string;
  parentId?: ID | null;
};

export type CategoryNode = Category & {
  children: CategoryNode[];
};

export type CategoriesResponse = {
  categories: CategoryNode[];
};

/* =========================
   ITEMS
========================= */

export type Item = {
  id: ID;
  slug: string;
  title: string;
  description?: string;
  categoryId: ID;
  createdAt: ISODate;
};

export type ItemsListResponse = {
  items: Item[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type ItemDetailsResponse = {
  item: Item;
};

/* =========================
   EVENTS (likes + comments)
========================= */

export type EventType = "like" | "comment";

export type EventRow = {
  id: ID;
  itemId: ID;
  type: EventType;
  value: string | number; // comment text OR 1
  pageUrl: string;
  userEmail: string;
  createdAt: ISODate;
  deleted?: boolean;
};

export type CreateEventPayload = {
  action: "event";
  type: EventType;
  itemSlug: string;
  value: string | number;
};

export type RemoveEventPayload = {
  action: "event-remove";
  type: EventType;
  itemSlug: string;
};

/* =========================
   STATS
========================= */

export type ItemStats = {
  likes: number;
  views: number;
  comments: number;
};

export type ItemStatsResponse = {
  stats: ItemStats;
};

/* =========================
   COMMENTS
========================= */

export type Comment = {
  id: ID;
  text: string;
  userEmail: string;
  createdAt: ISODate;
};

export type CommentsResponse = {
  comments: Comment[];
};

/* =========================
   API STANDARD RESPONSE
========================= */

export type OkResponse<T = unknown> = {
  ok: true;
  data: T;
};

export type ErrorResponse = {
  ok: false;
  error: string;
};