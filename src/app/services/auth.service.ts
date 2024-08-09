import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usersUrl = '../../users.json';
  private isAuthenticated = false;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.get<{ users: any[] }>(this.usersUrl).pipe(
      map(response => {
        const user = response.users.find(u => u.email === email && u.password === password);
        if (user) {
          this.isAuthenticated = true;
          // Stocker l'utilisateur dans le stockage local pour la session (optionnel)
          localStorage.setItem('user', JSON.stringify(user));
          return of(user); // Retourne l'utilisateur en tant qu'Observable
        } else {
          return throwError(() => new Error('Invalid credentials'));
        }
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('An error occurred during login'));
      })
    );
  }

  logout(): void {
    this.isAuthenticated = false;
    localStorage.removeItem('user'); // Supprime l'utilisateur du stockage local
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated || !!localStorage.getItem('user');
  }
}
