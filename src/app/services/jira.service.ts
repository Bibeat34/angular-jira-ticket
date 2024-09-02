import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

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
    //console.log('Données envoyées à Jira:', JSON.stringify(issueData, null, 2));
    return this.http.post(`${this.apiUrl}/issue`, issueData, { headers: this.getHeaders() });
  }

  attachFile(issueId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const headers = new HttpHeaders({
      'X-Atlassian-Token': 'no-check',
      'Authorization': `Basic ${btoa(this.authToken)}`
    });

    // Ne pas définir le Content-Type ici, laissez Angular le faire automatiquement
    return this.http.post(`${this.apiUrl}/issue/${issueId}/attachments`, formData, { 
      headers: headers,
      // Ajoutez cette option pour voir les détails de la progression
      reportProgress: true
    });
  }

  getIssues(issueType: string, projectKey: string): Observable<any> {
    const jql = `type = "${issueType}" AND project = "${projectKey}" ORDER BY created DESC`;
    const params = new HttpParams()
      .set('jql', jql)
      .set('fields', `key,summary,status,created,customfield_${environment.champNom}`);
      //subscribe pour essayer de récup une erreur sur le type ou la clé
    return this.http.get(`${this.apiUrl}/search`, { 
      headers: this.getHeaders(),
      params: params
    });
  }

  getIssue(issueKey: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/issue/${issueKey}`, { headers: this.getHeaders() })
    .pipe(
      map(response => {
        //console.log('Raw API response:', response);
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
}
 