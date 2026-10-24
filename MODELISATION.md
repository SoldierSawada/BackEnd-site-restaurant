# MODELISATION — Back-end de restaurant

## 1. Domaine choisi

### Domaine : Restaurant — réservation et gestion des membres

Le domaine concerne le back-end d'un restaurant : une API qui permet aux clients de devenir membres et de réserver une table. Le système doit gérer les disponibilités, les réservations, les membres et les règles métier associées, tout en permettant l'envoi d'événements pour les confirmations et notifications.

### Périmètre

- Le projet est **exclusivement back-end** : domaine (DDD), Use Cases, adapters (persistance, messagerie) et API REST (Express + routing-controllers + Inversify).
- Aucune interface utilisateur n'est modélisée : l'API est consommée par un client externe, hors périmètre.
- Architecture : **Clean Architecture / hexagonale** dans un monorepo Nx (voir §8).

### Langage omniprésent (glossaire)

| Terme | Définition |
|---|---|
| Membre (`Member`) | Client inscrit, identifié par une adresse email unique. |
| Réservation (`Reservation`) | Engagement d'un membre à occuper une table sur un créneau. |
| Table (`Table`) | Table physique du restaurant, avec une capacité et un emplacement. |
| Créneau | Intervalle `[startTime, endTime[` ; la fin est toujours strictement après le début. |
| Convives (`guestCount`) | Nombre de personnes de la réservation : entier strictement positif. |
| Créneau occupé | Créneau enregistré dans une `Table` pour une réservation active. |
| Libérer une table | Retirer de la table le créneau occupé d'une réservation annulée. |

---

## 2. Agrégats

### 2.1 Agrégat `Reservation`

L'agrégat `Reservation` représente une réservation effectuée par un client ou un membre du restaurant.

#### Propriétés

- `id` : identifiant unique de la réservation (UUID généré par le Use Case `CreateReservation`)
- `memberId` : identifiant du membre ayant effectué la réservation
- `tableId` : identifiant de la table réservée
- `reservationDate` : date de la réservation
- `startTime` : heure de début
- `endTime` : heure de fin
- `guestCount` : nombre de personnes
- `status` : `CONFIRMED` ou `CANCELLED` (privé, lu via `getStatus()`)
- `specialRequest` : demande particulière éventuelle (optionnelle)

#### Méthodes

- `init(props)` (fabrique statique) : valide le nombre de personnes et le créneau, crée la réservation directement à l'état `CONFIRMED` et produit `ReservationConfirmed`
- `confirm()` : confirme la réservation. Dans le code, cette confirmation se fait dès la création, dans `init()` (il n'y a pas de méthode `confirm()` séparée)
- `reconstitute(props + status)` (fabrique statique) : reconstruit une réservation depuis la persistance, sans revalider ni produire d'événement
- `cancel(now = new Date())` : annule la réservation et produit `ReservationCancelled` ; `now` est injectable pour les tests
- `isActive()` : indique si la réservation est encore active (`status === CONFIRMED`)
- `getStatus()` : retourne le statut courant

#### Cycle de vie

```text
   init()                 cancel()  (now < startTime)
 ─────────► CONFIRMED ─────────────────────────────► CANCELLED
                                                         │
                         cancel() ───────────────────────┘ ✗ ReservationAlreadyCancelledError
```

`CANCELLED` est un état final : aucune transition n'en sort.

#### Règles métier

- Une réservation doit concerner au moins une personne (`guestCount` entier ≥ 1).
- Le créneau doit être valide : `endTime` strictement après `startTime`.
- Une réservation ne peut pas être créée sur un créneau déjà occupé.
- Une réservation annulée ne peut pas être annulée une seconde fois.
- Une réservation ne peut pas être annulée après le début du créneau. L'annulation est refusée dès que `now >= startTime` : annuler à l'heure exacte du début est déjà trop tard.
- Une réservation doit être associée à un membre valide si le restaurant impose le compte membre.
- `reservationDate`, `startTime`, `endTime`, `guestCount` et `tableId` ne changent plus après la création.

---

### 2.2 Agrégat `Table`

L'agrégat `Table` représente une table disponible dans le restaurant et protège la règle de capacité et de disponibilité.

#### Propriétés

- `id` : identifiant unique
- `number` : numéro de table
- `capacity` : nombre maximal de personnes (entier ≥ 1)
- `location` : emplacement de la table dans le restaurant (ex. « Salle principale », « Terrasse »)
- `active` : indique si la table peut être réservée (champ `isActive` dans le code, lu via `getIsActive()`)
- `reservations` : liste des créneaux occupés par la table. Chaque élément contient :
  - `reservationId`
  - `startTime`
  - `endTime`

#### Méthodes

- `init(id, number, capacity, location)` (fabrique statique) : crée une table active, sans créneau occupé
- `reconstitute(props)` (fabrique statique) : reconstruit une table depuis la persistance, sans revalider
- `reserve(reservationId, startTime, endTime, guestCount, reservationDate = startTime)` : réserve la table sur un créneau et produit `TableReserved`
- `release(reservationId)` : libère la table (retire le créneau occupé de cette réservation) et produit `TableReleased`
- `canAccommodate(guestCount)` : vérifie que la capacité est suffisante et que la table est active
- `isAvailable(startTime, endTime)` : vérifie que la table est active et libre sur le créneau
- `deactivate()` : rend la table indisponible
- `getIsActive()` : indique si la table est active

#### Règles métier

- Une table doit avoir une capacité entière strictement positive.
- Le nombre de personnes ne doit pas dépasser la capacité de la table.
- Une table inactive ne peut pas être réservée.
- Une table ne peut pas être réservée deux fois sur le même créneau.
- Deux créneaux se chevauchent si `début_demandé < fin_existante` **et** `fin_demandée > début_existant`. Deux créneaux qui se touchent (ex. 19h–21h puis 21h–23h) ne sont donc **pas** en conflit.
- La table doit être libérée lorsqu'une réservation est annulée.
- `release()` est idempotent : libérer une réservation inconnue de la table ne lève pas d'erreur et ne produit aucun événement.
- Ordre des vérifications dans `reserve()` : nombre de personnes → capacité → table active → cohérence du créneau → conflit.

---

### 2.3 Agrégat `Member`

L'agrégat `Member` représente un client inscrit au système de membres du restaurant.

#### Propriétés

- `id` : identifiant unique
- `name` : nom du membre
- `email` : adresse email (Value Object `Email`)
- `status` : statut du compte, `ACTIVE` ou `DEACTIVATED`

#### Méthodes

- `register(id, name, email)` (fabrique statique) : crée un membre au statut `ACTIVE`, nom nettoyé des espaces, et produit `MemberRegistered`
- `reconstitute(props)` (fabrique statique) : reconstruit un membre depuis la persistance, sans produire d'événement
- `rename(newName)` : modifie le nom
- `deactivate()` : désactive le compte (idempotent)
- `isActive()` : indique si le membre peut encore réserver
- `getName()`, `getStatus()` : accesseurs

#### Cycle de vie

```text
 register()               deactivate()
 ─────────► ACTIVE ─────────────────────► DEACTIVATED
```

#### Règles métier

- L'adresse email doit être valide.
- Une même adresse email ne peut appartenir qu'à un seul membre.
- Le nom ne doit pas être vide (ni composé uniquement d'espaces), à l'inscription comme au renommage.
- Un membre désactivé ne peut plus effectuer de nouvelle réservation.
- La désactivation n'annule pas automatiquement les réservations déjà confirmées.

---

## 3. Value Objects

### `Email`

Le Value Object `Email` représente une adresse email valide.

#### Validation

- La valeur doit être une chaîne non vide.
- Elle doit respecter un format d'adresse email valide.
- La valeur est normalisée à la création (espaces retirés, minuscules), pour que la règle d'unicité soit fiable.
- Deux objets `Email` ayant la même valeur sont considérés comme égaux.
- L'objet est immuable après sa création.

Exemple :

```text
Email("client@restaurant.fr")
```

Une tentative de création avec une valeur invalide lève `InvalidEmailError`.

Emplacement : `packages/restaurant/core/src/ValueObject/Email.ts`.

---

## 4. Événements

Tous les événements implémentent `DomainEvent` (`ddd`) et portent `occurredOn`, fixé à leur création. Ils sont définis dans `packages/restaurant/messages/src/events/`.

#### Mécanisme de publication

```text
Agrégat.recordEvent(event)                      (pendant l'action métier)
        │
        ▼
Use Case → repository.save(agrégat)
        │
        ▼
EventDispatcher.dispatch(agrégat) → agrégat.pullEvents()
        │
        ▼
InMemoryMessageQueue.insert(event)              (statut PENDING)
        │
        ▼
MessageModule.poll()  (toutes les 3 s) → EventManager.handlersFor(event)
        │
        ▼
DomainEventHandler.handle(event) → PROCESSED   (ou FAILED en cas d'erreur)
```

Les événements sont publiés **après** la sauvegarde des agrégats.

### `MemberRegistered`

- **Agrégat émetteur :** `Member`

#### Propriétés

- `memberId`
- `name`
- `email`
- `occurredOn`

#### Produit quand

L'événement est produit lorsqu'un nouveau membre termine son inscription avec succès.

---

### `ReservationConfirmed`

- **Agrégat émetteur :** `Reservation`

#### Propriétés

- `reservationId`
- `memberId`
- `tableId`
- `reservationDate`
- `startTime`
- `endTime`
- `guestCount`
- `occurredOn`

#### Produit quand

L'événement est produit lorsqu'une réservation est créée et confirmée.

Il peut notamment déclencher l'envoi d'un email de confirmation.

---

### `ReservationCancelled`

- **Agrégat émetteur :** `Reservation`

#### Propriétés

- `reservationId`
- `memberId`
- `tableId`
- `guestCount`
- `occurredOn`

#### Produit quand

L'événement est produit lorsqu'une réservation active est annulée avec succès.

Il peut déclencher l'envoi d'un email d'annulation.

---

### `TableReserved`

- **Agrégat émetteur :** `Table`

#### Propriétés

- `tableId`
- `reservationId`
- `reservationDate`
- `startTime`
- `endTime`
- `occurredOn`

#### Produit quand

L'événement est produit lorsqu'une table est effectivement bloquée pour un créneau donné.

---

### `TableReleased`

- **Agrégat émetteur :** `Table`

#### Propriétés

- `tableId`
- `reservationId`
- `occurredOn`

#### Produit quand

L'événement est produit lorsqu'une réservation est annulée et que la table redevient disponible.

---

## 5. Use Cases

Tous les Use Cases implémentent `Usecase<IRequest, IResponse>` (`ddd`), sont `@injectable()` et reçoivent leurs dépendances (repositories, `EventDispatcher`) par injection Inversify.

### `RegisterMember`

**Type :** Commande

#### Entrée

```text
name: string
email: string
```

#### Sortie

```text
memberId: string
```

#### Règles

1. Valider l'adresse email.
2. Vérifier que l'email n'est pas déjà utilisé.
3. Créer le membre.
4. Sauvegarder le membre.
5. Produire `MemberRegistered`.

#### Erreurs possibles

`InvalidEmailError`, `EmailAlreadyUsedError`, `InvalidMemberNameError`

---

### `CreateReservation`

**Type :** Commande

#### Entrée

```text
memberId: string
reservationDate: Date
startTime: Date
endTime: Date
guestCount: number
specialRequest?: string
```

#### Sortie

```text
reservationId: string
```

#### Règles

1. Vérifier que le membre existe et est actif.
2. Vérifier que le nombre de personnes est un entier strictement positif.
3. Vérifier que le créneau horaire est valide.
4. Rechercher une table adaptée au nombre de personnes (`TableRepository.findAvailable`) ; la première table retournée est retenue.
5. Vérifier que la table est disponible.
6. Générer l'identifiant de la réservation (UUID).
7. Réserver la table (`Table.reserve`).
8. Créer la réservation (`Reservation.init`).
9. Sauvegarder les agrégats concernés (`Table` puis `Reservation`).
10. Produire `ReservationConfirmed` et `TableReserved`.

#### Erreurs possibles

`MemberNotFoundError`, `MemberDeactivatedError`, `InvalidGuestCountError`, `InvalidTimeSlotError`, `TableUnavailableError`, `InsufficientTableCapacityError`

---

### `CancelReservation`

**Type :** Commande

#### Entrée

```text
reservationId: string
```

#### Sortie

```text
void
```

#### Règles

1. Vérifier que la réservation existe.
2. Vérifier que la table associée existe.
3. Vérifier qu'elle n'est pas déjà annulée.
4. Vérifier que le créneau n'a pas encore commencé.
5. Annuler la réservation.
6. Libérer la table.
7. Sauvegarder les agrégats concernés (`Reservation` puis `Table`).
8. Produire `ReservationCancelled` et `TableReleased`.

#### Erreurs possibles

`ReservationNotFoundError`, `TableNotFoundError`, `ReservationAlreadyCancelledError`, `CancellationTooLateError`

---

### `ListAvailableTables`

**Type :** Requête

#### Entrée

```text
reservationDate: Date
startTime: Date
endTime: Date
guestCount: number
```

#### Sortie

```text
Table[]
```

#### Règles

- Ne modifier aucun agrégat et ne produire aucun événement.
- Le nombre de personnes doit être un entier strictement positif.
- Le créneau doit être valide.
- Retourner uniquement les tables actives.
- Une table doit avoir une capacité suffisante.
- Une table déjà réservée sur le créneau demandé ne doit pas apparaître.

#### Erreurs possibles

`InvalidGuestCountError`, `InvalidTimeSlotError`

---

### `GetMemberReservations`

**Type :** Requête

#### Entrée

```text
memberId: string
```

#### Sortie

```text
Reservation[]
```

#### Règles

- Le membre doit exister.
- La requête ne modifie aucune donnée.
- Retourner les réservations associées au membre (`ReservationRepository.findByMemberId`).

#### Erreurs possibles

`MemberNotFoundError`

---

## 6. Erreurs métier

Toutes les erreurs métier héritent de `DomainError` (`ddd`). Leur `name` est le nom de la classe. Côté API, `DomainErrorMiddleware` les convertit en réponse **HTTP 400** au format :

```json
{ "error": "<NomDeLErreur>", "message": "<message>" }
```

| Erreur | Levée par |
|---|---|
| `MemberNotFoundError` | `CreateReservation`, `GetMemberReservations` |
| `MemberDeactivatedError` | `CreateReservation` |
| `EmailAlreadyUsedError` | `RegisterMember`, `PostgresMemberRepository` (contrainte UNIQUE) |
| `InvalidEmailError` | `Email` |
| `InvalidMemberNameError` | `Member` |
| `InvalidGuestCountError` | `Reservation.init`, `Table.reserve`, `CreateReservation`, `ListAvailableTables` |
| `TableNotFoundError` | `CancelReservation` |
| `TableUnavailableError` | `Table.reserve`, `CreateReservation` |
| `InsufficientTableCapacityError` | `Table.init`, `Table.reserve` |
| `ReservationNotFoundError` | `CancelReservation` |
| `ReservationAlreadyCancelledError` | `Reservation.cancel` |
| `CancellationTooLateError` | `Reservation.cancel` |
| `InvalidTimeSlotError` | `Reservation.init`, `CreateReservation`, `ListAvailableTables` |

### `MemberNotFoundError`

Levée lorsqu'un membre demandé n'existe pas.

---

### `MemberDeactivatedError`

Levée lorsqu'un membre désactivé tente d'effectuer une nouvelle réservation.

---

### `EmailAlreadyUsedError`

Levée lorsqu'une inscription utilise une adresse email déjà associée à un membre. La comparaison se fait sur l'email normalisé, donc sans tenir compte de la casse. Avec PostgreSQL, la contrainte UNIQUE garantit aussi la règle quand deux inscriptions arrivent en même temps.

---

### `InvalidEmailError`

Levée lorsqu'une adresse email ne respecte pas les règles de validation.

---

### `InvalidMemberNameError`

Levée lorsque le nom d'un membre est vide, à l'inscription ou lors d'un renommage.

---

### `InvalidGuestCountError`

Levée lorsque le nombre de personnes demandé est inférieur ou égal à zéro, ou n'est pas un nombre entier.

---

### `TableNotFoundError`

Levée lorsqu'aucune table correspondant à l'identifiant demandé n'existe.

---

### `TableUnavailableError`

Levée lorsqu'une table est déjà réservée sur le créneau demandé ou lorsqu'elle est inactive. Également levée :

- par `Table.reserve()` lorsque le créneau est incohérent (`startTime >= endTime`) ;
- par `CreateReservation` lorsqu'aucune table adaptée n'est disponible.

---

### `InsufficientTableCapacityError`

Levée lorsqu'une table ne possède pas suffisamment de places pour le nombre de personnes demandé. Également levée par `Table.init()` lorsque la capacité fournie n'est pas un entier strictement positif.

---

### `ReservationNotFoundError`

Levée lorsqu'une réservation demandée n'existe pas.

---

### `ReservationAlreadyCancelledError`

Levée lorsqu'une réservation déjà annulée est de nouveau annulée.

---

### `CancellationTooLateError`

Levée lorsqu'une tentative d'annulation est effectuée après le début du créneau de réservation (ou exactement à son début).

---

### `InvalidTimeSlotError`

Levée lorsque l'heure de fin est antérieure ou égale à l'heure de début.

---

## 7. Diagramme

Le système est organisé autour de trois agrégats principaux. `Reservation` constitue le lien métier entre un `Member` et une `Table`.

```text
                    ┌──────────────────────┐
                    │       Member         │
                    │──────────────────────│
                    │ id                   │
                    │ name                 │
                    │ email : Email (VO)   │
                    │ status               │
                    │  ACTIVE|DEACTIVATED  │
                    └──────────┬───────────┘
                               │ 1
                               │ memberId
                               │ 0..*
                               ▼
                    ┌──────────────────────┐
                    │     Reservation      │
                    │──────────────────────│
                    │ id                   │
                    │ memberId             │
                    │ tableId              │
                    │ reservationDate      │
                    │ startTime / endTime  │
                    │ guestCount           │
                    │ specialRequest?      │
                    │ status               │
                    │  CONFIRMED|CANCELLED │
                    └──────────┬───────────┘
                               │ 0..*
                               │ tableId
                               │ 1
                               ▼
                    ┌──────────────────────┐
                    │        Table         │
                    │──────────────────────│
                    │ id                   │
                    │ number               │
                    │ capacity             │
                    │ location             │
                    │ active               │
                    │ reservations[]       │
                    │  (reservationId,     │
                    │   startTime, endTime)│
                    └──────────────────────┘


Événements principaux :

Member ────────────────► MemberRegistered

Reservation ───────────► ReservationConfirmed
Reservation ───────────► ReservationCancelled

Table ─────────────────► TableReserved
Table ─────────────────► TableReleased
```

### Relations

- `Member` possède une identité indépendante de ses réservations.
- `Reservation` référence un `memberId` et un `tableId`, mais ne possède pas directement les agrégats `Member` ou `Table` (références par identifiant uniquement).
- `Table` protège sa propre disponibilité et sa capacité, via sa liste de créneaux occupés.
- `Reservation` protège son propre état (`CONFIRMED` / `CANCELLED`).
- Les échanges entre agrégats passent par les Use Cases et les événements plutôt que par des modifications directes d'un agrégat depuis un autre.
- Les requêtes (`ListAvailableTables`, `GetMemberReservations`) ne modifient pas le domaine.
- Un Use Case de commande peut modifier deux agrégats (`Table` et `Reservation`) dans la même opération ; il les sauvegarde l'un après l'autre.

---


## 8. Architecture back-end

### Organisation du monorepo

```text
apps/
  api/                         → restaurant-api : API REST (Express, routing-controllers)
    src/config/                  AppKernel, SetUp, Database (choix mémoire / PostgreSQL)
    src/middlewares/             AuthenticationMiddleware, DomainErrorMiddleware
    src/modules/restaurant/      ReservationController, ReservationModule, DTO
    src/modules/membership/      MemberController, MemberModule, DTO
packages/
  tools/
    ddd/                       → ddd : AggregateRoot, DomainError, DomainEvent,
                                 DomainEventHandler, EventDispatcher, Usecase
    messages/                  → messages-core : EventManager, InMemoryEventDispatcher,
                                 InMemoryMessageQueue, MessageModule
  restaurant/
    core/                      → restaurant-core : agrégats, Value Objects, erreurs,
                                 ports (repositories), Use Cases, BookingIdentifiers
    messages/                  → restaurant-messages : événements du domaine
    adapters/                  → restaurant-adapters : repositories InMemory et PostgreSQL
                                 (TypeORM), entités, mappers, Build (câblage Inversify)
```

### Règle de dépendance

```text
api ──► adapters ──► core ──► restaurant-messages ──► ddd
            │          └────────────────────────────► ddd
            └─► messages-core ──► ddd
```

`core` ne dépend d'aucun framework web ni d'aucune base de données : seulement de `ddd`, de `restaurant-messages` et d'`inversify` (pour l'injection). TypeORM n'apparaît que dans `adapters`.

### Ports (interfaces de repositories)

| Port | Méthodes |
|---|---|
| `ReservationRepository` | `save(reservation)`, `findById(id)`, `findByMemberId(memberId)` (triées par `startTime`) |
| `TableRepository` | `save(table)`, `findById(id)`, `findAvailable(startTime, endTime, guestCount)` |
| `MemberRepository` | `save(member)`, `findById(id)`, `findByEmail(email: Email)` |

Identifiants d'injection (`BookingIdentifiers`) : `reservationRepository`, `tableRepository`, `memberRepository`.

### Adapters

Deux implémentations par port. `Build.load(container, { dataSource? })` choisit laquelle utiliser :

| Port | Mémoire (par défaut) | PostgreSQL (`dataSource` fournie) |
|---|---|---|
| `MemberRepository` | `InMemoryMemberRepository` | `PostgresMemberRepository` |
| `ReservationRepository` | `InMemoryReservationRepository` | `PostgresReservationRepository` |
| `TableRepository` | `InMemoryTableRepository` | `PostgresTableRepository` |

Toutes ces implémentations sont enregistrées en singleton. `EventDispatcher` est lié à `InMemoryEventDispatcher`, qui publie dans `InMemoryMessageQueue` (singleton).

### Persistance PostgreSQL (TypeORM)

- `createPostgresDataSource(config)` crée la `DataSource` avec les entités `POSTGRES_ENTITIES`. Elle est injectée via `DatabaseIdentifiers.dataSource`.
- Les mappers (`MemberMapper`, `ReservationMapper`, `TableMapper`) convertissent domaine ⇄ entité. Ils reconstruisent les agrégats avec `reconstitute()`, donc sans produire d'événements.
- `PostgresTableRepository.findAvailable` pré-filtre en base (`active = true`, `capacity >= guestCount`, tri par `number`), puis l'agrégat `Table` tranche les conflits de créneaux.
- Les colonnes ont des types explicites, ce qui les rend indépendantes des métadonnées de décorateurs.

| Table SQL | Colonnes | Contraintes |
|---|---|---|
| `members` | `id` varchar(64), `name` varchar(255), `email` varchar(320), `status` varchar(16) | PK `id`, **UNIQUE `email`** |
| `reservations` | `id`, `memberId`, `tableId` varchar(64), `reservationDate`, `startTime`, `endTime` timestamptz, `guestCount` int, `specialRequest` varchar(1000) NULL, `status` varchar(16) | PK `id`, index `memberId` |
| `tables` | `id` varchar(64), `number` int, `capacity` int, `location` varchar(255), `active` boolean, `reservations` text (JSON des créneaux occupés) | PK `id` |

### Configuration (variables d'environnement)

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | Port HTTP |
| `DB_TYPE` | `memory` | `memory` ou `postgres` |
| `DB_HOST` | `localhost` | Hôte PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `restaurant` | Identifiants et base |
| `DB_SYNCHRONIZE` | `true` | Création / mise à jour automatique du schéma (`false` pour la désactiver) |
| `DB_LOGGING` | `false` | Journalisation SQL |

Lancement :

- Mode mémoire : `npm start`.
- Mode PostgreSQL : `docker compose up -d`, puis copier `.env.example` en `.env`, puis `npm run start:postgres` (Node ≥ 20.6).

### Données initiales (`AppKernel`)

Ces tables sont créées au démarrage **uniquement si elles n'existent pas déjà**. En mode PostgreSQL, un redémarrage n'efface donc pas leurs créneaux occupés.

| id | Numéro | Capacité | Emplacement |
|---|---|---|---|
| `table-1` | 1 | 4 | Salle principale |
| `table-2` | 2 | 6 | Salle principale |
| `table-3` | 3 | 2 | Terrasse |

---

## 9. API REST

Préfixe : `/restaurant`. Port : `PORT`, ou `3000` par défaut.

| Méthode | Route | Auth | Use Case | Corps / paramètres | Réponse |
|---|---|---|---|---|---|
| `GET` | `/status` (hors préfixe) | — | — | — | `200` |
| `POST` | `/restaurant/members` | — | `RegisterMember` | body : `name`, `email` | `{ id }` |
| `GET` | `/restaurant/members/:id/reservations` | ✔ (le membre lui-même) | `GetMemberReservations` | param : `id` | `[{ id, memberId, tableId, reservationDate, startTime, endTime, guestCount, specialRequest?, status }]` |
| `GET` | `/restaurant/tables/available` | — | `ListAvailableTables` | query : `reservationDate`, `startTime`, `endTime`, `guestCount` | `[{ id, number, capacity, location, active }]` |
| `POST` | `/restaurant/reservations` | ✔ | `CreateReservation` | body : `reservationDate`, `startTime`, `endTime`, `guestCount`, `specialRequest?` | `{ id }` |
| `DELETE` | `/restaurant/reservations/:id` | — | `CancelReservation` | param : `id` | `{ cancelled: true }` |

### Validation des entrées (DTO `class-validator`)

- `RegisterMemberCommand` : `name` et `email` sont des chaînes non vides. Le format de l'email est validé par le Value Object `Email`.
- `CreateReservationCommand` : `reservationDate`, `startTime` et `endTime` sont des chaînes non vides (dates ISO 8601) ; `guestCount` est un entier ≥ 1 ; `specialRequest` est une chaîne optionnelle.
- `AvailableTablesQuery` : mêmes règles, sans `specialRequest`.
- Les dates sont converties en `Date` dans le contrôleur avant l'appel au Use Case.

### Gestion des erreurs (`DomainErrorMiddleware`)

| Cas | Code HTTP |
|---|---|
| `DomainError` | `400` `{ error, message }` |
| `HttpError` (validation `400`, `ForbiddenError` `403`, …) | `httpCode` de l'erreur `{ error, message, details? }` |
| Authentification manquante ou membre inconnu | `401` `{ error: "UnauthorizedError", message }` |
| Autre erreur | `500` `{ error: "InternalServerError" }` |

### Authentification

`AuthenticationMiddleware` lit l'en-tête `Authorization: Bearer <memberId>` et charge le membre via `MemberRepository`. Il place `{ memberId, name }` dans `request.identity` (`AuthenticatedRequest`), et répond `401` si l'en-tête est absent ou si le membre est inconnu.

- Pour `CreateReservation`, le `memberId` est tiré de l'identité, jamais du corps de la requête.
- Un membre désactivé reste authentifié, mais `CreateReservation` le refuse (`MemberDeactivatedError`).
- `GET /members/:id/reservations` renvoie `403` si `:id` n'est pas le membre authentifié.
- Ce jeton est volontairement simplifié (le jeton est l'identifiant du membre) : ce n'est pas un mécanisme sécurisé pour la production.

---

## 10. État d'implémentation

### Implémenté

- Agrégats `Member`, `Reservation`, `Table` et Value Object `Email`
- Use Cases `RegisterMember`, `GetMemberReservations`, `CreateReservation`, `CancelReservation`, `ListAvailableTables`
- Toutes les erreurs du §6
- Les 5 événements du §4 : ils sont enregistrés par les agrégats (`recordEvent`) et publiés dans la file de messages après sauvegarde
- Repositories en mémoire et PostgreSQL (TypeORM) pour les 3 agrégats
- API REST (6 routes) avec authentification et gestion des erreurs
- `docker-compose.yml` (PostgreSQL 16) et `.env.example`
- Tests Vitest (`packages/restaurant/adapters/tests/`) :
  - `CancelReservation.test.ts` : Use Cases de réservation
  - `Member.test.ts` : `Email`, `Member`, `RegisterMember`, `GetMemberReservations`, règles membre dans `CreateReservation`, événements publiés
  - `PostgresRepositories.test.ts` : repositories TypeORM sur PostgreSQL émulé (`pg-mem`), contrainte UNIQUE, persistance des créneaux, Use Cases de bout en bout

### Reste à faire / limites connues

| Élément | État |
|---|---|
| `MessageModule` | Jamais instancié ni démarré, et aucun handler enregistré : les événements restent en `PENDING` dans la file (aucun email n'est envoyé) |
| File de messages | En mémoire : les événements non traités sont perdus au redémarrage, même en mode PostgreSQL |
| Transactions | `CreateReservation` et `CancelReservation` sauvegardent deux agrégats sans transaction. Deux réservations simultanées sur la même table peuvent passer ; il faudra un verrou ou un contrôle de version |
| Migrations | Le schéma est géré par `synchronize`. Pour la production, il faudra des migrations TypeORM et `DB_SYNCHRONIZE=false` |
| `DELETE /reservations/:id` | Non authentifié : n'importe qui peut annuler une réservation dont il connaît l'identifiant |
| Use Cases `RenameMember` / `DeactivateMember` / `DeactivateTable` | Les méthodes existent sur les agrégats, mais aucun Use Case ni route ne les expose |

### Écarts techniques restants (hors périmètre de cette évolution)

- `project.json` de `restaurant-messages` : `sourceRoot` pointe vers `packages/booking/messages/src` au lieu de `packages/restaurant/messages/src`.
- `apps/api/project.json` : la cible `demo` lance `apps/api/src/demo.ts`, un fichier qui n'existe pas.
- `package.json` : la description mentionne encore « CinéClub ».

### Points ouverts

- `reservationDate` fait doublon avec `startTime`, qui contient déjà la date : soit on le supprime, soit on vérifie qu'il correspond au jour de `startTime`.
- Le choix de la table se limite à la « première table disponible » (tri par numéro). Une règle métier plus fine reste à définir (par exemple, la plus petite table de capacité suffisante).
- Le compte membre est désormais **obligatoire** pour réserver : `memberId` est requis dans `Reservation`.
- Les horaires d'ouverture et l'interdiction de réserver dans le passé ne sont pas encore modélisés.

---

## Implémentation

L'implémentation suit la structure du projet de référence (monorepo Nx DDD / Clean Architecture) :

- `packages/restaurant/core/src/aggregates/` : `Member.ts`, `Reservation.ts`, `Table.ts`
- `packages/restaurant/core/src/ValueObject/Email.ts`
- `packages/restaurant/core/src/errors/`
- `packages/restaurant/core/src/usecases/`
- `packages/restaurant/core/src/repositories/`
- `packages/restaurant/messages/src/events/`
- `packages/restaurant/adapters/src/repositories/repositories/` (mémoire)
- `packages/restaurant/adapters/src/repositories/postgres/` (TypeORM)
- `packages/restaurant/adapters/src/build/`
- `apps/api/src/`

`Member` protège son statut et la validité de son nom ; `Reservation` protège son état (`CONFIRMED` / `CANCELLED`) ; `Table` protège sa capacité et les conflits de créneaux. Les Use Cases orchestrent les agrégats sans modifier directement leur état interne.
