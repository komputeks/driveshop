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











/*************************************************
 * Types for calling getUserProfile endpoint
 *************************************************/

// Request payload for getUserProfile
export interface GetUserProfileRequest {
  action: "getUserProfile";
  email: string;                 // required user email
  limit?: number;                // optional, default 20
  likesCursor?: string;          // optional ISO timestamp for likes pagination
  commentsCursor?: string;       // optional ISO timestamp for comments pagination
}

// Example usage:
const payload: GetUserProfileRequest = {
  action: "getUserProfile",
  email: "alice@example.com",
  limit: 10,
  likesCursor: "2026-02-04T11:20:05.000Z",
  commentsCursor: "2026-02-03T18:55:12.000Z"
};





/*************************************************
 * Types for UserActivityService / getUserProfile
 *************************************************/

// Represents a single liked item
export interface UserLike {
  itemId: string;
  itemName: string;
  pageUrl: string;
  likedAt: string; // ISO timestamp
}

// Represents a single commented item
export interface UserComment {
  itemId: string;
  itemName: string;
  pageUrl: string;
  comment: string;
  commentedAt: string; // ISO timestamp
}

// Paginated likes/comments container
export interface PaginatedItems<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Response returned from getUserProfile
export interface GetUserProfileResponse {
  userEmail: string;
  profilePic: string;
  likedCount: number;
  commentCount: number;
  likes: PaginatedItems<UserLike>;
  comments: PaginatedItems<UserComment>;
}

// Example usage
const example: GetUserProfileResponse = {
  userEmail: "alice@example.com",
  profilePic: "https://cdn.example.com/photos/alice.jpg",
  likedCount: 3,
  commentCount: 2,
  likes: {
    items: [
      {
        itemId: "item_001",
        itemName: "Vintage Chair",
        pageUrl: "/items/item_001",
        likedAt: "2026-02-05T14:32:10.000Z"
      }
    ],
    nextCursor: "2026-02-05T14:32:10.000Z",
    hasMore: true
  },
  comments: {
    items: [
      {
        itemId: "item_002",
        itemName: "Modern Desk",
        pageUrl: "/items/item_002",
        comment: "Love this desk!",
        commentedAt: "2026-02-05T10:15:20.000Z"
      }
    ],
    nextCursor: "2026-02-05T10:15:20.000Z",
    hasMore: false
  }
};