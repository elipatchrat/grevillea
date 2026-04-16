document.addEventListener('DOMContentLoaded', function() {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('signup-form');
    const inputs = {
        fullname: document.getElementById('fullname'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirm-password'),
        terms: document.getElementById('terms')
    };

    const errors = {
        fullname: document.getElementById('fullname-error'),
        email: document.getElementById('email-error'),
        password: document.getElementById('password-error'),
        confirmPassword: document.getElementById('confirm-password-error'),
        terms: document.getElementById('terms-error')
    };

    function showError(field, message) {
        inputs[field].classList.add('error');
        errors[field].textContent = message;
        errors[field].classList.add('visible');
    }

    function clearError(field) {
        inputs[field].classList.remove('error');
        errors[field].classList.remove('visible');
    }

    function clearAllErrors() {
        Object.keys(inputs).forEach(field => clearError(field));
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validateForm() {
        let isValid = true;
        clearAllErrors();

        if (inputs.fullname.value.trim().length < 2) {
            showError('fullname', 'Please enter your full name');
            isValid = false;
        }

        if (!validateEmail(inputs.email.value)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        if (inputs.password.value.length < 8) {
            showError('password', 'Password must be at least 8 characters');
            isValid = false;
        }

        if (inputs.password.value !== inputs.confirmPassword.value) {
            showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        if (!inputs.terms.checked) {
            showError('terms', 'You must agree to the Terms of Service');
            isValid = false;
        }

        return isValid;
    }

    // Real-time validation
    inputs.fullname.addEventListener('blur', () => {
        if (inputs.fullname.value.trim().length > 0 && inputs.fullname.value.trim().length < 2) {
            showError('fullname', 'Please enter your full name');
        } else {
            clearError('fullname');
        }
    });

    inputs.email.addEventListener('blur', () => {
        if (inputs.email.value && !validateEmail(inputs.email.value)) {
            showError('email', 'Please enter a valid email address');
        } else {
            clearError('email');
        }
    });

    inputs.password.addEventListener('blur', () => {
        if (inputs.password.value && inputs.password.value.length < 8) {
            showError('password', 'Password must be at least 8 characters');
        } else {
            clearError('password');
        }
    });

    inputs.confirmPassword.addEventListener('blur', () => {
        if (inputs.confirmPassword.value && inputs.password.value !== inputs.confirmPassword.value) {
            showError('confirmPassword', 'Passwords do not match');
        } else {
            clearError('confirmPassword');
        }
    });

    Object.keys(inputs).forEach(field => {
        if (field === 'terms') {
            inputs[field].addEventListener('change', () => clearError(field));
        } else {
            inputs[field].addEventListener('input', () => clearError(field));
        }
    });

    async function handleSignup(e) {
        e.preventDefault();

        if (!validateForm()) return;

        const submitBtn = form.querySelector('.btn-primary');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            const fullname = inputs.fullname.value.trim();
            const email = inputs.email.value.trim();
            const password = inputs.password.value;

            const supabase = getSupabase();

            if (supabase) {
                // Supabase signup
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            fullname: fullname
                        }
                    }
                });

                if (error) throw error;

                // Create profile in database
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        fullname: fullname,
                        email: email,
                        created_at: new Date().toISOString()
                    }]);

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                }

                setUser({
                    id: data.user.id,
                    email: data.user.email,
                    fullname: fullname
                });
            } else {
                // Demo mode - store in localStorage
                await new Promise(r => setTimeout(r, 1000));
                
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                
                if (demoUsers.find(u => u.email === email)) {
                    throw new Error('An account with this email already exists');
                }

                const newUser = {
                    id: 'demo_' + Date.now(),
                    email: email,
                    fullname: fullname,
                    password: password
                };

                demoUsers.push(newUser);
                localStorage.setItem('demo_users', JSON.stringify(demoUsers));

                setUser({
                    id: newUser.id,
                    email: email,
                    fullname: fullname
                });
            }

            // Show success
            form.style.display = 'none';
            document.querySelector('.divider').style.display = 'none';
            document.querySelector('.social-login').style.display = 'none';
            
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message visible';
            successDiv.innerHTML = `
                <div class="success-icon"></div>
                <h2>Welcome to Grevillea!</h2>
                <p>Your account has been created successfully. ${supabase ? 'Check your email to verify your account.' : ''}</p>
                <button class="btn-primary" onclick="window.location.href='dashboard.html'">Continue to Dashboard</button>
            `;
            
            document.querySelector('.signup-card').appendChild(successDiv);

        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
            
            if (error.message.includes('email')) {
                showError('email', error.message);
            } else if (error.message.includes('password')) {
                showError('password', error.message);
            } else {
                showError('email', error.message || 'Failed to create account. Please try again.');
            }
        }
    }

    form.addEventListener('submit', handleSignup);

    // Social signup handlers
    document.querySelector('.btn-social.google')?.addEventListener('click', async function() {
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard.html'
                }
            });
            if (error) alert('Google sign up failed: ' + error.message);
        } else {
            alert('Social login requires Supabase configuration');
        }
    });

    document.querySelector('.btn-social.microsoft')?.addEventListener('click', async function() {
        const supabase = getSupabase();
        if (supabase) {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'azure'
            });
            if (error) alert('Microsoft sign up failed: ' + error.message);
        } else {
            alert('Social login requires Supabase configuration');
        }
    });
});
