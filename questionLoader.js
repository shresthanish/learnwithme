let questions = [];
let shuffledChoices = {};

async function loadAllQuestions() {
    try {
        const questionPath = localStorage.getItem('questionPath');
        if (!questionPath) {
            throw new Error('Question path not found in localStorage');
        }

        // First get the list of available questions
        const availableQuestions = [];
        let questionNumber = 1;

        // Dynamically check for all available questions
        while (true) {
            const response = await fetch(`${questionPath}/Question_${questionNumber}.json`);
            if (response.ok) {
                const data = await response.json();
                availableQuestions.push(data);
                questionNumber++;
            } else {
                // Stop when no more questions are found
                break;
            }
        }

        if (availableQuestions.length === 0) {
            throw new Error('No questions were found');
        }

        // Process the available questions
        const loadedQuestions = availableQuestions.map(data => {
            const questionData = {
                title: data.context.title,
                chapter: data.context.chapter,
                subchapter: data.context.subchapter,
                question_number: data.metadata.question_number,
                learning_objective: data.question.question_details.learning_objective,
                question: data.question.question_stem,
                options: {},
                correctAnswers: {},
                explanations: {}
            };

            data.question.blanks.forEach(blank => {
                questionData.options[blank.blank_id] = blank.options;
                questionData.correctAnswers[blank.blank_id] = blank.correct_answer;
                questionData.explanations[blank.blank_id] = blank.explanations;
            });

            return questionData;
        });

        if (loadedQuestions.length > 0) {
            questions = loadedQuestions;
            loadSavedState(); // Load saved state before loading question
            loadNextQuestion();
        } else {
            throw new Error('No questions were loaded');
        }
    } catch (error) {
        displayErrorMessage(error.message);
    }
}

function displayErrorMessage(message) {
    document.getElementById('question_stem').innerHTML = `
        <div style="color: red; padding: 20px;">
            <h3>Error Loading Questions</h3>
            <p>${message}</p>
            <p><a href="index.html">Return to Selection Page</a></p>
        </div>
    `;
}

// Start loading questions when the page loads
loadAllQuestions();
