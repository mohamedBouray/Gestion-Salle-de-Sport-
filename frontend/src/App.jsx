import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Public pages
const LandingPage = lazy(() => import("./pages/Landing/LandingPage"));
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import ActivateAccount from "./pages/Auth/ActivateAccount";

// Dashboard UI
import DashboardLayout from "./layouts/DashboardLayout";
import SectionPlaceholder from "./components/shared/SectionPlaceholder";
import LoadingScreen from "./components/shared/LoadingScreen";

// Profile
import Profile from "./components/Profile/Profile";

// admin 
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const MembersPage = lazy(() => import("./pages/Admin/MembersPage"));
const CoachesPage = lazy(() => import("./pages/Admin/CoachesPage"));
const AdminCoursesPage = lazy(() => import("./pages/Admin/CoursesPage"));
const AdminSchedulePage = lazy(() => import("./pages/Admin/SchedulePage"));
const AdminReservation = lazy(() => import("./pages/Admin/ReservationsPage"));
const AdminPresences = lazy(() => import("./pages/Admin/AttendancePage"));
const MessagesPage = lazy(() => import("./pages/Admin/MessagesPage"));
const LandingPageSettings = lazy(() => import("./pages/Admin/SiteSettingsPage"));
const AdminCourseProposalsPage = lazy(() => import("./pages/Admin/CourseProposalsPage"));
const AdminMembershipsPage = lazy(() => import("./pages/Admin/MembershipsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/Admin/PaymentsPage"));

// coaches 
const CoachDashboard = lazy(() => import("./pages/Coaches/CoachDashboard"));
const CoachCourses = lazy(() => import("./pages/Coaches/CoursesPage"));
const CoachSchedule = lazy(() => import("./pages/Coaches/SchedulePage"));
const CoachMembers = lazy(() => import("./pages/Coaches/MembersPage"));
const CoachAttendance = lazy(() => import("./pages/Coaches/AttendancePage"));
const AdminTariffsPage = lazy(() => import("./pages/Admin/TariffsPage"));

// members 
const MemberDashboard = lazy(() => import("./pages/Members/MemberDashboard"));
const MemberReservation = lazy(() => import("./pages/Members/ReservationsPage"));
const MemberCourses = lazy(() => import("./pages/Members/CoursesPage"));
const MemberSchedule = lazy(() => import("./pages/Members/SchedulePage"));
const MemberMembership = lazy(() => import("./pages/Members/MembershipPage"));
const MemberAttendance = lazy(() => import("./pages/Members/AttendancePage"));
const MemberPayments = lazy(() => import("./pages/Members/PaymentsPage"));


// Dashboard paths
const dashboards = { admin: "/admin/dashboard", coach: "/coach/dashboard", member: "/member/dashboard" };
function SetupRoute() {
    const { isSetup, loading } = useAuth();
    if (loading || isSetup === null) {
        return false;
    }

    if (isSetup === false) {
        return <Navigate to="/register" replace />;
    }
    return <Outlet />;
}

function GuestRoute() {
    const { user, loading } = useAuth();
    if (loading) {
        return <LoadingScreen message="Vérification de votre session" />;
    }
    if (user && user.status === "active") {
        return (
            <Navigate to={dashboards[user.role] || "/"} replace />
        );
    }
    return <Outlet />;
}

// Authenticated 
function PrivateRoute({ requiredRole }) {
    const { user, loading } = useAuth();
    if (loading) { return <LoadingScreen message="Accès à votre espace sportif" />;}
    if (!user) { return <Navigate to="/login" replace />;}
    if (user.status !== "active") { return <Navigate to="/login" replace />; }
    if (requiredRole && user.role !== requiredRole) { return ( <Navigate to={dashboards[user.role] || "/"} replace/>);}
    return <Outlet />;
}


function DashboardRedirect() {
    const { user, loading } = useAuth();
    if (loading) { return <LoadingScreen message="Chargement du tableau de bord" />;}
    if (!user || user.status !== "active") { return <Navigate to="/login" replace />}
    return (
        <Navigate  to={dashboards[user.role] || "/"} replace/>);
}

function RoleLayout() {
    const { user, logout } = useAuth();
    if (!user) { return <Navigate to="/login" replace />;}
    return (
        <DashboardLayout key={`${user.role}-${user.id}`} role={user.role} user={user} onLogout={logout} />
    );
}

// Application Routes
function AppRoutes() {
    return (
        <Routes>
            {/* FIRST ADMIN REGISTRATION */}
            <Route element={<GuestRoute />}>
                <Route path="/register" element={<Register />}/>
            </Route>
            <Route path="/forgot-password" element={<ForgotPassword />}/>
            <Route path="/reset-password/:token" element={<ResetPassword />}/>
            <Route path="/activate-account" element={<ActivateAccount />}/>
            <Route element={<SetupRoute />}>
                <Route path="/" element={<LandingPage />}/>
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<Login />}/>
                </Route>
                <Route path="/dashboard" element={<DashboardRedirect />}/>

                <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<Profile />}/>
                </Route>

                {/* ADMIN ROUTES */}
                <Route element={ <PrivateRoute requiredRole="admin" />}>
                    <Route path="/admin" element={<RoleLayout />}>
                        <Route index element={ <Navigate to="dashboard" replace /> }/>

                        <Route path="dashboard" element={<AdminDashboard />}/>
                        <Route path="members" element={<MembersPage />} />
                        <Route path="coaches" element={<CoachesPage />} /> 
                        <Route path="classes" element={<AdminCoursesPage />} />
                        <Route path="schedule" element={<AdminSchedulePage />} />
                        <Route path="reservations" element={<AdminReservation />} />
                        <Route path="attendance" element={<AdminPresences/>}/>
                        <Route path="course-proposals" element={<AdminCourseProposalsPage />}/>
                        <Route path="tariffs" element={<AdminTariffsPage />} />
                        <Route path="memberships" element={<AdminMembershipsPage />}/>
                        <Route path="payments" element={<AdminPaymentsPage />} />
                        <Route path="landing-page" element={<LandingPageSettings/>}/>
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="profile" element={<Profile />} />
                        
                        <Route path=":section" element={<SectionPlaceholder />}/>
                    </Route>
                </Route>

                {/* COACH ROUTES */}
                <Route element={ <PrivateRoute requiredRole="coach" />}>
                    <Route path="/coach"element={<RoleLayout />}>
                        <Route index element={ <Navigate to="dashboard" replace /> }/>

                        <Route path="dashboard" element={<CoachDashboard />}/>
                        <Route path="classes" element={<CoachCourses />} />
                        <Route path="schedule" element={<CoachSchedule />} />
                        <Route path="members" element={<CoachMembers />} />
                        <Route path="attendance" element={<CoachAttendance />} />
                        <Route path="profile" element={<Profile />} />

                        <Route path=":section" element={<SectionPlaceholder />}/>
                    </Route>
                </Route>

                {/* MEMBER ROUTES */}
                <Route element={<PrivateRoute requiredRole="member" />}>
                    <Route path="/member" element={<RoleLayout />}>
                        <Route index element={ <Navigate to="dashboard" replace />}/>

                        <Route path="dashboard" element={<MemberDashboard />}/>
                        <Route path="reservations" element={<MemberReservation/>}/>
                        <Route path="classes" element={<MemberCourses />} />
                        <Route path="schedule" element={<MemberSchedule />} />
                        <Route path="membership" element={<MemberMembership />} />
                        <Route path="attendance" element={<MemberAttendance />} />
                        <Route path="payments" element={<MemberPayments />} />
                        <Route path="profile" element={<Profile />} />

                        <Route path=":section" element={<SectionPlaceholder />}/>
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />}/>
            </Route>
        </Routes>
    );
}


export default function App() {
    return (
        <AuthProvider>
            <Suspense fallback={<LoadingScreen />}>
                <AppRoutes />
            </Suspense>
        </AuthProvider>
    );
}
