import React, {lazy, Suspense} from 'react';
import './App.css';
import {Routes, Route} from 'react-router-dom';

import RequireAuth from './components/require_auth';
import {ROLES} from './types/users';
import GuestLayout from './GuestLayout';
import UserLayout from './UserLayout';
import DashboardLayout from './components/dashboard/dashboard_layout';
import NotFoundPage from './pages/NotFoundPage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const NodePage = lazy(() => import('./pages/NodePage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const DoVerifyEmailPage = lazy(() => import('./pages/DoVerifyEmailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CarouselPage = lazy(() => import('./pages/CarouselPage'));
const ContactUs = lazy(() => import('./pages/ContactUsPage'));
const Terms = lazy(() => import('./pages/TermsPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPage'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const KarelPage = lazy(() => import('./pages/KarelPage'));
const AITutorChat = lazy(() => import('./components/bot/ai_tutor_chat'));
const Overview = lazy(() => import('./components/overview/overview'));
const Graph = lazy(() => import('./components/dashboard/graph'));
const Calculus = lazy(() => import('./components/experiments/calculus'));
const Thanks = lazy(() => import('./components/experiments/thanks'));
const Javascript = lazy(() => import('./components/experiments/javascript'));
const Engineer = lazy(() => import('./components/experiments/engineer'));
const Management = lazy(() => import('./components/experiments/management'));



const Home = lazy(() => import('./Home'));


function App() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="" element={<UserLayout/>}>
                    <Route path="" element={<Home/>}/>
                </Route>

                <Route path="" element={<GuestLayout/>}>
                    <Route path="login" element={<LoginPage/>}/>
                    <Route path="register" element={<RegisterPage/>}/>
                    <Route path="verify" element={<VerifyPage/>}/>
                    <Route path="do_verify_email" element={<DoVerifyEmailPage/>}/>
                    <Route path="contact" element={<ContactUs/>}/>
                    <Route path="terms" element={<Terms/>}/>
                    <Route path="privacy" element={<PrivacyPolicy/>}/>
                    <Route path="about" element={<AboutUs/>}/>
                </Route>
                <Route element={<RequireAuth allowedRoles={[ROLES.User, ROLES.Admin]}/>}>
                    <Route path="" element={<UserLayout/>}>
                        <Route path="/nodes/:nodeID" element={<NodePage/>}/>
                        <Route path="/welcome" element={<WelcomePage/>}/>
                        <Route path="/profile" element={<ProfilePage/>}/>
                        <Route path="/carousel" element={<CarouselPage/>}/>
                        <Route path="/karel_js" element={<KarelPage lang='js'/>}/>
                        <Route path="/karel_java" element={<KarelPage lang='java'/>}/>
                    </Route>
                    <Route path="dashboard" element={<DashboardLayout/>}>
                        <Route path="" element={<Overview/>}/>
                        <Route path="ai-tutor" element={<AITutorChat/>}/>
                        <Route path="graph" element={<Graph/>}/>
                    </Route>
                </Route>
                <Route path="experiments">
                    <Route path="thanks" element={<Thanks/>}/>
                    <Route path="calculus" element={<Calculus/>}/>
                    <Route path="javascript" element={<Javascript/>}/>
                    <Route path="engineer" element={<Engineer/>}/>
                    <Route path="management" element={<Management/>}/>
                </Route>
                <Route element={<RequireAuth allowedRoles={[ROLES.Admin]}/>}>
                    <Route path="/admin" element={<AdminPage/>}/>
                    <Route path="/graph/:userID" element={<GraphPage/>}/>
                </Route>
                <Route path="*" element={<NotFoundPage/>} />
            </Routes>
        </Suspense>
    );
}

export default App;
