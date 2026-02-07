/* ======================================================
   USER ACTIVITY / PROFILE TYPES (MATCHES GAS EXACTLY)
====================================================== */

/* ---------- primitives ---------- */

export type ISODateString = string;
export type Cursor = ISODateString | null;

/* ---------- item preview ---------- */

export interface ItemPreview {
  itemId: string;
  itemName: string;
  itemImage: string; // items.cdn
  pageUrl: string;
}

/* ---------- likes ---------- */

export interface UserLike extends ItemPreview {
  likedAt: ISODateString;
}

/* ---------- comments ---------- */

export interface UserComment extends ItemPreview {
  comment: string;
  commentedAt: ISODateString;
  userImage: string; // from users.photo
}

/* ---------- pagination container ---------- */

export interface PaginatedTimeline<T> {
  items: T[];
  nextCursor: Cursor;
  hasMore: boolean;
}

/* ---------- activity payload ---------- */

export interface UserActivityProfile {
  userEmail: string;
  profilePic: string;

  likedCount: number;
  commentCount: number;

  likes: PaginatedTimeline<UserLike>;
  comments: PaginatedTimeline<UserComment>;
}

/* ---------- API wrappers ---------- */

export type ApiOk<T> = {
  ok: true;
  data: T;
};

export type ApiError = {
  ok: false;
  error: string;
};

export type ApiResponse<T> = ApiOk<T> | ApiError;

/* ---------- getUserProfile ---------- */

export type GetUserProfileRequest = {
  action: "getUserProfile";
  email: string;
};

export type GetUserProfileResponse = ApiResponse<UserActivityProfile>;