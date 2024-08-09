import { Component, NgModule } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CreateIssueComponent } from './create-ticket/create-ticket.component';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CreateIssueComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ticketToJira';
}
