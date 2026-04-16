document.addEventListener('DOMContentLoaded', function() {
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

        // Full name validation
        if (inputs.fullname.value.trim().length < 2) {
            showError('fullname', 'Please enter your full name');
            isValid = false;
        }

        // Email validation
        if (!validateEmail(inputs.email.value)) {
            showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (inputs.password.value.length < 8) {
            showError('password', 'Password must be at least 8 characters');
            isValid = false;
        }

        // Confirm password validation
        if (inputs.password.value !== inputs.confirmPassword.value) {
            showError('confirmPassword', 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        if (!inputs.terms.checked) {
            showError('terms', 'You must agree to the Terms of Service');
            isValid = false;
        }

        return isValid;
    }

    // Real-time validation on blur
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

    // Clear errors on input
    Object.keys(inputs).forEach(field => {
        if (field === 'terms') {
            inputs[field].addEventListener('change', () => clearError(field));
        } else {
            inputs[field].addEventListener('input', () => clearError(field));
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            // Show loading state
            const submitBtn = form.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            // Simulate API call
            setTimeout(() => {
                // Hide form and show success
                form.style.display = 'none';
                document.querySelector('.divider').style.display = 'none';
                document.querySelector('.social-login').style.display = 'none';
                
                const successDiv = document.createElement('div');
                successDiv.className = 'success-message visible';
                successDiv.innerHTML = `
                    <div class="success-icon"></div>
                    <h2>Welcome to Grevillea!</h2>
                    <p>Your account has been created successfully. Check your email to verify your account.</p>
                    <button class="btn-primary" onclick="location.reload()">Continue to Dashboard</button>
                `;
                
                document.querySelector('.signup-card').appendChild(successDiv);
            }, 1500);
        }
    });
});
