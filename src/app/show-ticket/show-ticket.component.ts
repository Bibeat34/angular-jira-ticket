import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JiraService } from '../services/jira.service';
import { NgIf } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-show-ticket',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './show-ticket.component.html',
  styleUrl: './show-ticket.component.scss'
})
export class ShowTicketComponent implements OnInit {
  ticket: any;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private jiraService: JiraService,
    private sanitazer: DomSanitizer,
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

  loadTicket(id: string) {
    this.jiraService.getIssue(id).subscribe({
      next: (data) => {
        this.ticket = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load ticket. Please try again later.';
        this.loading = false;
        console.error('Error loading ticket:', err);
      }
    });
  }

  getDescription(): SafeHtml {
    if (this.ticket && this.ticket.fields && this.ticket.fields.description) {
      if (typeof this.ticket.fields.description === 'string') {
        return this.sanitazer.bypassSecurityTrustHtml(this.ticket.fields.description);
      } else if (this.ticket.fields.description.content) {
        // Traitement pour le format Atlassian Document
        let htmlContent = '';
        for (const contentItem of this.ticket.fields.description.content) {
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
        return this.sanitazer.bypassSecurityTrustHtml(htmlContent);
      }
    }
    return '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}