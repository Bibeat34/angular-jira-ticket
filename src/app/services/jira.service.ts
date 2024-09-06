import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, expand, reduce, EMPTY } from 'rxjs';

import environment from '../../env.json';

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
    return this.http.post(`${this.apiUrl}/issue`, issueData, { headers: this.getHeaders() });
  }

  attachFile(issueId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers = new HttpHeaders({
      'X-Atlassian-Token': 'no-check',
      'Authorization': `Basic ${btoa(this.authToken)}`
    });

    return this.http.post(`${this.apiUrl}/issue/${issueId}/attachments`, formData, { 
      headers: headers,
      reportProgress: true
    });
  }

  getAllIssues(issueType: string, projectKey: string): Observable<any[]> {
    const jql = `type = "${issueType}" AND project = "${projectKey}" ORDER BY created ASC`;
    const fields = `key,summary,status,created,customfield_${environment.champNom}`;

    return this.getIssuesPage(jql, fields, 0).pipe(
      expand(response => response.total > response.startAt + response.maxResults ?
        this.getIssuesPage(jql, fields, response.startAt + response.maxResults) :
        EMPTY
      ),
      reduce((acc, response) => [...acc, ...response.issues], [] as any[])
    );
  }

  getIssue(issueKey: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/issue/${issueKey}`, { headers: this.getHeaders() })
    .pipe(
      map(response => {
        return response;
      })
    );
  }  
    
  addComment(issueId: string, comment: any): Observable<any> {
    const url = `${this.apiUrl}/issue/${issueId}/comment`;
    
    return this.http.post(url, comment, { 
      headers: this.getHeaders(),
      observe: 'response'
     });
  }  

  getAttachment(attachmentId: string): Observable<Blob> {
    const url = `${this.apiUrl}/attachment/content/${attachmentId}`;
    return this.http.get(url, {
      headers: new HttpHeaders({
        'Authorization': `Basic ${btoa(this.authToken)}`
      }),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        return new Blob([response.body as BlobPart], { type: contentType });
      })
    );
  }

  private getIssuesPage(jql: string, fields: string, startAt: number): Observable<any> {
    const params = new HttpParams()
      .set('jql', jql)
      .set('fields', fields)
      .set('startAt', startAt.toString())
      .set('maxResults', '100');  // Augmentez cette valeur si nécessaire, max 100 pour Jira Cloud

    return this.http.get(`${this.apiUrl}/search`, {
      headers: this.getHeaders(),
      params: params
    });
  }
}
 