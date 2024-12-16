import { Sample } from "./sample.model";

export class Well {
  constructor(
    public serial?: string,
    public seat: number = -1,
    public coordinate: string = '',
    public occupied: boolean = false,
    public selected: boolean = false,
    public data_id?: number,
    public status?: string,
    public plate_id?: number,
    public sample?: Sample,
  ) {
  }
}
