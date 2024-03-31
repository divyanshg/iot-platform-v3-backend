export default class ApiResponse<T> {
  private code: number;
  private message: string;
  public data: T | unknown;

  constructor(code: number, message: string, data: T | unknown) {
    this.code = code;
    this.message = message;
    this.data = data;
  }
}
