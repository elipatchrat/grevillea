document.addEventListener('DOMContentLoaded', function() {
    // Load user data and update UI
    loadUserData();
    
    // Generate full month calendar
    generateCalendar();
    
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
                const dateInput = prompt('Due date (YYYY-MM-DD) or leave empty for today:', selectedDate);
                const taskDate = dateInput && dateInput.match(/^\d{4}-\d{2}-\d{2}$/) ? dateInput : selectedDate;
                
                tasks.push({
                    text: taskText.trim(),
                    completed: false,
                    tag: 'General',
                    date: taskDate,
                    createdAt: new Date().toISOString()
                });
                saveTasks();
                renderTasks();
                generateCalendar();
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
    let currentCalendarDate = new Date();
    let selectedDate = new Date().toISOString().split('T')[0];
    
    function generateCalendar() {
        const calendarDays = document.getElementById('calendar-days');
        const calendarMonth = document.getElementById('calendar-month');
        if (!calendarDays || !calendarMonth) return;
        
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        
        // Update month title
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[month]} ${year}`;
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        
        const today = new Date().toISOString().split('T')[0];
        
        let html = '';
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            
            // Get tasks for this date
            const dayTasks = tasks.filter(t => t.date === dateStr && !t.completed);
            const taskDots = dayTasks.map(() => '<div class="task-dot"></div>').join('');
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    <div class="calendar-day-tasks">${taskDots}</div>
                </div>
            `;
        }
        
        // Next month days to fill grid (6 rows x 7 cols = 42 cells)
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (firstDay + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        calendarDays.innerHTML = html;
        
        // Add click handlers
        calendarDays.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
            day.addEventListener('click', function() {
                selectedDate = this.dataset.date;
                generateCalendar();
                showTasksForDate(selectedDate);
            });
        });
        
        showTasksForDate(selectedDate);
    }
    
    function showTasksForDate(dateStr) {
        const dayTasksList = document.getElementById('day-tasks-list');
        const selectedDateSpan = document.getElementById('selected-date');
        if (!dayTasksList || !selectedDateSpan) return;
        
        selectedDateSpan.textContent = new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric' 
        });
        
        const dayTasks = tasks.filter(t => t.date === dateStr);
        
        if (dayTasks.length === 0) {
            dayTasksList.innerHTML = `
                <div class="empty-state">
                    <p>No tasks for this date.</p>
                </div>
            `;
        } else {
            dayTasksList.innerHTML = dayTasks.map((task, index) => `
                <label class="task-item">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-index="${tasks.indexOf(task)}">
                    <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                    <span class="task-tag">${task.completed ? 'Done' : 'Pending'}</span>
                </label>
            `).join('');
            
            dayTasksList.querySelectorAll('.task-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    const taskIndex = parseInt(this.dataset.index);
                    tasks[taskIndex].completed = this.checked;
                    saveTasks();
                    generateCalendar();
                    renderTasks();
                    showTasksForDate(selectedDate);
                });
            });
        }
    }
    
    // Month navigation
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar();
    });
    
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
