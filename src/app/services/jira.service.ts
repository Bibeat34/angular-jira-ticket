import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JiraService {
  private apiUrl = '/jira-api/rest/api/3';
  private authToken = `${environment.jiraMail}:${environment.authToken}`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Basic ${btoa(this.authToken)}`,
      'Content-Type': 'application/json'
    });
  }

  createIssue(issueData: any): Observable<any> {
    console.log('Données envoyées à Jira:', JSON.stringify(issueData, null, 2));
    return this.http.post(`${this.apiUrl}/issue`, issueData, { headers: this.getHeaders() });
  }

  getIssues(projectKey: string): Observable<any> {
    const jql = `project = "${projectKey}" ORDER BY created DESC`;
    const params = new HttpParams()
      .set('jql', jql)
      .set('fields', 'key,summary,status,created,customfield_10067');

    return this.http.get(`${this.apiUrl}/search`, { 
      headers: this.getHeaders(),
      params: params
    });
  }
  /* getIssues(projectKey: string): Observable<any> {
    const jql = encodeURIComponent(`project=${projectKey} ORDER BY created DESC`);
    return this.http.get(`${this.apiUrl}/search?jql=${jql}`, { headers: this.getHeaders() });
  } */


    getIssue(issueKey: string): Observable<any> {
      return this.http.get(`${this.apiUrl}/issue/${issueKey}`, { headers: this.getHeaders() });
    }  
  /* getIssue(issueKey: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/issue/${issueKey}`);
  } */
}
