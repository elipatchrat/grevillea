document.addEventListener('DOMContentLoaded', function() {
    // Task checkbox handling
    const taskCheckboxes = document.querySelectorAll('.task-checkbox');
    
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskText = this.nextElementSibling;
            if (this.checked) {
                taskText.classList.add('completed');
            } else {
                taskText.classList.remove('completed');
            }
            
            // Update stats
            updateTaskCount();
        });
    });
    
    function updateTaskCount() {
        const unchecked = document.querySelectorAll('.task-checkbox:not(:checked)').length;
        const statValue = document.querySelector('.stat-card:nth-child(3) .stat-value');
        if (statValue) {
            statValue.textContent = unchecked;
        }
    }
    
    // Pomodoro Timer
    let timerInterval = null;
    let timeLeft = 25 * 60; // 25 minutes in seconds
    let isRunning = false;
    
    const timerDisplay = document.querySelector('.timer-time');
    const startBtn = document.querySelector('.btn-timer.primary');
    const resetBtn = document.querySelector('.btn-timer:not(.primary)');
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function updateDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
    }
    
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            startBtn.textContent = 'Pause';
            
            timerInterval = setInterval(() => {
                timeLeft--;
                updateDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    startBtn.textContent = 'Start';
                    alert('Pomodoro session complete! Take a break.');
                    timeLeft = 25 * 60;
                    updateDisplay();
                }
            }, 1000);
        } else {
            pauseTimer();
        }
    }
    
    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = 'Resume';
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = 25 * 60;
        startBtn.textContent = 'Start';
        updateDisplay();
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    
    // Add task functionality
    const addTaskBtn = document.querySelector('.btn-add');
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            const taskList = document.querySelector('.task-list');
            
            const newTask = document.createElement('label');
            newTask.className = 'task-item';
            newTask.innerHTML = `
                <input type="checkbox" class="task-checkbox">
                <span class="task-text">New Task</span>
                <span class="task-tag">General</span>
            `;
            
            // Insert before the button
            taskList.insertBefore(newTask, addTaskBtn);
            
            // Add event listener to new checkbox
            const newCheckbox = newTask.querySelector('.task-checkbox');
            newCheckbox.addEventListener('change', function() {
                const taskText = this.nextElementSibling;
                if (this.checked) {
                    taskText.classList.add('completed');
                } else {
                    taskText.classList.remove('completed');
                }
                updateTaskCount();
            });
            
            // Make text editable
            const taskText = newTask.querySelector('.task-text');
            taskText.contentEditable = true;
            taskText.focus();
            
            taskText.addEventListener('blur', function() {
                this.contentEditable = false;
                if (this.textContent.trim() === '') {
                    this.textContent = 'New Task';
                }
            });
            
            taskText.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
            
            updateTaskCount();
        });
    }
    
    // Note item click handler
    const noteItems = document.querySelectorAll('.note-item');
    
    noteItems.forEach(item => {
        item.addEventListener('click', function() {
            alert('Note editor would open here');
        });
    });
    
    // Calendar day click
    const dayColumns = document.querySelectorAll('.day-column');
    
    dayColumns.forEach(day => {
        day.addEventListener('click', function() {
            dayColumns.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
