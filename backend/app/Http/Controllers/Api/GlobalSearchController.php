<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{User,Course,CourseSession,CourseEnrollment,SubscriptionPlan,MemberSubscription,Payment,ContactMessage,CourseProposal,GymAttendance};
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q', '');
        if (!is_string($q) || mb_strlen($q) > 80) return response()->json(['message' => 'Recherche invalide.'], 422);
        $q = trim($q);
        if (mb_strlen($q) < 2) return response()->json(['results' => []]);
        $user = $request->user(); $role = $user->role; $id = $user->id;
        abort_unless(in_array($role, ['admin', 'coach', 'member'], true), 403);
        $like = '%' . addcslashes($q, '%_\\') . '%'; $out = [];
        $match = fn($qb, $fields) => $qb->where(function ($w) use ($fields, $like) { foreach ($fields as $field) $w->orWhere($field, 'like', $like); });
        $add = function ($rows, $type, $path, $title, $detail) use (&$out) {
            foreach ($rows as $r) $out[] = ['id' => "$type-$r->id", 'type' => $type, 'title' => (string)$title($r), 'detail' => (string)$detail($r), 'path' => $path];
        };

        if ($role === 'admin') {
            foreach (['member' => ['Membre', '/admin/members'], 'coach' => ['Coach', '/admin/coaches']] as $r => [$type, $path]) {
                $add(User::where('role', $r)->where(fn($b) => $match($b, ['name','email','phone']))->limit(4)->get(), $type, $path, fn($x) => $x->name, fn($x) => $x->email);
            }
            $add(SubscriptionPlan::where(fn($b) => $match($b, ['name','description','type']))->limit(4)->get(), 'Tarif', '/admin/tariffs', fn($x) => $x->name, fn($x) => "$x->price MAD");
            $add(ContactMessage::where(fn($b) => $match($b, ['name','email','subject','message']))->limit(4)->get(), 'Message', '/admin/messages', fn($x) => $x->subject, fn($x) => $x->name);
            $add(CourseProposal::where(fn($b) => $match($b, ['name','description','status']))->limit(4)->get(), 'Proposition', '/admin/course-proposals', fn($x) => $x->name, fn($x) => $x->status);
            $add(GymAttendance::with('person')->whereHas('person', fn($b) => $match($b, ['name','email']))->limit(4)->get(), 'Présence', '/admin/attendance', fn($x) => $x->person?->name ?? 'Utilisateur', fn($x) => (string)$x->date?->format('d/m/Y'));
        }

        $courses = Course::when($role === 'coach', fn($b) => $b->where('coach_id', $id))->when($role === 'member', fn($b) => $b->where('status', 'active'))
            ->where(fn($b) => $match($b, ['name','description']))->limit(4)->get();
        $add($courses, 'Cours', "/$role/classes", fn($x) => $x->name, fn($x) => $x->description ?? 'Cours sportif');

        $sessions = CourseSession::with('course')->when($role === 'coach', fn($b) => $b->where('coach_id', $id))
            ->when($role === 'member', fn($b) => $b->where('status', 'scheduled')->whereHas('course', fn($c) => $c->where('status', 'active')))
            ->where(fn($b) => $b->where('location','like',$like)->orWhereHas('course', fn($c) => $match($c, ['name'])))->limit(4)->get();
        $add($sessions, 'Séance', "/$role/schedule", fn($x) => $x->course?->name ?? 'Séance', fn($x) => ($x->location ?: 'Salle') . ' · ' . $x->start_at?->format('d/m/Y H:i'));

        if ($role === 'coach') {
            $add(User::where('role','member')->whereHas('courseEnrollments.session', fn($b) => $b->where('coach_id',$id))
                ->where(fn($b) => $match($b, ['name','email','phone']))->limit(4)->get(), 'Membre', '/coach/members', fn($x) => $x->name, fn($x) => $x->email);
            $add(CourseProposal::where('coach_id',$id)->where(fn($b) => $match($b, ['name','description','status']))->limit(4)->get(), 'Proposition', '/coach/classes', fn($x) => $x->name, fn($x) => $x->status);
        }

        $bookings = CourseEnrollment::with(['member','session.course'])->when($role === 'member', fn($b) => $b->where('member_id',$id))
            ->when($role === 'coach', fn($b) => $b->whereHas('session', fn($s) => $s->where('coach_id',$id)))
            ->where(fn($b) => $b->where('status','like',$like)->orWhereHas('member', fn($u) => $match($u, ['name','email']))
                ->orWhereHas('session.course', fn($c) => $match($c, ['name'])))->limit(4)->get();
        $bookingPath = ['admin' => '/admin/reservations','coach' => '/coach/attendance','member' => '/member/reservations'][$role];
        $add($bookings, 'Réservation', $bookingPath, fn($x) => $x->session?->course?->name ?? "Réservation #$x->id", fn($x) => ($role === 'member' ? '' : (($x->member?->name ?? 'Membre') . ' · ')) . $x->status);

        if ($role !== 'coach') {
            $payments = Payment::with('member')->when($role === 'member', fn($b) => $b->where('member_id',$id))
                ->where(fn($b) => $match($b, ['reference','notes','status'])->orWhereHas('member', fn($u) => $match($u, ['name','email'])))->limit(4)->get();
            $add($payments, 'Paiement', "/$role/payments", fn($x) => $x->reference ?: "Paiement #$x->id", fn($x) => "$x->amount MAD · $x->status");
            $subs = MemberSubscription::with(['plan','member'])->when($role === 'member', fn($b) => $b->where('member_id',$id))
                ->where(fn($b) => $b->where('status','like',$like)->orWhereHas('plan', fn($p) => $match($p, ['name']))
                    ->orWhereHas('member', fn($u) => $match($u, ['name','email'])))->limit(4)->get();
            $add($subs, 'Abonnement', $role === 'admin' ? '/admin/memberships' : '/member/membership', fn($x) => $x->plan?->name ?? "Abonnement #$x->id", fn($x) => $x->status);
        }

        usort($out, fn($a,$b) => (int)str_contains(mb_strtolower($b['title']), mb_strtolower($q)) <=> (int)str_contains(mb_strtolower($a['title']), mb_strtolower($q)));
        return response()->json(['results' => array_slice($out, 0, 18)]);
    }
}
