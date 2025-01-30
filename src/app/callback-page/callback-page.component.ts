import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DepartmentService } from '../services/department.service';
import { Department } from '../data/french-departments';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';


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
  requestSubmitted: boolean = false;

  filteredDepartments: Department[] = [];
  showDepartmentsList: boolean = false;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private departmentService: DepartmentService) { }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value) {
        this.departmentService.searchDepartments(value)
          .subscribe(departments => {
            this.filteredDepartments = departments;
            this.showDepartmentsList = true;
          });
      } else {
        this.filteredDepartments = [];
        this.showDepartmentsList = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDepartmentInput(event: any) {
    this.searchSubject.next(event.target.value);
  }

  selectDepartment(department: Department) {
    this.departement = `${department.code} - ${department.name}`;
    this.showDepartmentsList = false;
  }
  
  onSubmit() {
    if (this.isFieldError()) return;
    
    // Ici, vous pourriez ajouter un service pour envoyer les données
    // par exemple vers une API ou un système de gestion des rappels
    console.log('Demande de rappel soumise:', {
      nom: this.name,
      prenom: this.surname,
      telephone: this.phone,
      departement: this.departement  || undefined,
      resume: this.summary  || undefined
    });

    this.requestSubmitted = true;
  }

  private isFieldError(): boolean {
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
}