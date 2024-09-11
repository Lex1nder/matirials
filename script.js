document.getElementById('calculate').addEventListener('click', calculateMaterials);

const fractions = ["RM", "AM", "MM", "YAK", "LCN", "FAM", "ESB", "BSG", "LSV", "MG-13"];

function calculateMaterials() {
    const trucksPerFraction = {};
    let totalTrucks = 0;
    let materialsPerTruck = parseInt(document.getElementById('materials_per_truck_input').value);

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
    const materialsPerFraction = Math.round(totalMaterials / participatingFractions.length);

    let resultText = `Общее количество грузовиков: ${totalTrucks}\n`;
    resultText += `Общее количество материалов: ${totalMaterials}\n`;
    resultText += `Количество фракций, участвующих в поставке: ${participatingFractions.length}\n`;
    resultText += `Количество материалов на каждую фракцию: ${materialsPerFraction}\n\n`;

    resultText += "Распределение материалов:\n";
    participatingFractions.forEach(fraction => {
        resultText += `${fraction}: ${materialsPerFraction}\n`;
    });

    resultText += "\nОбязательства по доставке:\n";

    const obligations = {};
    participatingFractions.forEach(fraction => {
        const trucks = trucksPerFraction[fraction];
        const excessMaterials = Math.round(trucks * materialsPerTruck - materialsPerFraction);
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
