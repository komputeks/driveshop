// lib/gas-types

export type ISODateString = string;
export type UUID = string;
export type Email = string;
export type Slug = string;
export type Url = string;

export type ApiOk<T = {}> = {
  ok: true;
} & T;

export type ApiError = {
  ok: false;
  error: string;
};

export type ApiResponse<T = {}> = ApiOk<T> | ApiError;

export type SheetName =
  | "items"
  | "events"
  | "users"
  | "errors"
  | "_cats";

export type EventType = "view" | "like" | "comment";


export interface ItemRow {
  id: UUID;
  name: string;
  cat1: string;
  cat2: string;
  cdn: Url;
  width: number;
  height: number;
  size: number;
  description: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  views: number;
  likes: number;
  comments: number;
  sig: string;
}


export interface EventRow {
  id: UUID;
  itemId: UUID;
  type: EventType;
  value: string;
  pageUrl: Url;
  userEmail: Email;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  deleted: boolean;
}

export interface UserRow {
  email: Email;
  name: string;
  photo: Url;
  createdAt: ISODateString;
  lastLogin: ISODateString;
}


export interface ErrorRow {
  time: ISODateString;
  jobId: string;
  itemId: UUID | "";
  message: string;
  stack: string;
}

export interface ItemWithSlug extends ItemRow {
  slug: Slug;
}

export interface LikedItemPreview {
  itemId: UUID;
  itemName: string;
  itemImage: Url;
  pageUrl: Url;
  likedAt: ISODateString;
}

export interface CommentedItemPreview {
  itemId: UUID;
  itemName: string;
  itemImage: Url;
  pageUrl: Url;
  comment: string;
  commentedAt: ISODateString;
  userImage: Url;
}


export interface UserActivityProfile {
  userEmail: Email;
  profilePic: Url;

  likedCount: number;
  commentCount: number;

  likes: {
    items: LikedItemPreview[];
    nextCursor: string | null;
    hasMore: boolean;
  };

  comments: {
    items: CommentedItemPreview[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}


export interface ItemsListParams {
  page?: number;
  limit?: number;
  cat1?: string;
  cat2?: string;
  search?: string;
}

export interface ItemsListPayload {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  items: ItemRow[];
}

export type ItemsListResponse = ApiResponse<ItemsListPayload>;

export interface ItemBySlugParams {
  slug: Slug;
}

export interface ItemBySlugPayload {
  item: ItemWithSlug;
}

export type ItemBySlugResponse = ApiResponse<ItemBySlugPayload>;


export interface CategoriesPayload {
  categories: string[];
}

export type CategoriesResponse = ApiResponse<CategoriesPayload>;

export interface ItemStatsPayload {
  stats: Partial<Record<EventType, number>>;
}

export type ItemStatsResponse = ApiResponse<ItemStatsPayload>;

export interface ItemEventsParams {
  itemId: UUID;
  type?: EventType;
}

export interface ItemEventWithUser extends EventRow {
  userName: string;
  userPhoto: Url;
}

export interface ItemEventsPayload {
  events: ItemEventWithUser[];
}

export type ItemEventsResponse = ApiResponse<ItemEventsPayload>;

export interface LoginRequest {
  email: Email;
  name?: string;
  photo?: Url;
}

export type LoginResponse = ApiResponse<{}>;

export interface EventUpsertRequest {
  itemId: UUID;
  type: EventType;
  value?: string;
  pageUrl?: Url;
  userEmail: Email;
}

export interface EventUpsertPayload {
  deduped?: boolean;
}

export type EventUpsertResponse = ApiResponse<EventUpsertPayload>;

export interface UserProfileParams {
  email: Email;
}

export type UserProfileResponse = ApiResponse<UserActivityProfile>;

export function isApiError<T>(
  res: ApiResponse<T>
): res is ApiError {
  return res.ok === false;
}

