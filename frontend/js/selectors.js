const months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];

export function setupSelectors(onDateChangeCallback, onSelectChangeCallback, minYear = 2015, maxYear, options) {
    // Populate month selectors
    months.forEach((month, i) => {
        ['start-month', 'end-month'].forEach(id => {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = month;
            document.getElementById(id).appendChild(option);
        });
    });

    // Populate year selectors
    for (let year = minYear; year <= maxYear; year++) {
        ['start-year', 'end-year'].forEach(id => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            document.getElementById(id).appendChild(option);
        });
    }

    // populate datalist
    const input = document.getElementById('search-by-name');
    const datalist = document.getElementById('suggestions');

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        datalist.appendChild(option);
    });

    // Handle input/select event
    // Hook up listeners
    ['start-month', 'start-year', 'end-month', 'end-year'].forEach(id => {
        document.getElementById(id).addEventListener('change', onDateChangeCallback);
    });

    input.addEventListener('change', onSelectChangeCallback);
}

// Helper to get the selected date range
export function getDateRange() {
    const sM = +document.getElementById('start-month').value;
    const sY = +document.getElementById('start-year').value;
    const eM = +document.getElementById('end-month').value;
    const eY = +document.getElementById('end-year').value;

    const startStr = `${sY} ${months[sM]}`;
    const endStr = `${eY} ${months[eM]}`;

    return { startStr, endStr };
}

export function getMonthsDiff() {
    const sY = +document.getElementById('start-year').value;
    const sM = +document.getElementById('start-month').value;
    const eY = +document.getElementById('end-year').value;
    const eM = +document.getElementById('end-month').value;

    return (eY - sY) * 12 + (eM - sM);
}

export function setEndDateFromString(dateStr) {
    const [yearStr, monthStr] = dateStr.split(' ');
    const monthMap = {
        JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
        JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
    };

    const year = +yearStr;
    const month = monthMap[monthStr];

    if (isNaN(year) || month === undefined) {
        console.warn('Invalid date string format:', dateStr);
        return;
    }

    document.getElementById('end-year').value = year;
    document.getElementById('end-month').value = month;
}

export function getSelectedItem() {
    return document.getElementById('search-by-name').value;
}