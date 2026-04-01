const video = document.getElementById('video');
const status = document.getElementById('status');
const output = document.getElementById('output-text');
let objectDetector;

// 1. Инициализация камеры и моделей
async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        
        status.innerText = "Загрузка моделей ИИ...";
        // Загружаем детектор объектов (COCO-SSD)
        objectDetector = await ml5.objectDetector('cocossd');
        status.innerText = "EchoSight Готов";
    } catch (err) {
        status.innerText = "Ошибка доступа";
        console.error(err);
    }
}

// 2. Функция озвучки
function speak(text) {
    window.speechSynthesis.cancel(); // Остановить текущую речь
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
}

// 3. Распознавание ОБЪЕКТОВ
document.getElementById('obj-btn').addEventListener('click', () => {
    status.innerText = "Анализирую предметы...";
    objectDetector.detect(video, (err, results) => {
        if (results && results.length > 0) {
            // Берем самый уверенный результат и переводим (базовый перевод)
            const obj = results[0].label;
            const translations = {
                'person': 'человек', 'cell phone': 'телефон', 'book': 'книга',
                'bottle': 'бутылка', 'cup': 'чашка', 'laptop': 'ноутбук'
            };
            const resultText = translations[obj] || obj;
            output.innerText = "Вижу: " + resultText;
            speak("Вижу " + resultText);
        } else {
            output.innerText = "Не могу разобрать предмет";
            speak("Предмет не распознан");
        }
        status.innerText = "EchoSight Готов";
    });
});

// 4. Распознавание ТЕКСТА
document.getElementById('text-btn').addEventListener('click', async () => {
    status.innerText = "Читаю текст...";
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
        if (text.trim().length > 0) {
            output.innerText = text;
            speak(text);
        } else {
            output.innerText = "Текст не найден";
            speak("Текст не найден");
        }
    } catch (e) {
        output.innerText = "Ошибка распознавания";
    }
    status.innerText = "EchoSight Готов";
});

init();
