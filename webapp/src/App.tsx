import React from 'react';
import './App.css';
import {Routes, Route} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import NodePage from './pages/NodePage';
import RequireAuth from './components/require_auth';
import {ROLES} from './types/users';
import VerifyPage from "./pages/VerifyPage";
import DoVerifyEmailPage from "./pages/DoVerifyEmailPage";
import ProfilePage from "./pages/ProfilePage";
import CarouselPage from './pages/CarouselPage';
import ContactUs from './pages/ContactUsPage';
import Terms from './pages/TermsPage';
import PrivacyPolicy from './pages/PrivacyPage';
import AboutUs from './pages/AboutUs';

function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage/>}/>
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/verify" element={<VerifyPage/>}/>
            <Route path="/do_verify_email" element={<DoVerifyEmailPage/>}/>
            <Route path="/contact" element={<ContactUs/>}/>
            <Route path="/terms" element={<Terms/>}/>
            <Route path="/privacy" element={<PrivacyPolicy/>}/>
            <Route path="/about" element={<AboutUs/>}/>
            <Route element={<RequireAuth allowedRoles={[ROLES.User]}/>}>
                <Route path="/nodes/:nodeID" element={<NodePage/>}/>
                <Route path="/welcome" element={<WelcomePage/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>
                <Route path="/carousel" element={<CarouselPage/>}/>
            </Route>
        </Routes>
    );
}

export default App;
