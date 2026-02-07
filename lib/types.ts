/* ======================================================
   GLOBAL CANONICAL TYPES
   GAS ↔ Internal API ↔ UI
====================================================== */

/* =========================
   PRIMITIVES
========================= */

export type ISODateString = string;
export type Cursor = ISODateString | null;
export type UUID = string;
export type Signature = string;

/* =========================
   USERS
========================= */

export interface User {
  email: string;
  name?: string;
  photo?: string;
  createdAt: ISODateString;
  lastLogin: ISODateString;
}

/* =========================
   ITEMS
========================= */

export interface Item {
  id: string;                 // Drive file ID
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
}

export interface ItemWithSlug extends Item {
  slug: string;
}

/* =========================
   CATEGORIES
========================= */

export interface CategoryHelperRow {
  cat1: string;
  cat2: string;
}

export interface CategoryTreeNode {
  slug: string;
  name: string;
  children: CategoryTreeNode[];
}

export type CategoryTree = CategoryTreeNode[];

/* =========================
   EVENTS
========================= */

export type EventType = "view" | "like" | "comment";

export interface EventRow {
  id: UUID;
  itemId: string;
  type: EventType;

  value: string;              // comment text or "1"
  pageUrl?: string;

  userEmail: string;

  createdAt: ISODateString;
  updatedAt: ISODateString;

  deleted: boolean;
}

export interface EventWithUser extends EventRow {
  userName?: string;
  userPhoto?: string;
}

/* =========================
   ACTIVITY (PROFILE)
========================= */

export interface ItemPreview {
  itemId: string;
  itemName: string;
  itemImage: string;          // items.cdn
  pageUrl: string;
}

export interface UserLike extends ItemPreview {
  likedAt: ISODateString;
}

export interface UserComment extends ItemPreview {
  comment: string;
  commentedAt: ISODateString;
  userImage: string;
}

export interface PaginatedTimeline<T> {
  items: T[];
  nextCursor: Cursor;
  hasMore: boolean;
}

export interface UserActivityProfile {
  userEmail: string;
  profilePic: string;

  likedCount: number;
  commentCount: number;

  likes: PaginatedTimeline<UserLike>;
  comments: PaginatedTimeline<UserComment>;
}

/* =========================
   API RESPONSE WRAPPERS
========================= */

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: string;
};

export type ApiResponse<T> = ApiOk<T> | ApiError;

/* =========================
   API PAYLOADS
========================= */

export interface LoginRequest {
  action: "login";
  email: string;
  name?: string;
  photo?: string;
}

export interface EventsUpsertRequest {
  action: "events.upsert";
  itemId: string;
  type: EventType;
  value?: string;
  pageUrl?: string;
  userEmail: string;
}

export interface EventsRemoveRequest {
  action: "events.remove";
  itemId: string;
  type: EventType;
  userEmail: string;
}

export interface GetUserProfileRequest {
  action: "getUserProfile";
  email: string;
}

/* =========================
   API RESPONSES
========================= */

export type GetUserProfileResponse = ApiResponse<UserActivityProfile>;

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

export type StatsResponse = ApiOk<{
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
}>;

export type EventsListResponse = ApiOk<{
  events: EventRow[] | EventWithUser[];
}>;

/* =========================
   MISC
========================= */

export interface RevalidatePayload {
  tags: string[];
}

export interface SignedPayload {
  action: string;
  timestamp: number;
  nonce: string;
  signature: string;
  payload: string;
}

export interface ItemPageParams {
  slug: string;
}

export interface ItemPageProps {
  params: ItemPageParams;
}