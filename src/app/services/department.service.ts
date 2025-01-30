// department.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {Department, FRENCH_DEPARTMENTS } from '../data/french-departments'

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private departments: Department[] = FRENCH_DEPARTMENTS;

  searchDepartments(query: string): Observable<Department[]> {
    const normalizedQuery = query.toLowerCase().trim();
    return of(this.departments).pipe(
      map(departments => departments.filter(dept => 
        dept.code.includes(normalizedQuery) || 
        dept.name.toLowerCase().includes(normalizedQuery)
      ))
    );
  }
}