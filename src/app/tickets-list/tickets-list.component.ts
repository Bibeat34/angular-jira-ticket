import { Component, OnInit } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { environment } from '../environments/environment';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [
    FormsModule,
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
  sortEtat: 'Terminé(e)' | 'À faire' | 'Revue en cours' | 'Tous' = 'Tous'; 
  sortName: string | null = null;
  doPrint: boolean = false;


  constructor(
    private jiraService: JiraService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadIssues();
  }

  loadIssues() {
    this.jiraService.getIssues(environment.issueType ,environment.jiraProjectKey).subscribe({
      next: (data) => {
        this.issues = data.issues;
        //console.log(this.issues[1].fields.status.name);
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
          valueA = (a.fields.customfield_10067 || '').toUpperCase();
          valueB = (b.fields.customfield_10067 || '').toUpperCase();
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

  
  applyFilters() {
    this.sortedIssues = this.issues.filter(issue => {
      const nameMatch = this.sortName ? 
      issue.fields.customfield_10067.toLowerCase().includes(this.sortName.toLowerCase()) : 
      true;
      const statusMatch = this.sortEtat === 'Tous' || issue.fields.status.name === this.sortEtat;
      return nameMatch && statusMatch;
    });
    
    if (this.sortColumn) {
      this.sortIssues(this.sortColumn);
    }
  }

  onSortNameChange() {
    this.applyFilters();
  }
  
  
  printIt(issue: any): boolean {
    this.doPrint = false;
    let test1 = false;
    let test2= false;  
    if (this.sortEtat != "Tous") {
      if (issue.fields.status.name === this.sortEtat) {test1=true}
    }else {test1 = true}
    if (this.sortName != null) {
      if (issue.fields.customfield_10067) {test2=true}
    }else {test2=true}

    if (test1 && test2) {this.doPrint = true}
    return this.doPrint
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  showTicket(ticketId: string) {
    this.router.navigate(['/ticket-list', ticketId]);
  }
}
