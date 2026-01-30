/* ===================================
   WeekFlow - Internationalization
   =================================== */

const WEEKFLOW_TRANSLATIONS = {
    en: {
        login: {
            subtitle: "Team check-ins made simple",
            teamCode: "Team Code",
            yourName: "Your Name",
            join: "Join Team",
            or: "or",
            createTeam: "Create New Team"
        },
        createTeam: {
            title: "Create New Team",
            teamName: "Team Name",
            yourName: "Your Name (Admin)",
            create: "Create Team"
        },
        sections: {
            showAndTell: "Show & Tell",
            toDiscuss: "To Discuss",
            focus: "Focus",
            team: "Team",
            carryover: "Pending from Last Week"
        },
        tasks: {
            myTasks: "My Tasks",
            addTask: "Add a task...",
            completed: "completed",
            carryover: "from last week"
        },
        priority: {
            normal: "Tranqui",
            important: "Ojo",
            urgent: "Fuego!"
        },
        mood: {
            howAreYou: "How are you feeling?",
            energy: "Energy Level"
        },
        pulse: {
            team: "Team Pulse:"
        },
        actions: {
            add: "Add",
            save: "Save",
            cancel: "Cancel",
            present: "Present",
            exit: "Exit",
            copy: "Copy",
            export: "Export to Doc"
        },
        settings: {
            title: "Settings",
            language: "Language",
            teamCode: "Team Code",
            inviteLink: "Invite Link",
            leave: "Leave Team"
        },
        form: {
            mentions: "Mention someone (optional)"
        },
        export: {
            title: "Weekly Check-in Summary",
            generated: "Generated on",
            teamPulse: "Team Pulse",
            pending: "Pending Tasks"
        },
        messages: {
            copied: "Copied!",
            linkCopied: "Invite link copied!",
            welcome: "Welcome to the team!",
            taskAdded: "Task added",
            itemAdded: "Item added"
        }
    },
    es: {
        login: {
            subtitle: "Check-ins de equipo simples",
            teamCode: "Código del Equipo",
            yourName: "Tu Nombre",
            join: "Unirse al Equipo",
            or: "o",
            createTeam: "Crear Nuevo Equipo"
        },
        createTeam: {
            title: "Crear Nuevo Equipo",
            teamName: "Nombre del Equipo",
            yourName: "Tu Nombre (Admin)",
            create: "Crear Equipo"
        },
        sections: {
            showAndTell: "Mostrar y Contar",
            toDiscuss: "Para Discutir",
            focus: "Enfoque",
            team: "Equipo",
            carryover: "Pendientes de la Semana Pasada"
        },
        tasks: {
            myTasks: "Mis Tareas",
            addTask: "Agregar tarea...",
            completed: "completadas",
            carryover: "de la semana pasada"
        },
        priority: {
            normal: "Tranqui",
            important: "Ojo",
            urgent: "¡Fuego!"
        },
        mood: {
            howAreYou: "¿Cómo te sientes?",
            energy: "Nivel de Energía"
        },
        pulse: {
            team: "Pulso del Equipo:"
        },
        actions: {
            add: "Agregar",
            save: "Guardar",
            cancel: "Cancelar",
            present: "Presentar",
            exit: "Salir",
            copy: "Copiar",
            export: "Exportar a Doc"
        },
        settings: {
            title: "Configuración",
            language: "Idioma",
            teamCode: "Código del Equipo",
            inviteLink: "Link de Invitación",
            leave: "Salir del Equipo"
        },
        form: {
            mentions: "Mencionar a alguien (opcional)"
        },
        export: {
            title: "Resumen del Check-in Semanal",
            generated: "Generado el",
            teamPulse: "Pulso del Equipo",
            pending: "Tareas Pendientes"
        },
        messages: {
            copied: "¡Copiado!",
            linkCopied: "¡Link de invitación copiado!",
            welcome: "¡Bienvenido al equipo!",
            taskAdded: "Tarea agregada",
            itemAdded: "Item agregado"
        }
    },
    pt: {
        login: {
            subtitle: "Check-ins de equipe simplificados",
            teamCode: "Código da Equipe",
            yourName: "Seu Nome",
            join: "Entrar na Equipe",
            or: "ou",
            createTeam: "Criar Nova Equipe"
        },
        createTeam: {
            title: "Criar Nova Equipe",
            teamName: "Nome da Equipe",
            yourName: "Seu Nome (Admin)",
            create: "Criar Equipe"
        },
        sections: {
            showAndTell: "Mostrar e Contar",
            toDiscuss: "Para Discutir",
            focus: "Foco",
            team: "Equipe",
            carryover: "Pendentes da Semana Passada"
        },
        tasks: {
            myTasks: "Minhas Tarefas",
            addTask: "Adicionar tarefa...",
            completed: "completadas",
            carryover: "da semana passada"
        },
        priority: {
            normal: "Tranquilo",
            important: "Atenção",
            urgent: "Fogo!"
        },
        mood: {
            howAreYou: "Como você está se sentindo?",
            energy: "Nível de Energia"
        },
        pulse: {
            team: "Pulso da Equipe:"
        },
        actions: {
            add: "Adicionar",
            save: "Salvar",
            cancel: "Cancelar",
            present: "Apresentar",
            exit: "Sair",
            copy: "Copiar",
            export: "Exportar para Doc"
        },
        settings: {
            title: "Configurações",
            language: "Idioma",
            teamCode: "Código da Equipe",
            inviteLink: "Link de Convite",
            leave: "Sair da Equipe"
        },
        form: {
            mentions: "Mencionar alguém (opcional)"
        },
        export: {
            title: "Resumo do Check-in Semanal",
            generated: "Gerado em",
            teamPulse: "Pulso da Equipe",
            pending: "Tarefas Pendentes"
        },
        messages: {
            copied: "Copiado!",
            linkCopied: "Link de convite copiado!",
            welcome: "Bem-vindo à equipe!",
            taskAdded: "Tarefa adicionada",
            itemAdded: "Item adicionado"
        }
    }
};

let currentLang = localStorage.getItem('weekflow_lang') || 'en';

function setWeekFlowLang(lang) {
    currentLang = lang;
    localStorage.setItem('weekflow_lang', lang);
    updatePageLanguage();
}

function wft(path) {
    const keys = path.split('.');
    let value = WEEKFLOW_TRANSLATIONS[currentLang];

    for (const key of keys) {
        if (value && value[key] !== undefined) {
            value = value[key];
        } else {
            // Fallback to English
            value = WEEKFLOW_TRANSLATIONS['en'];
            for (const k of keys) {
                value = value?.[k];
            }
            return value || path;
        }
    }
    return value;
}

function updatePageLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = wft(key);
    });

    // Update placeholders
    const taskInput = document.getElementById('newTaskInput');
    if (taskInput) taskInput.placeholder = wft('tasks.addTask');

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    // Update settings dropdown
    const settingsLang = document.getElementById('settingsLang');
    if (settingsLang) settingsLang.value = currentLang;
}

// Initialize language
document.addEventListener('DOMContentLoaded', () => {
    updatePageLanguage();

    // Language button clicks
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setWeekFlowLang(btn.dataset.lang);
        });
    });
});
