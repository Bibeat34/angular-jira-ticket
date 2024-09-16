import { Component, OnInit, OnDestroy } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { Subject, Subscription, takeUntil, timer } from 'rxjs';
import environment from '../../env.json';
import proxyConf from '../../../proxy.conf.json'

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss'
})
export class TicketsListComponent implements OnInit, OnDestroy {
  loading = true;
  errorMessage: string | null = null;

  page: number = 1;
  issueByPage: number = 20;
  pageMax: number = 1;
  
  issues: any[] = [];
  sortedIssues: any[] = [];
  issuesToShow: any[] = [];
  
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  sortEtat: string = 'Tous';
  availableStatuses: string[] = ['Tous']; 
  sortName: string | null = null;

  hoveredTicket: SafeHtml | null = null;
  hoveredTicketDescription: SafeHtml | null = null;
  private hoverTimer: Subscription | null = null;
  private currentDescriptionSubscription$: Subscription | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private jiraService: JiraService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadAllIssues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.currentDescriptionSubscription$) {
      this.currentDescriptionSubscription$.unsubscribe();
    }
    if (this.hoverTimer) {
      this.hoverTimer.unsubscribe();
    }
  }

  loadAllIssues() {
    this.loading = true;
    this.errorMessage = null;
    this.jiraService.getAllIssues(environment.issueType, environment.jiraProjectKey)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (issues) => {
          this.issues = issues;
          this.extractUniqueStatuses();
          this.sortedIssues = [...this.issues];
          this.sortBy('created');
          this.pageMax = this.setPageMax();
          this.loading = false;
        },
        error: (error) => {
          this.getErrorMessage(error.status);
          this.loading = false;
          console.error('Error loading issues:', error);
        }
      });
  }

  private extractUniqueStatuses() {
    const statusSet = new Set(this.issues.map(issue => issue.fields.status.name));
    this.availableStatuses = ['Tous', ...Array.from(statusSet).sort()];
  }

  issuesByPage() {
    this.issuesToShow = [];
    for (let i = 0; i < this.sortedIssues.length; i++) {
      if ( i >= (this.page * this.issueByPage) - this.issueByPage  && i < this.page * this.issueByPage )
        this.issuesToShow.push(this.sortedIssues[i])
    }
  }

  nextPage() {
    this.page++
    this.issuesByPage()
  }

  previousPage() {
    this.page--
    this.issuesByPage()
  }
  

  sortBy(column: string) {
    this.sortColumn = column;
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortIssues();
    this.issuesByPage()
  }  
  
  onSortChange() {
    this.applyFilters();
    this.page = 1;
    this.pageMax = this.setPageMax()
    this.issuesByPage()  
  }
  
  showDescription(issue: any) {
    if (this.hoverTimer) {
      this.hoverTimer.unsubscribe();
    }
    this.hoverTimer = timer(500).subscribe(() => {
      if (this.hoveredTicket !== issue) {
        this.hoveredTicket = issue;
        this.hoveredTicketDescription = null;
        this.loadTicketDescription(issue.key);
      }
    });
  }

  hideDescription() {
    if (this.hoverTimer) {
      this.hoverTimer.unsubscribe();
    }
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
  
  getName(issueFields: any): string {
    let name = issueFields[`customfield_${environment.champNom}`]
    if (!name) {
      name = issueFields.creator.displayName
      if (!name) return ""
    }
    return name
  } 



  
  showTicket(ticketId: string) {
    this.hideDescription();
    this.router.navigate(['/ticket-list', ticketId]);
  }
  





  
  
 private setPageMax(): number {
  let max = Math.floor(this.sortedIssues.length / this.issueByPage);
  if (this.sortedIssues.length > this.issueByPage && this.sortedIssues.length % this.issueByPage != 0) {
    max += 1
  }
  if (max === 0) {max = 1}
  return max;
 }

  private applyFilters() {
    this.sortedIssues = this.issues.filter(issue => {
      const searchTerm = this.sortName ? this.sortName.toLowerCase() : '';
      const nameMatch = issue.fields.customfield_10067?.toLowerCase().includes(searchTerm);
      const titleMatch = issue.fields.summary.toLowerCase().includes(searchTerm);
      const keyMatch = issue.key.toLowerCase().includes(searchTerm);
      const statusMatch = this.sortEtat === 'Tous' || issue.fields.status.name === this.sortEtat;
      return (nameMatch || titleMatch || keyMatch) && statusMatch;
    });
    
    this.sortIssues();
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

  private getErrorMessage(errorStatus: number): void {
    this.errorMessage = "Les tickets n'ont pas pu être chargé.";
          if (errorStatus === 404){
            this.errorMessage += ` Il a peut-être une erreur dans l'Url du proxy "${proxyConf['/jira-api'].target}."`
          }
          if (errorStatus === 400){
            this.errorMessage += ` Il y a peut-être une erreur dans:
                             le mail "${environment.jiraMail}",
                             la clé du projet "${environment.jiraMail}",
                             le type de ticket "${environment.jiraMail}"
                             ou dans le jeton d'API.`
          }
  }
}

