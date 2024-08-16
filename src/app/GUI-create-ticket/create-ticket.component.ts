import { Component } from '@angular/core';
import { JiraService } from '../services/jira.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
      target.value = '';
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
      this.previewX = event.clientX +10; // 10px de décalage par rapport au curseur
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

  onSubmit() {
    if (this.isFieldError()) {return} 
    
    const issueData = this.setIssueData()
    

    this.jiraService.createIssue(issueData).subscribe({
      next: (response) => {
        console.log('Ticket créé', response),
        this.ticketCreated = true;
        if (this.attachments.length > 0) {
          this.attachFiles(response.id);
        }
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


  private attachFiles(issueId: string) {
    this.attachments.forEach(file => {
      this.jiraService.attachFile(issueId, file).subscribe({
        next: (response) => {console.log('Fichier attaché', response)},
        error: (error) => {console.error('Erreur lors de l\'attachement du fichier', error)}
      });
    });
  }


  private isFieldError(): boolean {
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
        return true
      }
      return false
  }

  private setIssueData() {
    this.name += " " + this.surname;
    const data = {
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
          name: environment.issueType
        }
      }
    }
    return data
  }  
}
