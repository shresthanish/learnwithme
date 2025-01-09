let currentQuestionIndex = 0;
let selectedChoices = {};
let previousAnswers = [];
let isAnsweredCorrectly = false;
const STORAGE_KEY = 'shuffledChoicesState';

// Save current state
function saveCurrentState() {
    localStorage.setItem('currentQuestionIndex', currentQuestionIndex);
    localStorage.setItem('previousAnswers', JSON.stringify(previousAnswers));
    localStorage.setItem('shuffledChoices', JSON.stringify(shuffledChoices));
}

// Load saved state
function loadSavedState() {
    const savedIndex = localStorage.getItem('currentQuestionIndex');
    const savedAnswers = localStorage.getItem('previousAnswers');
    const savedShuffledChoices = localStorage.getItem('shuffledChoices');

    if (savedIndex) {
        currentQuestionIndex = parseInt(savedIndex);
    }
    if (savedAnswers) {
        previousAnswers = JSON.parse(savedAnswers);
    }
    if (savedShuffledChoices) {
        shuffledChoices = JSON.parse(savedShuffledChoices);
    }
}

function loadNextQuestion() {
    const questionElement = document.getElementById('question_stem');
    const choicesContainer = document.getElementById('choices-container');
    const resultMessage = document.getElementById('result-message');
    const submitButton = document.getElementById('submitButton');
    const questionNumberElement = document.getElementById('question-number');
    const previousButton = document.getElementById('previousButton');
    const nextButton = document.getElementById('nextButton');

    // Reset UI
    resultMessage.innerHTML = '';
    resultMessage.className = '';
    submitButton.style.display = 'block';
    nextButton.style.display = 'none';

    // Logic for showing/hiding "Previous Question" button
    if (currentQuestionIndex === 0) {
        previousButton.style.display = 'none'; // Hide "Previous Question" on the first question
    } else if (currentQuestionIndex === questions.length - 1) {
        previousButton.style.display = 'inline-block'; // Show "Previous Question" on the last question
        nextButton.style.display = 'none'; // Hide "Next Question" on the last question
    } else {
        previousButton.style.display = 'inline-block'; // Show "Previous Question" for all other cases
    }

    choicesContainer.style.display = 'none';
    selectedChoices = {};
    isAnsweredCorrectly = false;

    // Display question number and metadata
    const currentQuestion = questions[currentQuestionIndex];
    questionNumberElement.textContent = currentQuestion.question_number;

    // Update metadata
    document.getElementById('title').textContent = currentQuestion.title;
    document.getElementById('chapter').textContent = currentQuestion.chapter;
    document.getElementById('subchapter').textContent = currentQuestion.subchapter;
    document.getElementById('learning-objective').textContent = currentQuestion.learning_objective;

    // Build the question text with previous correct answers
    let questionText = '';

    // First, add all previous questions with their answers in order
    for (let i = 0; i < currentQuestionIndex; i++) {
        const question = questions[i];
        let completedQuestion = question.question;
        const answers = previousAnswers[i];

        // Create an array to store blanks and their replacements in order
        let replacements = [];
        let blankIndex = 0;
        completedQuestion.replace(/__________/g, () => {
            blankIndex++;
            const blankKey = `blank${blankIndex}`;
            const answer = answers[blankKey];
            replacements.push({
                original: '__________',
                replacement: `<span class="previous-correct">${answer}</span>`
            });
            return '__________'; // Temporary return to count blanks
        });

        // Replace all blanks in order
        replacements.forEach(({ original, replacement }) => {
            completedQuestion = completedQuestion.replace(original, replacement);
        });

        questionText += `${completedQuestion} `;
    }

    // Add current question
    let currentQuestionText = currentQuestion.question;
    let blankCount = 0;
    currentQuestionText = currentQuestionText.replace(/__________/g, () => {
        blankCount++;
        return `<span class="underlined" data-blank="blank${blankCount}" onclick="showChoices(event, 'blank${blankCount}')">__________</span>`;
    });

    questionText += currentQuestionText;
    questionElement.innerHTML = questionText;

    // Render equations
    if (window.MathJax) {
        MathJax.typesetPromise([questionElement]);
    }

    // Initialize or load shuffled choices
    let storedShuffledChoices = localStorage.getItem(STORAGE_KEY);
    if (storedShuffledChoices) {
        shuffledChoices = JSON.parse(storedShuffledChoices);
    }

    // Initialize shuffled choices if not already done
    if (!shuffledChoices[currentQuestionIndex]) {
        shuffledChoices[currentQuestionIndex] = {};
        Object.keys(currentQuestion.options).forEach(blankKey => {
            shuffledChoices[currentQuestionIndex][blankKey] = shuffleChoices(currentQuestion.options[blankKey], true);
        });
        // Store the shuffled state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shuffledChoices));
    }

    // Save state after loading question
    saveCurrentState();
}

function showChoices(event, blankKey) {
    if (isAnsweredCorrectly) return;

    const choicesContainer = document.getElementById('choices-container');
    const currentQuestion = questions[currentQuestionIndex];
    const options = shuffledChoices[currentQuestionIndex][blankKey];
    choicesContainer.innerHTML = '';

    for (let optionKey in options) {
        const choice = options[optionKey];
        const button = document.createElement('button');
        button.classList.add('choice');
        button.innerHTML = choice;
        button.onclick = () => {
            selectedChoices[blankKey] = choice;
            const underline = document.querySelector(`.underlined[data-blank="${blankKey}"]`);
            underline.innerHTML = `<span class="filled">${choice}</span>`;
            if (window.MathJax) {
                MathJax.typesetPromise([underline]);
            }
            choicesContainer.style.display = 'none';
        };
        choicesContainer.appendChild(button);
        if (window.MathJax) {
            MathJax.typesetPromise([button]);
        }
    }

    const rect = event.target.getBoundingClientRect();
    choicesContainer.style.top = `${rect.bottom + window.scrollY}px`;
    choicesContainer.style.left = `${rect.left + window.scrollX}px`;
    choicesContainer.style.display = 'block';

    document.addEventListener('click', hideChoicesIfClickedOutside);
}

function hideChoicesIfClickedOutside(event) {
    const choicesContainer = document.getElementById('choices-container');
    const underlinedElements = document.querySelectorAll('.underlined');

    if (![...underlinedElements].some(el => el.contains(event.target)) && !choicesContainer.contains(event.target)) {
        choicesContainer.style.display = 'none';
        document.removeEventListener('click', hideChoicesIfClickedOutside);
    }
}

// Modify the existing shuffleChoices function
function shuffleChoices(options, shouldShuffle = true) {
    if (!shouldShuffle) {
        return options;
    }
    const keys = Object.keys(options);
    for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
    }
    const shuffled = {};
    keys.forEach(key => {
        shuffled[key] = options[key];
    });
    return shuffled;
}

// Event listener for "Next Question" button
document.getElementById('nextButton').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
        alert('Congratulations! You have completed all questions in this section.');
        window.location.href = 'index.html';
    } else {
        loadNextQuestion();
    }
});

// Event listener for "Previous Question" button
document.getElementById('previousButton').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadNextQuestion();
    }
});
