/* ===================================
   CACTUS COMUNIDAD CREATIVA
   Archivo de Datos Administrable
   CON SOPORTE MULTI-IDIOMA

   INSTRUCCIONES:
   1. Edita los valores aquí para actualizar el contenido
   2. Para agregar un nuevo idioma, copia la estructura de 'es' y tradúcela
   3. El idioma por defecto se define en DEFAULT_LANG
   =================================== */

// Idioma por defecto
const DEFAULT_LANG = 'es';

// Idiomas disponibles
const AVAILABLE_LANGUAGES = {
    es: { name: 'Español', flag: '🇪🇸' },
    en: { name: 'English', flag: '🇺🇸' },
    pt: { name: 'Português', flag: '🇧🇷' }
};

// ============================================
// DATOS GLOBALES (sin traducción)
// ============================================
const GLOBAL_DATA = {
    company: {
        name: "Cactus",
        email: "contacto@cactuscomunidadcreativa.com",
        phone: "+1 (786) 395-4654",
        whatsapp: "17863954654",
        year: new Date().getFullYear()
    },
    social: {
        instagram: "https://instagram.com/cactuscomunidadcreativa",
        linkedin: "https://linkedin.com/company/cactuscomunidadcreativa",
        tiktok: "https://tiktok.com/@cactuscomunidadcreativa"
    },
    stats: {
        clients: 50,
        projects: 200,
        countries: 15
    },
    pricing: {
        currency: "USD",
        starter: { monthly: 500, annual: 400 },
        growth: { monthly: 1500, annual: 1200 },
        scale: { monthly: 3500, annual: 2800 }
    },
    portfolio: [
        {
            id: 1,
            category: "automation",
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&fit=crop",
            url: "https://rowi.vercel.app/",
            featured: true
        },
        {
            id: 2,
            category: "strategy",
            image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=450&fit=crop",
            url: "https://caard-arbitraje.vercel.app/dashboard",
            featured: true
        },
        {
            id: 3,
            category: "content",
            image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=450&fit=crop"
        },
        {
            id: 4,
            category: "social",
            image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=450&fit=crop"
        },
        {
            id: 5,
            category: "automation",
            image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=450&fit=crop"
        },
        {
            id: 6,
            category: "content",
            image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=450&fit=crop"
        }
    ],
    // Apps del ecosistema Cactus
    apps: [
        {
            id: "rowi",
            icon: "🧠",
            color: "#00D9FF",
            url: "https://rowi.vercel.app/",
            category: "wellness",
            price: 0.99,
            freeTrial: 30, // días
            hasCoupon: false,
            status: "live" // live, beta, coming-soon
        },
        {
            id: "caard",
            icon: "⚖️",
            color: "#7C3AED",
            url: "https://caard-arbitraje.vercel.app/dashboard",
            category: "legal",
            price: 0.99,
            freeTrial: 30,
            hasCoupon: false,
            status: "live"
        },
        {
            id: "taskflow",
            icon: "✅",
            color: "#10B981",
            url: null,
            category: "productivity",
            price: 0.99,
            freeTrial: 30,
            hasCoupon: true, // Con cupón = GRATIS
            status: "coming-soon"
        },
        {
            id: "notesai",
            icon: "📝",
            color: "#F59E0B",
            url: null,
            category: "productivity",
            price: 0,
            freeTrial: 0,
            hasCoupon: false,
            status: "coming-soon"
        },
        {
            id: "calendariq",
            icon: "📅",
            color: "#EF4444",
            url: null,
            category: "productivity",
            price: 0.99,
            freeTrial: 30,
            hasCoupon: false,
            status: "coming-soon"
        },
        {
            id: "focusmode",
            icon: "🎯",
            color: "#F472B6",
            url: null,
            category: "wellness",
            price: 0,
            freeTrial: 0,
            hasCoupon: false,
            status: "coming-soon"
        }
    ]
};

// ============================================
// TRADUCCIONES
// ============================================
const TRANSLATIONS = {
    // ========================================
    // ESPAÑOL
    // ========================================
    es: {
        // Meta
        meta: {
            title: "Cactus Comunidad Creativa | Marketing & IA",
            description: "Agencia de marketing, publicidad y comunicaciones potenciada por IA. Creatividad colectiva con el mejor talento global."
        },

        // Navegación
        nav: {
            services: "Servicios",
            solutions: "Soluciones IA",
            apps: "Apps",
            portfolio: "Portafolio",
            pricing: "Precios",
            cta: "Empezar"
        },

        // Hero
        hero: {
            badge: "Potenciado por Inteligencia Artificial",
            title: {
                line1: "Creatividad",
                line2: "Colectiva",
                line3: "+ IA"
            },
            description: "Somos una comunidad global de talentos creativos que transforma tu marketing con inteligencia artificial. Estrategia, contenido y automatización en un solo lugar.",
            cta1: "Solicitar Propuesta",
            cta2: "Ver Servicios",
            stats: {
                clients: "Clientes Activos",
                projects: "Proyectos IA",
                countries: "Países"
            }
        },

        // Marquee
        marquee: ["Social Media", "Content Creation", "Automatización", "Chatbots IA", "Email Marketing", "Publicidad Digital", "Estrategia", "Producción"],

        // Sección Servicios
        services: {
            tag: "Servicios",
            title: "Todo lo que necesitas para",
            titleHighlight: "crecer",
            description: "Todos nuestros servicios están potenciados por nuestro banco interno de apps con IA.",
            cta: "Conocer más",
            items: [
                {
                    id: "social",
                    title: "Social Media Management",
                    description: "Gestión integral de redes sociales con IA. Community management, contenido y análisis predictivo.",
                    features: ["Community Management con IA", "Calendarios Inteligentes", "Análisis de Sentimiento", "Reportes Predictivos"]
                },
                {
                    id: "content",
                    title: "Creación de Contenido",
                    description: "Producción de contenido multimedia optimizado con IA. Videos, diseño, copywriting y más.",
                    features: ["Videos Cortos (Reels, TikTok)", "Diseño Gráfico con IA", "Copywriting Optimizado", "Fotografía de Producto"]
                },
                {
                    id: "automation",
                    title: "Automatización Marketing",
                    description: "Automatiza tu marketing con flujos inteligentes. Email, chatbots, CRM y más.",
                    features: ["Email Marketing Inteligente", "Chatbots Conversacionales", "CRM Automatizado", "Lead Scoring con IA"],
                    badge: "Popular"
                },
                {
                    id: "ads",
                    title: "Publicidad Digital",
                    description: "Campañas de performance optimizadas con IA. Google, Meta, LinkedIn y más.",
                    features: ["Google Ads con IA", "Meta Ads Predictivo", "Audiencias Inteligentes", "Optimización ROAS"]
                },
                {
                    id: "strategy",
                    title: "Estrategia & Consultoría",
                    description: "Diseñamos estrategias integrales de marketing y comunicación potenciadas por datos.",
                    features: ["Diagnóstico Digital", "Plan de Marketing", "Transformación Digital", "Capacitación en IA"]
                },
                {
                    id: "processes",
                    title: "Gestión de Procesos",
                    description: "Optimizamos procesos internos de comunicación, personas e interrelaciones con IA.",
                    features: ["Comunicación Interna", "Procesos Automatizados", "Gestión de Personas", "Interrelaciones B2B"]
                }
            ]
        },

        // Sección Soluciones IA
        solutions: {
            tag: "Tecnología",
            title: "IA en el",
            titleHighlight: "centro",
            titleEnd: "de todo",
            description: "No solo usamos IA, somos IA-first. Cada proceso está optimizado con inteligencia artificial.",
            aiTitle: "Cactus AI Engine",
            metrics: {
                precision: "Precisión",
                speed: "Velocidad",
                active: "Activo"
            },
            items: [
                { number: "01", title: "Generación de Contenido", description: "IA que crea textos, imágenes y videos adaptados a tu marca y audiencia." },
                { number: "02", title: "Análisis Predictivo", description: "Anticipamos tendencias y comportamientos para optimizar tus campañas." },
                { number: "03", title: "Automatización Inteligente", description: "Flujos de trabajo que aprenden y mejoran continuamente." },
                { number: "04", title: "Optimización en Tiempo Real", description: "Ajustes automáticos basados en performance para maximizar ROI." }
            ]
        },

        // Sección Programas
        programs: {
            tag: "Programas Propios",
            title: "Soluciones",
            titleHighlight: "exclusivas",
            description: "Desarrollamos herramientas propias que ninguna otra agencia tiene.",
            demoCta: "Solicitar Demo",
            rowi: {
                badge: "IA Companion",
                title: "Tu Compañero de Inteligencia Emocional",
                description: "IA companion diseñado para desarrollar tu inteligencia emocional con coaching personalizado y herramientas de bienestar.",
                features: ["Coaching emocional con IA", "Seguimiento de estado emocional", "Ejercicios personalizados", "Comunidad de apoyo"]
            },
            sca: {
                badge: "Arbitraje",
                title: "Sistema de Control de Arbitrajes",
                description: "Plataforma integral para gestión de arbitrajes institucionales optimizada con inteligencia artificial.",
                features: ["Gestión completa de casos", "Calculadora de gastos automatizada", "Portal de clientes integrado", "Seguimiento de procesos con IA"]
            },
            lab: {
                title: "Laboratorio de IA Creativa",
                description: "Desarrollamos soluciones de IA personalizadas para tu negocio. Si lo imaginas, lo creamos.",
                tags: ["Modelos Personalizados", "Consultoría IA", "Workshops", "Implementación"]
            }
        },

        // Sección Apps
        apps: {
            tag: "Nuestro Core",
            title: "Banco de",
            titleHighlight: "Apps",
            description: "Todo lo que hacemos viene de nuestro ecosistema interno de apps. Herramientas propias potenciadas por IA que usamos para nuestros clientes y que también puedes usar tú.",
            tryFree: "Probar Gratis",
            viewApp: "Ver App",
            comingSoon: "Próximamente",
            free: "Gratis",
            freeTrial: "prueba gratis",
            month: "mes",
            withCoupon: "Con cupón",
            categories: {
                productivity: "Productividad",
                wellness: "Bienestar",
                legal: "Legal",
                finance: "Finanzas"
            },
            items: [
                { id: "rowi", name: "ROWI", tagline: "IA Companion Emocional", description: "Tu compañero de inteligencia artificial para desarrollar tu inteligencia emocional con coaching y bienestar." },
                { id: "caard", name: "CAARD", tagline: "Sistema de Control de Arbitrajes", description: "Plataforma de gestión de arbitrajes institucionales optimizada con IA, portal de clientes y calculadora." },
                { id: "taskflow", name: "TaskFlow", tagline: "Gestor de Tareas IA", description: "Organiza tus tareas con priorización inteligente y sugerencias automáticas." },
                { id: "notesai", name: "NotesAI", tagline: "Notas Inteligentes", description: "Toma notas que se organizan solas. Resúmenes automáticos y búsqueda semántica." },
                { id: "calendariq", name: "CalendarIQ", tagline: "Calendario Inteligente", description: "Planifica tu tiempo con IA. Sugerencias de horarios y bloques de enfoque." },
                { id: "focusmode", name: "FocusMode", tagline: "Modo Concentración", description: "Elimina distracciones y aumenta tu productividad con técnicas de enfoque." }
            ],
            comingSoonSection: {
                icon: "🚀",
                title: "Más apps próximamente",
                description: "Estamos constantemente desarrollando nuevas herramientas. Suscríbete para enterarte de los lanzamientos.",
                cta: "Notificarme"
            }
        },

        // Sección Portafolio
        portfolio: {
            tag: "Portafolio",
            title: "Lo que hemos",
            titleHighlight: "creado",
            description: "Una muestra de proyectos que demuestran nuestra capacidad.",
            filters: {
                all: "Todos",
                social: "Social Media",
                automation: "Automatización",
                content: "Contenido",
                strategy: "Estrategia"
            },
            items: [
                { id: 1, title: "ROWI - IA Companion Emocional", description: "Compañero de inteligencia artificial diseñado para desarrollar tu inteligencia emocional con coaching personalizado" },
                { id: 2, title: "CAARD - Sistema de Control de Arbitrajes", description: "Plataforma de gestión de arbitrajes institucionales optimizada con IA, portal de clientes y calculadora" },
                { id: 3, title: "Producción Audiovisual", description: "Videos cortos para TikTok e Instagram" },
                { id: 4, title: "Gestión Social Media", description: "Estrategia y gestión integral de redes sociales" },
                { id: 5, title: "Automatización de Procesos", description: "Flujos de trabajo automatizados con IA" },
                { id: 6, title: "Contenido para E-commerce", description: "Fotografía de producto y descripciones con IA" }
            ]
        },

        // Sección Precios
        pricing: {
            tag: "Precios",
            title: "Planes para cada",
            titleHighlight: "etapa",
            description: "Precios transparentes, sin sorpresas. Escala según tu crecimiento.",
            monthly: "Mensual",
            annual: "Anual",
            saveBadge: "-20%",
            perMonth: "/mes",
            custom: "Personalizado",
            cta: "Comenzar",
            ctaEnterprise: "Contactar",
            plans: {
                starter: {
                    name: "Starter",
                    description: "Para emprendedores que inician",
                    features: ["2 redes sociales", "12 publicaciones/mes", "Community management básico", "Reporte mensual", "1 automatización", "Chatbot IA", "Consultoría"]
                },
                growth: {
                    name: "Growth",
                    description: "Para PyMEs en crecimiento",
                    badge: "Más Popular",
                    features: ["4 redes sociales", "20 publicaciones/mes", "Contenido multimedia", "Pauta publicitaria gestionada", "3 automatizaciones", "Email marketing", "Reportes semanales"]
                },
                scale: {
                    name: "Scale",
                    description: "Para empresas medianas",
                    features: ["Redes ilimitadas", "Contenido ilimitado", "Producción audiovisual", "Chatbot IA personalizado", "CRM automatizado", "Consultoría mensual", "Equipo dedicado"]
                },
                enterprise: {
                    name: "Enterprise",
                    description: "Soluciones corporativas a medida",
                    features: ["Todo de Scale +", "Solución 360° personalizada", "Desarrollo IA a medida", "Integración de sistemas", "Capacitaciones", "SLA garantizado", "Account manager dedicado"]
                }
            }
        },

        // CTA Section
        cta: {
            title: "¿Listo para potenciar tu marketing con IA?",
            description: "Agenda una llamada gratuita de 30 minutos y descubre cómo podemos ayudarte.",
            button: "Agendar Llamada",
            whatsapp: "WhatsApp"
        },

        // Sección Contacto
        contact: {
            tag: "Contacto",
            title: "Hablemos de tu",
            titleHighlight: "proyecto",
            description: "Cuéntanos qué necesitas y te preparamos una propuesta personalizada en 24 horas.",
            methods: {
                email: "Email",
                whatsapp: "WhatsApp",
                location: "Ubicación",
                locationValue: "100% Remoto - Global"
            },
            form: {
                name: "Nombre",
                namePlaceholder: "Tu nombre completo",
                email: "Email",
                emailPlaceholder: "tu@email.com",
                company: "Empresa",
                companyPlaceholder: "Nombre de tu empresa",
                service: "Servicio de interés",
                servicePlaceholder: "Selecciona un servicio",
                budget: "Presupuesto mensual estimado",
                budgetPlaceholder: "Selecciona un rango",
                message: "Cuéntanos sobre tu proyecto",
                messagePlaceholder: "¿Qué quieres lograr?",
                submit: "Enviar Mensaje",
                services: [
                    { value: "social", label: "Social Media Management" },
                    { value: "content", label: "Creación de Contenido" },
                    { value: "automation", label: "Automatización Marketing" },
                    { value: "ads", label: "Publicidad Digital" },
                    { value: "strategy", label: "Estrategia & Consultoría" },
                    { value: "programs", label: "Programas (ROWI/SCA)" },
                    { value: "enterprise", label: "Solución Enterprise" }
                ],
                budgets: [
                    { value: "500-1500", label: "$500 - $1,500" },
                    { value: "1500-3500", label: "$1,500 - $3,500" },
                    { value: "3500-7000", label: "$3,500 - $7,000" },
                    { value: "7000+", label: "$7,000+" }
                ]
            }
        },

        // Footer
        footer: {
            tagline: "Creatividad Colectiva + IA",
            description: "Transformamos el marketing de empresas con inteligencia artificial y el mejor talento global.",
            services: "Servicios",
            apps: "Apps",
            company: "Empresa",
            copyright: "Todos los derechos reservados.",
            privacy: "Política de Privacidad",
            terms: "Términos de Servicio",
            viewAll: "Ver Todas"
        },

        // Chatbot
        chatbot: {
            name: "Cactus AI",
            status: "Online",
            placeholder: "Escribe tu mensaje...",
            greeting: "¡Hola! 👋 Soy el asistente de Cactus. Estoy aquí para ayudarte con información sobre nuestros servicios de marketing y IA.\n\n¿En qué puedo ayudarte hoy?",
            quickReplies: ["Servicios", "Precios", "ROWI", "Propuesta"],
            responses: {
                services: "Ofrecemos una gama completa de servicios de marketing potenciados por IA:\n\n📱 Social Media Management\n🎨 Creación de Contenido\n⚡ Automatización\n📈 Publicidad Digital\n📊 Estrategia\n\n¿Sobre cuál te gustaría saber más?",
                pricing: "Tenemos planes adaptados a cada etapa:\n\n🌱 Starter - Desde $500/mes\n🚀 Growth - Desde $1,500/mes\n📈 Scale - Desde $3,500/mes\n🏢 Enterprise - Personalizado\n\n¿Te gustaría una cotización personalizada?",
                rowi: "ROWI es nuestro IA Companion para desarrollar tu inteligencia emocional. 🧠\n\nTe ayuda con coaching personalizado, seguimiento emocional y ejercicios de bienestar.\n\n¿Te gustaría probarlo?",
                proposal: "¡Perfecto! Para prepararte una propuesta personalizada, puedes:\n\n1️⃣ Completar el formulario de contacto\n2️⃣ Escribirnos por WhatsApp\n3️⃣ Agendar una llamada\n\n¿Qué prefieres?",
                contact: "¡Genial! Escríbenos tus datos para contactarte:\n\n📧 Email: contacto@cactuscomunidadcreativa.com\n📱 WhatsApp: +1 (786) 395-4654\n\nO puedes llenar el formulario de contacto aquí abajo 👇\n\n¿Prefieres que te contactemos por WhatsApp?",
                whatsapp: "¡Escríbenos directamente por WhatsApp! 📱\n\n👉 +1 (786) 395-4654\n\nEstamos disponibles para resolver todas tus dudas y prepararte una propuesta personalizada.",
                default: "Gracias por tu mensaje. ¿Podrías especificar si te interesa conocer nuestros servicios, precios, o solicitar una propuesta?"
            }
        }
    },

    // ========================================
    // ENGLISH
    // ========================================
    en: {
        meta: {
            title: "Cactus Creative Community | Marketing & AI",
            description: "AI-powered marketing, advertising, and communications agency. Collective creativity with the best global talent."
        },

        nav: {
            services: "Services",
            solutions: "AI Solutions",
            apps: "Apps",
            portfolio: "Portfolio",
            pricing: "Pricing",
            cta: "Get Started"
        },

        hero: {
            badge: "Powered by Artificial Intelligence",
            title: {
                line1: "Collective",
                line2: "Creativity",
                line3: "+ AI"
            },
            description: "We are a global community of creative talents transforming your marketing with artificial intelligence. Strategy, content, and automation in one place.",
            cta1: "Request Proposal",
            cta2: "View Services",
            stats: {
                clients: "Active Clients",
                projects: "AI Projects",
                countries: "Countries"
            }
        },

        marquee: ["Social Media", "Content Creation", "Automation", "AI Chatbots", "Email Marketing", "Digital Advertising", "Strategy", "Production"],

        services: {
            tag: "Services",
            title: "Everything you need to",
            titleHighlight: "grow",
            description: "All our services are powered by our internal AI app bank.",
            cta: "Learn more",
            items: [
                {
                    id: "social",
                    title: "Social Media Management",
                    description: "Comprehensive social media management with AI. Community management, content, and predictive analytics.",
                    features: ["AI-Powered Community Management", "Smart Calendars", "Sentiment Analysis", "Predictive Reports"]
                },
                {
                    id: "content",
                    title: "Content Creation",
                    description: "AI-optimized multimedia content production. Videos, design, copywriting, and more.",
                    features: ["Short Videos (Reels, TikTok)", "AI Graphic Design", "Optimized Copywriting", "Product Photography"]
                },
                {
                    id: "automation",
                    title: "Marketing Automation",
                    description: "Automate your marketing with smart workflows. Email, chatbots, CRM, and more.",
                    features: ["Smart Email Marketing", "Conversational Chatbots", "Automated CRM", "AI Lead Scoring"],
                    badge: "Popular"
                },
                {
                    id: "ads",
                    title: "Digital Advertising",
                    description: "AI-optimized performance campaigns. Google, Meta, LinkedIn, and more.",
                    features: ["AI Google Ads", "Predictive Meta Ads", "Smart Audiences", "ROAS Optimization"]
                },
                {
                    id: "strategy",
                    title: "Strategy & Consulting",
                    description: "We design comprehensive marketing and communication strategies powered by data.",
                    features: ["Digital Diagnosis", "Marketing Plan", "Digital Transformation", "AI Training"]
                },
                {
                    id: "processes",
                    title: "Process Management",
                    description: "We optimize internal communication, people, and B2B relations processes with AI.",
                    features: ["Internal Communication", "Automated Processes", "People Management", "B2B Relations"]
                }
            ]
        },

        solutions: {
            tag: "Technology",
            title: "AI at the",
            titleHighlight: "core",
            titleEnd: "of everything",
            description: "We don't just use AI, we are AI-first. Every process is optimized with artificial intelligence.",
            aiTitle: "Cactus AI Engine",
            metrics: {
                precision: "Accuracy",
                speed: "Speed",
                active: "Active"
            },
            items: [
                { number: "01", title: "Content Generation", description: "AI that creates texts, images, and videos tailored to your brand and audience." },
                { number: "02", title: "Predictive Analysis", description: "We anticipate trends and behaviors to optimize your campaigns." },
                { number: "03", title: "Smart Automation", description: "Workflows that learn and improve continuously." },
                { number: "04", title: "Real-Time Optimization", description: "Automatic adjustments based on performance to maximize ROI." }
            ]
        },

        programs: {
            tag: "Proprietary Programs",
            title: "Exclusive",
            titleHighlight: "solutions",
            description: "We develop proprietary tools that no other agency has.",
            demoCta: "Request Demo",
            rowi: {
                badge: "AI Companion",
                title: "Your Emotional Intelligence Companion",
                description: "AI companion designed to develop your emotional intelligence with personalized coaching and wellness tools.",
                features: ["AI emotional coaching", "Emotional state tracking", "Personalized exercises", "Support community"]
            },
            sca: {
                badge: "Arbitration",
                title: "Arbitration Control System",
                description: "Comprehensive platform for institutional arbitration management optimized with artificial intelligence.",
                features: ["Complete case management", "Automated cost calculator", "Integrated client portal", "AI-powered process tracking"]
            },
            lab: {
                title: "Creative AI Lab",
                description: "We develop customized AI solutions for your business. If you can imagine it, we can create it.",
                tags: ["Custom Models", "AI Consulting", "Workshops", "Implementation"]
            }
        },

        // Apps Section
        apps: {
            tag: "Our Core",
            title: "App",
            titleHighlight: "Bank",
            description: "Everything we do comes from our internal app ecosystem. Proprietary AI-powered tools we use for our clients - and you can use them too.",
            tryFree: "Try Free",
            viewApp: "View App",
            comingSoon: "Coming Soon",
            free: "Free",
            freeTrial: "free trial",
            month: "month",
            withCoupon: "With coupon",
            categories: {
                productivity: "Productivity",
                wellness: "Wellness",
                legal: "Legal",
                finance: "Finance"
            },
            items: [
                { id: "rowi", name: "ROWI", tagline: "Emotional AI Companion", description: "Your AI companion for developing emotional intelligence with personalized coaching and wellness." },
                { id: "caard", name: "CAARD", tagline: "Arbitration Control System", description: "AI-optimized institutional arbitration management platform with client portal and calculator." },
                { id: "taskflow", name: "TaskFlow", tagline: "AI Task Manager", description: "Organize your tasks with smart prioritization and automatic suggestions." },
                { id: "notesai", name: "NotesAI", tagline: "Smart Notes", description: "Take notes that organize themselves. Automatic summaries and semantic search." },
                { id: "calendariq", name: "CalendarIQ", tagline: "Smart Calendar", description: "Plan your time with AI. Schedule suggestions and focus blocks." },
                { id: "focusmode", name: "FocusMode", tagline: "Focus Mode", description: "Eliminate distractions and boost productivity with focus techniques." }
            ],
            comingSoonSection: {
                icon: "🚀",
                title: "More apps coming soon",
                description: "We're constantly developing new tools. Subscribe to get notified of launches.",
                cta: "Notify Me"
            }
        },

        portfolio: {
            tag: "Portfolio",
            title: "What we've",
            titleHighlight: "created",
            description: "A sample of projects that demonstrate our capabilities.",
            filters: {
                all: "All",
                social: "Social Media",
                automation: "Automation",
                content: "Content",
                strategy: "Strategy"
            },
            items: [
                { id: 1, title: "ROWI - Emotional AI Companion", description: "AI companion designed to develop your emotional intelligence with personalized coaching" },
                { id: 2, title: "CAARD - Arbitration Control System", description: "AI-optimized institutional arbitration management platform with client portal and calculator" },
                { id: 3, title: "Video Production", description: "Short-form videos for TikTok and Instagram" },
                { id: 4, title: "Social Media Management", description: "Comprehensive social media strategy and management" },
                { id: 5, title: "Process Automation", description: "AI-powered automated workflows" },
                { id: 6, title: "E-commerce Content", description: "Product photography and AI descriptions" }
            ]
        },

        pricing: {
            tag: "Pricing",
            title: "Plans for every",
            titleHighlight: "stage",
            description: "Transparent pricing, no surprises. Scale as you grow.",
            monthly: "Monthly",
            annual: "Annual",
            saveBadge: "-20%",
            perMonth: "/mo",
            custom: "Custom",
            cta: "Get Started",
            ctaEnterprise: "Contact Us",
            plans: {
                starter: {
                    name: "Starter",
                    description: "For entrepreneurs just starting",
                    features: ["2 social networks", "12 posts/month", "Basic community management", "Monthly report", "1 automation", "AI Chatbot", "Consulting"]
                },
                growth: {
                    name: "Growth",
                    description: "For growing SMBs",
                    badge: "Most Popular",
                    features: ["4 social networks", "20 posts/month", "Multimedia content", "Managed ad spend", "3 automations", "Email marketing", "Weekly reports"]
                },
                scale: {
                    name: "Scale",
                    description: "For medium-sized companies",
                    features: ["Unlimited networks", "Unlimited content", "Video production", "Custom AI chatbot", "Automated CRM", "Monthly consulting", "Dedicated team"]
                },
                enterprise: {
                    name: "Enterprise",
                    description: "Custom corporate solutions",
                    features: ["Everything in Scale +", "360° custom solution", "Custom AI development", "System integration", "Training", "Guaranteed SLA", "Dedicated account manager"]
                }
            }
        },

        cta: {
            title: "Ready to supercharge your marketing with AI?",
            description: "Schedule a free 30-minute call and discover how we can help you.",
            button: "Schedule Call",
            whatsapp: "WhatsApp"
        },

        contact: {
            tag: "Contact",
            title: "Let's talk about your",
            titleHighlight: "project",
            description: "Tell us what you need and we'll prepare a personalized proposal within 24 hours.",
            methods: {
                email: "Email",
                whatsapp: "WhatsApp",
                location: "Location",
                locationValue: "100% Remote - Global"
            },
            form: {
                name: "Name",
                namePlaceholder: "Your full name",
                email: "Email",
                emailPlaceholder: "you@email.com",
                company: "Company",
                companyPlaceholder: "Your company name",
                service: "Service of interest",
                servicePlaceholder: "Select a service",
                budget: "Estimated monthly budget",
                budgetPlaceholder: "Select a range",
                message: "Tell us about your project",
                messagePlaceholder: "What do you want to achieve?",
                submit: "Send Message",
                services: [
                    { value: "social", label: "Social Media Management" },
                    { value: "content", label: "Content Creation" },
                    { value: "automation", label: "Marketing Automation" },
                    { value: "ads", label: "Digital Advertising" },
                    { value: "strategy", label: "Strategy & Consulting" },
                    { value: "programs", label: "Programs (ROWI/SCA)" },
                    { value: "enterprise", label: "Enterprise Solution" }
                ],
                budgets: [
                    { value: "500-1500", label: "$500 - $1,500" },
                    { value: "1500-3500", label: "$1,500 - $3,500" },
                    { value: "3500-7000", label: "$3,500 - $7,000" },
                    { value: "7000+", label: "$7,000+" }
                ]
            }
        },

        footer: {
            tagline: "Collective Creativity + AI",
            description: "We transform business marketing with artificial intelligence and the best global talent.",
            services: "Services",
            apps: "Apps",
            company: "Company",
            copyright: "All rights reserved.",
            privacy: "Privacy Policy",
            terms: "Terms of Service",
            viewAll: "View All"
        },

        chatbot: {
            name: "Cactus AI",
            status: "Online",
            placeholder: "Type your message...",
            greeting: "Hello! 👋 I'm Cactus assistant. I'm here to help you with information about our marketing and AI services.\n\nHow can I help you today?",
            quickReplies: ["Services", "Pricing", "ROWI", "Proposal"],
            responses: {
                services: "We offer a complete range of AI-powered marketing services:\n\n📱 Social Media Management\n🎨 Content Creation\n⚡ Automation\n📈 Digital Advertising\n📊 Strategy\n\nWhich one would you like to know more about?",
                pricing: "We have plans for every stage:\n\n🌱 Starter - From $500/mo\n🚀 Growth - From $1,500/mo\n📈 Scale - From $3,500/mo\n🏢 Enterprise - Custom\n\nWould you like a personalized quote?",
                rowi: "ROWI is our AI Companion for developing emotional intelligence. 🧠\n\nIt helps you with personalized coaching, emotional state tracking, and wellness exercises.\n\nWould you like to try it?",
                proposal: "Perfect! To prepare a personalized proposal, you can:\n\n1️⃣ Complete the contact form\n2️⃣ Message us on WhatsApp\n3️⃣ Schedule a call\n\nWhat do you prefer?",
                contact: "Great! Here's how you can reach us:\n\n📧 Email: contacto@cactuscomunidadcreativa.com\n📱 WhatsApp: +1 (786) 395-4654\n\nOr you can fill out the contact form below 👇\n\nWould you prefer us to contact you via WhatsApp?",
                whatsapp: "Message us directly on WhatsApp! 📱\n\n👉 +1 (786) 395-4654\n\nWe're available to answer all your questions and prepare a personalized proposal for you.",
                default: "Thanks for your message. Could you specify if you're interested in learning about our services, pricing, or requesting a proposal?"
            }
        }
    },

    // ========================================
    // PORTUGUÊS
    // ========================================
    pt: {
        meta: {
            title: "Cactus Comunidade Criativa | Marketing & IA",
            description: "Agência de marketing, publicidade e comunicações com IA. Criatividade coletiva com o melhor talento global."
        },

        nav: {
            services: "Serviços",
            solutions: "Soluções IA",
            apps: "Apps",
            portfolio: "Portfólio",
            pricing: "Preços",
            cta: "Começar"
        },

        hero: {
            badge: "Potencializado por Inteligência Artificial",
            title: {
                line1: "Criatividade",
                line2: "Coletiva",
                line3: "+ IA"
            },
            description: "Somos uma comunidade global de talentos criativos que transforma seu marketing com inteligência artificial. Estratégia, conteúdo e automação em um só lugar.",
            cta1: "Solicitar Proposta",
            cta2: "Ver Serviços",
            stats: {
                clients: "Clientes Ativos",
                projects: "Projetos IA",
                countries: "Países"
            }
        },

        marquee: ["Social Media", "Criação de Conteúdo", "Automação", "Chatbots IA", "Email Marketing", "Publicidade Digital", "Estratégia", "Produção"],

        services: {
            tag: "Serviços",
            title: "Tudo que você precisa para",
            titleHighlight: "crescer",
            description: "Todos os nossos serviços são potencializados pelo nosso banco interno de apps com IA.",
            cta: "Saiba mais",
            items: [
                {
                    id: "social",
                    title: "Gestão de Redes Sociais",
                    description: "Gestão integral de redes sociais com IA. Community management, conteúdo e análise preditiva.",
                    features: ["Community Management com IA", "Calendários Inteligentes", "Análise de Sentimento", "Relatórios Preditivos"]
                },
                {
                    id: "content",
                    title: "Criação de Conteúdo",
                    description: "Produção de conteúdo multimídia otimizado com IA. Vídeos, design, copywriting e mais.",
                    features: ["Vídeos Curtos (Reels, TikTok)", "Design Gráfico com IA", "Copywriting Otimizado", "Fotografia de Produto"]
                },
                {
                    id: "automation",
                    title: "Automação de Marketing",
                    description: "Automatize seu marketing com fluxos inteligentes. Email, chatbots, CRM e mais.",
                    features: ["Email Marketing Inteligente", "Chatbots Conversacionais", "CRM Automatizado", "Lead Scoring com IA"],
                    badge: "Popular"
                },
                {
                    id: "ads",
                    title: "Publicidade Digital",
                    description: "Campanhas de performance otimizadas com IA. Google, Meta, LinkedIn e mais.",
                    features: ["Google Ads com IA", "Meta Ads Preditivo", "Audiências Inteligentes", "Otimização ROAS"]
                },
                {
                    id: "strategy",
                    title: "Estratégia & Consultoria",
                    description: "Desenvolvemos estratégias integrais de marketing e comunicação baseadas em dados.",
                    features: ["Diagnóstico Digital", "Plano de Marketing", "Transformação Digital", "Treinamento em IA"]
                },
                {
                    id: "processes",
                    title: "Gestão de Processos",
                    description: "Otimizamos processos internos de comunicação, pessoas e relações B2B com IA.",
                    features: ["Comunicação Interna", "Processos Automatizados", "Gestão de Pessoas", "Relações B2B"]
                }
            ]
        },

        solutions: {
            tag: "Tecnologia",
            title: "IA no",
            titleHighlight: "centro",
            titleEnd: "de tudo",
            description: "Não apenas usamos IA, somos IA-first. Cada processo é otimizado com inteligência artificial.",
            aiTitle: "Cactus AI Engine",
            metrics: {
                precision: "Precisão",
                speed: "Velocidade",
                active: "Ativo"
            },
            items: [
                { number: "01", title: "Geração de Conteúdo", description: "IA que cria textos, imagens e vídeos adaptados à sua marca e audiência." },
                { number: "02", title: "Análise Preditiva", description: "Antecipamos tendências e comportamentos para otimizar suas campanhas." },
                { number: "03", title: "Automação Inteligente", description: "Fluxos de trabalho que aprendem e melhoram continuamente." },
                { number: "04", title: "Otimização em Tempo Real", description: "Ajustes automáticos baseados em performance para maximizar ROI." }
            ]
        },

        programs: {
            tag: "Programas Próprios",
            title: "Soluções",
            titleHighlight: "exclusivas",
            description: "Desenvolvemos ferramentas próprias que nenhuma outra agência possui.",
            demoCta: "Solicitar Demo",
            rowi: {
                badge: "IA Companion",
                title: "Seu Companheiro de Inteligência Emocional",
                description: "IA companion projetado para desenvolver sua inteligência emocional com coaching personalizado e ferramentas de bem-estar.",
                features: ["Coaching emocional com IA", "Acompanhamento de estado emocional", "Exercícios personalizados", "Comunidade de apoio"]
            },
            sca: {
                badge: "Arbitragem",
                title: "Sistema de Controle de Arbitragens",
                description: "Plataforma integral para gestão de arbitragens institucionais otimizada com inteligência artificial.",
                features: ["Gestão completa de casos", "Calculadora de custos automatizada", "Portal de clientes integrado", "Acompanhamento de processos com IA"]
            },
            lab: {
                title: "Laboratório de IA Criativa",
                description: "Desenvolvemos soluções de IA personalizadas para seu negócio. Se você imagina, nós criamos.",
                tags: ["Modelos Personalizados", "Consultoria IA", "Workshops", "Implementação"]
            }
        },

        // Apps Section
        apps: {
            tag: "Nosso Core",
            title: "Banco de",
            titleHighlight: "Apps",
            description: "Tudo o que fazemos vem do nosso ecossistema interno de apps. Ferramentas próprias com IA que usamos para nossos clientes - e você também pode usar.",
            tryFree: "Testar Grátis",
            viewApp: "Ver App",
            comingSoon: "Em Breve",
            free: "Grátis",
            freeTrial: "teste grátis",
            month: "mês",
            withCoupon: "Com cupom",
            categories: {
                productivity: "Produtividade",
                wellness: "Bem-estar",
                legal: "Jurídico",
                finance: "Finanças"
            },
            items: [
                { id: "rowi", name: "ROWI", tagline: "IA Companion Emocional", description: "Seu companheiro de IA para desenvolver sua inteligência emocional com coaching e bem-estar personalizados." },
                { id: "caard", name: "CAARD", tagline: "Sistema de Controle de Arbitragens", description: "Plataforma de gestão de arbitragens institucionais otimizada com IA, portal de clientes e calculadora." },
                { id: "taskflow", name: "TaskFlow", tagline: "Gerenciador de Tarefas IA", description: "Organize suas tarefas com priorização inteligente e sugestões automáticas." },
                { id: "notesai", name: "NotesAI", tagline: "Notas Inteligentes", description: "Faça anotações que se organizam sozinhas. Resumos automáticos e busca semântica." },
                { id: "calendariq", name: "CalendarIQ", tagline: "Calendário Inteligente", description: "Planeje seu tempo com IA. Sugestões de horários e blocos de foco." },
                { id: "focusmode", name: "FocusMode", tagline: "Modo Foco", description: "Elimine distrações e aumente sua produtividade com técnicas de foco." }
            ],
            comingSoonSection: {
                icon: "🚀",
                title: "Mais apps em breve",
                description: "Estamos constantemente desenvolvendo novas ferramentas. Inscreva-se para ser notificado dos lançamentos.",
                cta: "Notificar-me"
            }
        },

        portfolio: {
            tag: "Portfólio",
            title: "O que",
            titleHighlight: "criamos",
            description: "Uma amostra de projetos que demonstram nossa capacidade.",
            filters: {
                all: "Todos",
                social: "Social Media",
                automation: "Automação",
                content: "Conteúdo",
                strategy: "Estratégia"
            },
            items: [
                { id: 1, title: "ROWI - IA Companion Emocional", description: "Companheiro de IA projetado para desenvolver sua inteligência emocional com coaching personalizado" },
                { id: 2, title: "CAARD - Sistema de Controle de Arbitragens", description: "Plataforma de gestão de arbitragens institucionais otimizada com IA, portal de clientes e calculadora" },
                { id: 3, title: "Produção Audiovisual", description: "Vídeos curtos para TikTok e Instagram" },
                { id: 4, title: "Gestão Social Media", description: "Estratégia e gestão integral de redes sociais" },
                { id: 5, title: "Automação de Processos", description: "Fluxos de trabalho automatizados com IA" },
                { id: 6, title: "Conteúdo para E-commerce", description: "Fotografia de produto e descrições com IA" }
            ]
        },

        pricing: {
            tag: "Preços",
            title: "Planos para cada",
            titleHighlight: "etapa",
            description: "Preços transparentes, sem surpresas. Escale conforme seu crescimento.",
            monthly: "Mensal",
            annual: "Anual",
            saveBadge: "-20%",
            perMonth: "/mês",
            custom: "Personalizado",
            cta: "Começar",
            ctaEnterprise: "Contatar",
            plans: {
                starter: {
                    name: "Starter",
                    description: "Para empreendedores iniciantes",
                    features: ["2 redes sociais", "12 publicações/mês", "Community management básico", "Relatório mensal", "1 automação", "Chatbot IA", "Consultoria"]
                },
                growth: {
                    name: "Growth",
                    description: "Para PMEs em crescimento",
                    badge: "Mais Popular",
                    features: ["4 redes sociais", "20 publicações/mês", "Conteúdo multimídia", "Mídia paga gerenciada", "3 automações", "Email marketing", "Relatórios semanais"]
                },
                scale: {
                    name: "Scale",
                    description: "Para empresas médias",
                    features: ["Redes ilimitadas", "Conteúdo ilimitado", "Produção audiovisual", "Chatbot IA personalizado", "CRM automatizado", "Consultoria mensal", "Equipe dedicada"]
                },
                enterprise: {
                    name: "Enterprise",
                    description: "Soluções corporativas sob medida",
                    features: ["Tudo do Scale +", "Solução 360° personalizada", "Desenvolvimento IA sob medida", "Integração de sistemas", "Treinamentos", "SLA garantido", "Account manager dedicado"]
                }
            }
        },

        cta: {
            title: "Pronto para potencializar seu marketing com IA?",
            description: "Agende uma ligação gratuita de 30 minutos e descubra como podemos ajudá-lo.",
            button: "Agendar Ligação",
            whatsapp: "WhatsApp"
        },

        contact: {
            tag: "Contato",
            title: "Vamos falar sobre seu",
            titleHighlight: "projeto",
            description: "Conte-nos o que precisa e prepararemos uma proposta personalizada em 24 horas.",
            methods: {
                email: "Email",
                whatsapp: "WhatsApp",
                location: "Localização",
                locationValue: "100% Remoto - Global"
            },
            form: {
                name: "Nome",
                namePlaceholder: "Seu nome completo",
                email: "Email",
                emailPlaceholder: "voce@email.com",
                company: "Empresa",
                companyPlaceholder: "Nome da sua empresa",
                service: "Serviço de interesse",
                servicePlaceholder: "Selecione um serviço",
                budget: "Orçamento mensal estimado",
                budgetPlaceholder: "Selecione uma faixa",
                message: "Conte-nos sobre seu projeto",
                messagePlaceholder: "O que você quer alcançar?",
                submit: "Enviar Mensagem",
                services: [
                    { value: "social", label: "Gestão de Redes Sociais" },
                    { value: "content", label: "Criação de Conteúdo" },
                    { value: "automation", label: "Automação de Marketing" },
                    { value: "ads", label: "Publicidade Digital" },
                    { value: "strategy", label: "Estratégia & Consultoria" },
                    { value: "programs", label: "Programas (ROWI/SCA)" },
                    { value: "enterprise", label: "Solução Enterprise" }
                ],
                budgets: [
                    { value: "500-1500", label: "$500 - $1.500" },
                    { value: "1500-3500", label: "$1.500 - $3.500" },
                    { value: "3500-7000", label: "$3.500 - $7.000" },
                    { value: "7000+", label: "$7.000+" }
                ]
            }
        },

        footer: {
            tagline: "Criatividade Coletiva + IA",
            description: "Transformamos o marketing de empresas com inteligência artificial e o melhor talento global.",
            services: "Serviços",
            apps: "Apps",
            company: "Empresa",
            copyright: "Todos os direitos reservados.",
            privacy: "Política de Privacidade",
            terms: "Termos de Serviço",
            viewAll: "Ver Todos"
        },

        chatbot: {
            name: "Cactus AI",
            status: "Online",
            placeholder: "Digite sua mensagem...",
            greeting: "Olá! 👋 Sou o assistente da Cactus. Estou aqui para ajudá-lo com informações sobre nossos serviços de marketing e IA.\n\nComo posso ajudá-lo hoje?",
            quickReplies: ["Serviços", "Preços", "ROWI", "Proposta"],
            responses: {
                services: "Oferecemos uma gama completa de serviços de marketing com IA:\n\n📱 Gestão de Redes Sociais\n🎨 Criação de Conteúdo\n⚡ Automação\n📈 Publicidade Digital\n📊 Estratégia\n\nSobre qual gostaria de saber mais?",
                pricing: "Temos planos para cada etapa:\n\n🌱 Starter - A partir de $500/mês\n🚀 Growth - A partir de $1.500/mês\n📈 Scale - A partir de $3.500/mês\n🏢 Enterprise - Personalizado\n\nGostaria de um orçamento personalizado?",
                rowi: "ROWI é nosso IA Companion para desenvolver inteligência emocional. 🧠\n\nAjuda você com coaching personalizado, acompanhamento emocional e exercícios de bem-estar.\n\nGostaria de experimentar?",
                proposal: "Perfeito! Para preparar uma proposta personalizada, você pode:\n\n1️⃣ Preencher o formulário de contato\n2️⃣ Nos enviar mensagem pelo WhatsApp\n3️⃣ Agendar uma ligação\n\nO que você prefere?",
                contact: "Ótimo! Aqui estão nossos dados de contato:\n\n📧 Email: contacto@cactuscomunidadcreativa.com\n📱 WhatsApp: +1 (786) 395-4654\n\nOu você pode preencher o formulário de contato abaixo 👇\n\nPrefere que entremos em contato pelo WhatsApp?",
                whatsapp: "Fale conosco diretamente pelo WhatsApp! 📱\n\n👉 +1 (786) 395-4654\n\nEstamos disponíveis para responder todas as suas dúvidas e preparar uma proposta personalizada.",
                default: "Obrigado pela sua mensagem. Poderia especificar se está interessado em conhecer nossos serviços, preços ou solicitar uma proposta?"
            }
        }
    }
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

// Obtener idioma actual
function getCurrentLang() {
    return localStorage.getItem('cactus_lang') || DEFAULT_LANG;
}

// Cambiar idioma
function setLang(lang) {
    if (AVAILABLE_LANGUAGES[lang]) {
        localStorage.setItem('cactus_lang', lang);
        return true;
    }
    return false;
}

// Obtener traducción
function t(path) {
    const lang = getCurrentLang();
    const keys = path.split('.');
    let value = TRANSLATIONS[lang];

    for (const key of keys) {
        if (value && value[key] !== undefined) {
            value = value[key];
        } else {
            // Fallback a español
            value = TRANSLATIONS[DEFAULT_LANG];
            for (const k of keys) {
                if (value && value[k] !== undefined) {
                    value = value[k];
                } else {
                    return path; // Retorna el path si no encuentra
                }
            }
            break;
        }
    }

    return value;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GLOBAL_DATA, TRANSLATIONS, AVAILABLE_LANGUAGES, DEFAULT_LANG, getCurrentLang, setLang, t };
}
