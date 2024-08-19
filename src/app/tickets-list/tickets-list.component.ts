import { Component, OnInit, OnDestroy } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Subject, Subscription, takeUntil } from 'rxjs';
import environment from '../../env.json';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss'
})
export class TicketsListComponent implements OnInit, OnDestroy {
  issues: any[] = [];
  sortedIssues: any[] = [];
  loading = true;
  error: string | null = null;
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  sortEtat: 'Terminé(e)' | 'À faire' | 'Revue en cours' | 'Tous' = 'Tous'; 
  sortName: string | null = null;

  descriptionLoading = false;
  hoveredTicket: any = null;
  hoveredTicketDescription: any = null;
  private currentDescriptionSubscription$: Subscription | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private jiraService: JiraService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadIssues();
  }

  ngOnDestroy() {
    console.log("unsubscribe getIssues")
    this.destroy$.next();
    this.destroy$.complete();
    if (this.currentDescriptionSubscription$) {
      this.currentDescriptionSubscription$.unsubscribe();
    }
  }

  loadIssues() {
      this.jiraService.getIssues(environment.issueType, environment.jiraProjectKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
    this.sortIssues();
  }
 
  applyFilters() {
    this.sortedIssues = this.issues.filter(issue => {
      const nameMatch = this.sortName ? 
        issue.fields.customfield_10067?.toLowerCase().includes(this.sortName.toLowerCase()) : 
        true;
      const statusMatch = this.sortEtat === 'Tous' || issue.fields.status.name === this.sortEtat;
      return nameMatch && statusMatch;
    });
    
    this.sortIssues();
  }
  
  onSortNameChange() {
    this.applyFilters();
  }
  
  printIt(issue: any): boolean {
    if (this.sortEtat !== 'Tous' && issue.fields.status.name !== this.sortEtat) {
      return false;
    }
    if (this.sortName && !issue.fields.customfield_10067) {
      return false;
    }
    return true;
  }

  showDescription(issue: any) {
    if(this.hoveredTicket !== issue) {
      this.hoveredTicket = issue;
      this.hoveredTicketDescription = null;
      this.loadTicketDescription(issue.key);
    }
  }

  hideDescription() {
    this.hoveredTicket = null;
    this.hoveredTicketDescription = null;
    if (this.currentDescriptionSubscription$) {
      this.currentDescriptionSubscription$.unsubscribe();
      this.currentDescriptionSubscription$ = null;
    }
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
  
  showTicket(ticketId: string) {
    this.hideDescription();
    this.router.navigate(['/ticket-list', ticketId]);
  }
  





  
  
  private loadTicketDescription(ticketKey: string) {
    if (this.currentDescriptionSubscription$) {
      this.currentDescriptionSubscription$.unsubscribe();
    }

    this.currentDescriptionSubscription$ = this.jiraService.getIssue(ticketKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.hoveredTicketDescription = this.parseDescription(data);
        },
        error: (err) => {
          console.error('Error loading ticket:', err);
          this.hoveredTicketDescription = this.sanitizer.bypassSecurityTrustHtml('Failed to load description.');
        }
      });
  }
    
  private sortIssues() {
    const column = this.sortColumn;
    if (!column) return;
    
    this.sortedIssues.sort((a, b) => {
      let valueA: any;
      let valueB: any;    
      
      switch (column) {
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

  private parseDescription(issueData: any): SafeHtml {
    const description = issueData.fields?.description;
    if (!description) {
      return this.sanitizer.bypassSecurityTrustHtml('No description available');
    }
    
    if (typeof description === 'string') {
      return this.sanitizer.bypassSecurityTrustHtml(description);
    }
    
    if (description.content) {
      const htmlContent = this.parseAtlassianDocument(description);
      return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
    }

    return this.sanitizer.bypassSecurityTrustHtml('Invalid description format');
  }
  
  private parseAtlassianDocument(document: any): string {
    let htmlContent = '';
    for (const contentItem of document.content) {
      if (contentItem.type === 'paragraph') {
        htmlContent += '<p>';
        for (const textItem of contentItem.content) {
          if (textItem.type === 'text') {
            htmlContent += textItem.text;
          }
        }
        htmlContent += '</p>';
      }
    }
    return htmlContent;
  }

}

