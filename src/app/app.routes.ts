import { Routes } from '@angular/router';
import { CreateTicketComponent } from './create-ticket/create-ticket.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { TicketsListComponent } from './tickets-list/tickets-list.component';
import { ShowTicketComponent } from './show-ticket/show-ticket.component';

export const routes: Routes = [
    {
      path: '',
      component: LandingPageComponent 
    },
    {
      path: 'create-ticket',
      component: CreateTicketComponent 
    },
    {
      path: 'ticket-list',
      component: TicketsListComponent
    },
    {
      path: 'ticket-list/:id',
      component: ShowTicketComponent
    },
    {
      path: '**',
      redirectTo: '' // Redirige vers la page de login si le chemin n'existe pas
    }
  ];
