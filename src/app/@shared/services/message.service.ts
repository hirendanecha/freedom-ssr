import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root',
})
export class MessageService {

    private baseUrl = environment.serverUrl + 'messages';

    constructor(private http: HttpClient) { }

    getMessages(obj: any): Observable<any> {
        return this.http.post(`${this.baseUrl}`, obj);
    }

}