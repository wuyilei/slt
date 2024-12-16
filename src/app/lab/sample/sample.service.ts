import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({ providedIn: 'root' })
export class SampleService {

  constructor(private http: HttpClient) {

  }

  getSampleData(): Observable<any> {
    return this.http.get<any>('assets/test_data/sample.json');
  }

  downloadTemplate(): Observable<Blob> {
    let url = "assets/tpl/sample_template.xlsx";
    return this.http.get(url, { responseType: 'blob' });
  }
}
