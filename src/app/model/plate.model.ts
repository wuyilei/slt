import { Moment } from 'moment';

export class Plate {
  constructor(
    public id?: number,
    public name?: string,
    public serial?: string,
    public sample_num?: number,
    public type?: string,
    public status?: string,
    public time?: Moment,
) {
  }
}
