document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            htmlEl.setAttribute('data-theme', 'light');
            themeToggleBtn.textContent = '🌑 ライトモード';
        } else {
            htmlEl.setAttribute('data-theme', 'dark');
            themeToggleBtn.textContent = '🌙 ダークモード';
        }
    });

    // Load CSV Data
    let artsData = [];

    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',');
        
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            // Very basic CSV parser (doesn't handle quotes well but enough for current format)
            // The provided CSV doesn't have complex quotes like "aaa,bbb"
            const currentLine = lines[i].split(',');
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = currentLine[j];
            }
            result.push(obj);
        }
        return result;
    }

    // Load Attacker arts from data folder
    fetch('data/attacker.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('CSV network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            artsData = parseCSV(csvText);
            populateArtsSelector();
        })
        .catch(error => {
            console.error('There was a problem loading the CSV:', error);
            // Fallback empty message or alert
        });

    function populateArtsSelector() {
        const selector = document.getElementById('arts-selector');
        
        artsData.forEach((art, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `[${art['ルーツ']}] ${art['アーツ名']} (コスト: ${art['コスト']})`;
            selector.appendChild(option);
        });
    }

    // Add Arts to table
    const addArtsBtn = document.getElementById('add-arts-btn');
    const artsSelector = document.getElementById('arts-selector');
    const artsTableBody = document.querySelector('#arts-table tbody');

    addArtsBtn.addEventListener('click', () => {
        const selectedIndex = artsSelector.value;
        if (selectedIndex === "") return;

        const art = artsData[selectedIndex];
        addArtToTable(art);
    });

    function addArtToTable(art) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${art['アーツ名']}</strong><br><small>${art['ルーツ']}</small></td>
            <td>${art['種別']}</td>
            <td>${art['タイミング']}</td>
            <td>${art['判定値']}</td>
            <td>${art['対象']}</td>
            <td>${art['射程']}</td>
            <td>${art['コスト']}</td>
            <td><small>${art['効果']}</small></td>
        `;

        artsTableBody.appendChild(row);
    }
});
