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
    takeUntilDestroyed
    this.jiraService.getIssue(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          console.log(data)
          this.ticket = data;
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

  
  addComment() {
    if (!this.newComment.trim()) return;
    
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
  
   // console.log('Adding comment to ticket:', this.ticket.key);
   // console.log('Comment body:', JSON.stringify(commentBody, null, 2));
    
    this.addingComment = true;
    this.jiraService.addComment(this.ticket.key, commentBody).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
         // console.log('Comment added successfully:', response);
          if (!this.ticket.fields.comment) {
            this.ticket.fields.comment = { comments: [] };
          }
          this.ticket.fields.comment.comments.push(response);
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
}





/*addComment() {
  if (this.ticket.key && this.newComment) {
    this.jiraService.addComment(this.ticket.key, this.newComment).subscribe(
      response => {
        console.log('Commentaire ajouté avec succès', response);
        // Réinitialisez le champ de commentaire après l'ajout
        this.newComment = '';
      },
      error => {
        console.error('Erreur lors de l\'ajout du commentaire', error);
      }
    );
  } else {
    console.warn('ID du ticket et texte du commentaire doivent être fournis');
  }
} */  
/* addComment(): void {
  if (!this.newComment.trim()) {
    return; // Ne pas permettre l'ajout de commentaires vides
  }

  this.addingComment = true;

  const commentData = {
    body: this.newComment
  };

  this.jiraService.addComment(this.ticket.id, commentData).subscribe({
    next: (response) => {
      // Commentaire ajouté avec succès
      this.ticket.fields.comment.comments.push(response);
      this.newComment = '';
    },
    error: (err) => {
      console.error('Failed to add comment', err);
      this.error = 'Failed to add comment';
    },
    complete: () => {
      this.addingComment = false;
    }
  });
} */