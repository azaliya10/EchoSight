const video = document.getElementById('video');
const statusText = document.getElementById('status-text');
const output = document.getElementById('output-text');
const scanLine = document.getElementById('scan-line');
let objectDetector;

// Расширенный словарь для улицы и дома
const translations = {
    'person': 'человек', 'bicycle': 'велосипед', 'car': 'автомобиль',
    'motorcycle': 'мотоцикл', 'bus': 'автобус', 'truck': 'грузовик',
    'traffic light': 'светофор', 'stop sign': 'знак стоп', 'bench': 'скамейка',
    'dog': 'собака', 'cat': 'кошка', 'backpack': 'рюкзак', 'umbrella': 'зонт',
    'handbag': 'сумка', 'tie': 'галстук', 'skateboard': 'скейтборд',
    'bottle': 'бутылка', 'cup': 'чашка', 'fork': 'вилка', 'knife': 'нож',
    'chair': 'стул', 'couch': 'диван', 'potted plant': 'растение', 'bed': 'кровать',
    'dining table': 'стол', 'toilet': 'унитаз', 'tv': 'телевизор', 'laptop': 'ноутбук',
    'mouse': 'мышь', 'remote': 'пульт', 'keyboard': 'клавиатура', 'cell phone': 'телефон',
    'microwave': 'микроволновка', 'oven': 'печь', 'sink': 'раковина', 'refrigerator': 'холодильник',
    'book': 'книга', 'clock': 'часы', 'vase': 'ваза', 'scissors': 'ножницы', 'toothbrush': 'зубная щетка',
    'door': 'дверь', 'window': 'окно'
};

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
    });
    video.srcObject = stream;
    return new Promise((resolve) => video.onloadedmetadata = () => resolve());
}

async function loadModels() {
    statusText.innerText = "Загрузка нейросети...";
    objectDetector = await ml5.objectDetector('cocossd');
    statusText.innerText = "Система EchoSight активна";
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.1; // Чуть быстрее для удобства
    window.speechSynthesis.speak(utterance);
}

// РАСПОЗНАВАНИЕ ОБЪЕКТОВ (Длинный список)
document.getElementById('obj-btn').addEventListener('click', () => {
    scanLine.style.display = 'block';
    output.innerText = "Анализирую окружение...";
    
    objectDetector.detect(video, (err, results) => {
        scanLine.style.display = 'none';
        if (results && results.length > 0) {
            // Убираем дубликаты и переводим
            let seen = new Set();
            results.forEach(item => {
                if (item.confidence > 0.4) { // Берем только уверенные результаты
                    seen.add(translations[item.label] || item.label);
                }
            });
            
            let finalArray = Array.from(seen);
            let resultString = "Вижу следующее: " + finalArray.join(", ");
            output.innerText = resultString;
            speak(resultString);
        } else {
            output.innerText = "Ничего не обнаружено. Попробуйте другой ракурс.";
            speak("Ничего не обнаружено");
        }
    });
});

// РАСПОЗНАВАНИЕ ТЕКСТА И ВАЛЮТЫ
document.getElementById('text-btn').addEventListener('click', async () => {
    scanLine.style.display = 'block';
    output.innerText = "Ищу текст или купюру...";
    
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
        const lowText = text.toLowerCase();
        scanLine.style.display = 'none';

        let moneyResult = "";
        if (lowText.includes('100') || lowText.includes('жүз')) moneyResult = "Сто сом";
        else if (lowText.includes('200') || lowText.includes('эки жүз')) moneyResult = "Двести сом";
        else if (lowText.includes('500') || lowText.includes('беш жүз')) moneyResult = "Пятьсот сом";
        else if (lowText.includes('1000') || lowText.includes('миң')) moneyResult = "Одна тысяча сом";
        else if (lowText.includes('2000')) moneyResult = "Две тысячи сом";
        else if (lowText.includes('5000')) moneyResult = "Пять тысяч сом";

        if (moneyResult) {
            output.innerText = "Купюра: " + moneyResult;
            speak(moneyResult);
        } else if (text.trim().length > 2) {
            output.innerText = text;
            speak(text);
        } else {
            output.innerText = "Текст не распознан";
            speak("Текст не найден");
        }
    } catch (e) {
        output.innerText = "Ошибка системы";
        scanLine.style.display = 'none';
    }
});

// Запуск
setupCamera().then(loadModels);
