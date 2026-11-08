
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Public pages
import LandingPage from "./pages/Landing/LandingPage";
import Login from "./pages/Auth/login";
import Register from "./pages/Auth/register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

// Dashboard UI
import DashboardLayout from "./layouts/DashboardLayout";
import SectionPlaceholder from "./components/shared/SectionPlaceholder";

// Dashboards
import AdminDashboard from "./pages/Admin/AdminDashboard";
import MembersPage from "./pages/Admin/MembersPage";
import CoachesPage from "./pages/Admin/CoachesPage";
import ActivateAccount from "./pages/Auth/ActivateAccount";

import CoachDashboard from "./pages/Coaches/CoachDashboard";
import MemberDashboard from "./pages/Members/MemberDashboard";

// Profile
import Profile from "./components/Profile/Profile";


// Dashboard paths
const dashboards = { admin: "/admin/dashboard", coach: "/coach/dashboard", member: "/member/dashboard" };

// Check first admin setup
function SetupRoute() {
    const { isSetup } = useAuth();
    if (isSetup === false) {
        return <Navigate to="/register" replace />;
    }
    return <Outlet />;
}

// Pages only for guests
function GuestRoute() {
    const { user } = useAuth();
    if (user) {
        return (
            <Navigate to={dashboards[user.role] || "/"} replace/>
        );
    }
    return <Outlet />;
}

// Authenticated 
function PrivateRoute({ requiredRole }) {
    const { user } = useAuth();
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
                        <Route path="dashboard" element={<AdminDashboard />}/>
                        <Route path="members" element={<MembersPage />} />
                        <Route path="coaches" element={<CoachesPage />} />
                        
                        <Route path=":section" element={<SectionPlaceholder />}/>




                    </Route>
                </Route>

                {/* COACH ROUTES */}
                <Route element={ <PrivateRoute requiredRole="coach" />}>
                    <Route path="/coach"element={<RoleLayout />}>
                        <Route index element={ <Navigate to="dashboard" replace /> }/>
                        <Route path="dashboard" element={<CoachDashboard />}/>


                        
                        <Route path=":section" element={<SectionPlaceholder />}/>
                    </Route>
                </Route>

                {/* MEMBER ROUTES */}
                <Route element={<PrivateRoute requiredRole="member" />}>
                    <Route path="/member" element={<RoleLayout />}>
                        <Route index element={ <Navigate to="dashboard" replace />}/>
                        <Route path="dashboard" element={<MemberDashboard />}/>
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
