import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class JiraService {
  private apiUrl = '/jira-api/rest/api/3';
  private authToken = 'your@email.com:your-token';

  constructor(private http: HttpClient) { }

  createIssue(issueData: any): Observable<any> {
    console.log('Données envoyées à Jira:', JSON.stringify(issueData, null, 2));
    const headers = new HttpHeaders({
      'Authorization': `Basic ${btoa(this.authToken)}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/issue`, issueData, { headers });
  }
}
