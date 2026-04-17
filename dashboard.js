document.addEventListener('DOMContentLoaded', function() {
    // Initialize all variables first
    let tasks = JSON.parse(localStorage.getItem('grevillea_tasks') || '[]');
    let currentCalendarDate = new Date();
    let selectedDate = new Date().toISOString().split('T')[0];
    let currentMiniCalendarDate = new Date();
    let miniCalendarTarget = null;
    
    // Pomodoro Timer variables
    let timerInterval = null;
    let timeLeft = 25 * 60;
    let isRunning = false;
    let studyTimeToday = parseInt(localStorage.getItem('grevillea_study_time') || '0');
    
    // DEFINE ALL FUNCTIONS
    
    function loadUserData() {
        const user = JSON.parse(localStorage.getItem('grevillea_user') || '{}');
        const avatar = document.getElementById('user-avatar');
        if (avatar && user.avatar) {
            avatar.textContent = user.avatar;
            avatar.style.fontSize = '24px';
        } else if (avatar && user.fullname) {
            const initials = user.fullname.split(' ').map(n => n[0]).join('').toUpperCase();
            avatar.textContent = initials.slice(0, 2);
        }
    }
    
    function generateCalendar() {
        const calendarDays = document.getElementById('calendar-days');
        const calendarMonth = document.getElementById('calendar-month');
        if (!calendarDays || !calendarMonth) return;
        
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        calendarMonth.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const today = new Date().toISOString().split('T')[0];
        
        let html = '';
        
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayTasks = tasks.filter(t => t.date === dateStr && !t.completed);
            const taskDots = dayTasks.map(() => '<div class="task-dot"></div>').join('');
            
            html += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
                    <span class="calendar-day-number">${day}</span>
                    <div class="calendar-day-tasks">${taskDots}</div>
                </div>
            `;
        }
        
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (firstDay + daysInMonth);
        
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month"><span class="calendar-day-number">${day}</span></div>`;
        }
        
        calendarDays.innerHTML = html;
        
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
            dayTasksList.innerHTML = `<div class="empty-state"><p>No tasks for this date.</p></div>`;
        } else {
            dayTasksList.innerHTML = dayTasks.map((task, idx) => `
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
    
    function renderTasks() {
        const taskList = document.getElementById('task-list');
        const taskCountDisplay = document.getElementById('task-count-display');
        if (!taskList) return;
        
        const unchecked = tasks.filter(t => !t.completed).length;
        if (taskCountDisplay) taskCountDisplay.textContent = `${unchecked} pending`;
        
        if (tasks.length === 0) {
            taskList.innerHTML = `<div class="empty-state"><p>No tasks yet. Add your first task below!</p></div>`;
        } else {
            taskList.innerHTML = tasks.map((task, index) => `
                <div class="task-item" data-index="${index}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text-editable ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
                    <span class="task-date-picker" data-index="${index}">${formatDisplayDate(task.date)}</span>
                    <span class="task-tag">${task.completed ? 'Done' : 'Pending'}</span>
                    <button class="task-delete" data-index="${index}" title="Delete task">×</button>
                </div>
            `).join('');
            
            taskList.querySelectorAll('.task-checkbox').forEach(cb => {
                cb.addEventListener('change', function() {
                    const index = parseInt(this.closest('.task-item').dataset.index);
                    tasks[index].completed = this.checked;
                    saveTasks();
                    renderTasks();
                    generateCalendar();
                    updateStats();
                });
            });
            
            taskList.querySelectorAll('.task-text-editable').forEach(textEl => {
                textEl.addEventListener('click', function() {
                    const index = parseInt(this.closest('.task-item').dataset.index);
                    this.contentEditable = true;
                    this.focus();
                    
                    const saveEdit = () => {
                        this.contentEditable = false;
                        const newText = this.textContent.trim();
                        if (newText && newText !== tasks[index].text) {
                            tasks[index].text = newText;
                            saveTasks();
                        }
                        renderTasks();
                    };
                    
                    this.addEventListener('blur', saveEdit, { once: true });
                    this.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            this.blur();
                        }
                    });
                });
            });
            
            taskList.querySelectorAll('.task-date-picker').forEach(dateEl => {
                dateEl.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.dataset.index);
                    showMiniCalendarForTask(index, this);
                });
            });
            
            taskList.querySelectorAll('.task-delete').forEach(delBtn => {
                delBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const index = parseInt(this.dataset.index);
                    if (confirm('Delete this task?')) {
                        tasks.splice(index, 1);
                        saveTasks();
                        renderTasks();
                        generateCalendar();
                        showTasksForDate(selectedDate);
                    }
                });
            });
        }
        updateStats();
    }
    
    function formatDisplayDate(dateStr) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y.slice(-2)}`;
    }
    
    function showMiniCalendarForTask(taskIndex, targetEl) {
        const existing = document.querySelector('.mini-calendar-popup');
        if (existing) existing.remove();
        
        // Reset to current month when opening
        currentMiniCalendarDate = new Date();
        
        const popup = document.createElement('div');
        popup.className = 'mini-calendar-popup';
        popup.id = 'mini-calendar-popup';
        popup.style.position = 'fixed';
        popup.style.zIndex = '1000';
        
        const rect = targetEl.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.bottom + 8) + 'px';
        
        renderMiniCalendarForTask(popup, taskIndex);
        document.body.appendChild(popup);
        
        // Attach outside click handler
        setTimeout(() => {
            document.addEventListener('click', outsideClickHandler);
        }, 100);
    }
    
    function outsideClickHandler(e) {
        const popup = document.getElementById('mini-calendar-popup');
        if (popup && !popup.contains(e.target)) {
            closeMiniCalendar();
            document.removeEventListener('click', outsideClickHandler);
        }
    }
    
    function renderMiniCalendarForTask(container, taskIndex) {
        const year = currentMiniCalendarDate.getFullYear();
        const month = currentMiniCalendarDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().toISOString().split('T')[0];
        const taskDate = tasks[taskIndex].date;
        
        let html = `
            <div class="mini-calendar-header">
                <button class="mini-prev">&lt;</button>
                <span>${monthNames[month]} ${year}</span>
                <button class="mini-next">&gt;</button>
            </div>
            <div class="mini-calendar-grid">
        `;
        
        for (let i = 0; i < firstDay; i++) html += '<div></div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === taskDate;
            html += `<div class="mini-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">${day}</div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
        
        // Use onclick instead of addEventListener to avoid accumulation
        const prevBtn = container.querySelector('.mini-prev');
        const nextBtn = container.querySelector('.mini-next');
        
        prevBtn.onclick = (e) => {
            e.stopPropagation();
            currentMiniCalendarDate.setMonth(currentMiniCalendarDate.getMonth() - 1);
            renderMiniCalendarForTask(container, taskIndex);
        };
        
        nextBtn.onclick = (e) => {
            e.stopPropagation();
            currentMiniCalendarDate.setMonth(currentMiniCalendarDate.getMonth() + 1);
            renderMiniCalendarForTask(container, taskIndex);
        };
        
        container.querySelectorAll('.mini-calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                e.stopPropagation();
                tasks[taskIndex].date = day.dataset.date;
                saveTasks();
                renderTasks();
                generateCalendar();
                closeMiniCalendar();
                document.removeEventListener('click', outsideClickHandler);
            });
        });
    }
    
    function closeMiniCalendar() {
        const popup = document.getElementById('mini-calendar-popup');
        if (popup) popup.remove();
    }
    
    function saveTasks() {
        localStorage.setItem('grevillea_tasks', JSON.stringify(tasks));
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function updateStats() {
        const unchecked = tasks.filter(t => !t.completed).length;
        const tasksCount = document.getElementById('tasks-count');
        if (tasksCount) tasksCount.textContent = unchecked;
    }
    
    // Format functions
    function formatDateDDMMYY(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear()).slice(-2);
        return `${d}/${m}/${y}`;
    }
    
    function parseDDMMYY(dateStr) {
        const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (!match) return null;
        const [, d, m, y] = match;
        const year = y.length === 2 ? (parseInt(y) < 50 ? 2000 + parseInt(y) : 1900 + parseInt(y)) : parseInt(y);
        return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    
    // Timer functions
    function updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    function startTimer() {
        if (!isRunning) {
            isRunning = true;
            const startBtn = document.querySelector('.btn-timer.primary');
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
        const startBtn = document.querySelector('.btn-timer.primary');
        if (startBtn) startBtn.textContent = 'Resume';
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = 25 * 60;
        const startBtn = document.querySelector('.btn-timer.primary');
        if (startBtn) startBtn.textContent = 'Start';
        updateTimerDisplay();
    }
    
    function updateStudyTimeDisplay() {
        const studyTimeEl = document.getElementById('study-time');
        if (studyTimeEl) {
            const hours = Math.floor(studyTimeToday / 3600);
            const mins = Math.floor((studyTimeToday % 3600) / 60);
            studyTimeEl.textContent = `${hours}h ${mins.toString().padStart(2, '0')}m`;
        }
    }
    
    // Task creation functions
    function addNewTask() {
        const newTaskInput = document.getElementById('new-task-input');
        const newTaskDate = document.getElementById('new-task-date');
        
        const text = newTaskInput.value.trim();
        const dateStr = newTaskDate.value.trim();
        
        const taskText = text || `Task ${tasks.length + 1}`;
        const taskDate = parseDDMMYY(dateStr) || selectedDate;
        
        tasks.push({
            text: taskText,
            completed: false,
            tag: 'General',
            date: taskDate,
            createdAt: new Date().toISOString()
        });
        
        saveTasks();
        renderTasks();
        generateCalendar();
        
        newTaskInput.value = '';
        newTaskInput.focus();
    }
    
    function renderMiniCalendarInput(popup, targetInput) {
        const year = currentMiniCalendarDate.getFullYear();
        const month = currentMiniCalendarDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date().toISOString().split('T')[0];
        const currentInputDate = parseDDMMYY(targetInput.value || '');
        
        let html = `
            <div class="mini-calendar-header">
                <button class="mini-prev">&lt;</button>
                <span>${monthNames[month]} ${year}</span>
                <button class="mini-next">&gt;</button>
            </div>
            <div class="mini-calendar-grid">
        `;
        
        for (let i = 0; i < firstDay; i++) html += '<div></div>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = dateStr === currentInputDate;
            html += `<div class="mini-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">${day}</div>`;
        }
        
        html += '</div>';
        popup.innerHTML = html;
        
        popup.querySelector('.mini-prev').onclick = (e) => {
            e.stopPropagation();
            currentMiniCalendarDate.setMonth(currentMiniCalendarDate.getMonth() - 1);
            renderMiniCalendarInput(popup, targetInput);
        };
        
        popup.querySelector('.mini-next').onclick = (e) => {
            e.stopPropagation();
            currentMiniCalendarDate.setMonth(currentMiniCalendarDate.getMonth() + 1);
            renderMiniCalendarInput(popup, targetInput);
        };
        
        popup.querySelectorAll('.mini-calendar-day').forEach(day => {
            day.onclick = (e) => {
                e.stopPropagation();
                const dateStr = day.dataset.date;
                const [y, m, d] = dateStr.split('-');
                targetInput.value = `${d}/${m}/${y.slice(-2)}`;
                closeMiniCalendar();
                document.removeEventListener('click', outsideClickHandlerInput);
            };
        });
    }
    
    function outsideClickHandlerInput(e) {
        const popup = document.getElementById('mini-calendar-popup');
        if (popup && !popup.contains(e.target)) {
            closeMiniCalendar();
            document.removeEventListener('click', outsideClickHandlerInput);
        }
    }
    
    function showMiniCalendar(targetInput) {
        const existing = document.querySelector('.mini-calendar-popup');
        if (existing) existing.remove();
        
        miniCalendarTarget = targetInput;
        currentMiniCalendarDate = new Date();
        
        const popup = document.createElement('div');
        popup.className = 'mini-calendar-popup';
        popup.id = 'mini-calendar-popup';
        popup.style.position = 'fixed';
        popup.style.zIndex = '1000';
        
        const rect = targetInput.getBoundingClientRect();
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.bottom + 8) + 'px';
        
        renderMiniCalendarInput(popup, targetInput);
        document.body.appendChild(popup);
        
        setTimeout(() => {
            document.addEventListener('click', outsideClickHandlerInput);
        }, 100);
    }
    
    // INITIALIZE
    loadUserData();
    generateCalendar();
    renderTasks();
    updateTimerDisplay();
    updateStudyTimeDisplay();
    
    // Setup event listeners
    const addTaskBtnInline = document.getElementById('add-task-btn');
    if (addTaskBtnInline) addTaskBtnInline.addEventListener('click', addNewTask);
    
    const newTaskInput = document.getElementById('new-task-input');
    if (newTaskInput) {
        newTaskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addNewTask();
        });
    }
    
    const newTaskDate = document.getElementById('new-task-date');
    if (newTaskDate) {
        newTaskDate.value = formatDateDDMMYY(new Date());
        newTaskDate.addEventListener('click', function(e) {
            e.stopPropagation();
            showMiniCalendar(this);
        });
    }
    
    const startBtn = document.querySelector('.btn-timer.primary');
    const resetBtn = document.querySelector('.btn-timer:not(.primary)');
    
    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
    
    document.getElementById('prev-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar();
    });
});
