/* ======================================================
   USER ACTIVITY / PUBLIC PROFILE TYPES
====================================================== */

export type ISODateString = string;

export type Cursor = ISODateString | null;

export interface ItemPreview {
  itemId: string;
  itemName: string;
  itemImage: string; // cdn of the item
  pageUrl: string;
}

export type UserLike = ItemPreview & {
  likedAt: ISODateString;
};

export type UserComment = ItemPreview & {
  comment: string;
  commentedAt: ISODateString;
  userImage: string; // avatar of the commenting user
};

export type PaginatedTimeline<T> = {
  items: T[];
  nextCursor: Cursor;
  hasMore: boolean;
};

export type UserProfileActivity = {
  userEmail: string;   // once at top
  profilePic: string;  // page owner photo
  likedCount: number;
  commentCount: number;

  likes: PaginatedTimeline<UserLike>;
  comments: PaginatedTimeline<UserComment>;
};

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiErr = {
  ok: false;
  error: string;
};

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type UserProfileResponse = ApiOk<UserProfileActivity>;

/* =========================
   REQUEST PAYLOAD
========================= */

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