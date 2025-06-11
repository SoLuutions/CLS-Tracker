// Data storage with persistence
let tasks = {
    gary: [],
    falesha: [],
    lawrence: [],
    vconnx: [],
    other: []
};

// Calendar state
let currentCalendarDate = new Date();
let selectedDate = new Date();

// Helper function to get normalized shift date
function getShiftDate(date) {
    const d = new Date(date);
    const hour = d.getHours();
    if (hour < 4) d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Initialize date display with shift information
function updateDate() {
    const now = selectedDate;
    const hour = now.getHours();
    let shiftDate = new Date(now);
    let shiftIndicator = "";
    
    // Adjust date based on shift (8pm-4am)
    if (hour >= 20 || hour < 4) {
        // Night shift - date should be previous day if it's after midnight
        if (hour < 4) {
            shiftDate.setDate(shiftDate.getDate() - 1);
        }
        shiftIndicator = "🌙 Night Shift (8pm-4am)";
    } else {
        shiftIndicator = "☀️ Day Shift (9am-5pm)";
    }
    
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('currentDate').textContent = 
        `${shiftDate.toLocaleDateString('en-US', options)} | ${shiftIndicator}`;
}

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('taskTrackerData');
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
            // Convert date strings to Date objects
            for (const client in tasks) {
                tasks[client] = tasks[client].map(task => {
                    if (task.createdAt) task.createdAt = new Date(task.createdAt);
                    if (task.completedAt) task.completedAt = new Date(task.completedAt);
                    if (task.dueDate) task.dueDate = new Date(task.dueDate);
                    return task;
                });
            }
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
            alert('Failed to load tasks. Resetting to default.');
            resetTasks();
        }
    }
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem('taskTrackerData', JSON.stringify(tasks));
    } catch (e) {
        console.error('Error saving tasks to localStorage:', e);
        alert('Failed to save tasks. Check storage space.');
    }
}

// Toggle calendar visibility
function toggleCalendar() {
    const calendar = document.getElementById('calendarContainer');
    calendar.style.display = calendar.style.display === 'block' ? 'none' : 'block';
    if (calendar.style.display === 'block') {
        renderCalendar(currentCalendarDate);
    }
}

// Render calendar
function renderCalendar(date) {
    const monthYearElement = document.getElementById('calendarMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    
    // Set month/year header
    monthYearElement.textContent = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Create day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.textContent = day;
        dayElement.style.fontWeight = 'bold';
        dayElement.style.textAlign = 'center';
        calendarGrid.appendChild(dayElement);
    });
    
    // Get first day of month and last day of month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Add empty cells for days before first day
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add days
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = i;
        
        // Highlight today
        const today = new Date();
        if (date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear() && 
            i === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Highlight selected date
        if (date.getMonth() === selectedDate.getMonth() && 
            date.getFullYear() === selectedDate.getFullYear() && 
            i === selectedDate.getDate()) {
            dayElement.classList.add('selected');
        }
        
        dayElement.addEventListener('click', () => {
            selectedDate = new Date(date.getFullYear(), date.getMonth(), i);
            updateDate();
            renderAllTasks();  // Refresh tasks for new date
            toggleCalendar();
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

// Navigate calendar months
document.getElementById('prevMonth').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar(currentCalendarDate);
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar(currentCalendarDate);
});

// Toggle add task form
function toggleAddForm(client) {
    const form = document.getElementById(`add-form-${client}`);
    const isVisible = form.classList.contains('show');
    
    // Hide all forms first
    document.querySelectorAll('.add-task-form').forEach(f => f.classList.remove('show'));
    
    if (!isVisible) {
        form.classList.add('show');
        document.getElementById(`title-${client}`).focus();
    }
}

function addTask(client) {
    const titleInput = document.getElementById(`title-${client}`);
    const tagsInput = document.getElementById(`tags-${client}`);
    const priorityInput = document.getElementById(`priority-${client}`);
    const dueDateInput = document.getElementById(`dueDate-${client}`);
    const linkInput = document.getElementById(`link-${client}`);
    
    const title = titleInput.value.trim();
    const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
    const link = linkInput.value.trim();
    
    if (!title) {
        alert('Task title is required!');
        titleInput.focus();
        return;
    }
    
    const taskId = `custom-${client}-${Date.now()}`;
    const task = {
        id: taskId,
        title: title,
        tags: tags,
        priority: priority,
        dueDate: dueDate,
        link: link,
        status: 'pending',
        createdAt: new Date(),
        completedAt: null
    };
    
    tasks[client].push(task);
    renderTask(client, task);
    saveTasks();
    
    // Reset form
    titleInput.value = '';
    tagsInput.value = '';
    dueDateInput.value = '';
    linkInput.value = '';
    document.getElementById(`add-form-${client}`).classList.remove('show');
    
    updateProgress();
}

// Render a task
function renderTask(client, task) {
    const container = document.getElementById(`tasks-${client}`);
    
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : ''}`;
    taskItem.dataset.client = client;
    taskItem.dataset.id = task.id;
    taskItem.dataset.status = task.status;
    
    // Format due date if exists
    let dueDateHtml = '';
    if (task.dueDate) {
        const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        dueDateHtml = `<div class="due-date"><i class="far fa-calendar"></i> ${formattedDueDate}</div>`;
    }
    
    // Priority indicator
    const priorityClasses = {
        high: 'priority-high',
        medium: 'priority-medium',
        low: 'priority-low'
    };
    const priorityIndicator = `<span class="priority-indicator ${priorityClasses[task.priority]}"></span>`;
    
    taskItem.innerHTML = `
        <div class="task-header">
            <div class="task-status ${task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : ''}">
                ${task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '⌛' : ''}
            </div>
            <div class="task-name">${priorityIndicator}${task.title}</div>
            <button class="delete-task-btn" onclick="deleteTask('${client}', '${task.id}')" aria-label="Delete task">×</button>
        </div>
        <div class="task-inputs">
            <div class="input-group">
                <input type="text" placeholder="Task description" class="task-title-input" value="${task.title || ''}">
                <input type="text" placeholder="Tags (comma separated)" class="task-tags-input" value="${task.tags?.join(', ') || ''}">
                <select class="task-tags-input" id="edit-priority-${task.id}">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                </select>
                <input type="date" class="task-title-input" id="edit-dueDate-${task.id}" value="${task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}">
                <input type="text" placeholder="${client === 'vconnx' ? 'Google Drive link (required)' : 'Link (optional)'}" 
                    class="task-link-input" value="${task.link || ''}">
                <button class="save-task-btn" onclick="saveTaskDetails('${client}', '${task.id}')">Save</button>
            </div>
        </div>
        <div class="task-tags-container" id="tags-container-${task.id}">
            ${task.tags?.map(tag => `
                <div class="task-tag">
                    <i class="fas fa-tag"></i> ${tag}
                </div>
            `).join('')}
        </div>
        ${dueDateHtml}
        <div class="task-details">
            ${task.link ? `<a href="${task.link}" target="_blank" class="task-link">${client === 'vconnx' ? '📁 View File' : '🔗 View Link'}</a>` : ''}
        </div>
    `;
    
    // Add event listeners
    taskItem.querySelector('.task-header').addEventListener('click', function(e) {
        if (!e.target.classList.contains('delete-task-btn') && 
            !e.target.classList.contains('task-status')) {
            toggleTaskInputs(client, task.id);
        }
    });
    
    taskItem.querySelector('.task-status').addEventListener('click', function() {
        cycleTaskStatus(client, task.id);
    });
    
    container.appendChild(taskItem);
}

// Format completion timestamp
function formatCompletionDate(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    
    return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${formattedHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

// Toggle task inputs
function toggleTaskInputs(client, taskId) {
    const taskItem = document.querySelector(`.task-item[data-client="${client}"][data-id="${taskId}"]`);
    const inputs = taskItem.querySelector('.task-inputs');
    inputs.classList.toggle('show');
}

// Save task details
function saveTaskDetails(client, taskId) {
    const taskItem = document.querySelector(`.task-item[data-client="${client}"][data-id="${taskId}"]`);
    const titleInput = taskItem.querySelector('.task-title-input');
    const tagsInput = taskItem.querySelector('.task-tags-input');
    const priorityInput = taskItem.querySelector(`#edit-priority-${taskId}`);
    const dueDateInput = taskItem.querySelector(`#edit-dueDate-${taskId}`);
    const linkInput = taskItem.querySelector('.task-link-input');
    
    const title = titleInput.value.trim();
    const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
    const link = linkInput.value.trim();
    
    if (!title) {
        alert('Task description is required!');
        titleInput.focus();
        return;
    }
    
    if (client === 'vconnx' && !link) {
        alert('Google Drive link is required for Vconnx tasks!');
        linkInput.focus();
        return;
    }
    
    if (client === 'vconnx' && link && 
        !link.includes('drive.google.com') && 
        !link.includes('docs.google.com')) {
        alert('Please provide a valid Google Drive link!');
        linkInput.focus();
        return;
    }
    
    // Update task in data
    const taskIndex = tasks[client].findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[client][taskIndex].title = title;
        tasks[client][taskIndex].tags = tags;
        tasks[client][taskIndex].priority = priority;
        tasks[client][taskIndex].dueDate = dueDate;
        tasks[client][taskIndex].link = link;
    }
    
    // Update UI
    taskItem.querySelector('.task-name').innerHTML = `
        <span class="priority-indicator ${priorityClasses[priority]}"></span>${title}
    `;
    taskItem.querySelector('.task-inputs').classList.remove('show');
    
    // Update tags display
    const tagsContainer = document.getElementById(`tags-container-${taskId}`);
    tagsContainer.innerHTML = tags.map(tag => `
        <div class="task-tag">
            <i class="fas fa-tag"></i> ${tag}
        </div>
    `).join('');
    
    // Update due date display
    let dueDateHtml = '';
    if (dueDate) {
        const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        dueDateHtml = `<div class="due-date"><i class="far fa-calendar"></i> ${formattedDueDate}</div>`;
    }
    
    const dueDateContainer = taskItem.querySelector('.due-date');
    if (dueDateContainer) {
        dueDateContainer.outerHTML = dueDateHtml;
    } else if (dueDateHtml) {
        const tagsContainer = taskItem.querySelector('.task-tags-container');
        if (tagsContainer) {
            tagsContainer.insertAdjacentHTML('afterend', dueDateHtml);
        }
    } else {
        const dueDateElement = taskItem.querySelector('.due-date');
        if (dueDateElement) dueDateElement.remove();
    }
    
    if (link) {
        taskItem.querySelector('.task-details').innerHTML = `
            <a href="${link}" target="_blank" class="task-link">
                ${client === 'vconnx' ? '📁 View File' : '🔗 View Link'}
            </a>
        `;
    } else {
        taskItem.querySelector('.task-details').innerHTML = '';
    }
    
    updateProgress();
    saveTasks();
}

// Cycle through task statuses
function cycleTaskStatus(client, taskId) {
    const taskItem = document.querySelector(`.task-item[data-client="${client}"][data-id="${taskId}"]`);
    const taskIndex = tasks[client].findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;
    
    const task = tasks[client][taskIndex];
    const statuses = ['pending', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    // Check requirements when marking as completed
    if (nextStatus === 'completed') {
        if (client === 'vconnx' && !task.link) {
            alert('Please save a Google Drive link before marking as complete!');
            taskItem.querySelector('.task-inputs').classList.add('show');
            return;
        }
        
        // Record completion timestamp
        task.completedAt = new Date();
    }
    
    // Update status
    task.status = nextStatus;
    tasks[client][taskIndex] = task;
    
    // Update UI
    taskItem.dataset.status = nextStatus;
    taskItem.className = `task-item ${nextStatus === 'completed' ? 'completed' : nextStatus === 'in-progress' ? 'in-progress' : ''}`;
    
    const statusIndicator = taskItem.querySelector('.task-status');
    statusIndicator.className = `task-status ${nextStatus}`;
    statusIndicator.innerHTML = nextStatus === 'completed' ? '✓' : nextStatus === 'in-progress' ? '⌛' : '';
    
    // Update task details display
    if (nextStatus === 'completed' && task.link) {
        taskItem.querySelector('.task-details').innerHTML = `
            <a href="${task.link}" target="_blank" class="task-link">
                ${client === 'vconnx' ? '📁 View File' : '🔗 View Link'}
            </a>
        `;
    }
    
    updateProgress();
    saveTasks();
}

// Delete task
function deleteTask(client, taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    // Remove from data
    tasks[client] = tasks[client].filter(task => task.id !== taskId);
    
    // Remove from UI
    const taskItem = document.querySelector(`.task-item[data-client="${client}"][data-id="${taskId}"]`);
    if (taskItem) {
        taskItem.remove();
    }
    
    updateProgress();
    saveTasks();
}

// Add Other Task function
function addOtherTask() {
    const clientInput = document.getElementById('client-other');
    const titleInput = document.getElementById('title-other');
    const tagsInput = document.getElementById('tags-other');
    const dueDateInput = document.getElementById('dueDate-other');
    const linkInput = document.getElementById('link-other');
    
    const client = clientInput.value.trim();
    const title = titleInput.value.trim();
    const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
    const link = linkInput.value.trim();
    
    if (!client || !title) {
        alert('Client name and task title are required!');
        return;
    }
    
    const taskId = `other-${Date.now()}`;
    const task = {
        id: taskId,
        client: client,
        title: title,
        tags: tags,
        dueDate: dueDate,
        link: link,
        status: 'pending',
        createdAt: new Date(),
        completedAt: null
    };
    
    tasks.other.push(task);
    renderOtherTask(task);
    saveTasks();
    
    // Reset form
    clientInput.value = '';
    titleInput.value = '';
    tagsInput.value = '';
    dueDateInput.value = '';
    linkInput.value = '';
    document.getElementById('add-form-other').classList.remove('show');
    
    updateProgress();
}

// Render Other Task
function renderOtherTask(task) {
    const container = document.getElementById('tasks-other');
    
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : ''}`;
    taskItem.dataset.client = 'other';
    taskItem.dataset.id = task.id;
    taskItem.dataset.status = task.status;
    
    // Format due date if exists
    let dueDateHtml = '';
    if (task.dueDate) {
        const formattedDueDate = new Date(task.dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        dueDateHtml = `<div class="due-date"><i class="far fa-calendar"></i> ${formattedDueDate}</div>`;
    }
    
    taskItem.innerHTML = `
        <div class="task-header">
            <div class="task-status ${task.status === 'completed' ? 'completed' : task.status === 'in-progress' ? 'in-progress' : ''}">
                ${task.status === 'completed' ? '✓' : task.status === 'in-progress' ? '⌛' : ''}
            </div>
            <div class="task-name">${task.client}: ${task.title}</div>
            <button class="delete-task-btn" onclick="deleteTask('other', '${task.id}')" aria-label="Delete task">×</button>
        </div>
        <div class="task-inputs">
            <div class="input-group">
                <input type="text" placeholder="Client name" class="task-client-input" value="${task.client || ''}">
                <input type="text" placeholder="Task description" class="task-title-input" value="${task.title || ''}">
                <input type="text" placeholder="Tags (comma separated)" class="task-tags-input" value="${task.tags?.join(', ') || ''}">
                <input type="date" class="task-title-input" id="edit-dueDate-${task.id}" value="${task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}">
                <input type="text" placeholder="Link (optional)" class="task-link-input" value="${task.link || ''}">
                <button class="save-task-btn" onclick="saveOtherTaskDetails('${task.id}')">Save</button>
            </div>
        </div>
        <div class="task-tags-container" id="tags-container-${task.id}">
            ${task.tags?.map(tag => `
                <div class="task-tag">
                    <i class="fas fa-tag"></i> ${tag}
                </div>
            `).join('')}
        </div>
        ${dueDateHtml}
        <div class="task-details">
            ${task.link ? `
                ${task.link.split(',').map(link => `
                    <a href="${link.trim()}" target="_blank" class="task-link">${link.trim()}</a>
                `).join('')}
            ` : ''}
        </div>
    `;
    
    // Add event listeners
    taskItem.querySelector('.task-header').addEventListener('click', function(e) {
        if (!e.target.classList.contains('delete-task-btn') && 
            !e.target.classList.contains('task-status')) {
            toggleTaskInputs('other', task.id);
        }
    });
    
    taskItem.querySelector('.task-status').addEventListener('click', function() {
        cycleTaskStatus('other', task.id);
    });
    
    container.appendChild(taskItem);
}

// Save other task details
function saveOtherTaskDetails(taskId) {
    const taskItem = document.querySelector(`.task-item[data-client="other"][data-id="${taskId}"]`);
    const clientInput = taskItem.querySelector('.task-client-input');
    const titleInput = taskItem.querySelector('.task-title-input');
    const tagsInput = taskItem.querySelector('.task-tags-input');
    const dueDateInput = taskItem.querySelector(`#edit-dueDate-${taskId}`);
    const linkInput = taskItem.querySelector('.task-link-input');
    
    const client = clientInput.value.trim();
    const title = titleInput.value.trim();
    const tags = tagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag);
    const dueDate = dueDateInput.value ? new Date(dueDateInput.value) : null;
    const link = linkInput.value.trim();
    
    if (!client || !title) {
        alert('Client name and task description are required!');
        return;
    }
    
    // Update task in data
    const taskIndex = tasks.other.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks.other[taskIndex].client = client;
        tasks.other[taskIndex].title = title;
        tasks.other[taskIndex].tags = tags;
        tasks.other[taskIndex].dueDate = dueDate;
        tasks.other[taskIndex].link = link;
    }
    
    // Update UI
    taskItem.querySelector('.task-name').textContent = `${client}: ${title}`;
    taskItem.querySelector('.task-inputs').classList.remove('show');
    
    // Update tags display
    const tagsContainer = document.getElementById(`tags-container-${taskId}`);
    tagsContainer.innerHTML = tags.map(tag => `
        <div class="task-tag">
            <i class="fas fa-tag"></i> ${tag}
        </div>
    `).join('');
    
    // Update due date display
    let dueDateHtml = '';
    if (dueDate) {
        const formattedDueDate = new Date(dueDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        dueDateHtml = `<div class="due-date"><i class="far fa-calendar"></i> ${formattedDueDate}</div>`;
    }
    
    const dueDateContainer = taskItem.querySelector('.due-date');
    if (dueDateContainer) {
        dueDateContainer.outerHTML = dueDateHtml;
    } else if (dueDateHtml) {
        const tagsContainer = taskItem.querySelector('.task-tags-container');
        if (tagsContainer) {
            tagsContainer.insertAdjacentHTML('afterend', dueDateHtml);
        }
    } else {
        const dueDateElement = taskItem.querySelector('.due-date');
        if (dueDateElement) dueDateElement.remove();
    }
    
    if (link) {
        taskItem.querySelector('.task-details').innerHTML = `
            ${link.split(',').map(l => `
                <a href="${l.trim()}" target="_blank" class="task-link">${l.trim()}
            `).join('')}
        `;
    } else {
        taskItem.querySelector('.task-details').innerHTML = '';
    }
    
    updateProgress();
    saveTasks();
}

// Update progress
function updateProgress() {
    // Calculate daily progress (only count completed tasks)
    const dailyTasks = [
        ...tasks.gary, 
        ...tasks.falesha, 
        ...tasks.lawrence,
        ...tasks.other,
    ];
    const completedDaily = dailyTasks.filter(t => t.status === 'completed').length;
    const dailyProgress = dailyTasks.length > 0 ? (completedDaily / dailyTasks.length) * 100 : 0;
    
    // Calculate weekly (Vconnx) progress (only count completed tasks)
    const completedWeekly = tasks.vconnx.filter(t => t.status === 'completed').length;
    const weeklyProgress = (completedWeekly / 10) * 100; // 10 static tasks
    
    // Calculate overall progress (only count completed tasks)
    const allTasks = [...dailyTasks, ...tasks.vconnx];
    const completedAll = allTasks.filter(t => t.status === 'completed').length;
    const overallProgress = allTasks.length > 0 ? (completedAll / allTasks.length) * 100 : 0;
    
    // Update progress bars
    document.getElementById('dailyProgress').style.width = `${dailyProgress}%`;
    document.getElementById('weeklyProgress').style.width = `${weeklyProgress}%`;
    document.getElementById('overallProgress').style.width = `${overallProgress}%`;
    
    // Update stats text
    document.getElementById('dailyStats').textContent = `${completedDaily}/${dailyTasks.length} completed`;
    document.getElementById('weeklyStats').textContent = `${completedWeekly}/10 completed`;
    document.getElementById('overallStats').textContent = `${completedAll}/${allTasks.length} completed`;
}

// Reset all tasks
function resetTasks() {
    if (!confirm('Are you sure you want to reset all tasks?')) return;
    
    // Reset data
    tasks = {
        gary: [],
        falesha: [],
        lawrence: [],
        vconnx: [],
        other: []
    };
    
    // Clear UI
    document.querySelectorAll('#tasks-gary, #tasks-falesha, #tasks-lawrence, #tasks-other, #tasks-vconnx').forEach(container => {
        container.innerHTML = '';
    });
    
    // Reinitialize Vconnx tasks
    initializeVconnxTasks();
    
    updateProgress();
    saveTasks();
    alert('All tasks have been reset!');
}

// Initialize Vconnx tasks
function initializeVconnxTasks() {
    const vconnxTasks = [
        { id: 'vconnx-reel-1', title: 'Attraction Reel #1', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-reel-2', title: 'Attraction Reel #2', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-reel-3', title: 'Attraction Reel #3', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-reel-4', title: 'Attraction Reel #4', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-story-static-1', title: 'Static Story #1', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-story-static-2', title: 'Static Story #2', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-story-static-3', title: 'Static Story #3', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-nurture-1', title: 'Nurture Story #1', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-nurture-2', title: 'Nurture Story #2', status: 'pending', createdAt: new Date(), completedAt: null },
        { id: 'vconnx-nurture-3', title: 'Nurture Story #3', status: 'pending', createdAt: new Date(), completedAt: null }
    ];
    
    tasks.vconnx = [...vconnxTasks];
    
    // Render Vconnx tasks
    vconnxTasks.forEach(task => renderTask('vconnx', task));
}

// Generate EOD Report - with status differentiation
function generateEOD() {
    let eodContent = "📘 Clark's EOD Report\n\n";
    const date = selectedDate;
    const shiftDate = getShiftDate(date);
    const hour = date.getHours();
    const shiftIndicator = hour >= 20 || hour < 4 ? "🌙 Night Shift (8pm-4am)" : "☀️ Day Shift (9am-5pm)";
    
    const dateStr = shiftDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    eodContent += `Date: ${dateStr} | ${shiftIndicator}\n\n`;
    
    // Group tasks by client and status
    const statusGroups = {
        completed: [],
        'in-progress': []
    };
    
    // Process all clients
    ['gary', 'falesha', 'lawrence', 'vconnx', 'other'].forEach(client => {
        tasks[client].forEach(task => {
            if (task.status !== 'pending') {
                // Check if task belongs to selected shift date
                const taskCreatedShiftDate = getShiftDate(new Date(task.createdAt));
                const taskCompletedShiftDate = task.completedAt ? getShiftDate(new Date(task.completedAt)) : null;
                
                if (taskCreatedShiftDate.getTime() === shiftDate.getTime() || 
                    (taskCompletedShiftDate && taskCompletedShiftDate.getTime() === shiftDate.getTime())) {
                    
                    statusGroups[task.status].push({
                        client: client,
                        title: task.title,
                        link: task.link,
                        tags: task.tags,
                        completedAt: task.completedAt
                    });
                }
            }
        });
    });
    
    // Check if there are any completed or in-progress tasks
    if (statusGroups.completed.length === 0 && statusGroups['in-progress'].length === 0) {
        eodContent += "No tasks completed or in progress for this shift.\n";
    } else {
        // Format EOD content with status sections
        if (statusGroups.completed.length > 0) {
            eodContent += "✅ COMPLETED TASKS:\n";
            eodContent += formatStatusSection(statusGroups.completed, 'completed');
            eodContent += "\n";
        }
        
        if (statusGroups['in-progress'].length > 0) {
            eodContent += "⏳ IN PROGRESS:\n";
            eodContent += formatStatusSection(statusGroups['in-progress'], 'in-progress');
        }
    }
    
    // Display in modal
    document.getElementById('eodText').textContent = eodContent;
    document.getElementById('eodModal').style.display = 'block';
}

// Helper function to format status section in EOD report
function formatStatusSection(tasks, status) {
    let content = "";
    const groupedByClient = {};
    
    // Group tasks by client
    tasks.forEach(task => {
        const clientName = task.client === 'vconnx' ? 
            'Vconnx Virtual Solutions' : 
            task.client.charAt(0).toUpperCase() + task.client.slice(1);
            
        if (!groupedByClient[clientName]) {
            groupedByClient[clientName] = [];
        }
        groupedByClient[clientName].push(task);
    });
    
    // Format each client's tasks
    for (const [client, tasksList] of Object.entries(groupedByClient)) {
        content += `${client}:\n`;
        
        tasksList.forEach(task => {
            content += `- ${task.title}`;
            
            // Add tags if available
            if (task.tags && task.tags.length > 0) {
                content += ` [Tags: ${task.tags.join(', ')}]`;
            }
            
            // Add completion timestamp for completed tasks
            if (status === 'completed' && task.completedAt) {
                content += ` (Completed: ${formatCompletionDate(new Date(task.completedAt))})`;
            }
            
            // Add link if available (plain text)
            if (task.link) {
                content += `\n  Link: ${task.link}`;
            }
            
            content += '\n';
        });
        
        content += '\n';
    }
    
    return content;
}

// Copy EOD to clipboard
function copyEOD() {
    const eodText = document.getElementById('eodText').textContent;
    navigator.clipboard.writeText(eodText)
        .then(() => alert('EOD report copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
}

// Close EOD modal
function closeEODModal() {
    document.getElementById('eodModal').style.display = 'none';
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    
    // Update button text
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = document.body.classList.contains('dark-mode') ? 
        '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
}

// Show keyboard shortcuts
function showShortcuts() {
    document.getElementById('shortcutsModal').style.display = 'block';
}

// Close shortcuts modal
function closeShortcutsModal() {
    document.getElementById('shortcutsModal').style.display = 'none';
}

// Start new shift
function startNewShift() {
    // Hide previous shift tasks
    document.querySelectorAll('.task-item.previous-shift').forEach(task => {
        task.style.display = 'none';
    });
    
    // Update date display
    updateDate();
    
    // Show notification
    alert('New shift started! Previous shift tasks hidden.');
}

// Toggle previous shift tasks visibility
function togglePreviousShiftTasks() {
    showPreviousShiftTasks = document.getElementById('showPreviousShiftToggle').checked;
    
    document.querySelectorAll('.task-item.previous-shift').forEach(task => {
        task.style.display = showPreviousShiftTasks ? 'block' : 'none';
    });
}

// Render all tasks
function renderAllTasks() {
    // Clear all task containers
    document.querySelectorAll('#tasks-gary, #tasks-falesha, #tasks-lawrence, #tasks-vconnx, #tasks-other').forEach(container => {
        container.innerHTML = '';
    });
    
    // Render tasks for each client
    ['gary', 'falesha', 'lawrence', 'vconnx', 'other'].forEach(client => {
        tasks[client].forEach(task => {
            if (client === 'other') {
                renderOtherTask(task);
            } else {
                renderTask(client, task);
            }
        });
    });
    
    updateProgress();
}

// Priority classes mapping
const priorityClasses = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
};

// Initialize the application
function initApp() {
    // Load tasks from localStorage
    loadTasks();
    
    // Initialize date
    updateDate();
    
    // Initialize calendar
    document.getElementById('currentDate').addEventListener('click', toggleCalendar);
    
    // Initialize Vconnx tasks if empty
    if (tasks.vconnx.length === 0) {
        initializeVconnxTasks();
    } else {
        renderAllTasks();
    }
    
    // Initialize theme
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    }
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Alt+T - Toggle dark mode
        if (e.ctrlKey && e.altKey && e.key === 't') {
            toggleDarkMode();
        }
        
        // Ctrl+Alt+S - Show shortcuts
        if (e.ctrlKey && e.altKey && e.key === 's') {
            showShortcuts();
        }
        
        // Ctrl+Alt+R - Reset tasks
        if (e.ctrlKey && e.altKey && e.key === 'r') {
            resetTasks();
        }
        
        // Ctrl+Alt+E - Generate EOD
        if (e.ctrlKey && e.altKey && e.key === 'e') {
            generateEOD();
        }
        
        // Ctrl+Alt+N - Start new shift
        if (e.ctrlKey && e.altKey && e.key === 'n') {
            startNewShift();
        }
        
        // Esc - Close modals
        if (e.key === 'Escape') {
            closeEODModal();
            closeShortcutsModal();
            document.getElementById('calendarContainer').style.display = 'none';
        }
    });
    
    // Set up button event listeners
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('shortcutInfo').addEventListener('click', showShortcuts);
    
    updateProgress();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Close modal if clicked outside
window.addEventListener('click', function(event) {
    const eodModal = document.getElementById('eodModal');
    const shortcutsModal = document.getElementById('shortcutsModal');
    const calendarContainer = document.getElementById('calendarContainer');
    
    if (event.target === eodModal) {
        closeEODModal();
    }
    if (event.target === shortcutsModal) {
        closeShortcutsModal();
    }
    if (event.target === calendarContainer) {
        calendarContainer.style.display = 'none';
    }
});
