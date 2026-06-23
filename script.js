let users = [];
let tasks = [];
let currentFilter = 'all';
let currentSearch = '';
let currentUserFilter = 'all';

/**
 * Load all data from localStorage on page load
 */
function loadAllData() {
    const savedUsers = localStorage.getItem('users');
    const savedTasks = localStorage.getItem('tasks');
    
    if (savedUsers) {
        try {
            users = JSON.parse(savedUsers);
        } catch (error) {
            console.error('Error loading users:', error);
            users = [];
        }
    }
    
    if (savedTasks) {
        try {
            tasks = JSON.parse(savedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            tasks = [];
        }
    }
    
    loadTheme();
    renderUsers();
    renderUserFilters();
    renderTasks();
    updateCounters();
}


function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }
}

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}


function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function validateUserName(userName) {

    // Empty check
    if (userName === "") {
        return "❌ Please enter a username!";
    }

    // Numbers not allowed check
    if (/\d/.test(userName)) {
        return "❌ Numbers are not allowed in username!";
    }

    // Special characters not allowed check - Only letters and spaces allowed
    if (!/^[A-Za-z\s]+$/.test(userName)) {
        return "❌ Special characters are not allowed in username!";
    }

    // Single letter check
    if (userName.trim().length === 1) {
        return "❌ Single letter username is not allowed!";
    }

    // Minimum 2 characters required
    if (userName.trim().length < 2) {
        return "❌ Username must be at least 2 characters long!";
    }

    return "";
}

function validateTaskText(taskText) {

    // Empty check
    if (taskText === "") {
        return "❌ Please enter a task!";
    }

    // Numbers not allowed check
    if (/\d/.test(taskText)) {
        return "❌ Numbers are not allowed in task!";
    }

    // Special characters not allowed check - Only letters and spaces allowed
    if (!/^[A-Za-z\s]+$/.test(taskText)) {
        return "❌ Special characters are not allowed!";
    }

    // Single letter check
    if (taskText.trim().length === 1) {
        return "❌ Single letter is not allowed!";
    }

    // Split into words
    const words = taskText.trim().split(/\s+/);

    // At least two words required
    if (words.length < 2) {
        return "❌ Please enter a meaningful task (at least two words).";
    }

    return "";
}


function addUser() {
    const userInput = document.getElementById('userInput');
    const validationMsg = document.getElementById('userValidationMsg');

    validationMsg.textContent = '';

    const userName = userInput.value.trim();

    // Validation - COMPLETE VALIDATION CHECK
    const validationError = validateUserName(userName);

    if (validationError !== "") {
        validationMsg.textContent = validationError;
        userInput.focus();
        return;
    }

    // Validation: Duplicate user
    if (users.some(user => user.name.toLowerCase() === userName.toLowerCase())) {
        validationMsg.textContent = '⚠️ This user already exists!';
        userInput.focus();
        return;
    }

    // Create user object
    const newUser = {
        id: generateId(),
        name: userName,
        createdDate: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers();
    renderUsers();
    renderUserFilters();
    updateCounters();

    userInput.value = '';
    userInput.focus();
    showToast(`User "${userName}" added successfully! 👥`, 'success');
}


function removeUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const userTaskCount = tasks.filter(t => t.userId === userId).length;

    openConfirmModal(
        'Delete User',
        `Are you sure you want to delete "${user.name}"? This will remove all ${userTaskCount} task(s) associated with this user.`,
        () => {
            // Remove user
            users = users.filter(u => u.id !== userId);
            // Remove all tasks for this user
            tasks = tasks.filter(t => t.userId !== userId);

            saveUsers();
            saveTasks();
            renderUsers();
            renderUserFilters();
            renderTasks();
            updateCounters();

            showToast(`User "${user.name}" and their tasks deleted! 🗑️`, 'success');
        }
    );
}


function addTask() {
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskUserSelect = document.getElementById('taskUserSelect');
    const validationMsg = document.getElementById('validationMsg');

    validationMsg.textContent = '';

    const taskText = taskInput.value.trim();
    const selectedUserId = taskUserSelect.value;

    // Validation - COMPLETE VALIDATION CHECK
    const validationError = validateTaskText(taskText);

    if (validationError !== "") {
        validationMsg.textContent = validationError;
        taskInput.focus();
        return;
    }

    // Validation: No user selected
    if (selectedUserId === '') {
        validationMsg.textContent = '❌ Please select a user for this task!';
        taskUserSelect.focus();
        return;
    }

    // Validation: Valid user exists
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
        validationMsg.textContent = '❌ Selected user is no longer available!';
        return;
    }

    // Validation: Duplicate task for user
    if (tasks.some(task => 
        task.userId === selectedUserId && 
        task.text.toLowerCase() === taskText.toLowerCase()
    )) {
        validationMsg.textContent = '⚠️ This task already exists for this user!';
        taskInput.focus();
        return;
    }

    // Create task object
    const newTask = {
        id: generateId(),
        text: taskText,
        completed: false,
        priority: prioritySelect.value,
        userId: selectedUserId,
        createdDate: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateCounters();

    taskInput.value = '';
    prioritySelect.value = 'medium';
    taskUserSelect.value = '';
    taskInput.focus();

    showToast('Task added successfully! ✅', 'success');
}


function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    openConfirmModal(
        'Delete Task',
        'Are you sure you want to delete this task? This action cannot be undone.',
        () => {
            tasks = tasks.filter(t => t.id !== taskId);
            saveTasks();
            renderTasks();
            updateCounters();
            showToast('Task deleted successfully! 🗑️', 'success');
        }
    );
}


function toggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateCounters();
        const message = task.completed ? 'Task marked as completed! ✅' : 'Task marked as pending! ⏳';
        showToast(message, 'success');
    }
}


function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const editInput = document.getElementById('editInput');
    const editPrioritySelect = document.getElementById('editPrioritySelect');
    const editUserSelect = document.getElementById('editUserSelect');
    const editModal = document.getElementById('editModal');

    editInput.value = task.text;
    editPrioritySelect.value = task.priority;
    editUserSelect.value = task.userId;

    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // Remove old event listeners
    saveEditBtn.replaceWith(saveEditBtn.cloneNode(true));
    cancelEditBtn.replaceWith(cancelEditBtn.cloneNode(true));

    const newSaveBtn = document.getElementById('saveEditBtn');
    const newCancelBtn = document.getElementById('cancelEditBtn');

    newSaveBtn.addEventListener('click', () => saveEdit(taskId, editModal));
    newCancelBtn.addEventListener('click', () => closeEditModal(editModal));

    editModal.classList.add('active');
    editInput.focus();
}

function saveEdit(taskId, modal) {
    const editInput = document.getElementById('editInput');
    const editPrioritySelect = document.getElementById('editPrioritySelect');
    const editUserSelect = document.getElementById('editUserSelect');
    const newText = editInput.value.trim();
    const newUserId = editUserSelect.value;

    // Validation - COMPLETE VALIDATION CHECK
    const validationError = validateTaskText(newText);

    if (validationError !== "") {
        showToast(validationError, 'error');
        return;
    }

    if (newUserId === '') {
        showToast('Please select a user! ❌', 'error');
        return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.text = newText;
        task.priority = editPrioritySelect.value;
        task.userId = newUserId;
        saveTasks();
        renderTasks();
        updateCounters();
        closeEditModal(modal);
        showToast('Task updated successfully! ✏️', 'success');
    }
}


function closeEditModal(modal) {
    modal.classList.remove('active');
}


function clearAllTasks() {
    if (tasks.length === 0) {
        showToast('No tasks to clear! 🎉', 'info');
        return;
    }

    openConfirmModal(
        'Clear All Tasks',
        `Are you sure you want to delete all ${tasks.length} task(s)? This action cannot be undone.`,
        () => {
           tasks = [];
            saveTasks();
            renderTasks();
            updateCounters();
            showToast('All tasks cleared! 🗑️', 'success');
        }
    );
}


function searchTasks(query) {
    currentSearch = query.toLowerCase();
    renderTasks();
}


function filterTasks(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');

    renderTasks();
}

function filterByUser(userId) {
    currentUserFilter = userId;
    renderTasks();
}

function getFilteredTasks() {
    let filtered = tasks;

    // Apply user filter
    if (currentUserFilter !== 'all') {
        filtered = filtered.filter(task => task.userId === currentUserFilter);
    }

    // Apply status filter
    if (currentFilter === 'completed') {
        filtered = filtered.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
        filtered = filtered.filter(task => !task.completed);
    }

    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(task =>
            task.text.toLowerCase().includes(currentSearch)
        );
    }

    // ===== PRIORITY LOGIC =====
    const priorityMap = {
        high: 3,
        medium: 2,
        low: 1
    };

    filtered.sort((a, b) => {
        const priorityDiff =
            priorityMap[b.priority] - priorityMap[a.priority];

        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        // If priorities are equal, show newest first
        return new Date(b.createdDate) - new Date(a.createdDate);
    });

    return filtered;
}


function renderUsers() {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = '<div class="empty-users-state">👤 No users yet. Create one to get started!</div>';
        return;
    }

    users.forEach(user => {
        const userElement = createUserElement(user);
        usersList.appendChild(userElement);
    });
}

function createUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'user-badge';
    userDiv.id = `user-${user.id}`;

    // Get stats for this user
    const userTasks = tasks.filter(t => t.userId === user.id);
    const completedCount = userTasks.filter(t => t.completed).length;
    const pendingCount = userTasks.length - completedCount;

    userDiv.innerHTML = `
        <div style="flex-grow: 1; width: 100%;">
            <div class="user-badge-name">${escapeHtml(user.name)}</div>
            <div class="user-badge-stats">
                <div class="user-badge-stat-item">
                    📊 ${userTasks.length} task${userTasks.length !== 1 ? 's' : ''}
                </div>
                <div class="user-badge-stat-item">
                    ✅ ${completedCount}  |  ⏳ ${pendingCount}
                </div>
            </div>
        </div>
        <button class="remove-user-btn" data-user-id="${user.id}" title="Delete user">
            ✕
        </button>
    `;

    return userDiv;
}

function renderUserFilters() {
    const userFilterSelect = document.getElementById('userFilterSelect');
    const taskUserSelect = document.getElementById('taskUserSelect');
    const editUserSelect = document.getElementById('editUserSelect');

    // Clear previous options (except first)
    const filterOptions = Array.from(userFilterSelect.options).slice(1);
    filterOptions.forEach(opt => opt.remove());

    const taskOptions = Array.from(taskUserSelect.options).slice(1);
    taskOptions.forEach(opt => opt.remove());

    const editOptions = Array.from(editUserSelect.options).slice(1);
    editOptions.forEach(opt => opt.remove());

    // Add user options
    users.forEach(user => {
        // Filter select
        const filterOption = document.createElement('option');
        filterOption.value = user.id;
        filterOption.textContent = user.name;
        userFilterSelect.appendChild(filterOption);

        // Task user select
        const taskOption = document.createElement('option');
        taskOption.value = user.id;
        taskOption.textContent = user.name;
        taskUserSelect.appendChild(taskOption);

        // Edit user select
        const editOption = document.createElement('option');
        editOption.value = user.id;
        editOption.textContent = user.name;
        editUserSelect.appendChild(editOption);
    });
}


function renderTasks() {
    const taskList = document.getElementById('taskList');
    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = '';

    if (tasks.length === 0 || filteredTasks.length === 0) {
        let emptyMessage = 'No tasks yet. Create one to get started!';
        if (tasks.length > 0 && filteredTasks.length === 0) {
            emptyMessage = 'No tasks match your filters.';
        }

        taskList.innerHTML = `
            <div class="empty-state">
                <p class="empty-icon">📭</p>
                <p class="empty-message">${emptyMessage}</p>
            </div>
        `;
        return;
    }

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;
    taskDiv.id = `task-${task.id}`;
    taskDiv.dataset.taskId = task.id;

    const user = users.find(u => u.id === task.userId);
    const userName = user ? escapeHtml(user.name) : 'Unknown User';
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

    taskDiv.innerHTML = `
        <input 
            type="checkbox" 
            class="task-checkbox" 
            data-task-id="${task.id}"
            ${task.completed ? 'checked' : ''}
            aria-label="Mark task as complete"
        >
        <div class="task-content">
            <div>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-user-badge">${userName}</span>
                <span class="priority-badge ${task.priority}">${priorityLabel}</span>
            </div>
            <div class="task-meta">
                <span class="task-date">📅 ${formatDate(task.createdDate)}</span>
            </div>
        </div>
        <div class="task-actions">
            <button class="task-btn edit-btn" data-task-id="${task.id}" title="Edit task">
                ✏️ Edit
            </button>
            <button class="task-btn delete-btn" data-task-id="${task.id}" title="Delete task">
                🗑️ Delete
            </button>
        </div>
    `;

    return taskDiv;
}


function updateCounters() {
    // Global stats
    const totalUsers = users.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
}


function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');

    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon();
    showToast(
        isDarkMode ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️',
        'info'
    );
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    const isDarkMode = document.body.classList.contains('dark-mode');
    themeIcon.textContent = isDarkMode ? '☀️' : '🌙';
}


function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInLeft 300ms ease-in-out reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}


function openConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);

    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        modal.classList.remove('active');
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.classList.add('active');
}


function closeModalOnOutsideClick(e) {
    const confirmModal = document.getElementById('confirmModal');
    const editModal = document.getElementById('editModal');

    if (e.target === confirmModal) {
        confirmModal.classList.remove('active');
    }
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadAllData();

    // ===== USER MANAGEMENT =====
    document.getElementById('addUserBtn').addEventListener('click', addUser);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addUser();
        }
    });

    // ===== TASK MANAGEMENT =====
    document.getElementById('addBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // ===== SEARCH & FILTER =====
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchTasks(e.target.value);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterTasks(btn.getAttribute('data-filter'));
        });
    });

    document.getElementById('userFilterSelect').addEventListener('change', (e) => {
        filterByUser(e.target.value);
    });

    // ===== OTHER =====
    document.getElementById('clearBtn').addEventListener('click', clearAllTasks);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Modal outside click
    document.addEventListener('click', closeModalOnOutsideClick);

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('confirmModal').classList.remove('active');
            document.getElementById('editModal').classList.remove('active');
        }
    });

    // Edit input enter to save
    document.getElementById('editInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveEditBtn').click();
        }
    });

    console.log('✅ Multi-User To-Do List App initialized successfully!');
});


document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-user-btn')) {
        const userId = e.target.dataset.userId;
        removeUser(userId);
    }
});


document.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
        const taskId = e.target.dataset.taskId;
        toggleComplete(taskId);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const taskId = e.target.dataset.taskId;
        openEditModal(taskId);
    }

    if (e.target.classList.contains('delete-btn')) {
        const taskId = e.target.dataset.taskId;
        deleteTask(taskId);
    }
});



document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to focus on task input
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('taskInput').focus();
    }

    // Ctrl/Cmd + K to focus on search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    // Ctrl/Cmd + D to toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }

    // Ctrl/Cmd + U to focus on user input
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        document.getElementById('userInput').focus();
    }
});
