export interface IApiResponse<T> {
  success: boolean;
  meta?: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor: string;
  };
  data: T;
}
