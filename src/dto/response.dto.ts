export class ResponseDto {
  status: number;
  message: string;
  data: object;
  error: boolean;
  code: string;

  constructor(
    status: number,
    code: string,
    error: boolean,
    message?: string,
    data?: object,
  ) {
    this.status = status;
    this.code = code;
    this.error = error;
    this.message = message || '';
    this.data = data || undefined;
  }

  setStatus(status: number): void {
    this.status = status;
  }

  setMessage(message: string): void {
    this.message = message;
  }

  setData(data: object): void {
    this.data = data;
  }

  setCode(code: string): void {
    this.code = code;
  }

  setError(error: boolean): void {
    this.error = error;
  }
}
