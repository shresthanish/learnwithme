let currentLevel = 'subject';
let selectedPath = {
    subject: '',
    category: '',
    topic: '',
    title: '',
    chapter: '',
    subchapter: '',
    question_types: ''
};

const levelOrder = ['subject', 'category', 'topic', 'title', 'chapter', 'subchapter', 'question_types'];
const levelTitles = {
    subject: 'Select a Subject',
    category: 'Select a Category',
    topic: 'Select a Topic',
    title: 'Select a Title',
    chapter: 'Select a Chapter',
    subchapter: 'Select a Subchapter',
    question_types: 'Select a Question Type'
};

function sanitizePath(str) {
    if (!str) return '';
    return str.replace(/\s*&\s*/g, '_and_')
        .replace(/\s+/g, '_')
        .replace(/\?/g, '')  // Remove question marks
        .replace(/[^a-zA-Z0-9_]/g, '_'); // Replace other special characters with underscore
}

function getJsonPath() {
    switch(currentLevel) {
        case 'subject':
            return './data/Subjects.json';
        case 'category':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Subject_${sanitizePath(selectedPath.subject)}.json`;
        case 'topic':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Category_${sanitizePath(selectedPath.category)}.json`;
        case 'title':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Topic_${sanitizePath(selectedPath.topic)}/Topic_${sanitizePath(selectedPath.topic)}.json`;
        case 'chapter':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Topic_${sanitizePath(selectedPath.topic)}/Title_${sanitizePath(selectedPath.title)}/Title_${sanitizePath(selectedPath.title)}.json`;
        case 'subchapter':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Topic_${sanitizePath(selectedPath.topic)}/Title_${sanitizePath(selectedPath.title)}/Chapter_${sanitizePath(selectedPath.chapter)}/Chapter_${sanitizePath(selectedPath.chapter)}.json`;
        case 'question_types':
            return `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Topic_${sanitizePath(selectedPath.topic)}/Title_${sanitizePath(selectedPath.title)}/Chapter_${sanitizePath(selectedPath.chapter)}/SubChapter_${sanitizePath(selectedPath.subchapter)}/SubChapter_${sanitizePath(selectedPath.subchapter)}.json`;
        default:
            return '';
    }
}

async function loadSelectionData() {
    const container = document.getElementById('selection-container');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch(getJsonPath());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        switch(currentLevel) {
            case 'subject':
                displayOptions(data.subjects);
                break;
            case 'category':
                displayOptions(data.categories);
                break;
            case 'topic':
                displayOptions(data.topics);
                break;
            case 'title':
                displayOptions(data.titles);
                break;
            case 'chapter':
                displayOptions(data.chapters);
                break;
            case 'subchapter':
                displayOptions(data.subchapters);
                break;
            case 'question_types':
                displayOptions(data.question_types);
                break;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        container.innerHTML = `
            <p>Error loading options. Please check:</p>
            <ul>
                <li>Current level: ${currentLevel}</li>
                <li>Selected paths: ${JSON.stringify(selectedPath, null, 2)}</li>
                <li>Current file path: ${getJsonPath()}</li>
                <li>Error details: ${error.message}</li>
            </ul>
        `;
    }
}

function displayOptions(options) {
    const container = document.getElementById('selection-container');
    container.innerHTML = '';

    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'selection-item';
        button.textContent = option;
        button.onclick = () => selectOption(option);
        container.appendChild(button);
    });
}

function selectOption(option) {
    const buttons = document.querySelectorAll('.selection-item');
    buttons.forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    selectedPath[currentLevel] = option;
}

document.getElementById('submitButton').addEventListener('click', () => {
    if (!selectedPath[currentLevel]) {
        alert('Please select an option');
        return;
    }

    const currentIndex = levelOrder.indexOf(currentLevel);
    if (currentIndex < levelOrder.length - 1) {
        currentLevel = levelOrder[currentIndex + 1];
        document.getElementById('selection-title').textContent = levelTitles[currentLevel];
        loadSelectionData();
    } else {
        const questionPath = `./data/Subjects/Subject_${sanitizePath(selectedPath.subject)}/Category_${sanitizePath(selectedPath.category)}/Topic_${sanitizePath(selectedPath.topic)}/Title_${sanitizePath(selectedPath.title)}/Chapter_${sanitizePath(selectedPath.chapter)}/SubChapter_${sanitizePath(selectedPath.subchapter)}/Questions_${sanitizePath(selectedPath.question_types)}/Questions`;
        localStorage.setItem('questionPath', questionPath);

        // Determine the redirection page
        let redirectPage;
        if (selectedPath.question_types === 'Sentence For Learning') {
            redirectPage = 'sentence_for_learning_questions.html';
        } else if (selectedPath.question_types === 'Fill In The Blanks') {
            redirectPage = 'fill_in_the_blanks.html';
        } else if (selectedPath.question_types === 'Multiple Choice') {
            redirectPage = 'multiple_choice_questions.html';
        } else {
            redirectPage = 'select_all_that_apply_questions.html';
        }

        window.location.href = redirectPage;
    }
});


// Initial load
loadSelectionData();