// Обработчик для автоматического обновления рекомендаций
document.addEventListener('DOMContentLoaded', function() {
    console.log('Recommendations handler loaded');
    
    // Сохраняем флаг при отправке формы измерений
    if (window.location.pathname === '/measure') {
        const measureForm = document.querySelector('form');
        if (measureForm) {
            measureForm.addEventListener('submit', function() {
                console.log('Measurements submitted, setting flag');
                sessionStorage.setItem('measurementsSubmitted', 'true');
            });
        }
    }
    
    // Проверяем на странице рекомендаций
    if (window.location.pathname === '/fit') {
        console.log('On fit page, checking for new measurements');
        
        // Если есть флаг новых измерений - обновляем страницу
        if (sessionStorage.getItem('measurementsSubmitted') === 'true') {
            console.log('New measurements detected, reloading...');
            sessionStorage.removeItem('measurementsSubmitted');
            setTimeout(function() {
                window.location.reload();
            }, 1000); // Ждем 1 секунду перед перезагрузкой
        }
        
        // Альтернатива: проверяем, есть ли уже данные на странице
        setTimeout(function() {
            const recommendations = document.querySelector('.recommendations, .fit-results, [class*="result"], [class*="recommend"]');
            if (!recommendations || recommendations.children.length === 0) {
                console.log('No recommendations found, trying to fetch...');
                // Можно попробовать вызвать функцию загрузки, если она есть
                if (typeof loadRecommendations === 'function') {
                    loadRecommendations();
                }
            }
        }, 1500);
    }
});
