// department.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {Department, FRENCH_DEPARTMENTS } from '../data/french-departments'
import { Region, FRENCH_REGIONS } from '../data/french-regions';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private departments: Department[] = FRENCH_DEPARTMENTS;

  searchDepartments(query: string): Observable<Department[]> {
    const normalizedQuery = query.toLowerCase().trim();
    return of(this.departments).pipe(
      map(departments => departments.filter(dept => 
        dept.code.toLowerCase().includes(normalizedQuery) || 
        dept.name.toLowerCase().includes(normalizedQuery)
      ))
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private regions: Region[] = FRENCH_REGIONS;

  searchRegions(query: string): Observable<Region[]> {
    const normalizedQuery = query.toLowerCase().trim();
    return of(this.regions).pipe(
      map(regions => regions.filter(region => 
        region.code.includes(normalizedQuery) || 
        region.name.toLowerCase().includes(normalizedQuery)
      ))
    );
  }
}