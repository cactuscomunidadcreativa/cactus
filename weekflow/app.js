/* ===================================
   WeekFlow - Main Application
   Connected to Neon PostgreSQL
   =================================== */

// API Base URL (changes based on environment)
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// App State
let state = {
    currentUser: null,
    currentTeam: null,
    isAdmin: false,
    presenterMode: false,
    loading: false
};

// ===================================
// API Functions
// ===================================
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===================================
// Utility Functions
// ===================================
function getWeekLabel() {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString(currentLang, { month: 'short' });
    return `Week of ${month} ${day}`;
}

function getWeekStart() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    return startOfWeek.toISOString().split('T')[0];
}

function showLoading(show = true) {
    state.loading = show;
    // Could add a loading indicator to UI
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

async function createTeam() {
    const teamName = document.getElementById('newTeamName').value.trim();
    const adminName = document.getElementById('adminName').value.trim();

    if (!teamName || !adminName) {
        alert('Please fill in all fields');
        return;
    }

    showLoading(true);

    try {
        const result = await apiCall('/teams', 'POST', {
            name: teamName,
            creatorName: adminName
        });

        state.currentTeam = {
            id: result.team.id,
            name: result.team.name,
            code: result.team.code
        };
        state.currentUser = result.member;
        state.isAdmin = result.member.role === 'admin';

        // Save session
        localStorage.setItem('weekflow_session', JSON.stringify({
            teamId: result.team.id,
            teamCode: result.team.code,
            memberId: result.member.id
        }));

        closeModal('createTeamModal');
        await loadTeamData();
        showMainScreen();

    } catch (error) {
        alert('Error creating team: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function joinTeam() {
    const teamCode = document.getElementById('teamCode').value.trim().toUpperCase();
    const userName = document.getElementById('userName').value.trim();

    if (!teamCode || !userName) {
        alert('Please fill in all fields');
        return;
    }

    showLoading(true);

    try {
        // Find team by code
        const team = await apiCall(`/teams?code=${teamCode}`);

        // Get existing members
        const members = await apiCall(`/members?teamId=${team.id}`);

        // Check if user already exists
        let member = members.find(m => m.name.toLowerCase() === userName.toLowerCase());

        if (!member) {
            // Create new member
            member = await apiCall('/members', 'POST', {
                teamId: team.id,
                name: userName
            });
        }

        state.currentTeam = {
            id: team.id,
            name: team.name,
            code: team.code
        };
        state.currentUser = member;
        state.isAdmin = member.role === 'admin';

        // Save session
        localStorage.setItem('weekflow_session', JSON.stringify({
            teamId: team.id,
            teamCode: team.code,
            memberId: member.id
        }));

        await loadTeamData();
        showMainScreen();

    } catch (error) {
        if (error.message.includes('not found')) {
            alert('Team not found. Check the code and try again.');
        } else {
            alert('Error joining team: ' + error.message);
        }
    } finally {
        showLoading(false);
    }
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
// Load Team Data
// ===================================
async function loadTeamData() {
    if (!state.currentTeam) return;

    try {
        // Load members
        state.members = await apiCall(`/members?teamId=${state.currentTeam.id}`);

        // Load tasks for current week
        state.tasks = await apiCall(`/tasks?teamId=${state.currentTeam.id}&includePending=true`);

        // Load moods
        state.moods = await apiCall(`/moods?teamId=${state.currentTeam.id}`);

        // Load team pulse
        state.pulse = await apiCall(`/moods?teamId=${state.currentTeam.id}&pulse=true`);

    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

// ===================================
// Main Screen
// ===================================
async function showMainScreen() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');

    // Update header
    document.getElementById('teamNameDisplay').textContent = state.currentTeam.name;
    document.getElementById('weekLabel').textContent = getWeekLabel();
    document.getElementById('userNameDisplay').textContent = state.currentUser.name;
    document.getElementById('displayTeamCode').textContent = state.currentTeam.code;

    // Sync language selector with current language
    const headerSelect = document.getElementById('headerLangSelect');
    const settingsSelect = document.getElementById('settingsLang');
    if (headerSelect) headerSelect.value = currentLang;
    if (settingsSelect) settingsSelect.value = currentLang;

    // Show admin badge and presenter button
    if (state.isAdmin) {
        document.getElementById('adminBadge').classList.remove('hidden');
        document.getElementById('presenterBtn').classList.remove('hidden');
    }

    // Update mood
    updateMoodDisplay();

    // Load data
    await refreshData();

    // Update mentions dropdown
    updateMentionsDropdown();
}

async function refreshData() {
    await loadTeamData();
    loadSections();
    loadMembers();
    loadMyTasks();
    loadCarryover();
}

function updateMoodDisplay() {
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    const myMood = state.moods?.find(m => m.member_id === state.currentUser.id);
    const moodValue = myMood?.mood || 4;
    document.getElementById('currentMood').textContent = moods[moodValue - 1] || '😊';
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

async function saveItem() {
    const content = document.getElementById('itemContent').value.trim();
    const mentionId = document.getElementById('itemMention').value;

    if (!content) return;

    try {
        // Map section names to match API
        const sectionMap = {
            showAndTell: 'show_and_tell',
            toDiscuss: 'to_discuss',
            focus: 'focus'
        };

        await apiCall('/tasks', 'POST', {
            teamId: state.currentTeam.id,
            memberId: state.currentUser.id,
            section: sectionMap[currentSection],
            text: content,
            priority: 'normal'
        });

        closeModal('addItemModal');
        await refreshData();

        if (state.presenterMode) {
            updatePresenterView();
        }
    } catch (error) {
        alert('Error saving item: ' + error.message);
    }
}

function loadSections() {
    const weekStart = getWeekStart();
    const sectionMap = {
        showAndTell: 'show_and_tell',
        toDiscuss: 'to_discuss',
        focus: 'focus'
    };

    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const container = document.getElementById(section + 'Items');
        const items = (state.tasks || []).filter(t =>
            t.section === sectionMap[section] &&
            t.week_start === weekStart
        );

        const member = (id) => state.members?.find(m => m.id === id);

        container.innerHTML = items.map(item => `
            <div class="section-item" data-id="${item.id}">
                <div class="item-header">
                    <span class="author">${member(item.member_id)?.name || 'Unknown'}</span>
                    <span class="item-time">${formatTime(item.created_at)}</span>
                </div>
                <div class="item-content">${item.text}</div>
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
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    const weekStart = getWeekStart();

    const membersHtml = (state.members || []).map(member => {
        const memberTasks = (state.tasks || []).filter(t =>
            t.member_id === member.id &&
            t.section === 'personal' &&
            t.week_start === weekStart
        );
        const completed = memberTasks.filter(t => t.status === 'completed').length;
        const total = memberTasks.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        const memberMood = state.moods?.find(m => m.member_id === member.id);
        const moodValue = memberMood?.mood || 4;

        return `
            <div class="member-card">
                <div class="member-header">
                    <div class="member-avatar">${member.avatar || getInitials(member.name)}</div>
                    <span class="member-name">${member.name}${member.role === 'admin' ? ' 👑' : ''}</span>
                    <span class="member-mood">${moods[moodValue - 1]}</span>
                </div>
                <div class="member-progress">
                    <div class="member-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="member-tasks">
                    ${memberTasks.slice(0, 4).map(task => `
                        <div class="member-task ${task.status === 'completed' ? 'completed' : ''}">
                            <span class="priority-dot priority-${task.priority}"></span>
                            <span>${task.text.substring(0, 40)}${task.text.length > 40 ? '...' : ''}</span>
                        </div>
                    `).join('')}
                    ${memberTasks.length > 4 ? `<div class="member-task" style="opacity: 0.5;">+${memberTasks.length - 4} more...</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = membersHtml;

    // Update team pulse
    if (state.pulse && state.pulse.avgMood) {
        document.getElementById('pulseValue').textContent =
            `${moods[Math.round(state.pulse.avgMood) - 1]} ${state.pulse.avgMood}`;
    }
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// ===================================
// My Tasks
// ===================================
function loadMyTasks() {
    const container = document.getElementById('tasksList');
    const weekStart = getWeekStart();

    const myTasks = (state.tasks || []).filter(t =>
        t.member_id === state.currentUser.id &&
        t.section === 'personal'
    );

    // Separate current week and carryover
    const currentWeekTasks = myTasks.filter(t => t.week_start === weekStart);
    const carryoverTasks = myTasks.filter(t => t.week_start !== weekStart && t.status === 'pending');

    const allTasks = [...carryoverTasks.map(t => ({...t, carryover: true})), ...currentWeekTasks];

    const completed = allTasks.filter(t => t.status === 'completed').length;
    const total = allTasks.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${completed}/${total}`;

    container.innerHTML = allTasks.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div class="task-checkbox ${task.status === 'completed' ? 'checked' : ''}" onclick="toggleTask('${task.id}')">
                ${task.status === 'completed' ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-text ${task.status === 'completed' ? 'completed' : ''}">${task.text}</div>
                <div class="task-meta">
                    <span class="task-priority">${getPriorityEmoji(task.priority)}</span>
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

async function addTask() {
    const input = document.getElementById('newTaskInput');
    const priority = document.getElementById('taskPriority').value;

    const text = input.value.trim();
    if (!text) return;

    try {
        await apiCall('/tasks', 'POST', {
            teamId: state.currentTeam.id,
            memberId: state.currentUser.id,
            section: 'personal',
            text: text,
            priority: priority
        });

        input.value = '';
        await refreshData();

    } catch (error) {
        alert('Error adding task: ' + error.message);
    }
}

async function toggleTask(taskId) {
    const task = state.tasks?.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
        await apiCall('/tasks', 'PUT', {
            id: taskId,
            status: newStatus
        });

        await refreshData();

    } catch (error) {
        alert('Error updating task: ' + error.message);
    }
}

// ===================================
// Carryover (Pending from last week)
// ===================================
function loadCarryover() {
    if (!state.isAdmin) return;

    const weekStart = getWeekStart();
    const pendingTasks = (state.tasks || []).filter(t =>
        t.week_start < weekStart &&
        t.status === 'pending' &&
        t.section === 'personal'
    );

    if (pendingTasks.length === 0) {
        document.getElementById('carryoverSection').classList.add('hidden');
        return;
    }

    document.getElementById('carryoverSection').classList.remove('hidden');
    document.getElementById('carryoverCount').textContent = pendingTasks.length;

    const getMemberName = (id) => state.members?.find(m => m.id === id)?.name || 'Unknown';

    document.getElementById('carryoverItems').innerHTML = pendingTasks.map(task => `
        <div class="carryover-item">
            <span class="priority-dot priority-${task.priority}"></span>
            <span class="author">${getMemberName(task.member_id)}:</span>
            <span>${task.text}</span>
        </div>
    `).join('');
}

// ===================================
// Mood with Plutchik Wheel
// ===================================
let plutchikWheel = null;
let selectedMood = 4;

function openMoodPicker() {
    const container = document.getElementById('plutchikContainer');

    // Initialize Plutchik Wheel if not already
    if (!plutchikWheel) {
        plutchikWheel = new PlutchikWheel(container, {
            onSave: async (selection) => {
                await savePlutchikMood(selection);
            },
            onCancel: () => {
                closeModal('moodModal');
            }
        });
    }

    // Update language
    plutchikWheel.setLanguage(currentLang);

    // Load current mood if exists
    const myMood = state.moods?.find(m => m.member_id === state.currentUser.id);
    if (myMood?.emotion_data) {
        plutchikWheel.setSelection(myMood.emotion_data);
    } else {
        plutchikWheel.clearSelection();
    }

    document.getElementById('moodModal').classList.remove('hidden');
}

async function savePlutchikMood(selection) {
    try {
        // Map emotion to traditional mood value (1-5)
        const moodMapping = {
            joy: 5,
            anticipation: 4,
            trust: 4,
            surprise: 3,
            fear: 2,
            sadness: 2,
            disgust: 2,
            anger: 1
        };

        const moodValue = moodMapping[selection.emotion] || 3;

        // Energy based on intensity
        const energyMapping = {
            low: 2,
            medium: 3,
            high: 4
        };
        const energy = energyMapping[selection.intensity] || 3;

        await apiCall('/moods', 'POST', {
            teamId: state.currentTeam.id,
            memberId: state.currentUser.id,
            mood: moodValue,
            energy: energy,
            emotion_data: selection  // Store full Plutchik data
        });

        await refreshData();
        updateMoodDisplay();
        closeModal('moodModal');

    } catch (error) {
        alert('Error saving mood: ' + error.message);
    }
}

// Fallback for simple mood selection
function selectMood(mood) {
    selectedMood = mood;
    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.mood) === mood);
    });
}

async function saveMood() {
    const energy = parseInt(document.getElementById('energyLevel')?.value || 3);

    try {
        await apiCall('/moods', 'POST', {
            teamId: state.currentTeam.id,
            memberId: state.currentUser.id,
            mood: selectedMood,
            energy: energy
        });

        await refreshData();
        updateMoodDisplay();
        closeModal('moodModal');

    } catch (error) {
        alert('Error saving mood: ' + error.message);
    }
}

// ===================================
// Mentions Dropdown
// ===================================
function updateMentionsDropdown() {
    const select = document.getElementById('itemMention');
    select.innerHTML = '<option value="">No one</option>';

    (state.members || []).forEach(member => {
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
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    const weekStart = getWeekStart();
    const sectionMap = {
        showAndTell: 'show_and_tell',
        toDiscuss: 'to_discuss',
        focus: 'focus'
    };

    // Update sections
    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const container = document.getElementById('presenter' + section.charAt(0).toUpperCase() + section.slice(1));
        const items = (state.tasks || []).filter(t =>
            t.section === sectionMap[section] &&
            t.week_start === weekStart
        );

        const getMemberName = (id) => state.members?.find(m => m.id === id)?.name || 'Unknown';

        container.innerHTML = items.map(item => `
            <div class="presenter-item">
                <span class="author">${getMemberName(item.member_id)}:</span>
                ${item.text}
            </div>
        `).join('') || '<p style="opacity: 0.5;">No items yet</p>';
    });

    // Update team members
    const membersHtml = (state.members || []).map(member => {
        const memberTasks = (state.tasks || []).filter(t =>
            t.member_id === member.id &&
            t.section === 'personal' &&
            t.week_start === weekStart
        );
        const completed = memberTasks.filter(t => t.status === 'completed').length;

        const memberMood = state.moods?.find(m => m.member_id === member.id);
        const moodValue = memberMood?.mood || 4;

        return `
            <div class="presenter-member">
                <div class="member-avatar">${member.avatar || getInitials(member.name)}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}${member.role === 'admin' ? ' 👑' : ''}</div>
                    <div class="member-tasks-count">${completed}/${memberTasks.length} tasks</div>
                </div>
                <span class="member-mood">${moods[moodValue - 1]}</span>
            </div>
        `;
    }).join('');

    document.getElementById('presenterMembers').innerHTML = membersHtml;

    // Update pulse
    if (state.pulse && state.pulse.avgMood) {
        document.getElementById('presenterPulse').textContent =
            `${moods[Math.round(state.pulse.avgMood) - 1]} ${state.pulse.avgMood}`;
    }
}

// ===================================
// Settings
// ===================================
function openSettings() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function changeLanguage(lang) {
    setWeekFlowLang(lang);
    // Sync all language selectors
    const headerSelect = document.getElementById('headerLangSelect');
    const settingsSelect = document.getElementById('settingsLang');
    if (headerSelect) headerSelect.value = lang;
    if (settingsSelect) settingsSelect.value = lang;
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
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    const weekStart = getWeekStart();
    const sectionMap = { showAndTell: 'show_and_tell', toDiscuss: 'to_discuss', focus: 'focus' };

    let doc = `# ${state.currentTeam.name} - ${wft('export.title')}\n`;
    doc += `${wft('export.generated')}: ${new Date().toLocaleDateString()}\n\n`;

    // Sections
    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const sectionName = wft(`sections.${section}`);
        const items = (state.tasks || []).filter(t =>
            t.section === sectionMap[section] && t.week_start === weekStart
        );
        const getMemberName = (id) => state.members?.find(m => m.id === id)?.name || 'Unknown';

        doc += `## ${sectionName}\n`;
        items.forEach(item => {
            doc += `- **${getMemberName(item.member_id)}**: ${item.text}\n`;
        });
        doc += '\n';
    });

    // Team tasks
    doc += `## ${wft('sections.team')}\n`;
    (state.members || []).forEach(member => {
        const memberTasks = (state.tasks || []).filter(t =>
            t.member_id === member.id && t.section === 'personal' && t.week_start === weekStart
        );
        const memberMood = state.moods?.find(m => m.member_id === member.id);

        doc += `### ${member.name} ${moods[(memberMood?.mood || 4) - 1]}\n`;
        memberTasks.forEach(task => {
            const status = task.status === 'completed' ? '✅' : '⬜';
            doc += `${status} ${task.text}\n`;
        });
        doc += '\n';
    });

    // Download as markdown
    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekflow-${state.currentTeam.name}-${weekStart}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===================================
// Google Docs Export
// ===================================
function exportToGoogleDocs() {
    const moods = ['😫', '😕', '😐', '😊', '😄'];
    const weekStart = getWeekStart();
    const sectionMap = { showAndTell: 'show_and_tell', toDiscuss: 'to_discuss', focus: 'focus' };

    let content = `${state.currentTeam.name} - ${wft('export.title')}\n`;
    content += `${'='.repeat(50)}\n`;
    content += `${wft('export.generated')}: ${new Date().toLocaleDateString()}\n\n`;

    const sectionIcons = { showAndTell: '📢', toDiscuss: '💬', focus: '🎯' };
    const getMemberName = (id) => state.members?.find(m => m.id === id)?.name || 'Unknown';

    ['showAndTell', 'toDiscuss', 'focus'].forEach(section => {
        const sectionName = wft(`sections.${section}`);
        const items = (state.tasks || []).filter(t =>
            t.section === sectionMap[section] && t.week_start === weekStart
        );
        content += `${sectionIcons[section]} ${sectionName}\n`;
        content += `${'-'.repeat(30)}\n`;
        if (items.length === 0) {
            content += `(No items)\n`;
        } else {
            items.forEach(item => {
                content += `• ${getMemberName(item.member_id)}: ${item.text}\n`;
            });
        }
        content += '\n';
    });

    // Team Pulse
    if (state.pulse && state.pulse.avgMood) {
        content += `📊 ${wft('export.teamPulse')}: ${moods[Math.round(state.pulse.avgMood) - 1]} ${state.pulse.avgMood}\n\n`;
    }

    // Team tasks
    content += `👥 ${wft('sections.team')}\n`;
    content += `${'='.repeat(50)}\n\n`;

    (state.members || []).forEach(member => {
        const memberTasks = (state.tasks || []).filter(t =>
            t.member_id === member.id && t.section === 'personal' && t.week_start === weekStart
        );
        const completed = memberTasks.filter(t => t.status === 'completed').length;
        const memberMood = state.moods?.find(m => m.member_id === member.id);

        content += `${member.name} ${moods[(memberMood?.mood || 4) - 1]} (${completed}/${memberTasks.length})\n`;
        content += `${'-'.repeat(30)}\n`;
        if (memberTasks.length === 0) {
            content += `(No tasks)\n`;
        } else {
            memberTasks.forEach(task => {
                const status = task.status === 'completed' ? '✅' : '⬜';
                const priority = task.priority === 'urgent' ? '🔥' : task.priority === 'important' ? '🟡' : '';
                content += `${status} ${priority} ${task.text}\n`;
            });
        }
        content += '\n';
    });

    document.getElementById('exportPreview').textContent = content;
    document.getElementById('googleDocsModal').classList.remove('hidden');
}

function copyExportContent() {
    const content = document.getElementById('exportPreview').textContent;
    navigator.clipboard.writeText(content);
    alert(wft('messages.contentCopied'));
}

function openGoogleDocs() {
    window.open('https://docs.google.com/document/create', '_blank');
}

// ===================================
// Slack Integration
// ===================================
async function openSlackSetup() {
    try {
        const integrations = await apiCall(`/integrations?teamId=${state.currentTeam.id}&type=slack`);
        const settings = integrations[0]?.settings || {};

        document.getElementById('slackWebhook').value = settings.webhookUrl || '';
        document.getElementById('slackReminderDay').value = settings.reminderDay || '1';
        document.getElementById('slackSummary').checked = settings.sendSummary !== false;
    } catch (e) {
        console.error('Error loading slack settings:', e);
    }
    document.getElementById('slackModal').classList.remove('hidden');
}

async function saveSlackSettings() {
    const settings = {
        webhookUrl: document.getElementById('slackWebhook').value.trim(),
        reminderDay: document.getElementById('slackReminderDay').value,
        sendSummary: document.getElementById('slackSummary').checked
    };

    try {
        await apiCall('/integrations', 'POST', {
            teamId: state.currentTeam.id,
            type: 'slack',
            settings: settings,
            enabled: true
        });

        closeModal('slackModal');
        alert(wft('messages.slackSaved'));
        document.getElementById('slackBtn').innerHTML = `<span>✓ ${wft('actions.setup')}</span>`;
    } catch (error) {
        alert('Error saving settings: ' + error.message);
    }
}

// ===================================
// Email Integration
// ===================================
async function openEmailSetup() {
    try {
        const integrations = await apiCall(`/integrations?teamId=${state.currentTeam.id}&type=email`);
        const settings = integrations[0]?.settings || {};

        document.getElementById('emailAddresses').value = settings.addresses || '';
        document.getElementById('emailReminderDay').value = settings.reminderDay || '1';
        document.getElementById('emailSummary').checked = settings.sendSummary !== false;
    } catch (e) {
        console.error('Error loading email settings:', e);
    }
    document.getElementById('emailModal').classList.remove('hidden');
}

async function saveEmailSettings() {
    const settings = {
        addresses: document.getElementById('emailAddresses').value.trim(),
        reminderDay: document.getElementById('emailReminderDay').value,
        sendSummary: document.getElementById('emailSummary').checked
    };

    try {
        await apiCall('/integrations', 'POST', {
            teamId: state.currentTeam.id,
            type: 'email',
            settings: settings,
            enabled: true
        });

        closeModal('emailModal');
        alert(wft('messages.emailSaved'));
        document.getElementById('emailBtn').innerHTML = `<span>✓ ${wft('actions.setup')}</span>`;
    } catch (error) {
        alert('Error saving settings: ' + error.message);
    }
}

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check URL parameters for direct join
    checkUrlParams();

    // Check for existing session
    const session = localStorage.getItem('weekflow_session');
    if (session) {
        try {
            const { teamId, teamCode, memberId } = JSON.parse(session);

            // Verify session with API
            const team = await apiCall(`/teams?id=${teamId}`);
            const members = await apiCall(`/members?teamId=${teamId}`);
            const member = members.find(m => m.id === memberId);

            if (team && member) {
                state.currentTeam = {
                    id: team.id,
                    name: team.name,
                    code: team.code
                };
                state.currentUser = member;
                state.isAdmin = member.role === 'admin';

                await loadTeamData();
                showMainScreen();
                return;
            }
        } catch (e) {
            console.error('Session restore failed:', e);
            localStorage.removeItem('weekflow_session');
        }
    }

    // Show login screen
    document.getElementById('loginScreen').classList.remove('hidden');
});

// Auto-refresh every 30 seconds
setInterval(async () => {
    if (state.currentTeam && !document.hidden && !state.loading) {
        await refreshData();

        if (state.presenterMode) {
            updatePresenterView();
        }
    }
}, 30000);
