document.addEventListener('DOMContentLoaded', function() {
    console.log('Theme switcher script loaded');
    initializeTheme();

    const themeSwitcher = document.getElementById('themeSwitcher');
    console.log('Theme switcher element:', themeSwitcher);

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', toggleTheme);
        console.log('Theme switcher event listener added');
    } else {
        console.error('Theme switcher button not found!');
    }
});

const themeConfig = {
    light: { icon: '☀', text: 'Светлая', next: 'soft' },
    soft: { icon: '🌤', text: 'Мягкая', next: 'dark' },
    dark: { icon: '☾', text: 'Темная', next: 'light' }
};

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    console.log('Initializing theme:', savedTheme);
    setTheme(savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    console.log('Theme toggle clicked');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = themeConfig[currentTheme].next;
    console.log('Switching from', currentTheme, 'to', nextTheme);

    // Добавляем класс анимации
    document.body.classList.add('theme-changing');

    setTimeout(() => {
        setTheme(nextTheme);
        updateThemeButton(nextTheme);
        localStorage.setItem('theme', nextTheme);

        // Убираем класс анимации после завершения
        setTimeout(() => {
            document.body.classList.remove('theme-changing');
        }, 600);
    }, 150);
}

function setTheme(theme) {
    console.log('Setting theme to:', theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Плавное изменение фона
    document.body.style.opacity = '0.8';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 200);
}

function updateThemeButton(theme) {
    const themeSwitcher = document.getElementById('themeSwitcher');
    const themeIcon = document.getElementById('themeIcon');

    console.log('Updating theme button:', theme, 'Icon element:', themeIcon);

    if (themeSwitcher && themeIcon) {
        const config = themeConfig[theme];

        console.log('New icon:', config.icon);

        // Анимация изменения иконки
        themeIcon.style.transform = 'scale(0) rotate(0deg)';
        themeIcon.style.opacity = '0';

        setTimeout(() => {
            themeIcon.textContent = config.icon;
            themeIcon.style.transform = 'scale(1) rotate(360deg)';
            themeIcon.style.opacity = '1';

            // Обновляем title для подсказки
            themeSwitcher.title = config.text + ' тема';

            console.log('Icon updated to:', themeIcon.textContent);
        }, 200);

        // Добавляем эффект пульсации
        themeSwitcher.style.animation = 'none';
        setTimeout(() => {
            themeSwitcher.style.animation = 'pulse 0.6s ease';
        }, 10);
    } else {
        console.error('Theme button elements not found!');
    }
}

// Добавляем CSS анимацию пульсации
if (!document.getElementById('theme-switcher-styles')) {
    const style = document.createElement('style');
    style.id = 'theme-switcher-styles';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        @keyframes themeSwitch {
            0% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(0.98);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        .theme-changing {
            animation: themeSwitch 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Стили для компактной кнопки */
        .theme-switcher {
            background: var(--card-bg);
            border: 2px solid var(--accent-color);
            color: var(--accent-color);
            padding: 8px;
            border-radius: 50%;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 15px;
            position: relative;
            overflow: hidden;
            width: 40px;
            height: 40px;
            min-width: auto;
        }

        .theme-switcher::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.6s;
        }

        .theme-switcher:hover::before {
            left: 100%;
        }

        .theme-switcher:hover {
            background: var(--accent-color);
            color: white;
            transform: translateY(-2px) scale(1.1);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .theme-icon {
            font-size: 18px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-block;
        }

        .theme-switcher:hover .theme-icon {
            transform: rotate(180deg) scale(1.2);
        }

        /* Скрываем текст */
        .theme-text {
            display: none;
        }

        @media (max-width: 768px) {
            .theme-switcher {
                width: 36px;
                height: 36px;
                margin-left: 10px;
            }

            .theme-icon {
                font-size: 16px;
            }
        }
    `;
    document.head.appendChild(style);
}