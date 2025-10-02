let db;
let firebaseInitialized = false;
let unsubscribe = null;

// Accede a las traducciones desde el objeto global
const t = window.translations;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log(t.firebaseInitSuccess);
} catch (error) {
    console.error(t.firebaseInitError, error);
    document.getElementById('setupInstructions').style.display = 'block';
}

// Variables del juego
const emojis = ['🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎸', '🎺'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let startTime;
let timerInterval;
let currentPlayer = {};

// Detectar si viene del QR (parámetro en URL)
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('play') === 'true') {
        showGamePage();
    } else {
        showLandingPage();
    }
}

// Generar QR Code
function generateQR() {
    const gameURL = `${window.location.origin}/${window.lang}?play=true`;
    document.getElementById('gameUrl').textContent = gameURL;
    
    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = ""; // Limpiar el contenedor
    new QRCode(qrcodeContainer, {
        text: gameURL,
        width: 256,
        height: 256,
        colorDark: '#667eea',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Cargar ranking en tiempo real
function loadRanking() {
    if (!firebaseInitialized) {
        const errorMessage = `
            <tr><td colspan="4" class="no-data">
                ${t.firebaseNotConfigured}
            </td></tr>
        `;
        document.getElementById('rankingBody').innerHTML = errorMessage;
        document.getElementById('podium').innerHTML = `<div class="no-data">${t.configureFirebaseRanking}</div>`;
        return;
    }

    unsubscribe = db.collection('gameRecords')
        .orderBy('score', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
            const records = [];
            snapshot.forEach(doc => {
                records.push({ id: doc.id, ...doc.data() });
            });
            
            displayPodium(records);
            displayRankingTable(records);
        }, error => {
            console.error('Error loading ranking:', error);
            document.getElementById('rankingBody').innerHTML = `
                <tr><td colspan="4" class="no-data">
                    ${t.loadRankingError}
                </td></tr>
            `;
        });
}

function displayPodium(records) {
    const podium = document.getElementById('podium');
    
    if (records.length === 0) {
        podium.innerHTML = `<div class="no-data">${t.beTheFirstToPlay}</div>`;
        return;
    }

    const top3 = records.slice(0, 3);
    const positions = ['second', 'first', 'third'];
    const medals = ['🥈', '🥇', '🥉'];
    
    let html = '';
    
    // Segundo lugar
    if (top3[1]) {
        html += createPodiumHTML(top3[1], positions[0], medals[0]);
    }
    
    // Primer lugar
    if (top3[0]) {
        html += createPodiumHTML(top3[0], positions[1], medals[1]);
    }
    
    // Tercer lugar
    if (top3[2]) {
        html += createPodiumHTML(top3[2], positions[2], medals[2]);
    }
    
    podium.innerHTML = html;
}

function createPodiumHTML(record, className, medal) {
    const minutes = Math.floor(record.time / 60);
    const seconds = record.time % 60;
    
    return `
        <div class="podium-place ${className}">
            <div class="podium-medal">${medal}</div>
            <div class="podium-name">${record.name}</div>
            <div class="podium-score">${record.score}</div>
            <div style="font-size: 12px; margin-top: 5px;">
                ${minutes}:${seconds.toString().padStart(2, '0')}
            </div>
        </div>
    `;
}

function displayRankingTable(records) {
    const tbody = document.getElementById('rankingBody');
    
    if (records.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="4" class="no-data">
                ${t.noRecordsYet}
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = records.map((record, index) => {
        const minutes = Math.floor(record.time / 60);
        const seconds = record.time % 60;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        return `
            <tr>
                <td><span class="position-badge">${index + 1}</span> ${medal}</td>
                <td><strong>${record.name}</strong><br><small style="color: #999;">${record.email}</small></td>
                <td><strong style="color: #667eea;">${record.score}</strong></td>
                <td>${minutes}:${seconds.toString().padStart(2, '0')}</td>
            </tr>
        `;
    }).join('');
}

// Navegación
function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('gamePage').classList.remove('active');
    if (unsubscribe) unsubscribe();
    loadRanking();
    generateQR();
}

function showGamePage() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('gamePage').classList.add('active');
    if (unsubscribe) unsubscribe();
}

function backToLanding() {
    clearInterval(timerInterval);
    window.history.pushState({}, '', window.location.pathname);
    showLandingPage();
}

// Funciones del juego
async function saveRecord(record) {
    try {
        const docRef = await db.collection('gameRecords').add({
            ...record,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error(t.saveError, error);
        throw error;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}
        
function startGame() {
    if (!firebaseInitialized) {
        showError(t.firebaseNotSetUp);
        return;
    }

    const name = document.getElementById('playerName').value.trim();
    const email = document.getElementById('playerEmail').value.trim();
    
    if (!name || !email) {
        showError(t.completeAllFields);
        return;
    }

    if (!email.includes('@')) {
        showError(t.enterValidEmail);
        return;
    }

    hideError();
    currentPlayer = { name, email };
    
    document.getElementById('formSection').classList.remove('active');
    document.getElementById('gameSection').classList.add('active');
    
    initializeGame();
}
        
function initializeGame() {
    cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    startTime = Date.now();
    
    document.getElementById('moves').textContent = moves;
    document.getElementById('matches').textContent = `0/${emojis.length}`;
    
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.innerHTML = `
            <span class="card-back">❓</span>
            <span class="card-front">${emoji}</span>
        `;
        card.onclick = () => flipCard(card, index);
        grid.appendChild(card);
    });
    
    startTimer();
}
        
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}
        
function flipCard(card, index) {
    if (flippedCards.length === 2 || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched')) {
        return;
    }
    
    card.classList.add('flipped');
    flippedCards.push({ card, index });
    
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('moves').textContent = moves;
        checkMatch();
    }
}
        
function checkMatch() {
    const [first, second] = flippedCards;
    
    if (cards[first.index] === cards[second.index]) {
        first.card.classList.add('matched');
        second.card.classList.add('matched');
        matchedPairs++;
        document.getElementById('matches').textContent = `${matchedPairs}/${emojis.length}`;
        flippedCards = [];
        
        if (matchedPairs === emojis.length) {
            endGame();
        }
    } else {
        setTimeout(() => {
            first.card.classList.remove('flipped');
            second.card.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}
        
async function endGame() {
    clearInterval(timerInterval);
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
    const score = Math.max(1000 - (moves * 10) - timeElapsed, 0);
    
    const record = {
        name: currentPlayer.name,
        email: currentPlayer.email,
        score: score,
        time: timeElapsed,
        moves: moves,
        date: new Date().toISOString()
    };
    
    try {
        await saveRecord(record);
        showResults(record);
    } catch (error) {
        console.error(t.saveError, error);
        showError(t.saveScoreError);
    }
}
        
function showResults(record) {
    document.getElementById('gameSection').classList.remove('active');
    document.getElementById('resultsSection').classList.add('active');
    
    const minutes = Math.floor(record.time / 60);
    const seconds = record.time % 60;
    document.getElementById('finalScoreDiv').innerHTML = `
        <div class="final-score">
            <h2>${t.gameCompleted}</h2>
            <p><strong>${t.scoreLabel}</strong> ${record.score}</p>
            <p><strong>${t.timeScoreLabel}</strong> ${minutes}:${seconds.toString().padStart(2, '0')}</p>
            <p><strong>${t.movesScoreLabel}</strong> ${record.moves}</p>
        </div>
    `;
}
        
function resetGame() {
    clearInterval(timerInterval);
    initializeGame();
}
        
function backToStart() {
    clearInterval(timerInterval);
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('formSection').classList.add('active');
    document.getElementById('playerName').value = '';
    document.getElementById('playerEmail').value = '';
    hideError();
}

// Inicializar
window.onload = function() {
    checkURLParams();
};

// Limpiar listeners al cerrar
window.onbeforeunload = function() {
    if (unsubscribe) unsubscribe();
    clearInterval(timerInterval);
};