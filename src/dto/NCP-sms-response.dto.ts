import { AxiosResponse } from 'axios';

export class NCPSmsResposne {
  requestId: string;
  requestTime: string;
  statusCode: string;
  statusName: string;

  constructor(res: AxiosResponse) {
    const data = res.data;
    this.requestId = data.requestId;
    this.requestTime = data.requestTime;
    this.statusCode = data.statusCode;
    this.statusName = data.statusName;
  }
}
