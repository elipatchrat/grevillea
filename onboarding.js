document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    const totalSteps = 3;
    let selectedAvatar = '🎓';
    let userData = {
        fullname: '',
        username: '',
        avatar: '🎓',
        role: '',
        discovery: ''
    };

    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedAvatar = this.dataset.avatar;
            userData.avatar = selectedAvatar;
        });
    });

    // Step 1: Profile form
    document.getElementById('profile-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value.trim();
        const username = document.getElementById('username').value.trim();
        const errorEl = document.getElementById('fullname-error');

        if (fullname.length < 2) {
            errorEl.textContent = 'Please enter your full name';
            errorEl.classList.add('visible');
            document.getElementById('fullname').classList.add('error');
            return;
        }

        errorEl.classList.remove('visible');
        document.getElementById('fullname').classList.remove('error');

        userData.fullname = fullname;
        userData.username = username || fullname.split(' ')[0].toLowerCase();

        // Save to user
        const user = getUser();
        if (user) {
            user.fullname = fullname;
            user.username = userData.username;
            user.avatar = selectedAvatar;
            setUser(user);
        }

        nextStep();
    });

    // Step 2: Role form
    document.getElementById('role-form')?.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get selected role
        const selectedRole = document.querySelector('input[name="role"]:checked');
        const roleError = document.getElementById('role-error');

        if (!selectedRole) {
            roleError.textContent = 'Please select your role';
            roleError.classList.add('visible');
            return;
        }

        roleError.classList.remove('visible');

        // Get discovery source
        const selectedDiscovery = document.querySelector('input[name="discovery"]:checked');

        userData.role = selectedRole.value;
        userData.discovery = selectedDiscovery ? selectedDiscovery.value : null;

        // Save role/discovery to user
        const user = getUser();
        if (user) {
            user.role = userData.role;
            user.discovery = userData.discovery;
            setUser(user);

            // Save to Supabase if available
            const supabase = getSupabase();
            if (supabase) {
                supabase.from('profiles').upsert({
                    id: user.id,
                    fullname: user.fullname,
                    username: user.username,
                    avatar: user.avatar,
                    role: userData.role,
                    discovery_source: userData.discovery,
                    updated_at: new Date().toISOString()
                });
            }
        }

        nextStep();
    });

    function nextStep() {
        if (currentStep < totalSteps) {
            // Hide current step
            document.getElementById(`step-${currentStep}`).classList.remove('active');
            
            // Mark current step as completed
            const currentProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
            currentProgressStep.classList.remove('active');
            currentProgressStep.classList.add('completed');
            
            // Update progress line
            const progressLines = document.querySelectorAll('.progress-line');
            if (currentStep <= progressLines.length) {
                progressLines[currentStep - 1].classList.add('completed');
            }
            
            // Show next step
            currentStep++;
            document.getElementById(`step-${currentStep}`).classList.add('active');
            
            // Activate next progress step
            const nextProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
            nextProgressStep.classList.add('active');
        }
    }

    window.prevStep = function() {
        if (currentStep > 1) {
            // Hide current step
            document.getElementById(`step-${currentStep}`).classList.remove('active');
            
            // Remove active from current progress step
            const currentProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
            currentProgressStep.classList.remove('active');
            
            // Go back
            currentStep--;
            
            // Show previous step
            document.getElementById(`step-${currentStep}`).classList.add('active');
            
            // Update progress - uncomplete current step
            const prevProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
            prevProgressStep.classList.remove('completed');
            prevProgressStep.classList.add('active');
            
            // Update progress line
            const progressLines = document.querySelectorAll('.progress-line');
            if (currentStep <= progressLines.length) {
                progressLines[currentStep - 1].classList.remove('completed');
            }
        }
    };

    window.finishOnboarding = async function() {
        const user = getUser();
        if (user) {
            user.onboarding = true;
            setUser(user);

            // Update Supabase if available
            const supabase = getSupabase();
            if (supabase) {
                await supabase.from('profiles').upsert({
                    id: user.id,
                    fullname: user.fullname,
                    username: user.username,
                    avatar: user.avatar,
                    role: user.role,
                    discovery_source: user.discovery,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                });
            }
        }

        window.location.href = 'dashboard.html';
    };

    // Clear error on input
    document.getElementById('fullname')?.addEventListener('input', function() {
        document.getElementById('fullname-error').classList.remove('visible');
        this.classList.remove('error');
    });
});
