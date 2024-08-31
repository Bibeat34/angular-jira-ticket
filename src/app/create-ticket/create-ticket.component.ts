import { Component } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import environment from '../../env.json'
import proxyConf from '../../../proxy.conf.json'

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
  summary: string = '';
  description: string = '';
  name: string = '';
  surname: string = "";
  mail: string = "";
  errorMessage: string = "";

  attachments: File[] = []
  previewFile: File | null = null;
  previewX: number= 0;
  previewY: number= 0;
  ticketCreated: boolean= false;

  constructor(
    private jiraService: JiraService,
    private sanitizer: DomSanitizer,
  ) { }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files) {
      const newFiles = Array.from(target.files);
      
      // Filtrer les fichiers en doublon
      const uniqueNewFiles = newFiles.filter(newFile => 
        !this.attachments.some(existingFile => 
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );

      // Ajouter les nouveaux fichiers uniques à la liste existante
      this.attachments = [...this.attachments, ...uniqueNewFiles];

      // Réinitialiser l'input file pour permettre la sélection du même fichier
      target.value = `${this.attachments.length}`;
    }
  }

  removeFile(file: File) {
    this.attachments = this.attachments.filter(f => f !== file);
  }

  showPreview(event: MouseEvent, file: File) {
    this.previewFile = file;
    this.updatePreviewPosition(event);
  }

  updatePreviewPosition(event: MouseEvent) {
    if (this.previewFile) {
      this.previewX = event.clientX +10;
      this.previewY = event.clientY +10;
    }
  }

  hidePreview() {
    this.previewFile = null;
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getFilePreviewUrl(file: File): SafeUrl {
    const url = URL.createObjectURL(file);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getFileIcon(file: File): string {
    // Retourne une icône en fonction du type de fichier
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    return '📎';
  }

  onNameInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = this.filterNonAlphabetic(inputElement.value);
    this.name = this.capitalizeFirstLetter(inputElement.value);
  }

  onSurnameInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = this.filterNonAlphabetic(inputElement.value);
    this.surname = this.capitalizeFirstLetter(inputElement.value);
  }

  onSubmit() {
    if (this.isFieldError()) {return} 
    
    const issueData = this.setIssueData()
    

    this.jiraService.createIssue(issueData).subscribe({
      next: (response) => {
        console.log('Ticket créé'),
        this.ticketCreated = true;
        if (this.attachments.length > 0) {
          this.attachFiles(response.id);
        }
      },  
      error: (error) => {        
        console.error('Erreur', error);
        this.updateErrorMessage(error.status)
        if (error.error && error.error.errors) {
          console.error("Détails de l'erreur:", error.error.errors);
        }
      }
    });
  }




  





  private attachFiles(issueId: string) {
    this.attachments.forEach(file => {
      this.jiraService.attachFile(issueId, file).subscribe({
        next: (response) => {console.log('Fichier attaché', response)},
        error: (error) => {
          this.errorMessage = "La ou les pièces jointes n'ont pas étaient envoyées"
          console.error('Erreur lors de l\'attachement du fichier', error)}
      });
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private filterNonAlphabetic(str: string): string {
    return str.replace(/[^a-zA-Z-]/g, '');
  }

  private isFieldError(): boolean {
    this.errorMessage = "";
    this.name = this.capitalizeFirstLetter(this.filterNonAlphabetic(this.name.trim()));
    this.surname = this.capitalizeFirstLetter(this.filterNonAlphabetic(this.surname.trim()));

      if (!this.name){
        this.errorMessage = " Nom,";

      } if (!this.surname){
        this.errorMessage += " Prénom,";

      } if (!this.mail.trim()){
        this.errorMessage += " Email,";
      } else if (!this.isValidEmail(this.mail.trim())) {
        this.errorMessage = " Email invalide (format: adresse@mail.com)";
        return true;

      } if (!this.summary.trim()){
        this.errorMessage += " l'Objet,";

      } if (!this.description.trim()){
        this.errorMessage += " la Description.";
      }
  
      if(this.errorMessage) {
        this.errorMessage = `Vous devez renseigner votre ${this.errorMessage}`
        return true
      }
      return false
  }

  private setIssueData() {
    const data = {
      fields: {
        project: {
          key: environment.jiraProjectKey
        },
        [`customfield_${environment.champNom}`] : this.name + " " + this.surname,
        [`customfield_${environment.champMail}`]: this.mail.trim(),
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
          name: environment.issueType
        }
      }
    }
    return data
  }  


  private updateErrorMessage(errNum: number): void{
    this.errorMessage = "Une erreur est survenue lors de la création du ticket.";

    if (errNum === 404)
      this.errorMessage += `  Il il a peut-être une erreur dans l'Url du proxy : ${proxyConf['/jira-api'].target}.`  
    if (errNum === 400)
      this.errorMessage += `  Il il a peut-être une erreur dans l'id d'un des champs perso.`  
    if (errNum === 401){
      this.errorMessage += ` Il y a peut-être une erreur dans le mail "${environment.jiraMail}" ou dans le jeton d'API.`
    }
    if (errNum === 403){
      this.errorMessage += `Il y a un problème avec les packages. Aller dans l'invite de commandes, placez-vous à la racine et entrer "npm install"`
    }
  }
}
