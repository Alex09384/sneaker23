document.addEventListener('DOMContentLoaded', function() {
    initializeMeasureForm();
    initializeInputValidation();
});

function initializeMeasureForm() {
    const measureForm = document.getElementById('measureForm');
    if (measureForm) {
        measureForm.addEventListener('submit', validateForm);
    }
}

function initializeInputValidation() {
    const lengthInput = document.getElementById('length');
    const widthInput = document.getElementById('width');

    if (lengthInput) {
        lengthInput.addEventListener('input', function() {
            if (this.value < 0) this.value = Math.abs(this.value);
            if (this.value < 15 || this.value > 40) {
                this.style.borderColor = '#d32f2f';
            } else {
                this.style.borderColor = '#e8e8e8';
            }
        });
    }

    if (widthInput) {
        widthInput.addEventListener('input', function() {
            if (this.value < 0) this.value = Math.abs(this.value);
            if (this.value < 5 || this.value > 15) {
                this.style.borderColor = '#d32f2f';
            } else {
                this.style.borderColor = '#e8e8e8';
            }
        });
    }

    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        });

        input.addEventListener('blur', function() {
            if (this.value < 0) {
                this.value = Math.abs(this.value);
            }
        });
    });
}

function validateForm(e) {
    let isValid = true;

    const lengthInput = document.getElementById('length');
    const lengthError = document.getElementById('lengthError');
    if (!lengthInput.value || lengthInput.value < 15 || lengthInput.value > 40) {
        lengthError.style.display = 'block';
        isValid = false;
    } else {
        lengthError.style.display = 'none';
    }

    const widthInput = document.getElementById('width');
    const widthError = document.getElementById('widthError');
    if (!widthInput.value || widthInput.value < 5 || widthInput.value > 15) {
        widthError.style.display = 'block';
        isValid = false;
    } else {
        widthError.style.display = 'none';
    }

    const archSelect = document.getElementById('arch');
    const archError = document.getElementById('archError');
    if (!archSelect.value) {
        archError.style.display = 'block';
        isValid = false;
    } else {
        archError.style.display = 'none';
    }

    const footTypeSelect = document.getElementById('foot_type');
    const footTypeError = document.getElementById('footTypeError');
    if (!footTypeSelect.value) {
        footTypeError.style.display = 'block';
        isValid = false;
    } else {
        footTypeError.style.display = 'none';
    }

    if (!isValid) {
        e.preventDefault();
    }
}