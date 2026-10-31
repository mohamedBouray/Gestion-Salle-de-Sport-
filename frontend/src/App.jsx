import {Routes,Route,Navigate,Outlet,} from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";

import LandingPage from "./pages/landing/LandingPage";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import CoachDashboard from "./pages/coach/CoachDashboard";
import MemberDashboard from "./pages/members/MemberDashboard";


import Profile from "./pages/profile/Profile";

// Dashboard paths
const dashboards = {
    admin: "/admin/dashboard",
    coach: "/coach/dashboard",
    member: "/member/dashboard",
};

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
        return ( <Navigate to={dashboards[user.role] || "/"} replace />);
    }
    return <Outlet />;
}

// Authenticated + correct role
function PrivateRoute({ requiredRole }) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status !== "active") {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return ( <Navigate to={dashboards[user.role] || "/"} replace/> );
    }
    return <Outlet />;
}

function DashboardRedirect() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return (
        <Navigate to={dashboards[user.role] || "/"} replace/>
    );
}

function AppRoutes() {
    return (
        <Routes>
            {/* FIRST ADMIN REGISTRATION */}
            <Route path="/register" element={ <GuestRoute /> }>
                <Route index element={<Register />} />
            </Route>
            <Route path="/forgot-password" element={<ForgotPassword />}/>
            <Route path="/reset-password/:token" element={<ResetPassword />}/>

            {/* APPLICATION ROUTES */}
            <Route element={<SetupRoute />}>
                {/* PUBLIC LANDING */}
                <Route  path="/" element={<LandingPage />}/>

                {/* LOGIN */}
                <Route element={<GuestRoute />}>
                    <Route path="/login" element={<Login />}/>
                </Route>

                {/* DASHBOARD REDIRECT */}
                <Route path="/dashboard" element={<DashboardRedirect />}/>

                {/* PROFILE - ADMIN, COACH, MEMBER */}
                <Route element={<PrivateRoute />}>
                    <Route path="/profile" element={<Profile />}/>
                </Route>
                
                {/* ADMIN */}
                <Route element={<PrivateRoute requiredRole="admin" />}>
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />
                </Route>

                {/* COACH */}
                <Route element={<PrivateRoute requiredRole="coach" />}>
                    <Route
                        path="/coach/dashboard"
                        element={<CoachDashboard />}
                    />
                </Route>

                {/* MEMBER */}
                <Route element={<PrivateRoute requiredRole="member" />}>
                    <Route
                        path="/member/dashboard"
                        element={<MemberDashboard />}
                    />
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
