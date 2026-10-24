# Journal d'activité — fonctions utilisateur journalisées

Chaque utilisation d'une fonction ci-dessous ajoute une ligne dans le journal (table `activity_logs` en PostgreSQL, mémoire sinon). Le journal est consultable par le responsable sur `GET /restaurant/admin/logs` et affiché dans l'espace responsable.

| Fonction utilisateur | Route | Action enregistrée | Détail enregistré | Qui |
| --- | --- | --- | --- | --- |
| Inscription | `POST /restaurant/members` | `MEMBER_REGISTERED` | « Nouveau membre inscrit » | Nouveau membre |
| Réserver une table | `POST /restaurant/reservations` | `RESERVATION_CREATED` | Identifiant de la réservation | Membre connecté |
| Annuler une réservation | `DELETE /restaurant/reservations/:id` | `RESERVATION_CANCELLED` | Identifiant de la réservation | Propriétaire de la réservation |
| Ajouter une table | `POST /restaurant/admin/tables` | `TABLE_CREATED` | « Table N ajoutée » | Responsable |
| Activer une table | `PATCH /restaurant/admin/tables/:id` (`active: true`) | `TABLE_ACTIVATED` | « Table N » | Responsable |
| Désactiver une table | `PATCH /restaurant/admin/tables/:id` (`active: false`) | `TABLE_DEACTIVATED` | « Table N » | Responsable |

## Non journalisées (volontairement)

- **Connexion** : elle se fait avec le jeton (identifiant du membre). Aucune route dédiée n'existe ; la page d'accueil appelle `GET /restaurant/members/:id/reservations`, qui sert aussi au tableau de bord. Ajouter une ligne à chaque affichage du tableau de bord produirait du bruit.
- Consultation de la carte des tables, des tables disponibles et des statistiques.
- Notifications temps réel (WebSocket) : ce sont des messages, pas des actions.

## Champs d'une ligne

| Champ | Contenu |
| --- | --- |
| `id` | Identifiant unique de la ligne |
| `action` | Code de l'action (voir tableau) |
| `memberId` | Membre qui a déclenché l'action |
| `details` | Précision lisible (numéro de table, identifiant de réservation…) |
| `createdAt` | Date et heure de l'action (UTC) |

## Avis (REVIEW_*)

| Action | Déclencheur | Détail enregistré |
|---|---|---|
| REVIEW_CREATED | Un membre publie son premier avis | identifiant de l'avis |
| REVIEW_UPDATED | Un membre modifie son avis (un seul avis par membre) | identifiant de l'avis |
| REVIEW_REPLIED | L'admin ajoute ou modifie la réponse à un avis | identifiant de l'avis |
| REVIEW_REPLY_DELETED | L'admin supprime la réponse à un avis | identifiant de l'avis |
| REVIEW_DELETED | L'admin supprime un avis | identifiant de l'avis |

