document.getElementById('calculate').addEventListener('click', calculateMaterials);

const fractions = ["RM", "AM", "MM", "YAK", "LCN", "FAM", "ESB", "BSG", "LSV", "MG-13"];
const percentages = {};

// Добавляем обработчики для радио-кнопок
document.querySelectorAll('input[name="distribution"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const percentagesDiv = document.getElementById('percentages');
        if (e.target.value === 'fair') {
            updateSliders();
            percentagesDiv.classList.remove('hidden');
        } else {
            percentagesDiv.classList.add('hidden');
        }
    });
});

// Добавляем обработчики для чекбоксов
fractions.forEach(fraction => {
    const checkbox = document.getElementById(`${fraction}_checkbox`);
    checkbox.addEventListener('change', () => {
        if (document.querySelector('input[name="distribution"]:checked').value === 'fair') {
            updateSliders();
        }
    });
});

// Обновляем обработчики для переключения распределения
document.querySelectorAll('.distribution-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.distribution-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const percentagesDiv = document.getElementById('percentages');
        if (e.target.dataset.value === 'fair') {
            updateSliders();
            percentagesDiv.classList.remove('hidden');
        } else {
            percentagesDiv.classList.add('hidden');
            // Очищаем контейнер ползунков при переключении на "Поровну"
            document.getElementById('sliders-container').innerHTML = '';
        }
    });
});

// Добавляем проверку активности кнопки расчета
function updateCalculateButton() {
    const checkedFractions = fractions.filter(fraction => 
        document.getElementById(`${fraction}_checkbox`).checked
    );
    const calculateBtn = document.getElementById('calculate');
    
    if (checkedFractions.length > 0) {
        calculateBtn.classList.add('active');
    } else {
        calculateBtn.classList.remove('active');
    }
}

// Добавляем обработчики для чекбоксов
fractions.forEach(fraction => {
    const checkbox = document.getElementById(`${fraction}_checkbox`);
    checkbox.addEventListener('change', () => {
        updateCalculateButton();
        if (document.querySelector('.distribution-btn[data-value="fair"].active')) {
            updateSliders();
        }
    });
});

// Вызываем функцию при загрузке страницы
updateCalculateButton();

function updateSliders() {
    const slidersContainer = document.getElementById('sliders-container');
    slidersContainer.innerHTML = '';
    
    const checkedFractions = fractions.filter(fraction => 
        document.getElementById(`${fraction}_checkbox`).checked
    );
    
    const defaultPercentage = Math.floor(100 / checkedFractions.length);
    
    checkedFractions.forEach(fraction => {
        percentages[fraction] = percentages[fraction] || defaultPercentage;
        
        const container = document.createElement('div');
        container.className = 'slider-container';
        
        const label = document.createElement('label');
        label.textContent = fraction;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = percentages[fraction];
        
        const percentageDisplay = document.createElement('span');
        percentageDisplay.className = 'percentage';
        percentageDisplay.textContent = percentages[fraction] + '%';

        const pinButton = document.createElement('button');
        pinButton.className = 'pin-button';
        pinButton.textContent = '📌';
        pinButton.title = 'Зафиксировать значение';
        pinButton.setAttribute('data-pinned', 'false');
        
        pinButton.addEventListener('click', () => {
            const isPinned = pinButton.getAttribute('data-pinned') === 'true';
            pinButton.setAttribute('data-pinned', (!isPinned).toString());
            pinButton.classList.toggle('pinned');
        });
        
        slider.addEventListener('input', (e) => {
            const newValue = parseInt(e.target.value);
            percentages[fraction] = newValue;
            percentageDisplay.textContent = newValue + '%';
            
            // Получаем все незафиксированные ползунки, кроме текущего
            const unlockedFractions = checkedFractions.filter(f => {
                if (f === fraction) return false;
                const pinBtn = document.querySelector(`input[data-fraction="${f}"]`)
                    .parentNode.querySelector('.pin-button');
                return pinBtn.getAttribute('data-pinned') !== 'true';
            });
            
            if (unlockedFractions.length > 0) {
                // Вычисляем сумму процентов зафиксированных ползунков
                const pinnedSum = checkedFractions.reduce((sum, f) => {
                    if (f === fraction) return sum + newValue;
                    const pinBtn = document.querySelector(`input[data-fraction="${f}"]`)
                        .parentNode.querySelector('.pin-button');
                    if (pinBtn.getAttribute('data-pinned') === 'true') {
                        return sum + percentages[f];
                    }
                    return sum;
                }, 0);
                
                // Распределяем оставшиеся проценты между незафиксированными ползунками
                const remainingPercentage = Math.max(0, 100 - pinnedSum);
                const percentagePerUnlocked = Math.max(0, remainingPercentage / unlockedFractions.length);
                
                unlockedFractions.forEach(f => {
                    percentages[f] = percentagePerUnlocked;
                    const otherSlider = document.querySelector(`input[type="range"][data-fraction="${f}"]`);
                    otherSlider.value = percentagePerUnlocked;
                    otherSlider.nextElementSibling.textContent = Math.round(percentagePerUnlocked) + '%';
                });
            }
            
            updateTotalPercentage();
        });
        
        slider.setAttribute('data-fraction', fraction);
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(percentageDisplay);
        container.appendChild(pinButton);
        slidersContainer.appendChild(container);
    });
    
    updateTotalPercentage();
}

function updateTotalPercentage() {
    const total = Object.values(percentages).reduce((sum, value) => sum + value, 0);
    const totalElement = document.querySelector('#total-percentage span');
    totalElement.textContent = Math.round(total);
    document.getElementById('total-percentage').classList.toggle('warning', Math.abs(total - 100) > 1);
}

function calculateMaterials() {
    const trucksPerFraction = {};
    let totalTrucks = 0;
    let materialsPerTruck = parseInt(document.getElementById('materials_per_truck_input').value);
    const isEqualDistribution = document.querySelector('.distribution-btn[data-value="equal"].active');

    fractions.forEach(fraction => {
        const checkbox = document.getElementById(`${fraction}_checkbox`);
        const input = document.getElementById(`${fraction}_input`);
        if (checkbox.checked) {
            const trucks = parseInt(input.value);
            trucksPerFraction[fraction] = trucks;
            totalTrucks += trucks;
        }
    });

    const totalMaterials = totalTrucks * materialsPerTruck;
    const participatingFractions = Object.keys(trucksPerFraction);

    let materialsPerFraction = {};
    if (isEqualDistribution) {
        const equalShare = Math.round(totalMaterials / participatingFractions.length);
        participatingFractions.forEach(fraction => {
            materialsPerFraction[fraction] = equalShare;
        });
    } else {
        participatingFractions.forEach(fraction => {
            materialsPerFraction[fraction] = Math.round(totalMaterials * (percentages[fraction] / 100));
        });
    }

    let resultText = `Общее количество грузовиков: ${totalTrucks}\n`;
    resultText += `Общее количество материалов: ${totalMaterials}\n`;
    resultText += `Количество фракций, участвующих в поставке: ${participatingFractions.length}\n\n`;

    resultText += "Распределение материалов:\n";
    participatingFractions.forEach(fraction => {
        resultText += `${fraction}: ${materialsPerFraction[fraction]} (${isEqualDistribution ? 
            Math.round(100 / participatingFractions.length) : 
            Math.round(percentages[fraction])}%)\n`;
    });

    resultText += "\nОбязательства по доставке:\n";

    const obligations = {};
    participatingFractions.forEach(fraction => {
        const trucks = trucksPerFraction[fraction];
        const excessMaterials = Math.round(trucks * materialsPerTruck - materialsPerFraction[fraction]);
        obligations[fraction] = excessMaterials;
    });

    const simplifiedObligations = simplifyObligations(obligations, participatingFractions, materialsPerTruck, materialsPerFraction);

    for (const donor in simplifiedObligations) {
        for (const recipient in simplifiedObligations[donor]) {
            const amount = simplifiedObligations[donor][recipient];
            if (amount > 0) {
                resultText += `${donor} должны ${recipient} ${Math.round(amount)} материалов\n`;
            }
        }
    }

    document.getElementById('result').innerText = resultText;
}

function simplifyObligations(obligations, participatingFractions, materialsPerTruck, materialsPerFraction) {
    const simplified = {};

    const obligationsList = [];
    for (const donor in obligations) {
        const excess = obligations[donor];
        if (excess > 0) {
            participatingFractions.forEach(recipient => {
                if (donor !== recipient && obligations[recipient] < 0) {
                    const amount = Math.min(excess, -obligations[recipient]);
                    obligationsList.push([donor, recipient, amount]);
                    obligations[donor] -= amount;
                    obligations[recipient] += amount;
                }
            });
        }
    }

    obligationsList.forEach(([donor, recipient, amount]) => {
        if (amount > 0) {
            if (!simplified[donor]) {
                simplified[donor] = {};
            }
            if (simplified[donor][recipient]) {
                simplified[donor][recipient] += amount;
            } else {
                simplified[donor][recipient] = amount;
            }
        }
    });

    fractions.forEach(fraction => {
        const checkbox = document.getElementById(`${fraction}_checkbox`);
        if (!checkbox.checked) {
            const input = document.getElementById(`${fraction}_input`);
            const trucks = parseInt(input.value);
            if (trucks > 0) {
                const excessMaterials = trucks * materialsPerTruck;
                participatingFractions.forEach(recipient => {
                    if (recipient !== fraction) {
                        const amount = Math.min(excessMaterials, materialsPerFraction);
                        if (!simplified[fraction]) {
                            simplified[fraction] = {};
                        }
                        if (simplified[fraction][recipient]) {
                            simplified[fraction][recipient] += amount;
                        } else {
                            simplified[fraction][recipient] = amount;
                        }
                        excessMaterials -= amount;
                    }
                });
            }
        }
    });

    return simplified;
}
