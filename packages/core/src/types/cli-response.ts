export interface Warning {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CliResponse<T = unknown> {
  success: boolean;
  data?: T;
  warnings?: Warning[];
  error?: ErrorPayload;
}
