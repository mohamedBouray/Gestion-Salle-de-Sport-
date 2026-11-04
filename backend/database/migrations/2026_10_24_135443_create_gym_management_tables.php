<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    public function up(): void
    {
        // Comptes Admin / Coach / Member
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('email', 190)->unique();
            $table->string('phone', 32)->nullable();
            $table->string('password');
            $table->string('role', 16)->default('member'); 
            $table->string('status', 20)->default('pending');
            $table->timestamp('email_verified_at')->nullable();
            $table->foreignId('created_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['role', 'status'], 'users_role_status_idx');
        });

        // Récupération de mot de passe (Laravel Password Broker)
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email', 190)->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions web / SPA avec SESSION_DRIVER=database
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Invitation/activation de comptes créés par Admin
        Schema::create('account_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('invited_by_user_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->string('role', 16);
            $table->char('token_hash', 64)->unique(); 
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'expires_at'], 'inv_user_exp_idx');
        });

        // 1. Catalogue des cours collectifs.
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->foreignId('created_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->string('name', 160);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0); // Prix par séance, MAD.
            $table->string('image', 255)->nullable(); // Chemin, pas image binaire.
            $table->string('status', 20)->default('pending'); // pending, active, inactive
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'coach_id']);
        });

        // 2. Séances réelles, avec coach, date, heure et capacité.
        Schema::create('course_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')
                ->constrained('courses')->restrictOnDelete();
            $table->foreignId('coach_id')
                ->constrained('users')->restrictOnDelete();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->unsignedSmallInteger('capacity');
            $table->string('location', 160)->nullable();
            $table->string('status', 20)->default('scheduled'); // scheduled, completed, cancelled
            $table->timestamps();
            $table->index(['coach_id', 'start_at']);
            $table->index(['course_id', 'start_at']);
        });

        // 3. Inscriptions des membres aux séances collectives.
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('course_sessions')->restrictOnDelete();
            $table->foreignId('member_id')
                ->constrained('users')->restrictOnDelete();
            $table->decimal('price_at_booking', 10, 2)->default(0);
            $table->string('status', 20)->default('pending'); // pending, confirmed, attended, cancelled
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->unique(['session_id', 'member_id'], 'enrollment_session_member_unique');
            $table->index(['member_id', 'status']);
        });

        // 4. Planning hebdomadaire des coachs (0=dimanche, 6=samedi).
        Schema::create('coach_availabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coach_id')
                ->constrained('users')->restrictOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(
                ['coach_id', 'day_of_week', 'start_time', 'end_time'],
                'coach_availability_slot_unique'
            );
        });

        // 5. Offres créées par l'admin : générale, cours ou coaching.
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('type', 20)->default('general'); // general, course, personal
            $table->foreignId('course_id')->nullable()
                ->constrained('courses')->restrictOnDelete();
            $table->foreignId('coach_id')->nullable()
                ->constrained('users')->restrictOnDelete();
            $table->unsignedInteger('duration_value')->default(1);
            $table->string('duration_unit', 10)->default('month'); // day, month, year
            $table->decimal('price', 10, 2);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('active'); // active, inactive
            $table->timestamps();
            $table->softDeletes();
            $table->index(['type', 'status']);
        });

        // 6. Abonnements effectivement souscrits par les membres.
        Schema::create('member_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')
                ->constrained('users')->restrictOnDelete();
            $table->foreignId('plan_id')
                ->constrained('subscription_plans')->restrictOnDelete();
            $table->date('starts_at');
            $table->date('ends_at');
            $table->decimal('price_at_purchase', 10, 2); // Historique du prix.
            $table->string('status', 20)->default('pending'); // pending, active, expired, cancelled
            $table->timestamps();
            $table->index(['member_id', 'status']);
            $table->index(['ends_at', 'status']);
        });

        // 7. Demandes de coach personnel ou de séance privée.
        Schema::create('personal_training_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')
                ->constrained('users')->restrictOnDelete();
            $table->foreignId('coach_id')
                ->constrained('users')->restrictOnDelete();
            $table->string('request_type', 24); // coach, seance_privee
            $table->text('message')->nullable();
            $table->dateTime('preferred_at')->nullable();
            $table->string('status', 20)->default('pending'); // pending, accepted, rejected, cancelled
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            $table->index(['coach_id', 'status']);
            $table->index(['member_id', 'status']);
        });

        // 8. Séances privées planifiées après acceptation de la demande.
        Schema::create('personal_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')
                ->constrained('personal_training_requests')->restrictOnDelete();
            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->decimal('price', 10, 2);
            $table->string('location', 160)->nullable();
            $table->string('status', 20)->default('planned'); // planned, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['scheduled_at', 'status']);
        });

        // 9. Paiements manuels (cash/virement) pour UN seul objet payable.
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')
                ->constrained('users')->restrictOnDelete();
            $table->foreignId('subscription_id')->nullable()
                ->constrained('member_subscriptions')->restrictOnDelete();
            $table->foreignId('enrollment_id')->nullable()
                ->constrained('course_enrollments')->restrictOnDelete();
            $table->foreignId('personal_session_id')->nullable()
                ->constrained('personal_sessions')->restrictOnDelete();
            $table->foreignId('recorded_by_user_id')->nullable()
                ->constrained('users')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('method', 20); // cash, virement, other
            $table->string('status', 20)->default('paid'); // pending, paid, refunded
            $table->dateTime('paid_at')->nullable();
            $table->string('reference', 120)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['member_id', 'paid_at']);
            $table->index(['status', 'paid_at']);
        });

        // 10. Messages du formulaire Contact de la Landing Page.
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->string('email', 190);
            $table->string('phone', 32)->nullable();
            $table->string('subject', 190);
            $table->text('message');
            $table->string('status', 20)->default('new'); // new, read, replied
            $table->timestamp('read_at')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });

        // 11. Paramètres et textes de la Landing Page (clé => valeur).
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 120)->unique();
            $table->longText('value')->nullable();
            $table->string('label', 160)->nullable();
            $table->string('group', 50)->default('general'); // hero, about, contact, etc.
            $table->timestamps();
            $table->index('group');
        });
        
        
        Schema::create('coach_profiles', function (Blueprint $table) {
            $table->id();
            // Relation avec users (Coach)
            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            // Informations professionnelles
            $table->string('specialty', 160);
            $table->text('bio')->nullable();
            $table->string('photo')->nullable();

            // Expérience
            $table->unsignedSmallInteger('experience_years')
                ->default(0);
            // Affichage Landing Page
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });
            
    }

    public function down(): void
    {

        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('personal_sessions');
        Schema::dropIfExists('personal_training_requests');
        Schema::dropIfExists('member_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('coach_availabilities');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('course_sessions');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('coach_profiles');

        Schema::dropIfExists('account_invitations');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
