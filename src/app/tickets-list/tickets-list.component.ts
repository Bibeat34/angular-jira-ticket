import { NgClass, NgIf, UpperCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { environment } from '../environments/environment';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    RouterLink,
  ],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss'
})
export class TicketsListComponent implements OnInit {
  issues: any[] = [];
  sortedIssues: any[] = [];
  loading = true;
  error: string | null = null;
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private jiraService: JiraService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.jiraService.getIssues(environment.jiraProjectKey).subscribe({
      next: (data) => {
        this.issues = data.issues;
        this.sortedIssues = [...this.issues];
        this.sortBy('reporter');
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load issues. Please try again later.';
        this.loading = false;
        console.error('Error loading issues:', err);
      }
    });
  }

  sortBy(column: string) {
    this.sortColumn = column;
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortIssues(column);
     
    
  }

  private sortIssues(column: string) {  
    this.sortedIssues.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
     

      switch (column) {
        /* case 'key':
          valueA = a.key;
          valueB = b.key;
          break;
        case 'summary':
          valueA = a.fields.summary;
          valueB = b.fields.summary;
          break; */
        case 'reporter':

          let afieldUpperCase: string = a.fields.customfield_10067;
          let bfieldUpperCase: string = b.fields.customfield_10067;
          bfieldUpperCase.toUpperCase();
          afieldUpperCase.toUpperCase();
          valueA = afieldUpperCase;
          valueB = bfieldUpperCase;
          break;
        case 'status':
          valueA = a.fields.status.name;
          valueB = b.fields.status.name;
          break;
        case 'created':
          valueA = new Date(a.fields.created).getTime();
          valueB = new Date(b.fields.created).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  showTicket(ticketId: string) {
    this.router.navigate(['/ticket-list', ticketId]);
  }
}
