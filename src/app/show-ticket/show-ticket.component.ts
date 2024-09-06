import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JiraService } from '../services/jira.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import environment from '../../env.json'

@Component({
  selector: 'app-show-ticket',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './show-ticket.component.html',
  styleUrl: './show-ticket.component.scss'
})
export class ShowTicketComponent implements OnInit, OnDestroy {
  ticket: any;
  loading = true;
  errorMessage: string | null = null;

  newComment: string = "";
  addingComment: boolean = false;
  sortedComments: any[] = [];

  _name!: string;
  _created!: string;
  _description!: SafeHtml;
  _attachments: any[] = [];
  _comments: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private jiraService: JiraService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.loadTicket(ticketId);
    } else {
      this.errorMessage = 'Aucun ticket trouvé';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicket(id: string) {
    this.loading = true;
    this.errorMessage = null;
    this.jiraService.getIssue(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.ticket = data;
        this.setData()
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ticket:', error);
        this.errorMessage = "Le ticket n'as pas pu charger. Réessayer plus tard.";
        this.loading = false;
      }
    });
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

  downloadAttachment(attachmentId: string, filename: string) {
    //console.log(`Téléchargement de la pièce jointe: ${filename} (ID: ${attachmentId})`);
    this.jiraService.getAttachment(attachmentId).subscribe({
      next: (blob: Blob) => {
        console.log(`Pièce jointe reçue, taille: ${blob.size} octets, type: ${blob.type}`);
        if (blob.size === 0) {
          console.error('La pièce jointe reçue est vide');
          this.errorMessage = `Erreur : La pièce jointe ${filename} est vide.`;
          return;
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      //  console.log(`Téléchargement de ${filename} initié`);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de la pièce jointe:', error);
        this.errorMessage = `Erreur lors du téléchargement de ${filename}. Veuillez réessayer.`;
      }
    });
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
    
    const commentBody = this.setCommentBody()  
    this.addingComment = true;
    this.sendingToJira(commentBody)   
  }
  
  
  
  private setData(): void {
    this._name = this.getName(this.ticket.fields);
    this._created = this.formatDate(this.ticket.fields.created);
    this._description = this.getDescription();
    this.getAttachments();
    this.sortComments();
  }
  
  private getName(issueFields: any): string {
    let name = issueFields[`customfield_${environment.champNom}`]
    if (!name) {
      return ""
    }
    return name
  }

  private getDescription(): SafeHtml {
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

  private getAttachments() {
    if (this.ticket.fields.attachment.length > 0) {
      let attachement;
      for( let attach of this.ticket.fields.attachment) {
          attachement = {
            id: attach.id,
            filename: attach.filename,
            size: this.formatFileSize(attach.size)
          }
          this._attachments.push(attachement)  
      };
    } 
  }

  private getComments() {
    let comment;
    for (let data of this.sortedComments) {
      comment = {
        author: data.author.displayName,
        body: this.getCommentBody(data),
        created: this.formatDate(data.created),
        id: data.id
      }
      this._comments.push(comment)
    }
  }

  private sortComments() {
    if (this.ticket?.fields?.comment?.comments) {
      this.sortedComments = [...this.ticket.fields.comment.comments].sort((a, b) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      );
      this.getComments()
    }
  } 

  private sendingToJira(commentBody: any): void {
    this.jiraService.addComment(this.ticket.key, commentBody).subscribe({
      next: (response) => {
          if (!this.ticket.fields.comment) {
            this.ticket.fields.comment = { comments: [] };
          }
          this.ticket.fields.comment.comments.push(response);
          this.reset()
          this.loadTicket(this.ticket.key);
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.errorMessage = `Échec de l'ajout du commentaire: ${err.message}`;
      },
    });
  }

  private reset(): void {
    this.newComment = '';
    this.errorMessage = null;
    this._attachments = [];
    this._comments = [];
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