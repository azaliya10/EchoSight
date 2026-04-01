const video = document.getElementById('video');
const statusText = document.getElementById('status-text');
const output = document.getElementById('output-text');
const scanLine = document.getElementById('scan-line');
let objectDetector;

// Огромный словарь объектов (Улица + Дом + Личные вещи)
const translations = {
    'person': 'человек', 'bicycle': 'велосипед', 'car': 'машина', 'motorcycle': 'мотоцикл',
    'bus': 'автобус', 'truck': 'грузовик', 'traffic light': 'светофор', 'stop sign': 'знак стоп',
    'bench': 'скамейка', 'dog': 'собака', 'cat': 'кошка', 'backpack': 'рюкзак', 'umbrella': 'зонт',
    'handbag': 'сумка', 'tie': 'галстук', 'suitcase': 'чемодан', 'frisbee': 'диск', 'skis': 'лыжи',
    'snowboard': 'сноуборд', 'sports ball': 'мяч', 'kite': 'воздушный змей', 'baseball bat': 'бита',
    'bottle': 'бутылка', 'wine glass': 'бокал', 'cup': 'чашка', 'fork': 'вилка', 'knife': 'нож',
    'spoon': 'ложка', 'bowl': 'миска', 'banana': 'банан', 'apple': 'яблоко', 'sandwich': 'сэндвич',
    'orange': 'апельсин', 'broccoli': 'брокколи', 'carrot': 'морковь', 'hot dog': 'хот-дог',
    'pizza': 'пицца', 'donut': 'пончик', 'cake': 'торт', 'chair': 'стул', 'couch': 'диван',
    'potted plant': 'растение', 'bed': 'кровать', 'dining table': 'стол', 'toilet': 'унитаз',
    'tv': 'телевизор', 'laptop': 'ноутбук', 'mouse': 'мышка', 'remote': 'пульт', 'keyboard': 'клавиатура',
    'cell phone': 'телефон', 'microwave': 'микроволновка', 'oven': 'печь', 'sink': 'раковина',
    'refrigerator': 'холодильник', 'book': 'книга', 'clock': 'часы', 'vase': 'ваза', 'scissors': 'ножницы',
    'teddy bear': 'мишка', 'hair drier': 'фен', 'toothbrush': 'зубная щетка', 'glasses': 'очки',
    'spectacles': 'очки', 'door': 'дверь', 'window': 'окно', 'skateboard': 'скейтборд'
};

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 } } 
        });
        video.srcObject = stream;
        statusText.innerText = "Загрузка нейросети...";
        objectDetector = await ml5.objectDetector('cocossd');
        statusText.innerText = "EchoSight Pro: Готов";
    } catch (e) { statusText.innerText = "Ошибка камеры"; }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
}

// 1. УЗНАТЬ ПРЕДМЕТ (Ложка, Человек, Очки и т.д.)
document.getElementById('obj-btn').addEventListener('click', () => {
    scanLine.style.display = 'block';
    objectDetector.detect(video, (err, results) => {
        scanLine.style.display = 'none';
        if (results && results.length > 0) {
            let found = results.filter(i => i.confidence > 0.4).map(i => translations[i.label] || i.label);
            let unique = [...new Set(found)];
            let res = unique.length > 0 ? "Вижу: " + unique.join(", ") : "Не уверена";
            output.innerText = res; speak(res);
        } else { speak("Ничего не вижу"); }
    });
});

// 2. УЗНАТЬ ДЕНЬГИ (Точная логика)
document.getElementById('text-btn').addEventListener('click', async () => {
    scanLine.style.display = 'block';
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
        scanLine.style.display = 'none';
        
        // Очищаем текст от мусора, оставляем только цифры и пробелы
        const cleanText = text.replace(/[^0-9\s]/g, ' ');
        const words = cleanText.split(/\s+/);
        
        let finalNominal = "";
        
        // Ищем точное совпадение (от больших к меньшим)
        if (words.includes('5000')) finalNominal = "Пять тысяч сом";
        else if (words.includes('2000')) finalNominal = "Две тысячи сом";
        else if (words.includes('1000')) finalNominal = "Одна тысяча сом";
        else if (words.includes('500')) finalNominal = "Пятьсот сом";
        else if (words.includes('200')) finalNominal = "Двести сом";
        else if (words.includes('100')) finalNominal = "Сто сом";
        else if (words.includes('50')) finalNominal = "Пятьдесят сом";
        else if (words.includes('20')) finalNominal = "Двадцать сом";

        if (finalNominal) {
            output.innerText = finalNominal; speak(finalNominal);
        } else {
            // Если цифр нет, ищем по кыргызским словам
            const lowText = text.toLowerCase();
            if (lowText.includes('миң')) speak("Одна тысяча сом");
            else if (lowText.includes('жүз')) speak("Сто сом");
            else {
                output.innerText = "Не удалось распознать номинал";
                speak("Попробуйте еще раз");
            }
        }
    } catch (e) { scanLine.style.display = 'none'; }
});

init();
