let allRecommendations = [];
let currentDisplayCount = 12;
let currentFilters = {
    compatibility: 'all',
    sort: 'compatibility-desc',
    type: 'all'
};

async function loadRecommendations() {
    try {
        const response = await fetch('/get_recommendations');

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const recommendations = await response.json();

        const container = document.getElementById('recommendations-container');
        const resultsCount = document.getElementById('resultsCount');
        const filterSection = document.querySelector('.filter-section');

        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="no-recommendations">
                    <h3>Рекомендации не найдены</h3>
                    <p>Для получения рекомендаций необходимо заполнить измерения стопы</p>
                    <a href="/measure" class="btn btn-primary" style="margin-top: 15px;">Заполнить измерения</a>
                </div>
            `;
            resultsCount.textContent = 'Рекомендации не найдены';
            if (filterSection) filterSection.style.display = 'none';
            return;
        }

        if (filterSection) filterSection.style.display = 'block';

        const recommendationsWithType = await Promise.all(
            recommendations.map(async rec => {
                const shoeType = await getShoeType(rec.model);
                return {
                    ...rec,
                    shoeType: shoeType
                };
            })
        );

        allRecommendations = recommendationsWithType;
        initializeFilters();
        applyFiltersAndDisplay();

    } catch (error) {
        console.error('Error loading recommendations:', error);
        const container = document.getElementById('recommendations-container');
        const resultsCount = document.getElementById('resultsCount');
        const filterSection = document.querySelector('.filter-section');

        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p>Ошибка загрузки рекомендаций</p>
                <button onclick="loadRecommendations()" class="btn btn-primary">Попробовать снова</button>
            </div>
        `;
        resultsCount.textContent = 'Ошибка загрузки';
        if (filterSection) filterSection.style.display = 'none';
    }
}

async function getShoeType(modelName) {
    try {
        const response = await fetch('/get_shoe_type?model=' + encodeURIComponent(modelName));
        if (!response.ok) return 'sport';
        const data = await response.json();
        return data.shoeType || 'sport';
    } catch (error) {
        console.error('Error getting shoe type:', error);
        const modelLower = modelName.toLowerCase();
        if (modelLower.includes('runner') || modelLower.includes('st') || modelLower.includes('sport')) {
            return 'sport';
        } else if (modelLower.includes('club') || modelLower.includes('court') || modelLower.includes('lifestyle')) {
            return 'casual';
        }
        return 'sport';
    }
}

function initializeFilters() {
    const compatibilityFilter = document.getElementById('compatibilityFilter');
    const sortFilter = document.getElementById('sortFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (compatibilityFilter) {
        compatibilityFilter.addEventListener('change', function() {
            currentFilters.compatibility = this.value;
            applyFiltersAndDisplay();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            currentFilters.sort = this.value;
            applyFiltersAndDisplay();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            currentFilters.type = this.value;
            applyFiltersAndDisplay();
        });
    }
}

function applyFiltersAndDisplay() {
    let filtered = [...allRecommendations];

    if (currentFilters.compatibility !== 'all') {
        const minCompatibility = parseInt(currentFilters.compatibility);
        filtered = filtered.filter(rec => rec.compatibility >= minCompatibility);
    }

    if (currentFilters.type !== 'all') {
        filtered = filtered.filter(rec => {
            if (currentFilters.type === 'sport') return rec.shoeType === 'sport';
            if (currentFilters.type === 'casual') return rec.shoeType === 'casual';
            return true;
        });
    }

    filtered.sort((a, b) => {
        switch (currentFilters.sort) {
            case 'compatibility-asc':
                return a.compatibility - b.compatibility;
            case 'name-asc':
                return a.model.localeCompare(b.model);
            case 'name-desc':
                return b.model.localeCompare(a.model);
            case 'compatibility-desc':
            default:
                return b.compatibility - a.compatibility;
        }
    });

    document.getElementById('resultsCount').textContent =
        `Найдено моделей: ${filtered.length}`;

    displayRecommendations(filtered, currentDisplayCount);
}

function displayRecommendations(recommendations, count) {
    const container = document.getElementById('recommendations-container');
    const showMoreContainer = document.getElementById('showMoreContainer');
    const recommendationsToShow = recommendations.slice(0, count);

    if (recommendationsToShow.length === 0) {
        container.innerHTML = `
            <div class="no-recommendations">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        showMoreContainer.style.display = 'none';
        return;
    }

    let html = '<div class="recommendations-grid">';

    for (const rec of recommendationsToShow) {
        const imageUrl = getShoeImageUrl(rec.model);
        const compatibilityColor = getCompatibilityColor(rec.compatibility);
        const typeText = rec.shoeType === 'sport' ? 'Спортивная' : 'Повседневная';
        const typeClass = rec.shoeType === 'sport' ? 'sport-badge' : 'casual-badge';

        html += `
            <div class="shoe-card">
                <div>
                    <div class="shoe-image">
                        <img src="${imageUrl}" alt="${rec.model}"
                             onerror="this.src='https://via.placeholder.com/250x200/4285f4/ffffff?text='+encodeURIComponent('${rec.model.split(' ')[0]}')">
                    </div>
                    <div class="shoe-model">${rec.model}</div>
                    <div class="compatibility-badge" style="background: ${compatibilityColor}">
                        Совместимость: ${rec.compatibility}%
                    </div>
                    <div class="shoe-type-badge ${typeClass}">
                        ${typeText}
                    </div>
                    <div class="size-info">
                        Рекомендуемый размер: <strong>EU ${rec.best_size.eu}</strong>
                    </div>
                </div>
                <div class="shoe-actions">
                    <a href="/shoe/${encodeURIComponent(rec.model)}">
                        <button class="nav-btn" style="width: 100%;">Подробнее</button>
                    </a>
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;

    if (recommendations.length > count) {
        showMoreContainer.style.display = 'block';
    } else {
        showMoreContainer.style.display = 'none';
    }
}

function getShoeImageUrl(modelName) {
    return `/static/models%20photo/${encodeURIComponent(modelName)}/1.jpg`;
}

function getCompatibilityColor(percentage) {
    if (percentage >= 80) return '#4CAF50';
    if (percentage >= 60) return '#FF9800';
    if (percentage >= 40) return '#FFC107';
    if (percentage >= 20) return '#FF5722';
    return '#9E9E9E';
}

document.addEventListener('DOMContentLoaded', function() {
    loadRecommendations();

    const showMoreBtn = document.getElementById('showMoreBtn');
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            currentDisplayCount += 12;
            applyFiltersAndDisplay();
        });
    }
});

function resetFilters() {
    document.getElementById('compatibilityFilter').value = 'all';
    document.getElementById('sortFilter').value = 'compatibility-desc';
    document.getElementById('typeFilter').value = 'all';
    
    currentFilters = {
        compatibility: 'all',
        sort: 'compatibility-desc',
        type: 'all'
    };
    
    applyFiltersAndDisplay();
}
