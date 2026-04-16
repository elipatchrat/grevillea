// Authentication utilities

const AUTH_KEY = 'grevillea_user';

function setUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function getUser() {
    const user = localStorage.getItem(AUTH_KEY);
    return user ? JSON.parse(user) : null;
}

function clearUser() {
    localStorage.removeItem(AUTH_KEY);
}

function isAuthenticated() {
    return !!getUser();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    clearUser();
    const supabase = getSupabase();
    if (supabase) {
        supabase.auth.signOut();
    }
    window.location.href = 'login.html';
}

function updateUIForUser() {
    const user = getUser();
    if (!user) return;
    
    // Update avatar with initials
    const avatar = document.getElementById('user-avatar') || document.querySelector('.avatar');
    if (avatar && user.fullname) {
        const initials = user.fullname.split(' ').map(n => n[0]).join('').toUpperCase();
        avatar.textContent = initials.slice(0, 2);
    }
}
