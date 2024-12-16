import { Moment } from 'moment';

export class Sample {
  constructor(
    public id?: number,
    public name?: string,
    public serial?: string,
    public board_serial?: string,
    public board_location?: string,
    public type?: string,
    public client_name?: string,
    public client_address?: string,
    public client_city?: string,
    public result?: string,
    public instrument?: string,
    public disease?: string,
    public report?: string,
    public code?: string,
    public amount?: number,
    public source?: string,
    public status?: string,
    public time?: Moment,
    ) {
  }
}
