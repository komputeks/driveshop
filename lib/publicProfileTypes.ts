/* ======================================================
   USER ACTIVITY / PUBLIC PROFILE (Timeline-based)
====================================================== */
export type ISODateString = string; // RFC 3339 / ISO 8601

/**
 * Cursor is always an ISO timestamp (createdAt)
 */
export type Cursor = ISODateString | null;

/**
 * Shared item fields (enriched from ITEMS sheet)
 */
export interface ItemPreview {
  itemId: string;     // items.id
  itemName: string;   // items.name
  itemImage: string;  // items.cdn
  pageUrl: string;    // events.pageUrl (canonical link)
}

/**
 * A single liked item
 */
export type UserLike = ItemPreview & {
  likedAt: ISODateString; // events.createdAt
};

/**
 * A single comment
 */
export type UserComment = ItemPreview & {
  comment: string;        // events.value
  commentedAt: ISODateString; // events.createdAt
};

/**
 * Generic cursor-based pagination container
 */
export type PaginatedTimeline<T> = {
  items: T[];
  nextCursor: Cursor;
  hasMore: boolean;
};

/**
 * Public user activity payload
 * Returned by getUserProfile (GAS)
 */
export type UserProfileActivity = {
  userEmail: string;   // appears ONCE at top
  profilePic: string;  // users.cdn or photo
  likedCount: number;
  commentCount: number;

  likes: PaginatedTimeline<UserLike>;
  comments: PaginatedTimeline<UserComment>;
};

/* ======================================================
   API RESPONSE WRAPPERS
====================================================== */

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiErr = {
  ok: false;
  error: string;
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type UserProfileResponse = ApiResponse<UserProfileActivity>;

/* ======================================================
   REQUEST PAYLOAD
====================================================== */

export type GetUserProfileRequest = {
  action: "getUserProfile";
  email: string;
  limit?: number;
  likesCursor?: Cursor;
  commentsCursor?: Cursor;
};

/* =========================
   Handle Resolver
========================= */

export interface ResolveHandleRequest {
  action: "resolveUserHandle";
  handle: string;
}

export interface ResolveHandleResponse {
  ok: true;
  email: string;
}