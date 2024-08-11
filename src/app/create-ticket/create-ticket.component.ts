import { Component } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgIf,    
  ],
  templateUrl: './create-ticket.component.html',
  styleUrls: ['./create-ticket.component.scss']
})
export class CreateTicketComponent {
  summary: string = '';
  description: string = '';
  name: string = '';
  surname: string = "";
  mail: string = "";
  errorMessage: string = "";
  ticketCreated: boolean= false;

  constructor(private jiraService: JiraService) { }

  onSubmit() {
    this.errorMessage = ""
    if (!this.name.trim()){
      this.errorMessage = " Nom,";
    } if (!this.surname.trim()){
      this.errorMessage += " Prénom,";
    } if (!this.mail.trim()){
      this.errorMessage += " Email,";
    } if (!this.summary.trim()){
      this.errorMessage += " l'Objet,";
    } if (!this.description.trim()){
      this.errorMessage += " la Description.";
    }

    if(this.errorMessage) {
      this.errorMessage = `Vous devez renseigner votre ${this.errorMessage}`
      return}

    this.name += " " + this.surname;
    const issueData = {
      fields: {
        project: {
          key: environment.jiraProjectKey
        },
        customfield_10067: this.name,
        customfield_10066: this.mail.trim(),
        summary: this.summary.trim(),
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: this.description.trim(),
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
      next: (response) => {
        console.log('Ticket créé', response),
        this.ticketCreated = true;
        /* this.errorMessage = "Ticket créé avec succès!";  
        this.name = '';
        this.surname = '';
        this.mail = '';
        this.summary = '';
        this.description = ''; */
      },  
      error: (error) => {
        this.errorMessage = "Une erreur est survenue lors de la création du ticket.";
        console.error('Erreur', error);
        if (error.error && error.error.errors) {
          console.error("Détails de l'erreur:", error.error.errors);
        }
      }
    });
  }
}