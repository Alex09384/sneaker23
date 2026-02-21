let currentImages = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    const modelName = document.querySelector('.info-section h1')?.textContent || "{{ shoe.model }}";
    const images = loadModelImages(modelName);
    renderGallery(images);
    initializeModal();
});

function loadModelImages(modelName) {
    const images = [];
    let imageIndex = 1;

    while (imageIndex <= 10) {
        const imageUrl = `/static/models%20photo/${encodeURIComponent(modelName)}/${imageIndex}.jpg`;

        images.push({
            url: imageUrl,
            index: imageIndex
        });

        imageIndex++;

        if (imageIndex > 10) break;
    }

    return images;
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

function renderGallery(images) {
    const mainImage = document.getElementById('mainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');

    const existingImages = [];
    let checkedCount = 0;

    if (images.length === 0) {
        showPlaceholder();
        return;
    }

    images.forEach((image, index) => {
        checkImageExists(image.url, function(exists) {
            checkedCount++;
            if (exists) {
                existingImages.push(image);
            }

            if (checkedCount === images.length) {
                if (existingImages.length === 0) {
                    showPlaceholder();
                } else {
                    displayImages(existingImages);
                }
            }
        });
    });

    function showPlaceholder() {
        mainImage.innerHTML = '<div style="color: #666; text-align: center; padding: 50px; font-size: 18px;">Изображение отсутствует</div>';
        thumbnailGallery.innerHTML = '';
    }

    function displayImages(validImages) {
        currentImages = validImages;
        currentImageIndex = 0;
        updateMainImage();

        thumbnailGallery.innerHTML = '';
        validImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${image.url}" alt="${image.index}">`;
            thumbnail.addEventListener('click', () => {
                currentImageIndex = index;
                updateMainImage();
                updateThumbnails();
            });
            thumbnailGallery.appendChild(thumbnail);
        });
    }
}

function updateMainImage() {
    const mainImage = document.getElementById('mainImage');
    if (currentImages.length > 0) {
        mainImage.innerHTML = `<img src="${currentImages[currentImageIndex].url}" alt="Image ${currentImages[currentImageIndex].index}">`;
    }
}

function updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

function initializeModal() {
    const mainImage = document.getElementById('mainImage');
    const modalClose = document.getElementById('modalClose');
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');
    const modalOverlay = document.getElementById('imageModal');

    if (mainImage) {
        mainImage.addEventListener('click', openModal);
    }
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    if (modalPrev) {
        modalPrev.addEventListener('click', () => navigateModal('prev'));
    }
    if (modalNext) {
        modalNext.addEventListener('click', () => navigateModal('next'));
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('imageModal');
        if (modal.style.display === 'flex') {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowLeft') navigateModal('prev');
            if (e.key === 'ArrowRight') navigateModal('next');
        }
    });
}

function openModal() {
    if (currentImages.length === 0) return;

    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const imageCounter = document.getElementById('imageCounter');

    modalImage.src = currentImages[currentImageIndex].url;
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function navigateModal(direction) {
    if (direction === 'prev') {
        currentImageIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentImages.length - 1;
    } else {
        currentImageIndex = currentImageIndex < currentImages.length - 1 ? currentImageIndex + 1 : 0;
    }

    const modalImage = document.getElementById('modalImage');
    const imageCounter = document.getElementById('imageCounter');

    modalImage.src = currentImages[currentImageIndex].url;
    imageCounter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
    updateMainImage();
    updateThumbnails();
}