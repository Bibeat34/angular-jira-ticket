import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs';
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

    /* addComment(issueKey: string, commentBody: any): Observable<any> {
      const url = `${this.apiUrl}/issue/${issueKey}/comment`;
      console.log('Sending request to:', url);
      console.log('With headers:', this.getHeaders());
      console.log('With body:', JSON.stringify(commentBody, null, 2));
  
      return this.http.post(url, commentBody, { 
        headers: this.getHeaders(),
        observe: 'response'
      }).pipe(
        tap(response => console.log('Full response:', response)),
        catchError(this.handleError)
      );
    }
    
    private handleError(error: HttpErrorResponse) {
      console.error('An error occurred:', error);
      if (error.error instanceof ErrorEvent) {
        console.error('Client-side error:', error.error.message);
      } else {
        console.error(`Backend returned code ${error.status}, body was:`, error.error);
      }
      return throwError(() => new Error('Something bad happened; please try again later.'));
    }*/
}
 