document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const submitBtn = form.querySelector('.btn-primary');

    function showError(element, message) {
        element.textContent = message;
        element.classList.add('visible');
        element.previousElementSibling?.classList.add('error');
    }

    function clearErrors() {
        emailError.classList.remove('visible');
        passwordError.classList.remove('visible');
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async function handleLogin(e) {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let hasError = false;

        if (!email || !validateEmail(email)) {
            showError(emailError, 'Please enter a valid email address');
            hasError = true;
        }

        if (!password) {
            showError(passwordError, 'Please enter your password');
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            const supabase = getSupabase();
            
            if (supabase) {
                // Try Supabase auth
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                // Get user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    fullname: profile?.fullname || email.split('@')[0]
                });
            } else {
                // Demo mode - simulate login
                await new Promise(r => setTimeout(r, 1000));
                
                // Check for demo user
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                const user = demoUsers.find(u => u.email === email);
                
                if (!user || user.password !== password) {
                    throw new Error('Invalid email or password');
                }

                setUser({
                    id: user.id,
                    email: user.email,
                    fullname: user.fullname
                });
            }

            // Redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
            
            // Show generic error on password field
            showError(passwordError, error.message || 'Invalid email or password');
        }
    }

    form.addEventListener('submit', handleLogin);

    // Social login handlers
    document.getElementById('google-signin')?.addEventListener('click', async function() {
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google'
            });
            if (error) alert('Google sign in failed: ' + error.message);
        } else {
            alert('Social login requires Supabase configuration');
        }
    });

    document.getElementById('microsoft-signin')?.addEventListener('click', async function() {
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'azure'
            });
            if (error) alert('Microsoft sign in failed: ' + error.message);
        } else {
            alert('Social login requires Supabase configuration');
        }
    });

    // Real-time validation
    emailInput.addEventListener('blur', function() {
        if (this.value && !validateEmail(this.value)) {
            showError(emailError, 'Please enter a valid email address');
        } else {
            emailError.classList.remove('visible');
            this.classList.remove('error');
        }
    });

    // Clear errors on input
    emailInput.addEventListener('input', function() {
        emailError.classList.remove('visible');
        this.classList.remove('error');
    });

    passwordInput.addEventListener('input', function() {
        passwordError.classList.remove('visible');
        this.classList.remove('error');
    });
});
