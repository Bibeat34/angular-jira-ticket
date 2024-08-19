import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JiraService } from '../services/jira.service';
import { NgFor} from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-show-ticket',
  standalone: true,
  imports: [
    NgFor,
    FormsModule,
    RouterLink
  ],
  templateUrl: './show-ticket.component.html',
  styleUrl: './show-ticket.component.scss'
})
export class ShowTicketComponent implements OnInit, OnDestroy {
  ticket: any;
  loading = true;
  error: string | null = null;
  newComment: string = "";
  addingComment: boolean = false;
  sortedComments: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private jiraService: JiraService,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicket(ticketId);
    } else {
      this.error = 'No ticket ID provided';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    console.log("unsubscribe")
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicket(id: string) {
    this.loading = true;
    this.error = null;
    this.jiraService.getIssue(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          console.log(data)
          this.ticket = data;
          this.sortComments();
          this.loading = false;
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error loading ticket:', err);
          this.error = 'Failed to load ticket. Please try again later.';
          this.loading = false;
        });
      }
    });
  }

  getDescription(): SafeHtml {
    if (this.ticket?.fields?.description) {
      if (typeof this.ticket.fields.description === 'string') {
        return this.sanitizer.bypassSecurityTrustHtml(this.ticket.fields.description);
      } else if (this.ticket.fields.description.content) {
        // Traitement pour le format Atlassian Document
        const htmlContent = this.parseAtlassianDocument(this.ticket.fields.description);
        return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
      }
    }
    return '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString( 'fr-FR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    } );
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getCommentBody(comment: any): SafeHtml {
    if (comment?.body) {
      if (typeof comment.body === 'string') {
        return this.sanitizer.bypassSecurityTrustHtml(comment.body);
      } else if (comment.body.content) {
        // Traitement pour le format Atlassian Document
        const htmlContent = this.parseAtlassianDocument(comment.body);
        return this.sanitizer.bypassSecurityTrustHtml(htmlContent);
      }
    }
    return '';
  }

  sortComments() {
    if (this.ticket?.fields?.comment?.comments) {
      this.sortedComments = [...this.ticket.fields.comment.comments].sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );
    }
  } 
  
  addComment() {
    if (!this.newComment.trim()) return;
    
    const commentBody = this.setCommentBody()  
    this.addingComment = true;
    
    this.jiraService.addComment(this.ticket.key, commentBody).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
         if (!this.ticket.fields.comment) {
            this.ticket.fields.comment = { comments: [] };
          }
          this.ticket.fields.comment.comments.push(response);
          this.sortComments();
          this.newComment = '';
          this.error = null;

          this.loadTicket(this.ticket.key);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error adding comment:', err);
          this.error = `Échec de l'ajout du commentaire: ${err.message}`;
        });
      },
      complete: () => {
        this.ngZone.run(() => {
          this.addingComment = false;
        });
      }
    });
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

  private setCommentBody() {
    const commentBody = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: this.newComment
              }
            ]
        }] 
      }
    };
    return commentBody
  }
}