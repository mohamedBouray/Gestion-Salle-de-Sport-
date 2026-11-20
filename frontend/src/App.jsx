import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Public pages
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import ActivateAccount from "./pages/Auth/ActivateAccount";

// Dashboard UI
import DashboardLayout from "./layouts/DashboardLayout";
import SectionPlaceholder from "./components/shared/SectionPlaceholder";

// admin 
import MessagesPage from "./pages/Admin/MessagesPage";
import MembersPage from "./pages/Admin/MembersPage";
import CoachesPage from "./pages/Admin/CoachesPage";
import AdminCoursesPage from "./pages/Admin/CoursesPage";
import AdminSchedulePage from "./pages/Admin/SchedulePage";
import AdminReservation from "./pages/Admin/ReservationsPage";
import AdminPresences from "./pages/Admin/AttendancePage";
import LandingPageSettings from "./pages/Admin/SiteSettingsPage"
import AdminCourseProposalsPage from "./pages/Admin/CourseProposalsPage";

// coaches 
import CoachCourses from './pages/Coaches/CoursesPage';
import CoachSchedule from "./pages/Coaches/SchedulePage";
import CoachMembers from "./pages/Coaches/MembersPage";
import CoachAttendance from "./pages/Coaches/AttendancePage";


// members 
import MemberReservation from './pages/Members/ReservationsPage';


// Profile
import Profile from "./components/Profile/Profile";


// Dashboard paths
const dashboards = { admin: "/admin/dashboard", coach: "/coach/dashboard", member: "/member/dashboard" };

// Check first admin setup
function SetupRoute() {
    const { isSetup, loading } = useAuth();
    if (loading || isSetup === null) return <div className="p-8 text-center">Chargement...</div>;
    if (isSetup === false) {
        return <Navigate to="/register" replace />;
    }
    return <Outlet />;
}

// Pages only for guests
function GuestRoute() {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (user) {
        return (
            <Navigate to={dashboards[user.role] || "/"} replace/>
        );
    }
    return <Outlet />;
}

// Authenticated 
function PrivateRoute({ requiredRole }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status !== "active") {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return (
            <Navigate to={dashboards[user.role] || "/"} replace/>
        );
    }
    return <Outlet />;
}

// Redirect to role dashboard
function DashboardRedirect() {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return (
        <Navigate to={dashboards[user.role] || "/"} replace/>
    );
}

// Shared Dashboard Layout
function RoleLayout() {
    const { user, signOut } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return (
        <DashboardLayout key={user.role} role={user.role} user={user} onLogout={signOut}/>
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
                <Route element={<GuestRoute />}><Route path="/login" element={<Login />}/></Route>
                <Route path="/dashboard" element={<DashboardRedirect />}/>
                <Route element={<PrivateRoute />}><Route path="/profile" element={<Profile />}/></Route>

                {/* ADMIN ROUTES */}
                <Route element={ <PrivateRoute requiredRole="admin" />}>
                    <Route path="/admin" element={<RoleLayout />}>
                    <Route index element={ <Navigate to="dashboard" replace /> }/>
                        {/* <Route path="dashboard" element={<AdminDashboard />}/> */}
                        <Route path="members" element={<MembersPage />} />
                        <Route path="coaches" element={<CoachesPage />} /> 
                        <Route path="classes" element={<AdminCoursesPage />} />
                        <Route path="schedule" element={<AdminSchedulePage />} />
                        <Route path="reservations" element={<AdminReservation />} />
                        <Route path="attendance" element={<AdminPresences/>}/>
                        <Route path="course-proposals" element={<AdminCourseProposalsPage />}/>


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
                        <Route  path="reservations" element={<MemberReservation/>}/>

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
            <AppRoutes />
        </AuthProvider>
    );
}
