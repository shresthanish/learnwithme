let questions = [];
let currentQuestionIndex = 0;
let selectedChoices = {};
let previousAnswers = [];
let isAnsweredCorrectly = false;
let shuffledChoices = {};

// Function to load all questions
async function loadAllQuestions() {
    try {
        const questionPath = localStorage.getItem('questionPath');
        console.log('Loading questions from path:', questionPath);

        if (!questionPath) {
            throw new Error('Question path not found in localStorage');
        }

        let questionNumber = 1;
        let loadedQuestions = [];

        while (true) {
            try {
                const response = await fetch(`${questionPath}/Question_${questionNumber}.json`);
                console.log(`Attempting to load Question_${questionNumber}.json`);

                if (!response.ok) {
                    console.log(`No more questions found after Question_${questionNumber - 1}`);
                    break;
                }

                const data = await response.json();

                loadedQuestions.push({
                    title: data.context.title,
                    chapter: data.context.chapter,
                    subchapter: data.context.subchapter,
                    question_number: data.metadata.question_number,
                    learning_objective: data.context.learning_objective,
                    question: data.question.question_text,
                    options: {},
                    correctAnswers: {},
                    explanations: {}
                });

                // Process each blank's data
                data.question.blanks.forEach(blank => {
                    loadedQuestions[loadedQuestions.length - 1].options[blank.blank_id] = blank.options;
                    loadedQuestions[loadedQuestions.length - 1].correctAnswers[blank.blank_id] = blank.correct_answer;
                    loadedQuestions[loadedQuestions.length - 1].explanations[blank.blank_id] = blank.explanations;
                });

                questionNumber++;
            } catch (error) {
                console.log('Error loading question:', error);
                break;
            }
        }

        if (loadedQuestions.length > 0) {
            questions = loadedQuestions;
            console.log(`Successfully loaded ${questions.length} questions`);
            loadNextQuestion();
        } else {
            const errorMessage = `No questions found at path: ${questionPath}`;
            console.error(errorMessage);
            document.getElementById('question').innerHTML = `
                <div style="color: red; padding: 20px;">
                    <h3>Error Loading Questions</h3>
                    <p>${errorMessage}</p>
                    <p>Please check:</p>
                    <ul>
                        <li>The selected path exists</li>
                        <li>Question files are named correctly (Question_1.json, Question_2.json, etc.)</li>
                        <li>Files are in the correct directory structure</li>
                    </ul>
                    <p><a href="home.html">Return to Selection Page</a></p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error in loadAllQuestions:', error);
        document.getElementById('question').innerHTML = `
            <div style="color: red; padding: 20px;">
                <h3>Error Loading Questions</h3>
                <p>${error.message}</p>
                <p><a href="home.html">Return to Selection Page</a></p>
            </div>
        `;
    }
}

function loadNextQuestion() {
    const questionElement = document.getElementById('question');
    const choicesContainer = document.getElementById('choices-container');
    const resultMessage = document.getElementById('result-message');
    const submitButton = document.getElementById('submitButton');
    const questionNumberElement = document.getElementById('question-number');

    // Reset UI
    resultMessage.textContent = '';
    resultMessage.className = '';
    submitButton.style.display = 'block';
    document.getElementById('nextButton').style.display = 'none';
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
    previousAnswers.forEach((answers, index) => {
        const question = questions[index];
        let completedQuestion = question.question;
        Object.entries(answers).forEach(([blankKey, answer]) => {
            completedQuestion = completedQuestion.replace(
                `__________`,
                `<span class="correct-answer">${answer}</span>`
            );
        });
        questionText += `${completedQuestion} `;
    });

    // Add the current question
    let currentQuestionText = currentQuestion.question;
    let blankCount = 0;

    currentQuestionText = currentQuestionText.replace(/__________/g, () => {
        blankCount++;
        return `<span class="underlined" data-blank="blank${blankCount}" onclick="showChoices(event, 'blank${blankCount}')">__________</span>`;
    });

    questionText += currentQuestionText;
    questionElement.innerHTML = questionText;

    // Shuffle choices if not already shuffled
    if (!shuffledChoices[currentQuestionIndex]) {
        shuffledChoices[currentQuestionIndex] = {};
        Object.keys(currentQuestion.options).forEach(blankKey => {
            shuffledChoices[currentQuestionIndex][blankKey] = shuffleChoices(currentQuestion.options[blankKey]);
        });
    }
}

function shuffleChoices(options) {
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
        button.textContent = choice;
        button.onclick = () => {
            selectedChoices[blankKey] = choice;
            const underline = document.querySelector(`.underlined[data-blank="${blankKey}"]`);
            underline.innerHTML = `<span class="filled">${choice}</span>`;
            choicesContainer.style.display = 'none';
        };
        choicesContainer.appendChild(button);
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

document.getElementById('submitButton').addEventListener('click', () => {
    const resultMessage = document.getElementById('result-message');
    const submitButton = document.getElementById('submitButton');

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswers = currentQuestion.correctAnswers;
    let isAllCorrect = true;
    let firstIncorrectExplanation = '';

    if (Object.keys(selectedChoices).length !== Object.keys(correctAnswers).length) {
        resultMessage.textContent = 'Please select an answer for all blanks.';
        resultMessage.className = 'result-incorrect';
        return;
    }

    Object.keys(correctAnswers).forEach(blankKey => {
        const selectedChoice = selectedChoices[blankKey];
        const correctKey = correctAnswers[blankKey];
        const correctChoice = currentQuestion.options[blankKey][correctKey];

        if (selectedChoice !== correctChoice) {
            isAllCorrect = false;
            if (!firstIncorrectExplanation) {
                const incorrectAnswerKey = Object.keys(currentQuestion.options[blankKey]).find(
                    key => currentQuestion.options[blankKey][key] === selectedChoice
                );
                firstIncorrectExplanation = currentQuestion.explanations[blankKey][incorrectAnswerKey];
            }
        }
    });

    if (isAllCorrect) {
        Object.keys(correctAnswers).forEach(blankKey => {
            const underline = document.querySelector(`.underlined[data-blank="${blankKey}"]`);
            underline.innerHTML = `<span class="correct-answer">${selectedChoices[blankKey]}</span>`;
        });

        let correctExplanations = 'Correct! ';
        correctExplanations += Object.keys(correctAnswers).map(blankKey => {
            // Get the explanation, remove any HTML tags by using textContent
            const explanation = currentQuestion.explanations[blankKey][correctAnswers[blankKey]];
            // Return the explanation without any HTML, so it's displayed as plain text
            return explanation.replace(/^\s*Correct!\s*/, '').trim();
        }).join(" ");

        // Render the result as text and apply green styling
        resultMessage.textContent = correctExplanations;
        resultMessage.className = 'result-correct'; // Keep green color for correct answers

        previousAnswers.push(selectedChoices);
        isAnsweredCorrectly = true;

        submitButton.style.display = 'none';
        document.getElementById('nextButton').style.display = 'inline-block';
    } else {
        resultMessage.textContent = firstIncorrectExplanation;
        resultMessage.className = 'result-incorrect';
    }
});


document.getElementById('nextButton').addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex >= questions.length) {
        alert('Congratulations! You have completed all questions in this section.');
        window.location.href = 'home.html';
    } else {
        loadNextQuestion();
    }
});

// Start loading questions when the page loads
loadAllQuestions();