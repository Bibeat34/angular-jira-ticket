import { Component } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,    
  ],
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent {
  summary: string = 'Objet du ticket';
  description: string = 'Description du ticket';
  name: string = 'Yves';
  surname: string = "Rocher";
  mail: string = "pseudo@mail.com";

  constructor(private jiraService: JiraService) { }

  onSubmit() {
    this.name += " " + this.surname;
    const issueData = {
      fields: {
        project: {
          key: environment.jiraProjectKey
        },
        customfield_10067: this.name,
        customfield_10066: this.mail,
        summary: this.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: this.description,
                }
              ]
            }
          ]
        },
        issuetype: {
          name: "Bug"
        }
      }
    };

    this.jiraService.createIssue(issueData).subscribe({
      next: (response) => console.log('Ticket créé', response),
      error: (error) => {
        console.error('Erreur', error);
        if (error.error && error.error.errors) {
          console.error("Détails de l'erreur:", error.error.errors);
        }
      }
    });
  }
}