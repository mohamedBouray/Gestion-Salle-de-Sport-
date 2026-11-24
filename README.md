# Bouray Gym

Projet de Programmation Web Dynamique — application de gestion d'une salle de sport, React/Vite, Laravel/Sanctum et MySQL, avec Docker Compose.

## Fonctionnalités

- Administrateur : membres, coaches, cours, planning, réservations, entrées/sorties, tarifs, abonnements, paiements simulés, propositions de cours et site public.
- Coach : cours, planning, disponibilités, participants, pointage et propositions de cours.
- Membre : catalogue, planning, abonnements, paiement simulé, réservations et historique.
- Les membres actifs et vérifiés consultent l'application sans abonnement. Réserver nécessite un abonnement actif, compatible et valide. L'accès physique exige un abonnement valide. Le coach valide la participation aux cours séparément du pointage à l'entrée.
- Laravel Scheduler clôture automatiquement les séances expirées ; les heures sont stockées en UTC et affichées selon Africa/Casablanca.

## Installation locale (nouvelle installation uniquement)

Prérequis : Docker et Docker Compose v2, Git. Depuis la racine :

1. Copier `.env.example` vers `.env`, `backend/.env.example` vers `backend/.env` et `frontend/.env.example` vers `frontend/.env` uniquement si ces fichiers n'existent pas. Renseigner deux mots de passe MySQL distincts dans le fichier racine.
2. Préparer les répertoires Laravel : `mkdir -p backend/storage/framework/{cache/data,sessions,views} backend/storage/logs backend/bootstrap/cache` (Bash).
3. `docker compose up -d --wait db`
4. `docker compose run --rm --no-deps backend composer install --no-scripts`
5. `docker compose run --rm --no-deps backend php artisan key:generate` (première installation uniquement).
6. `docker compose run --rm --no-deps backend php artisan migrate`
7. `docker compose run --rm --no-deps backend php artisan storage:link` (si le lien n'existe pas).
8. `docker compose up -d --build`

Frontend : http://localhost:3000 — Backend : http://localhost:8001 — MySQL local : 127.0.0.1:3308.

Pour créer les données de démonstration sur une base neuve, renseigner un mot de passe local dans `backend/.env` (`GYM_DEMO_PASSWORD`, 8 à 72 octets), puis `docker compose exec backend php artisan db:seed`. Le seeder crée notamment `admin@gmail.com`, `coach.nora@example.test`, `coach.amine@example.test` et `member01@example.test`. Ne jamais utiliser ce mot de passe partagé en production. Les autres comptes peuvent être en attente ou inactifs.

## Email

Resend est pris en charge : `MAIL_MAILER=resend`, `RESEND_API_KEY` et une adresse `MAIL_FROM_ADDRESS` autorisée, dans `backend/.env`. Conserver les valeurs existantes si elles fonctionnent déjà. Les exemples ne contiennent aucun secret réel. Après modification locale de configuration : `docker compose exec backend php artisan config:clear`.

## Tests isolés

Ne pas lancer les tests de fonctionnalités sur la base de développement. Avec les dépendances backend déjà installées :

```bash
docker compose -f docker-compose.test.yml run --rm backend-test
docker compose -f docker-compose.test.yml down
```

Ce projet Docker distinct utilise un réseau privé, une base `academic_db_test`, un utilisateur et un volume séparés. Il ne monte pas les données de stockage de l'application en écriture ; ses clés et mots de passe sont exclusivement des valeurs de test. Les mails sont capturés en mémoire. Le garde-fou PHPUnit refuse les tests Laravel si la connexion ne correspond pas à cette base de test. Ne pas ajouter `-v` à la commande `docker compose down` du projet principal.

```bash
docker compose exec frontend node --test tests/gymDates.test.js
docker compose exec frontend npm run build
docker compose exec backend php artisan schedule:list
docker compose exec frontend npm audit
docker compose exec backend composer audit
```

## Sécurité des dépendances

Après sauvegarde des fichiers de verrouillage et selon les alertes reçues, supprimer le paquet frontend `xlsx` non utilisé (les exports sont produits par Laravel), puis appliquer les mises à jour compatibles :

```bash
docker compose exec frontend npm uninstall xlsx
docker compose exec frontend npm audit fix
docker compose exec backend composer update laravel/framework symfony/http-foundation symfony/http-kernel symfony/mime symfony/routing --with-all-dependencies
```

Relancer les deux audits, le build et les tests. Ne pas utiliser `npm audit fix --force` ni ignorer une alerte pour obtenir un résultat artificiellement vert. Versionner les nouveaux lockfiles après vérification.

## Structure du dépôt

- `frontend/` : pages, composants, services API, utilitaires et tests Node.
- `backend/` : routes, controllers, services, models, requests, resources, migrations et tests Laravel.
- `docker-compose.yml` : environnement de développement et scheduler.
- `docker-compose.test.yml` : environnement de test indépendant.

Ne jamais publier les vrais fichiers `.env`, les clés Resend, les sauvegardes SQL, les données privées ni les dépendances installées. Le mode de développement (`artisan serve`, Vite, debug) n'est pas destiné à un déploiement public. Pour un déploiement réel, préparer HTTPS, les origines et cookies sécurisés, et désactiver le debug.
