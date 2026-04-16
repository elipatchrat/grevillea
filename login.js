document.addEventListener('DOMContentLoaded', async function() {
    const supabase = getSupabase();
    
    // Check for OAuth session (modern method using cookies/storage)
    if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
            const userId = session.user.id;
            
            // Check Supabase for profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            // Check if onboarding completed
            const onboardingCompleted = profile?.onboarding_completed === true || !!profile?.fullname;
            const fullname = profile?.fullname || session.user.user_metadata?.full_name || session.user.user_metadata?.name || null;
            
            setUser({
                id: userId,
                email: session.user.email,
                fullname: fullname,
                username: profile?.username || null,
                avatar: profile?.avatar || null,
                role: profile?.role || null,
                discovery: profile?.discovery_source || null,
                onboarding: onboardingCompleted
            });
            
            // Redirect based on onboarding status
            if (onboardingCompleted) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'onboarding.html';
            }
            return;
        }
    }
    
    // Redirect if already logged in
    if (isAuthenticated()) {
        const user = getUser();
        // Check if onboarding is completed
        if (user && user.onboarding === true) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'onboarding.html';
        }
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
            
            if (!supabase) {
                throw new Error('Unable to connect to authentication service. Please try again.');
            }

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

            // Check if onboarding is completed (has fullname AND onboarding_completed flag)
            const onboardingCompleted = profile?.onboarding_completed === true || !!profile?.fullname;
            
            // Save all profile data to localStorage
            setUser({
                id: data.user.id,
                email: data.user.email,
                fullname: profile?.fullname || null,
                username: profile?.username || null,
                avatar: profile?.avatar || null,
                role: profile?.role || null,
                discovery: profile?.discovery_source || null,
                onboarding: onboardingCompleted
            });

            // Redirect based on onboarding status
            const currentUser = getUser();
            if (currentUser?.onboarding) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'onboarding.html';
            }

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
                provider: 'google',
                options: {
                    redirectTo: 'https://grevillea.app/login.html'
                }
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
