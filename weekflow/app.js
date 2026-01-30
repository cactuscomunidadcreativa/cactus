/* ===================================
   WeekFlow - Main Application
   =================================== */

// App State
let state = {
    currentUser: null,
    currentTeam: null,
    isAdmin: false,
    presenterMode: false
};

// Generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate team code
function generateTeamCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Get current week label
function getWeekLabel() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString(currentLang, { month: 'short' });
    return `Week of ${month} ${day}`;
}

// Get week key for storage
function getWeekKey() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    return startOfWeek.toISOString().split('T')[0];
}

// ===================================
// Storage Functions
// ===================================
function getTeams() {
    try {
        return JSON.parse(localStorage.getItem('weekflow_teams')) || {};
    } catch (e) {
        return {};
    }
}

function saveTeams(teams) {
    localStorage.setItem('weekflow_teams', JSON.stringify(teams));
}

function getTeamData(teamCode) {
    const teams = getTeams();
    return teams[teamCode] || null;
}

function saveTeamData(teamCode, data) {
    const teams = getTeams();
    teams[teamCode] = data;
    saveTeams(teams);
}

// ===================================
// URL Parameters (Direct Link Join)
// ===================================
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const teamCode = params.get('team');
    const inviteName = params.get('name');

    if (teamCode) {
        document.getElementById('teamCode').value = teamCode;
        if (inviteName) {
            document.getElementById('userName').value = inviteName;
        }
    }
}

// ===================================
// Team Management
// ===================================
function showCreateTeam() {
    document.getElementById('createTeamModal').classList.remove('hidden');
}

function createTeam() {
    const teamName = document.getElementById('newTeamName').value.trim();
    const adminName = document.getElementById('adminName').value.trim();

    if (!teamName || !adminName) {
        alert('Please fill in all fields');
        return;
    }

    const teamCode = generateTeamCode();
    const weekKey = getWeekKey();

    const teamData = {
        name: teamName,
        code: teamCode,
        createdAt: new Date().toISOString(),
        adminId: generateId(),
        members: {},
        weeks: {}
    };

    // Add admin as first member
    const adminId = teamData.adminId;
    teamData.members[adminId] = {
        id: adminId,
        name: adminName,
        isAdmin: true,
        mood: 4,
        energy: 3,
        joinedAt: new Date().toISOString()
    };

    // Initialize current week
    teamData.weeks[weekKey] = {
        showAndTell: [],
        toDiscuss: [],
        focus: [],
        tasks: {}
    };
    teamData.weeks[weekKey].tasks[adminId] = [];

    saveTeamData(teamCode, teamData);

    // Set current user
    state.currentUser = teamData.members[adminId];
    state.currentTeam = teamData;
    state.isAdmin = true;

    localStorage.setItem('weekflow_session', JSON.stringify({
        teamCode: teamCode,
        oderId: adminId
    }));

    closeModal('createTeamModal');
    showMainScreen();
}

function joinTeam() {
    const teamCode = document.getElementById('teamCode').value.trim().toUpperCase();
    const userName = document.getElementById('userName').value.trim();

    if (!teamCode || !userName) {
        alert('Please fill in all fields');
        return;
    }

    const teamData = getTeamData(teamCode);

    if (!teamData) {
        alert('Team not found. Check the code and try again.');
        return;
    }

    // Check if user already exists (by name)
    let existingUser = Object.values(teamData.members).find(m =>
        m.name.toLowerCase() === userName.toLowerCase()
    );

    let userId;
    if (existingUser) {
        userId = existingUser.id;
    } else {
        // Add new member
        userId = generateId();
        const weekKey = getWeekKey();

        teamData.members[userId] = {
            id: userId,
            name: userName,
            isAdmin: false,
            mood: 4,
            energy: 3,
            joinedAt: new Date().toISOString()
        };

        // Initialize tasks for this user
        if (!teamData.weeks[weekKey]) {
            teamData.weeks[weekKey] = {
                showAndTell: [],
                toDiscuss: [],
                focus: [],
                tasks: {}
            };
        }
        teamData.weeks[weekKey].tasks[userId] = [];

        saveTeamData(teamCode, teamData);
    }

    state.currentUser = teamData.members[userId];
    state.currentTeam = teamData;
    state.isAdmin = teamData.members[userId].isAdmin;

    localStorage.setItem('weekflow_session', JSON.stringify({
        teamCode: teamCode,
        userId: userId
    }));

    showMainScreen();
}

function leaveTeam() {
    if (!confirm('Are you sure you want to leave this team?')) return;

    localStorage.removeItem('weekflow_session');
    state = { currentUser: null, currentTeam: null, isAdmin: false, presenterMode: false };

    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('presenterScreen').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

// ===================================
// Main Screen
// ===================================
function showMainScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');

    // Update header
    document.getElementById('teamNameDisplay').textContent = state.currentTeam.name;
    document.getElementById('weekLabel').textContent = getWeekLabel();
    document.getElementById('userNameDisplay').textContent = state.currentUser.name;
    document.getElementById('displayTeamCode').textContent = state.currentTeam.code;

    // Show admin badge and presenter button
    if (state.isAdmin) {
        document.getElementById('adminBadge').classList.remove('hidden');
        document.getElementById('presenterBtn').classList.remove('hidden');
    }

    // Update mood
    updateMoodDisplay();

    // Load data
    loadSections();
    loadMembers();
    loadMyTasks();
    loadCarryover();

    // Update mentions dropdown
    updateMentionsDropdown();
}

function updateMoodDisplay() {
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    document.getElementById('currentMood').textContent = moods[state.currentUser.mood - 1] || '😊';
}

// ===================================
// Sections (Show & Tell, To Discuss, Focus)
// ===================================
let currentSection = null;

function addItem(section) {
    currentSection = section;
    const titles = {
        showAndTell: '📢 ' + wft('sections.showAndTell'),
        toDiscuss: '💬 ' + wft('sections.toDiscuss'),
        focus: '🎯 ' + wft('sections.focus')
    };
    document.getElementById('addItemTitle').textContent = titles[section];
    document.getElementById('itemContent').value = '';
    document.getElementById('itemMention').value = '';
    document.getElementById('addItemModal').classList.remove('hidden');
}

function saveItem() {
    const content = document.getElementById('itemContent').value.trim();
    const mention = document.getElementById('itemMention').value;

    if (!content) return;

    const weekKey = getWeekKey();
    const teamData = getTeamData(state.currentTeam.code);

    if (!teamData.weeks[weekKey]) {
        teamData.weeks[weekKey] = { showAndTell: [], toDiscuss: [], focus: [], tasks: {} };
    }

    const item = {
        id: generateId(),
        content: content,
        author: state.currentUser.name,
        authorId: state.currentUser.id,
        mention: mention ? teamData.members[mention]?.name : null,
        mentionId: mention || null,
        createdAt: new Date().toISOString()
    };

    teamData.weeks[weekKey][currentSection].push(item);
    saveTeamData(state.currentTeam.code, teamData);
    state.currentTeam = teamData;

    closeModal('addItemModal');
    loadSections();

    // Update presenter if active
    if (state.presenterMode) {
        updatePresenterView();
    }
}

function loadSections() {
    const weekKey = getWeekKey();
    const weekData = state.currentTeam.weeks?.[weekKey] || {};

    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const container = document.getElementById(section + 'Items');
        const items = weekData[section] || [];

        container.innerHTML = items.map(item => `
            <div class="section-item" data-id="${item.id}">
                <div class="item-header">
                    <span class="author">${item.author}</span>
                    ${item.mention ? `<span class="mention">@${item.mention}</span>` : ''}
                    <span class="item-time">${formatTime(item.createdAt)}</span>
                </div>
                <div class="item-content">${item.content}</div>
            </div>
        `).join('') || `<p style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">No items yet</p>`;
    });
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ===================================
// Members
// ===================================
function loadMembers() {
    const container = document.getElementById('membersGrid');
    const weekKey = getWeekKey();
    const weekData = state.currentTeam.weeks?.[weekKey] || {};
    const moods = ['😫', '😕', '😐', '😊', '😄'];

    let totalMood = 0;
    let moodCount = 0;

    const membersHtml = Object.values(state.currentTeam.members).map(member => {
        const tasks = weekData.tasks?.[member.id] || [];
        const completed = tasks.filter(t => t.completed).length;
        const total = tasks.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        totalMood += member.mood || 4;
        moodCount++;

        return `
            <div class="member-card">
                <div class="member-header">
                    <div class="member-avatar">${getInitials(member.name)}</div>
                    <span class="member-name">${member.name}${member.isAdmin ? ' 👑' : ''}</span>
                    <span class="member-mood">${moods[(member.mood || 4) - 1]}</span>
                </div>
                <div class="member-progress">
                    <div class="member-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="member-tasks">
                    ${tasks.slice(0, 4).map(task => `
                        <div class="member-task ${task.completed ? 'completed' : ''}">
                            <span class="priority-dot priority-${task.priority}"></span>
                            <span>${task.text.substring(0, 40)}${task.text.length > 40 ? '...' : ''}</span>
                        </div>
                    `).join('')}
                    ${tasks.length > 4 ? `<div class="member-task" style="opacity: 0.5;">+${tasks.length - 4} more...</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = membersHtml;

    // Update team pulse
    const avgMood = moodCount > 0 ? (totalMood / moodCount).toFixed(1) : 4;
    document.getElementById('pulseValue').textContent = `${moods[Math.round(avgMood) - 1]} ${avgMood}`;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// ===================================
// My Tasks
// ===================================
function loadMyTasks() {
    const container = document.getElementById('tasksList');
    const weekKey = getWeekKey();
    const tasks = state.currentTeam.weeks?.[weekKey]?.tasks?.[state.currentUser.id] || [];

    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${completed}/${total}`;

    container.innerHTML = tasks.map((task, index) => `
        <div class="task-item" data-index="${index}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${index})">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                <div class="task-meta">
                    <span class="task-priority">${getPriorityEmoji(task.priority)}</span>
                    ${task.dueDate ? `<span class="task-due">📅 ${task.dueDate}</span>` : ''}
                    ${task.carryover ? `<span class="task-carryover">↩️</span>` : ''}
                </div>
            </div>
        </div>
    `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No tasks yet. Add one below!</p>';
}

function getPriorityEmoji(priority) {
    const emojis = { normal: '⚪', important: '🟡', urgent: '🔥' };
    return emojis[priority] || '⚪';
}

function handleTaskKeypress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}

function addTask() {
    const input = document.getElementById('newTaskInput');
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    const text = input.value.trim();
    if (!text) return;

    const weekKey = getWeekKey();
    const teamData = getTeamData(state.currentTeam.code);

    if (!teamData.weeks[weekKey].tasks[state.currentUser.id]) {
        teamData.weeks[weekKey].tasks[state.currentUser.id] = [];
    }

    teamData.weeks[weekKey].tasks[state.currentUser.id].push({
        id: generateId(),
        text: text,
        priority: priority,
        dueDate: dueDate || null,
        completed: false,
        carryover: false,
        createdAt: new Date().toISOString()
    });

    saveTeamData(state.currentTeam.code, teamData);
    state.currentTeam = teamData;

    input.value = '';
    document.getElementById('taskDueDate').value = '';

    loadMyTasks();
    loadMembers();
}

function toggleTask(index) {
    const weekKey = getWeekKey();
    const teamData = getTeamData(state.currentTeam.code);
    const tasks = teamData.weeks[weekKey].tasks[state.currentUser.id];

    if (tasks[index]) {
        tasks[index].completed = !tasks[index].completed;
        saveTeamData(state.currentTeam.code, teamData);
        state.currentTeam = teamData;
        loadMyTasks();
        loadMembers();
    }
}

// ===================================
// Carryover (Pending from last week)
// ===================================
function loadCarryover() {
    if (!state.isAdmin) return;

    const currentWeekKey = getWeekKey();
    const weeks = Object.keys(state.currentTeam.weeks || {}).sort().reverse();
    const previousWeekKey = weeks.find(w => w < currentWeekKey);

    if (!previousWeekKey) {
        document.getElementById('carryoverSection').classList.add('hidden');
        return;
    }

    const previousWeek = state.currentTeam.weeks[previousWeekKey];
    const pendingTasks = [];

    Object.entries(previousWeek.tasks || {}).forEach(([userId, tasks]) => {
        const member = state.currentTeam.members[userId];
        tasks.filter(t => !t.completed).forEach(task => {
            pendingTasks.push({
                ...task,
                memberName: member?.name || 'Unknown'
            });
        });
    });

    if (pendingTasks.length === 0) {
        document.getElementById('carryoverSection').classList.add('hidden');
        return;
    }

    document.getElementById('carryoverSection').classList.remove('hidden');
    document.getElementById('carryoverCount').textContent = pendingTasks.length;

    document.getElementById('carryoverItems').innerHTML = pendingTasks.map(task => `
        <div class="carryover-item">
            <span class="priority-dot priority-${task.priority}"></span>
            <span class="author">${task.memberName}:</span>
            <span>${task.text}</span>
        </div>
    `).join('');
}

// ===================================
// Mood
// ===================================
let selectedMood = 4;

function openMoodPicker() {
    selectedMood = state.currentUser.mood || 4;
    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === selectedMood);
    });
    document.getElementById('energyLevel').value = state.currentUser.energy || 3;
    document.getElementById('moodModal').classList.remove('hidden');
}

function selectMood(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });
}

function saveMood() {
    const energy = document.getElementById('energyLevel').value;

    const teamData = getTeamData(state.currentTeam.code);
    teamData.members[state.currentUser.id].mood = selectedMood;
    teamData.members[state.currentUser.id].energy = parseInt(energy);

    saveTeamData(state.currentTeam.code, teamData);
    state.currentTeam = teamData;
    state.currentUser = teamData.members[state.currentUser.id];

    updateMoodDisplay();
    loadMembers();
    closeModal('moodModal');
}

// ===================================
// Mentions Dropdown
// ===================================
function updateMentionsDropdown() {
    const select = document.getElementById('itemMention');
    select.innerHTML = '<option value="">No one</option>';

    Object.values(state.currentTeam.members).forEach(member => {
        if (member.id !== state.currentUser.id) {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            select.appendChild(option);
        }
    });
}

// ===================================
// Presenter Mode
// ===================================
function togglePresenterMode() {
    state.presenterMode = true;
    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('presenterScreen').classList.remove('hidden');

    document.getElementById('presenterTeamName').textContent = state.currentTeam.name;
    document.getElementById('presenterWeek').textContent = getWeekLabel();

    updatePresenterView();
}

function exitPresenterMode() {
    state.presenterMode = false;
    document.getElementById('presenterScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
}

function updatePresenterView() {
    const weekKey = getWeekKey();
    const weekData = state.currentTeam.weeks?.[weekKey] || {};
    const moods = ['😫', '😕', '😐', '😊', '😄'];

    // Update sections
    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const container = document.getElementById('presenter' + section.charAt(0).toUpperCase() + section.slice(1));
        const items = weekData[section] || [];

        container.innerHTML = items.map(item => `
            <div class="presenter-item">
                <span class="author">${item.author}:</span>
                ${item.content}
                ${item.mention ? `<span class="mention">@${item.mention}</span>` : ''}
            </div>
        `).join('') || '<p style="opacity: 0.5;">No items yet</p>';
    });

    // Update team
    let totalMood = 0;
    let moodCount = 0;

    const membersHtml = Object.values(state.currentTeam.members).map(member => {
        const tasks = weekData.tasks?.[member.id] || [];
        const completed = tasks.filter(t => t.completed).length;

        totalMood += member.mood || 4;
        moodCount++;

        return `
            <div class="presenter-member">
                <div class="member-avatar">${getInitials(member.name)}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}${member.isAdmin ? ' 👑' : ''}</div>
                    <div class="member-tasks-count">${completed}/${tasks.length} tasks</div>
                </div>
                <span class="member-mood">${moods[(member.mood || 4) - 1]}</span>
            </div>
        `;
    }).join('');

    document.getElementById('presenterMembers').innerHTML = membersHtml;

    const avgMood = moodCount > 0 ? (totalMood / moodCount).toFixed(1) : 4;
    document.getElementById('presenterPulse').textContent = `${moods[Math.round(avgMood) - 1]} ${avgMood}`;
}

// ===================================
// Settings
// ===================================
function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function changeLanguage(lang) {
    setWeekFlowLang(lang);
}

function copyTeamCode() {
    navigator.clipboard.writeText(state.currentTeam.code);
    alert(wft('messages.copied'));
}

function copyInviteLink() {
    const url = `${window.location.origin}${window.location.pathname}?team=${state.currentTeam.code}`;
    navigator.clipboard.writeText(url);
    alert(wft('messages.linkCopied'));
}

// ===================================
// Modals
// ===================================
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Close modals on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// ===================================
// Export to Doc
// ===================================
function exportToDoc() {
    const weekKey = getWeekKey();
    const weekData = state.currentTeam.weeks?.[weekKey] || {};
    const moods = ['😫', '😕', '😐', '😊', '😄'];

    let doc = `# ${state.currentTeam.name} - ${wft('export.title')}\n`;
    doc += `${wft('export.generated')}: ${new Date().toLocaleDateString()}\n\n`;

    // Sections
    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const sectionName = wft(`sections.${section}`);
        const items = weekData[section] || [];
        doc += `## ${sectionName}\n`;
        items.forEach(item => {
            doc += `- **${item.author}**: ${item.content}${item.mention ? ` @${item.mention}` : ''}\n`;
        });
        doc += '\n';
    });

    // Team tasks
    doc += `## ${wft('sections.team')}\n`;
    Object.values(state.currentTeam.members).forEach(member => {
        const tasks = weekData.tasks?.[member.id] || [];
        doc += `### ${member.name} ${moods[(member.mood || 4) - 1]}\n`;
        tasks.forEach(task => {
            const status = task.completed ? '✅' : '⬜';
            doc += `${status} ${task.text}\n`;
        });
        doc += '\n';
    });

    // Download as markdown
    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekflow-${state.currentTeam.name}-${weekKey}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for direct join
    checkUrlParams();

    // Check for existing session
    const session = localStorage.getItem('weekflow_session');
    if (session) {
        try {
            const { teamCode, userId } = JSON.parse(session);
            const teamData = getTeamData(teamCode);

            if (teamData && teamData.members[userId]) {
                state.currentTeam = teamData;
                state.currentUser = teamData.members[userId];
                state.isAdmin = teamData.members[userId].isAdmin;
                showMainScreen();
                return;
            }
        } catch (e) {
            localStorage.removeItem('weekflow_session');
        }
    }

    // Show login screen
    document.getElementById('loginScreen').classList.remove('hidden');
});

// Auto-refresh every 30 seconds
setInterval(() => {
    if (state.currentTeam && !document.hidden) {
        const teamData = getTeamData(state.currentTeam.code);
        if (teamData) {
            state.currentTeam = teamData;
            loadSections();
            loadMembers();

            if (state.presenterMode) {
                updatePresenterView();
            }
        }
    }
}, 30000);
