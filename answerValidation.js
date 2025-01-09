document.getElementById('submitButton').addEventListener('click', () => {
    const resultMessage = document.getElementById('result-message');
    const submitButton = document.getElementById('submitButton');

    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswers = currentQuestion.correctAnswers;
    let isAllCorrect = true;
    let firstIncorrectExplanation = '';

    if (Object.keys(selectedChoices).length !== Object.keys(correctAnswers).length) {
        resultMessage.innerHTML = 'Please select an answer for all blanks.';
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
            if (window.MathJax) {
                MathJax.typesetPromise([underline]);
            }
        });

        let correctExplanations = 'Correct! ';
        correctExplanations += Object.keys(correctAnswers).map(blankKey => {
            const explanation = currentQuestion.explanations[blankKey][correctAnswers[blankKey]];
            return explanation.replace(/^\s*Correct!\s*/, '').trim();
        }).join(" ");

        resultMessage.innerHTML = correctExplanations;
        resultMessage.className = 'result-correct';
        previousAnswers.push(selectedChoices);
        isAnsweredCorrectly = true;

        submitButton.style.display = 'none';
        document.getElementById('nextButton').style.display = 'inline-block';
        if (nextButton.style.display === 'inline-block') { // show "Next Question" on the last question
            previousButton.style.display = 'none'; // hide "Previous Question" for all other cases
        }

        // Save current state
        saveCurrentState();

        if (window.MathJax) {
            MathJax.typesetPromise([resultMessage]);
        }
    } else {
        resultMessage.innerHTML = firstIncorrectExplanation;
        resultMessage.className = 'result-incorrect';

        if (window.MathJax) {
            MathJax.typesetPromise([resultMessage]);
        }
    }
});
