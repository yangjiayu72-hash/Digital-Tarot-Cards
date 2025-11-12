// Tarot Card Data
const tarotCards = [
    {
        id: 1,
        name: 'The Moon',
        symbol: '🌙',
        sentence: 'Illusions fade to reveal hidden truths',
        theme: 'mysterious',
        emotion: 'reflection'
    },
    {
        id: 2,
        name: 'The Star',
        symbol: '⭐',
        sentence: 'Hope illuminates the darkest night',
        theme: 'cool',
        emotion: 'hope'
    },
    {
        id: 3,
        name: 'The Lovers',
        symbol: '💕',
        sentence: 'Hearts entwine in perfect harmony',
        theme: 'warm',
        emotion: 'love'
    },
    {
        id: 4,
        name: 'The Chariot',
        symbol: '⚔️',
        sentence: 'Willpower conquers all obstacles',
        theme: 'warm',
        emotion: 'determination'
    },
    {
        id: 5,
        name: 'Strength',
        symbol: '🦁',
        sentence: 'Gentle courage tames the wild spirit',
        theme: 'warm',
        emotion: 'courage'
    },
    {
        id: 6,
        name: 'The High Priestess',
        symbol: '🔮',
        sentence: 'Intuition whispers ancient wisdom',
        theme: 'mysterious',
        emotion: 'wisdom'
    }
];

// State Management
const state = {
    placedCards: {
        past: null,
        present: null,
        future: null
    },
    selectedForSwap: null,
    audioContext: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeAudio();
    renderDeck();
    setupDragAndDrop();
});

// Render Card Deck
function renderDeck() {
    const deck = document.getElementById('deck');
    deck.innerHTML = '';

    tarotCards.forEach(card => {
        const cardElement = createCardElement(card, false);
        deck.appendChild(cardElement);
    });
}

// Create Card Element
function createCardElement(cardData, isFlipped = false) {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.cardId = cardData.id;

    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';

    // Back of card
    const cardBack = document.createElement('div');
    cardBack.className = 'card-face card-back';
    cardBack.innerHTML = '<div class="card-back-pattern"></div>';

    // Front of card
    const cardFront = document.createElement('div');
    cardFront.className = `card-face card-front ${cardData.theme}`;
    cardFront.innerHTML = `
        <div class="card-symbol">${cardData.symbol}</div>
        <div class="card-name">${cardData.name}</div>
        <div class="card-text">${cardData.sentence}</div>
    `;

    cardInner.appendChild(cardBack);
    cardInner.appendChild(cardFront);
    card.appendChild(cardInner);

    if (isFlipped) {
        card.classList.add('flipped');
    }

    return card;
}

// Setup Drag and Drop
function setupDragAndDrop() {
    const deck = document.getElementById('deck');

    // Drag start from deck
    deck.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.dataset.cardId);
        }
    });

    deck.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('card')) {
            e.target.classList.remove('dragging');
        }
    });

    // Setup slots
    const slots = document.querySelectorAll('.slot-content');
    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!this.classList.contains('filled')) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    // Don't allow drop if slot is already filled
    if (this.classList.contains('filled')) {
        return;
    }

    const cardId = parseInt(e.dataTransfer.getData('text/html'));
    const cardData = tarotCards.find(c => c.id === cardId);
    const position = this.parentElement.dataset.position;

    if (cardData && !isCardAlreadyPlaced(cardId)) {
        placeCard(position, cardData, this);
    }
}

function isCardAlreadyPlaced(cardId) {
    return Object.values(state.placedCards).some(card => card && card.id === cardId);
}

function placeCard(position, cardData, slotElement) {
    // Create and place the card
    const cardElement = createCardElement(cardData, false);
    cardElement.classList.add('placed');
    slotElement.innerHTML = '';
    slotElement.appendChild(cardElement);
    slotElement.classList.add('filled');

    // Store in state
    state.placedCards[position] = cardData;

    // Flip animation with delay for effect
    setTimeout(() => {
        cardElement.classList.add('flipped');
        playBellSound();
        addGlowEffect(slotElement);
    }, 100);

    // Setup click for swapping
    cardElement.addEventListener('click', () => handleCardClick(position));

    // Check if all slots are filled
    setTimeout(() => {
        checkAllSlotsFilled();
    }, 1000);
}

function handleCardClick(position) {
    if (state.selectedForSwap === null) {
        // First card selected
        state.selectedForSwap = position;
        const slotContent = document.querySelector(`[data-position="${position}"] .slot-content`);
        const card = slotContent.querySelector('.card');
        if (card) {
            card.classList.add('selected-for-swap');
        }
    } else if (state.selectedForSwap === position) {
        // Deselect same card
        deselectCard();
    } else {
        // Swap cards
        swapCards(state.selectedForSwap, position);
        deselectCard();
    }
}

function deselectCard() {
    if (state.selectedForSwap) {
        const slotContent = document.querySelector(`[data-position="${state.selectedForSwap}"] .slot-content`);
        const card = slotContent.querySelector('.card');
        if (card) {
            card.classList.remove('selected-for-swap');
        }
        state.selectedForSwap = null;
    }
}

function swapCards(position1, position2) {
    const slot1 = document.querySelector(`[data-position="${position1}"] .slot-content`);
    const slot2 = document.querySelector(`[data-position="${position2}"] .slot-content`);

    // Add flash effect
    slot1.classList.add('flash-effect');
    slot2.classList.add('flash-effect');

    // Add shake effect
    slot1.classList.add('shake-effect');
    slot2.classList.add('shake-effect');

    // Swap in state
    const temp = state.placedCards[position1];
    state.placedCards[position1] = state.placedCards[position2];
    state.placedCards[position2] = temp;

    // Re-render cards
    setTimeout(() => {
        renderPlacedCard(position1, slot1);
        renderPlacedCard(position2, slot2);

        // Remove effects
        setTimeout(() => {
            slot1.classList.remove('flash-effect', 'shake-effect');
            slot2.classList.remove('flash-effect', 'shake-effect');
        }, 500);

        // Update fate sentence
        updateFateSentence();
    }, 300);
}

function renderPlacedCard(position, slotElement) {
    const cardData = state.placedCards[position];
    if (cardData) {
        const cardElement = createCardElement(cardData, true);
        cardElement.classList.add('placed');
        slotElement.innerHTML = '';
        slotElement.appendChild(cardElement);

        // Setup click for swapping
        cardElement.addEventListener('click', () => handleCardClick(position));
    }
}

function addGlowEffect(element) {
    element.classList.add('locked');
}

function checkAllSlotsFilled() {
    const allFilled = state.placedCards.past &&
                      state.placedCards.present &&
                      state.placedCards.future;

    if (allFilled) {
        generateFateSentence();
    }
}

function generateFateSentence() {
    const past = state.placedCards.past;
    const present = state.placedCards.present;
    const future = state.placedCards.future;

    // Create connectors based on themes
    const connectors = [
        { start: ', ', middle: ', and ', end: '.' },
        { start: '. ', middle: ', yet ', end: '.' },
        { start: ', while ', middle: ', so ', end: '.' }
    ];

    const connector = connectors[Math.floor(Math.random() * connectors.length)];

    // Generate fate sentence
    let fateSentence = past.sentence.toLowerCase();
    fateSentence += connector.start + present.sentence.toLowerCase();
    fateSentence += connector.middle + future.sentence.toLowerCase();
    fateSentence += connector.end;

    // Capitalize first letter
    fateSentence = fateSentence.charAt(0).toUpperCase() + fateSentence.slice(1);

    updateFateSentence(fateSentence);
}

function updateFateSentence(customSentence = null) {
    const resultPanel = document.getElementById('resultPanel');
    const fateSentenceElement = document.getElementById('fateSentence');
    const cardSummaryElement = document.getElementById('cardSummary');

    if (customSentence === null && state.placedCards.past && state.placedCards.present && state.placedCards.future) {
        generateFateSentence();
        return;
    }

    if (customSentence) {
        // Show result panel
        resultPanel.classList.add('visible');
        fateSentenceElement.textContent = customSentence;

        // Update card summary
        cardSummaryElement.innerHTML = `
            <div class="summary-item">
                <div class="summary-item-label">Past</div>
                <div class="summary-item-name">${state.placedCards.past.symbol} ${state.placedCards.past.name}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Present</div>
                <div class="summary-item-name">${state.placedCards.present.symbol} ${state.placedCards.present.name}</div>
            </div>
            <div class="summary-item">
                <div class="summary-item-label">Future</div>
                <div class="summary-item-name">${state.placedCards.future.symbol} ${state.placedCards.future.name}</div>
            </div>
        `;

        // Determine overall theme
        const themes = [
            state.placedCards.past.theme,
            state.placedCards.present.theme,
            state.placedCards.future.theme
        ];

        const dominantTheme = themes.sort((a, b) =>
            themes.filter(t => t === a).length - themes.filter(t => t === b).length
        ).pop();

        // Apply theme color
        const themeColors = {
            warm: 'linear-gradient(135deg, rgba(255, 228, 181, 0.2) 0%, rgba(255, 184, 140, 0.2) 100%)',
            cool: 'linear-gradient(135deg, rgba(179, 217, 255, 0.2) 0%, rgba(141, 185, 232, 0.2) 100%)',
            mysterious: 'linear-gradient(135deg, rgba(216, 179, 255, 0.2) 0%, rgba(185, 141, 232, 0.2) 100%)'
        };

        resultPanel.style.background = themeColors[dominantTheme] || themeColors.mysterious;

        // Play completion sound
        playCompletionSound();
    }
}

// Audio Functions
function initializeAudio() {
    try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function playBellSound() {
    if (!state.audioContext) return;

    const now = state.audioContext.currentTime;
    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);

    // Bell-like sound
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
}

function playCompletionSound() {
    if (!state.audioContext) return;

    const now = state.audioContext.currentTime;

    // Play a chord
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G

    frequencies.forEach((freq, index) => {
        const oscillator = state.audioContext.createOscillator();
        const gainNode = state.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(state.audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, now + index * 0.1);

        gainNode.gain.setValueAtTime(0.2, now + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 1);

        oscillator.start(now + index * 0.1);
        oscillator.stop(now + index * 0.1 + 1);
    });
}

// Resume audio context on user interaction (required by browsers)
document.addEventListener('click', () => {
    if (state.audioContext && state.audioContext.state === 'suspended') {
        state.audioContext.resume();
    }
}, { once: true });
