/* =========================
   PRIMITIVES
========================= */

export type ISODateString = string; // new Date().toISOString()
export type UUID = string;
export type Signature = string;

/* =========================
   ITEMS
========================= */

export type Item = {
  id: string;            // Drive file ID
  name: string;
  cat1: string;
  cat2?: string | null;
  cdn: string;
  width: number;
  height: number;
  size: number;
  description?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  views: number;
  likes: number;
  comments: number;
  sig: Signature;
};

export type ItemWithSlug = Item & {
  slug: string;
};

/* =========================
   EVENTS
========================= */

export type EventType = "view" | "like" | "comment";

export type EventRow = {
  id: UUID;
  itemId: string;
  type: EventType;
  value: string;          // "1" for like, text for comment
  pageUrl?: string;
  userEmail: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deleted: boolean;
};

export type EventWithUser = EventRow & {
  userName?: string;
  userPhoto?: string;
};

/* =========================
   USERS
========================= */

export type User = {
  email: string;
  name?: string;
  photo?: string;
  createdAt: ISODateString;
  lastLogin: ISODateString;
};

/* =========================
   CATEGORIES
========================= */

export type CategoryHelperRow = {
  cat1: string;
  cat2: string;
};

export type CategoryNode = {
  slug: string;
  name: string;
};

export type CategoryTreeNode = CategoryNode & {
  children: CategoryTreeNode[];
};

export type CategoryTree = CategoryTreeNode[];

/* =========================
   ERRORS / LOGGING
========================= */

export type ErrorLog = {
  time: ISODateString;
  jobId?: string;
  itemId?: string;
  message: string;
  stack?: string;
};

/* =========================
   API RESPONSE WRAPPERS
========================= */

export type ApiOk<T = {}> = {
  ok: true;
} & T;

export type ApiError = {
  ok: false;
  error: string;
};

export type ApiResponse<T = {}> = ApiOk<T> | ApiError;

/* =========================
   API RESPONSES
========================= */

export type ItemsListResponse = ApiOk<{
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  items: Item[];
}>;

export type ItemResponse = ApiOk<{
  item: Item;
}>;

export type ItemBySlugResponse = ApiOk<{
  item: ItemWithSlug;
}>;

export type CategoriesResponse = ApiOk<{
  categories: string[];
}>;

export type CategoryTreeResponse = ApiOk<{
  categories: CategoryTree;
}>;

export type ItemStats = {
  views: number;
  likes: number;
  comments: number;
};

export type StatsResponse = ApiOk<{
  stats: ItemStats;
}>;

export type EventsListResponse = ApiOk<{
  events: EventRow[] | EventWithUser[];
}>;

/* =========================
   REQUEST PAYLOADS
========================= */

export type LoginRequest = {
  action: "login";
  email: string;
  name?: string;
  photo?: string;
};

export type EventsUpsertRequest = {
  action: "events.upsert";
  itemId: string;
  type: EventType;
  value?: string;
  pageUrl?: string;
  userEmail: string;
};

export type EventsRemoveRequest = {
  action: "events.remove";
  itemId: string;
  type: EventType;
  userEmail: string;
};

/* =========================
   MISC
========================= */

export type RevalidatePayload = {
  tags: string[];
};

export type SignedPayload = {
  action: string;
  timestamp: number;
  nonce: string;
  signature: string;
  payload: string;
};

export type ItemPageParams = {
  slug: string;
};

export type ItemPageProps = {
  params: ItemPageParams;
};