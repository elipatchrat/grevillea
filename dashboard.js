document.addEventListener('DOMContentLoaded', function() {
    // Load user data and update UI
    loadUserData();
    
    // Generate calendar week view
    generateWeekView();
    
    // Task management
    let tasks = JSON.parse(localStorage.getItem('grevillea_tasks') || '[]');
    renderTasks();
    
    function renderTasks() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks yet. Add your first task to get started!</p>
                </div>
            `;
        } else {
            taskList.innerHTML = tasks.map((task, index) => `
                <label class="task-item">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-index="${index}">
                    <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                    <span class="task-tag">${escapeHtml(task.tag || 'General')}</span>
                </label>
            `).join('');
            
            // Add event listeners
            taskList.querySelectorAll('.task-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    const index = parseInt(this.dataset.index);
                    tasks[index].completed = this.checked;
                    saveTasks();
                    renderTasks();
                    updateStats();
                });
            });
        }
        
        updateStats();
    }
    
    function saveTasks() {
        localStorage.setItem('grevillea_tasks', JSON.stringify(tasks));
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Add task functionality
    const addTaskBtn = document.querySelector('.tasks-card .btn-add');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function() {
            const taskText = prompt('Enter task name:');
            if (taskText && taskText.trim()) {
                tasks.push({
                    text: taskText.trim(),
                    completed: false,
                    tag: 'General',
                    createdAt: new Date().toISOString()
                });
                saveTasks();
                renderTasks();
            }
        });
    }
    
    function updateStats() {
        const unchecked = tasks.filter(t => !t.completed).length;
        const tasksCount = document.getElementById('tasks-count');
        if (tasksCount) {
            tasksCount.textContent = unchecked;
        }
    }
    
    // Pomodoro Timer
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let isRunning = false;
    let studyTimeToday = parseInt(localStorage.getItem('grevillea_study_time') || '0');
    
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.querySelector('.btn-timer.primary');
    const resetBtn = document.querySelector('.btn-timer:not(.primary)');
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function formatStudyTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    
    function updateTimerDisplay() {
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timeLeft);
        }
    }
    
    function updateStudyTimeDisplay() {
        const studyTimeEl = document.getElementById('study-time');
        if (studyTimeEl) {
            studyTimeEl.textContent = formatStudyTime(studyTimeToday);
        }
    }
    
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            if (startBtn) startBtn.textContent = 'Pause';
            
            timerInterval = setInterval(() => {
                timeLeft--;
                studyTimeToday++;
                updateTimerDisplay();
                updateStudyTimeDisplay();
                localStorage.setItem('grevillea_study_time', studyTimeToday.toString());
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    if (startBtn) startBtn.textContent = 'Start';
                    alert('Pomodoro session complete! Take a break.');
                    timeLeft = 25 * 60;
                    updateTimerDisplay();
                }
            }, 1000);
        } else {
            pauseTimer();
        }
    }
    
    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        if (startBtn) startBtn.textContent = 'Resume';
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = 25 * 60;
        if (startBtn) startBtn.textContent = 'Start';
        updateTimerDisplay();
    }
    
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    
    updateTimerDisplay();
    updateStudyTimeDisplay();
    
    // Notes functionality
    let notes = JSON.parse(localStorage.getItem('grevillea_notes') || '[]');
    renderNotes();
    
    function renderNotes() {
        const notesList = document.getElementById('notes-list');
        if (!notesList) return;
        
        if (notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <p>No notes yet. Create your first study note!</p>
                </div>
            `;
        } else {
            notesList.innerHTML = notes.map(note => `
                <div class="note-item" data-id="${note.id}">
                    <div class="note-icon">${note.icon || '📝'}</div>
                    <div class="note-content">
                        <h4>${escapeHtml(note.title)}</h4>
                        <p>${escapeHtml(note.preview)}</p>
                        <span class="note-meta">${escapeHtml(note.subject || 'General')} • ${formatDate(note.createdAt)}</span>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            notesList.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', function() {
                    const noteId = this.dataset.id;
                    const note = notes.find(n => n.id === noteId);
                    if (note) {
                        alert(`Note: ${note.title}\n\n${note.content}`);
                    }
                });
            });
        }
        
        // Update notes count
        const notesCount = document.getElementById('notes-count');
        if (notesCount) {
            notesCount.textContent = notes.length;
        }
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    }
    
    // Calendar functionality
    function generateWeekView() {
        const weekView = document.getElementById('week-view');
        if (!weekView) return;
        
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday
        const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to get Monday
        const monday = new Date(today.setDate(diff));
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        
        weekView.innerHTML = days.map((day, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            const dayNumber = date.getDate();
            const isToday = index === todayIndex;
            
            return `
                <div class="day-column ${isToday ? 'active' : ''}" data-date="${date.toISOString().split('T')[0]}">
                    <span class="day-label">${day}</span>
                    <span class="day-number">${dayNumber}</span>
                    <div class="day-dot ${isToday ? 'active' : ''}"></div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        weekView.querySelectorAll('.day-column').forEach(day => {
            day.addEventListener('click', function() {
                weekView.querySelectorAll('.day-column').forEach(d => d.classList.remove('active'));
                weekView.querySelectorAll('.day-dot').forEach(d => d.classList.remove('active'));
                this.classList.add('active');
                this.querySelector('.day-dot').classList.add('active');
            });
        });
    }
    
    // Load user data
    function loadUserData() {
        const user = JSON.parse(localStorage.getItem('grevillea_user') || '{}');
        
        // Update avatar
        const avatar = document.getElementById('user-avatar');
        if (avatar && user.avatar) {
            avatar.textContent = user.avatar;
            avatar.style.fontSize = '24px';
        } else if (avatar && user.fullname) {
            const initials = user.fullname.split(' ').map(n => n[0]).join('').toUpperCase();
            avatar.textContent = initials.slice(0, 2);
        }
    }
});
