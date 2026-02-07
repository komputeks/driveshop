/* ======================================================
   USER ACTIVITY / PUBLIC PROFILE (Timeline-based)
====================================================== */

/**
 * Cursor is always an ISO timestamp (createdAt)
 */
export type Cursor = ISODateString | null;

/**
 * A single liked item, enriched from ITEMS sheet
 */
export type UserLike = {
  itemId: string;          // items.id
  itemName: string;        // items.name
  itemImage: string;       // items.cdn
  pageUrl: string;         // events.pageUrl (canonical link)
  likedAt: ISODateString;  // events.createdAt
};

/**
 * A single comment, enriched from ITEMS sheet
 */
export type UserComment = {
  itemId: string;              // items.id
  itemName: string;            // items.name
  itemImage: string;           // items.cdn
  pageUrl: string;             // events.pageUrl
  comment: string;             // events.value
  commentedAt: ISODateString;  // events.createdAt
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
  userEmail: string;        // appears ONCE at top
  profilePic: string;       // users.cdn or photo
  likedCount: number;
  commentCount: number;

  likes: PaginatedTimeline<UserLike>;
  comments: PaginatedTimeline<UserComment>;
};

/**
 * API response wrapper for public profile
 */
export type UserProfileResponse = ApiOk<UserProfileActivity>;

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



export interface ItemPreview {
  itemId: string;
  itemName: string;
  itemImage: string;
  pageUrl: string;
}

export type UserLike = ItemPreview & {
  likedAt: ISODateString;
};

export type UserComment = ItemPreview & {
  comment: string;
  commentedAt: ISODateString;
};