import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    RouterLink,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  hoveredButton: string | null = null;
  
  showHoverText(button: string) {
    this.hoveredButton = button;
  }

  clearHoverText() {
    this.hoveredButton = null;
  }

  getHoverText(button: string): string {
    switch(button) {
      case 'callback':
        return "L'équipe de support informatique/métier vous recontacte dès que possible";
      case 'create':
        return "Vous pouvez créer un ticket pour signaler un incident, proposer une amélioration, ...";
      case 'list':
        return "Vous pouvez consulter vos tickets pour en suivre l'avancée";
      default:
        return '';
    }
  }
}
