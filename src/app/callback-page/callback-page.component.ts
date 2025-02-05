import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DepartmentService, RegionService } from '../services/department.service';
import { Department } from '../data/french-departments';
import { Region } from '../data/french-regions';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, firstValueFrom } from 'rxjs';
import { JiraService } from '../services/jira.service';

import environment from '../../env.json'


@Component({
  selector: 'app-callback-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
  ],
  templateUrl: './callback-page.component.html',
  styleUrls: ['./callback-page.component.scss']
})
export class CallbackPageComponent {
  surname: string = '';
  name: string = '';
  phone: string = '';
  departement: string = '';
  summary: string = '';
  errorMessage: string = '';
  ticketCreated: boolean = false;

  selectedOption: string = 'departments';
  filteredDepartments: Department[] = [];
  showList: boolean = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private departmentService: DepartmentService,
    private regionService: RegionService,
    private jiraService: JiraService,) { }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value) {
        if (this.selectedOption === 'departments') {
          this.departmentService.searchDepartments(value)
            .subscribe(departments => {
              this.filteredDepartments = departments;
              this.showList = true;
            });
          } else {
            this.regionService.searchRegions(value)
              .subscribe(regions => {
                this.filteredDepartments = regions;
                this.showList = true;
              });
            }
        } else {
          this.filteredDepartments = [];
          this.showList = false;
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async onSubmit() {
    const hasError = await this.isFieldError();
    if (hasError) return;

    console.log('Demande de rappel soumise:', {
      nom: this.name,
      prenom: this.surname,
      telephone: this.phone,
      departement: this.departement  || undefined,
      resume: this.summary  || undefined
    });

    const issueData = this.setIssueData()

    this.jiraService.createIssue(issueData).subscribe({
      next: (response) => {
        this.ticketCreated = true;
        
      },  
      error: (error) => {        
        console.error('Erreur', error);
        if (error.error && error.error.errors) {
          console.error("Détails de l'erreur:", error.error.errors);
        }
      }
    });
    
  }
  
  onDepartmentInput(event: any) {
    this.searchSubject.next(event.target.value);
  }
  
  selectDepartment(department: Department) {
    this.departement = `${department.code} - ${department.name}`;
    this.showList = false;
  }  
  
  onDepartmentBlur() {
    // On attend un peu avant de cacher la liste pour permettre le clic sur un élément
    console.log ("filteredDepartments.length : ", this.filteredDepartments.length)
    setTimeout(() => {
      this.showList = false;
    }, 500);
    if (this.filteredDepartments.length == 1){
      this.departement = `${this.filteredDepartments[0].code} - ${this.filteredDepartments[0].name}`;
    }    
  }

  private async isFieldError(): Promise<boolean> {
    this.errorMessage = '';
    this.name = this.capitalizeFirstLetter(this.name.trim());
    this.surname = this.capitalizeFirstLetter(this.surname.trim());
    
    if (!this.name) {
      this.errorMessage = ' Nom,';
    }
    if (!this.surname) {
      this.errorMessage += ' Prénom,';
    }
    if (!this.phone.trim()) {
      this.errorMessage += ' Numéro de téléphone,';
    } else if (!this.isValidPhone(this.phone.trim())) {
      this.errorMessage = ' Numéro de téléphone invalide (format: 0634152849 ou +33634152849)';
      return true;
    }

    if (this.departement) {
      const formatRegex = /^\d{2,3}\s-\s/;
    if (!formatRegex.test(this.departement)) {
      if(this.selectedOption === "departments" ){        
        this.errorMessage = ' Le département n\'est pas valide';
      } else {
        this.errorMessage = ' La région n\'est pas valide';
      }
        return true;
      }
    }
    
    if (this.errorMessage) {
      this.errorMessage = `Vous devez renseigner votre${this.errorMessage}`;
      return true;
    }
    return false;
  }

  private isValidPhone(phone: string): boolean {
    // Accepte les formats: 0634152849 ou +33634152849
    const phoneRegex = /^(\+33|0)[1-9](\d{8})$/;
    return phoneRegex.test(phone);
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private setIssueData() {
    const data = {
      fields: {
        project: {
          key: environment.jiraProjectKey
        },
        [`customfield_${environment.champNom}`] : this.name + " " + this.surname,
        [`customfield_${environment.champOrigine}`] : this.departement,
        [`customfield_${environment.champTelephone}`]: this.phone,
        summary: "Demande de Rappel",
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: this.summary.trim(),
                }
              ]
            }
          ]
        },
        issuetype: {
          name: environment.issueRappel
        }
      }
    }
    return data
  }  
}