/* ===================================
   Plutchik Emotion Wheel Component
   Interactive & Multi-language
   =================================== */

// Default emotions structure (editable by admin)
const DEFAULT_EMOTIONS = {
    // 8 primary emotions with 3 intensity levels each
    joy: {
        color: '#F7DC6F',
        intensities: ['serenity', 'joy', 'ecstasy']
    },
    trust: {
        color: '#82E0AA',
        intensities: ['acceptance', 'trust', 'admiration']
    },
    fear: {
        color: '#76D7C4',
        intensities: ['apprehension', 'fear', 'terror']
    },
    surprise: {
        color: '#85C1E9',
        intensities: ['distraction', 'surprise', 'amazement']
    },
    sadness: {
        color: '#BB8FCE',
        intensities: ['pensiveness', 'sadness', 'grief']
    },
    disgust: {
        color: '#C39BD3',
        intensities: ['boredom', 'disgust', 'loathing']
    },
    anger: {
        color: '#F1948A',
        intensities: ['annoyance', 'anger', 'rage']
    },
    anticipation: {
        color: '#F5B041',
        intensities: ['interest', 'anticipation', 'vigilance']
    }
};

// Translations for all emotions
const EMOTION_TRANSLATIONS = {
    en: {
        title: "How are you feeling?",
        subtitle: "Click on the emotion that best describes how you feel",
        selected: "You selected:",
        intensity: "Intensity",
        save: "Save",
        cancel: "Cancel",
        emotions: {
            serenity: "Serenity", joy: "Joy", ecstasy: "Ecstasy",
            acceptance: "Acceptance", trust: "Trust", admiration: "Admiration",
            apprehension: "Apprehension", fear: "Fear", terror: "Terror",
            distraction: "Distraction", surprise: "Surprise", amazement: "Amazement",
            pensiveness: "Pensiveness", sadness: "Sadness", grief: "Grief",
            boredom: "Boredom", disgust: "Disgust", loathing: "Loathing",
            annoyance: "Annoyance", anger: "Anger", rage: "Rage",
            interest: "Interest", anticipation: "Anticipation", vigilance: "Vigilance"
        }
    },
    es: {
        title: "¿Cómo te sientes?",
        subtitle: "Haz clic en la emoción que mejor describe cómo te sientes",
        selected: "Seleccionaste:",
        intensity: "Intensidad",
        save: "Guardar",
        cancel: "Cancelar",
        emotions: {
            serenity: "Serenidad", joy: "Alegría", ecstasy: "Éxtasis",
            acceptance: "Aceptación", trust: "Confianza", admiration: "Admiración",
            apprehension: "Preocupación", fear: "Miedo", terror: "Terror",
            distraction: "Distracción", surprise: "Sorpresa", amazement: "Asombro",
            pensiveness: "Pensativo", sadness: "Tristeza", grief: "Dolor",
            boredom: "Aburrimiento", disgust: "Repugnancia", loathing: "Aversión",
            annoyance: "Molestia", anger: "Enojo", rage: "Rabia",
            interest: "Interés", anticipation: "Anticipación", vigilance: "Vigilancia"
        }
    },
    pt: {
        title: "Como você está se sentindo?",
        subtitle: "Clique na emoção que melhor descreve como você se sente",
        selected: "Você selecionou:",
        intensity: "Intensidade",
        save: "Salvar",
        cancel: "Cancelar",
        emotions: {
            serenity: "Serenidade", joy: "Alegria", ecstasy: "Êxtase",
            acceptance: "Aceitação", trust: "Confiança", admiration: "Admiração",
            apprehension: "Apreensão", fear: "Medo", terror: "Terror",
            distraction: "Distração", surprise: "Surpresa", amazement: "Espanto",
            pensiveness: "Pensativo", sadness: "Tristeza", grief: "Dor",
            boredom: "Tédio", disgust: "Repugnância", loathing: "Aversão",
            annoyance: "Irritação", anger: "Raiva", rage: "Fúria",
            interest: "Interesse", anticipation: "Antecipação", vigilance: "Vigilância"
        }
    },
    it: {
        title: "Come ti senti?",
        subtitle: "Clicca sull'emozione che meglio descrive come ti senti",
        selected: "Hai selezionato:",
        intensity: "Intensità",
        save: "Salva",
        cancel: "Annulla",
        emotions: {
            serenity: "Serenità", joy: "Gioia", ecstasy: "Estasi",
            acceptance: "Accettazione", trust: "Fiducia", admiration: "Ammirazione",
            apprehension: "Apprensione", fear: "Paura", terror: "Terrore",
            distraction: "Distrazione", surprise: "Sorpresa", amazement: "Stupore",
            pensiveness: "Pensierosità", sadness: "Tristezza", grief: "Dolore",
            boredom: "Noia", disgust: "Disgusto", loathing: "Repulsione",
            annoyance: "Fastidio", anger: "Rabbia", rage: "Furia",
            interest: "Interesse", anticipation: "Anticipazione", vigilance: "Vigilanza"
        }
    },
    ja: {
        title: "今の気分は？",
        subtitle: "あなたの気持ちに最も近い感情をクリックしてください",
        selected: "選択した感情:",
        intensity: "強度",
        save: "保存",
        cancel: "キャンセル",
        emotions: {
            serenity: "穏やか", joy: "喜び", ecstasy: "恍惚",
            acceptance: "受容", trust: "信頼", admiration: "敬愛",
            apprehension: "不安", fear: "恐れ", terror: "恐怖",
            distraction: "気散じ", surprise: "驚き", amazement: "驚愕",
            pensiveness: "物思い", sadness: "悲しみ", grief: "悲嘆",
            boredom: "退屈", disgust: "嫌悪", loathing: "憎悪",
            annoyance: "苛立ち", anger: "怒り", rage: "激怒",
            interest: "興味", anticipation: "期待", vigilance: "警戒"
        }
    },
    zh: {
        title: "你感觉如何？",
        subtitle: "点击最能描述你感受的情绪",
        selected: "你选择了:",
        intensity: "强度",
        save: "保存",
        cancel: "取消",
        emotions: {
            serenity: "平静", joy: "快乐", ecstasy: "狂喜",
            acceptance: "接受", trust: "信任", admiration: "敬佩",
            apprehension: "担忧", fear: "恐惧", terror: "惊恐",
            distraction: "分心", surprise: "惊讶", amazement: "惊奇",
            pensiveness: "沉思", sadness: "悲伤", grief: "悲痛",
            boredom: "无聊", disgust: "厌恶", loathing: "憎恨",
            annoyance: "烦恼", anger: "愤怒", rage: "狂怒",
            interest: "兴趣", anticipation: "期待", vigilance: "警惕"
        }
    },
    ko: {
        title: "기분이 어떠세요?",
        subtitle: "지금 느끼는 감정을 클릭하세요",
        selected: "선택한 감정:",
        intensity: "강도",
        save: "저장",
        cancel: "취소",
        emotions: {
            serenity: "평온", joy: "기쁨", ecstasy: "황홀",
            acceptance: "수용", trust: "신뢰", admiration: "존경",
            apprehension: "불안", fear: "두려움", terror: "공포",
            distraction: "산만", surprise: "놀람", amazement: "경악",
            pensiveness: "사색", sadness: "슬픔", grief: "비통",
            boredom: "지루함", disgust: "혐오", loathing: "증오",
            annoyance: "짜증", anger: "분노", rage: "격노",
            interest: "관심", anticipation: "기대", vigilance: "경계"
        }
    },
    ar: {
        title: "كيف تشعر؟",
        subtitle: "انقر على الشعور الذي يصف حالتك",
        selected: "اخترت:",
        intensity: "الشدة",
        save: "حفظ",
        cancel: "إلغاء",
        emotions: {
            serenity: "صفاء", joy: "فرح", ecstasy: "نشوة",
            acceptance: "قبول", trust: "ثقة", admiration: "إعجاب",
            apprehension: "قلق", fear: "خوف", terror: "رعب",
            distraction: "تشتت", surprise: "مفاجأة", amazement: "ذهول",
            pensiveness: "تأمل", sadness: "حزن", grief: "أسى",
            boredom: "ملل", disgust: "اشمئزاز", loathing: "كراهية",
            annoyance: "انزعاج", anger: "غضب", rage: "هياج",
            interest: "اهتمام", anticipation: "ترقب", vigilance: "يقظة"
        }
    }
};

// Plutchik Wheel Component
class PlutchikWheel {
    constructor(containerOrId, options = {}) {
        // Accept either an element or an ID string
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
        } else {
            this.container = containerOrId;
        }

        this.lang = options.lang || 'en';
        this.onSave = options.onSave || (() => {});
        this.onCancel = options.onCancel || (() => {});
        this.customEmotions = options.customEmotions || null;
        this.selectedEmotion = null;
        this.selectedIntensity = null;
        this.selectedLevel = null;

        this.emotions = this.customEmotions || DEFAULT_EMOTIONS;
        this.render();
    }

    getTranslation(key) {
        const t = EMOTION_TRANSLATIONS[this.lang] || EMOTION_TRANSLATIONS['en'];
        return t[key] || key;
    }

    getEmotionName(emotionKey) {
        const t = EMOTION_TRANSLATIONS[this.lang] || EMOTION_TRANSLATIONS['en'];
        return t.emotions[emotionKey] || emotionKey;
    }

    setLanguage(lang) {
        this.lang = lang;
        this.render();
    }

    render() {
        const emotionKeys = Object.keys(this.emotions);
        const angleStep = 360 / emotionKeys.length;

        this.container.innerHTML = `
            <div class="plutchik-wheel-container">
                <h3 class="plutchik-title">${this.getTranslation('title')}</h3>
                <p class="plutchik-subtitle">${this.getTranslation('subtitle')}</p>

                <div class="plutchik-wheel" id="plutchikSvgContainer">
                    <svg viewBox="-150 -150 300 300" class="plutchik-svg">
                        ${this.renderWheel(emotionKeys, angleStep)}
                    </svg>
                </div>

                <div class="plutchik-selection hidden" id="plutchikSelection">
                    <div class="selection-display">
                        <span class="selection-label">${this.getTranslation('selected')}</span>
                        <span class="selection-emotion" id="selectedEmotionDisplay"></span>
                    </div>
                    <div class="intensity-selector" id="intensitySelector"></div>
                </div>

                <div class="plutchik-actions">
                    <button class="btn btn-outline" onclick="plutchikWheel.cancel()">${this.getTranslation('cancel')}</button>
                    <button class="btn btn-primary" onclick="plutchikWheel.save()" id="plutchikSaveBtn" disabled>${this.getTranslation('save')}</button>
                </div>
            </div>
        `;

        this.attachEvents();
    }

    renderWheel(emotionKeys, angleStep) {
        let svg = '';

        emotionKeys.forEach((emotion, index) => {
            const startAngle = index * angleStep - 90;
            const endAngle = startAngle + angleStep;
            const emotionData = this.emotions[emotion];

            // Three intensity rings (outer = mild, middle = moderate, inner = intense)
            [0, 1, 2].forEach((intensityLevel) => {
                const outerRadius = 140 - (intensityLevel * 35);
                const innerRadius = outerRadius - 35;

                const path = this.createArcPath(innerRadius, outerRadius, startAngle, endAngle);
                const intensity = emotionData.intensities[intensityLevel];
                const color = this.adjustColorIntensity(emotionData.color, intensityLevel);

                svg += `
                    <path
                        d="${path}"
                        fill="${color}"
                        stroke="#fff"
                        stroke-width="1"
                        class="emotion-segment"
                        data-emotion="${emotion}"
                        data-intensity="${intensity}"
                        data-level="${intensityLevel}"
                    />
                `;

                // Add text label for middle intensity (most readable)
                if (intensityLevel === 1) {
                    const midAngle = (startAngle + endAngle) / 2;
                    const textRadius = (innerRadius + outerRadius) / 2;
                    const x = textRadius * Math.cos(midAngle * Math.PI / 180);
                    const y = textRadius * Math.sin(midAngle * Math.PI / 180);

                    svg += `
                        <text
                            x="${x}"
                            y="${y}"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            class="emotion-label"
                            data-emotion="${emotion}"
                            style="font-size: 10px; fill: #333; pointer-events: none;"
                        >${this.getEmotionName(intensity)}</text>
                    `;
                }
            });
        });

        return svg;
    }

    createArcPath(innerRadius, outerRadius, startAngle, endAngle) {
        const startRad = startAngle * Math.PI / 180;
        const endRad = endAngle * Math.PI / 180;

        const x1 = outerRadius * Math.cos(startRad);
        const y1 = outerRadius * Math.sin(startRad);
        const x2 = outerRadius * Math.cos(endRad);
        const y2 = outerRadius * Math.sin(endRad);
        const x3 = innerRadius * Math.cos(endRad);
        const y3 = innerRadius * Math.sin(endRad);
        const x4 = innerRadius * Math.cos(startRad);
        const y4 = innerRadius * Math.sin(startRad);

        const largeArc = (endAngle - startAngle > 180) ? 1 : 0;

        return `
            M ${x1} ${y1}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
            Z
        `;
    }

    adjustColorIntensity(baseColor, level) {
        // level 0 = lightest, level 2 = darkest
        const lightness = [0.3, 0, -0.2][level];
        return this.adjustColor(baseColor, lightness);
    }

    adjustColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        let r = (num >> 16) + Math.round(amount * 255);
        let g = ((num >> 8) & 0x00FF) + Math.round(amount * 255);
        let b = (num & 0x0000FF) + Math.round(amount * 255);

        r = Math.min(255, Math.max(0, r));
        g = Math.min(255, Math.max(0, g));
        b = Math.min(255, Math.max(0, b));

        return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
    }

    attachEvents() {
        const segments = this.container.querySelectorAll('.emotion-segment');

        segments.forEach(segment => {
            segment.addEventListener('click', (e) => {
                this.handleSegmentClick(e.target);
            });

            segment.addEventListener('mouseenter', (e) => {
                e.target.style.opacity = '0.8';
                e.target.style.cursor = 'pointer';
            });

            segment.addEventListener('mouseleave', (e) => {
                e.target.style.opacity = '1';
            });
        });
    }

    handleSegmentClick(segment) {
        const emotion = segment.dataset.emotion;
        const intensity = segment.dataset.intensity;
        const level = parseInt(segment.dataset.level);

        this.selectedEmotion = emotion;
        this.selectedIntensity = intensity;
        this.selectedLevel = level;

        // Highlight selected segment
        this.container.querySelectorAll('.emotion-segment').forEach(s => {
            s.classList.remove('selected');
        });
        segment.classList.add('selected');

        // Show selection
        const selectionDiv = document.getElementById('plutchikSelection');
        const displaySpan = document.getElementById('selectedEmotionDisplay');
        const saveBtn = document.getElementById('plutchikSaveBtn');

        selectionDiv.classList.remove('hidden');
        displaySpan.textContent = this.getEmotionName(intensity);
        displaySpan.style.backgroundColor = this.emotions[emotion].color;
        saveBtn.disabled = false;

        // Show intensity options
        this.renderIntensitySelector(emotion, level);
    }

    renderIntensitySelector(emotion, currentLevel) {
        const emotionData = this.emotions[emotion];
        const container = document.getElementById('intensitySelector');

        container.innerHTML = `
            <span class="intensity-label">${this.getTranslation('intensity')}:</span>
            ${emotionData.intensities.map((intensity, idx) => `
                <button
                    class="intensity-btn ${idx === currentLevel ? 'active' : ''}"
                    data-intensity="${intensity}"
                    data-level="${idx}"
                    style="background-color: ${this.adjustColorIntensity(emotionData.color, idx)}"
                    onclick="plutchikWheel.selectIntensity('${emotion}', '${intensity}', ${idx})"
                >${this.getEmotionName(intensity)}</button>
            `).join('')}
        `;
    }

    selectIntensity(emotion, intensity, level) {
        this.selectedIntensity = intensity;
        this.selectedLevel = level;

        // Update UI
        document.querySelectorAll('.intensity-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.intensity === intensity);
        });

        document.getElementById('selectedEmotionDisplay').textContent = this.getEmotionName(intensity);

        // Highlight the corresponding segment
        this.container.querySelectorAll('.emotion-segment').forEach(s => {
            s.classList.remove('selected');
            if (s.dataset.emotion === emotion && s.dataset.intensity === intensity) {
                s.classList.add('selected');
            }
        });
    }

    save() {
        if (this.selectedEmotion && this.selectedIntensity) {
            const intensityLevels = ['low', 'medium', 'high'];
            this.onSave({
                emotion: this.selectedEmotion,
                intensityKey: this.selectedIntensity,
                intensity: intensityLevels[this.selectedLevel] || 'medium',
                label: this.getEmotionName(this.selectedIntensity),
                color: this.emotions[this.selectedEmotion].color
            });
        }
    }

    cancel() {
        this.selectedEmotion = null;
        this.selectedIntensity = null;
        this.selectedLevel = null;
        this.onCancel();
    }

    clearSelection() {
        this.selectedEmotion = null;
        this.selectedIntensity = null;
        this.selectedLevel = null;
        this.render();
    }

    setSelection(emotionData) {
        if (emotionData && emotionData.emotion && emotionData.intensityKey) {
            this.selectedEmotion = emotionData.emotion;
            this.selectedIntensity = emotionData.intensityKey;
            // Find level from intensity key
            const emotionConfig = this.emotions[emotionData.emotion];
            if (emotionConfig) {
                this.selectedLevel = emotionConfig.intensities.indexOf(emotionData.intensityKey);
            }
            this.render();
            // Re-highlight the selection after render
            setTimeout(() => {
                const segment = this.container.querySelector(
                    `.emotion-segment[data-emotion="${emotionData.emotion}"][data-intensity="${emotionData.intensityKey}"]`
                );
                if (segment) {
                    this.handleSegmentClick(segment);
                }
            }, 100);
        }
    }
}

// Global instance for use in WeekFlow
let plutchikWheel = null;

function initPlutchikWheel(containerId, options) {
    plutchikWheel = new PlutchikWheel(containerId, options);
    return plutchikWheel;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlutchikWheel, initPlutchikWheel, EMOTION_TRANSLATIONS, DEFAULT_EMOTIONS };
}
