import { Routes } from '@angular/router';
import { CreateIssueComponent } from './create-ticket/create-ticket.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    {
      path: '',
      component: LoginComponent // La page d'accueil redirige vers le LoginComponent
    },
    {
      path: 'create-ticket',
      component: CreateIssueComponent // Le chemin /create-ticket charge CreateTicketComponent
    },
    {
      path: '**',
      redirectTo: '' // Redirige vers la page de login si le chemin n'existe pas
    }
  ];
