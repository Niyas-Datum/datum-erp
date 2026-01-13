export interface ApiResponseDto<T> {
  isValid: boolean;
  exception: string | null;
  httpCode: number;
  data: T;
}