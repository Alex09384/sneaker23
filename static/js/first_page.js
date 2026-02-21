document.addEventListener('DOMContentLoaded', function() {
    loadRandomShoe();
});

async function loadRandomShoe() {
    try {
        const response = await fetch('/get_random_shoe');
        const shoeData = await response.json();

        const container = document.getElementById('shoePreview');

        if (shoeData.error || !shoeData.model) {
            showPlaceholder(container);
            return;
        }

        const imageUrl = `/static/models%20photo/${encodeURIComponent(shoeData.model)}/1.jpg`;

        const imageExists = await new Promise(resolve => {
            checkImageExists(imageUrl, resolve);
        });

        if (imageExists) {
            container.innerHTML = `
                <div class="shoe-preview-card">
                    <div class="shoe-preview-image">
                        <img src="${imageUrl}" alt="${shoeData.model}"
                             onerror="this.src='https://via.placeholder.com/300x200/4285f4/ffffff?text=SneakerFit'">
                    </div>
                    <div class="shoe-preview-info">
                        <h3>${shoeData.model}</h3>
                        <a href="/shoe/${encodeURIComponent(shoeData.model)}" class="btn btn-secondary">Подробнее</a>
                    </div>
                </div>
            `;
        } else {
            showPlaceholder(container, shoeData.model);
        }

    } catch (error) {
        console.error('Error loading random shoe:', error);
        showPlaceholder(document.getElementById('shoePreview'));
    }
}

function showPlaceholder(container, modelName = null) {
    if (modelName) {
        container.innerHTML = `
            <div class="shoe-preview-card">
                <div class="shoe-preview-image placeholder">
                    <div style="color: #666; text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">👟</div>
                        <p>${modelName}</p>
                    </div>
                </div>
                <div class="shoe-preview-info">
                    <h3>${modelName}</h3>
                    <a href="/shoe/${encodeURIComponent(modelName)}" class="btn btn-secondary">Подробнее</a>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="shoe-preview-card">
                <div class="shoe-preview-image placeholder">
                    <div style="color: #666; text-align: center; padding: 40px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">👟</div>
                        <p>Случайная модель обуви</p>
                    </div>
                </div>
                <div class="shoe-preview-info">
                    <h3>Добро пожаловать в SneakerFit</h3>
                    <p>Начните с измерения стопы для персонализированных рекомендаций</p>
                    <a href="/measure" class="btn btn-primary">Начать измерение</a>
                </div>
            </div>
        `;
    }
}

function checkImageExists(url, callback) {
    const img = new Image();
    img.onload = function() {
        callback(true);
    };
    img.onerror = function() {
        callback(false);
    };
    img.src = url;
}