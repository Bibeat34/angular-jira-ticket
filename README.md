# TicketToJira

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.4.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Modif a faire

Dans /src/app/services/jira.service.ts, il faut changé authToken et mettre le bon

## Idée(s) à ajouter:

*Pour éviter le vol d'identiter, envoyer un mail de confirmation d'envoi à l'email entrer dans le formulaire. Depuis jira si possible, sinon depuis l'app.
*Peu etre plus tard ajouter une fonction pour voir si l'email est présent dans la base de données, si non, refuser l'envoi du ticket.
*Ne pas afficher les tickets terminées, a part si on le demande
*Ajouter une sécurité pour ne pas pouvoir envoyer de champs vide dans le ticket
*Ajouter une fonction qui renvoit au menu, ou une page de confirmation, quand le ticket est envoyé
