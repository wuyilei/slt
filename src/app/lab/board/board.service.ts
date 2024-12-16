import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class BoardService {

  constructor(private http: HttpClient) {

  }

  getPlateData(): Observable<any> {
    return this.http.get<any>('assets/test_data/plate.json');
  }

}
