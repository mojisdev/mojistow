export interface ApiError {
  path: string;
  status: number;
  message: string;
  timestamp: string;
}

export interface HonoEnv {
  Bindings: CloudflareBindings;
}
