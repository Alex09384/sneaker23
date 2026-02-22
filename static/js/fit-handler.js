// Проверяем при загрузке страницы рекомендаций
document.addEventListener('DOMContentLoaded', function() {
    // Если есть флаг новых измерений - обновляем страницу
    if (sessionStorage.getItem('measurementsUpdated') === 'true') {
        console.log('New measurements detected, reloading...');
        sessionStorage.removeItem('measurementsUpdated');
        location.reload();
    }
});
