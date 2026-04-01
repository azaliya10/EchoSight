const video = document.getElementById('video');
const output = document.getElementById('output-text');
const statusText = document.getElementById('ai-status');
const scanLine = document.querySelector('.scanner-line');
const torchBtn = document.getElementById('torch-btn');
let classifier; // ИИ для глубокого анализа
let track; // Для управления фонариком

// ОГРОМНЫЙ СЛОВАРЬ (Улица + Офис + Транспорт) - Часть из 1000+ категорий
const translateMap = {
    // Улица и Транспорт
    'traffic light': 'светофор', 'street sign': 'дорожный знак', 'pedestrian crosswalk': 'пешеходный переход',
    'stop sign': 'знак стоп', 'bench': 'скамейка', 'bus': 'автобус', 'taxi': 'такси', 'car': 'машина',
    'motorcycle': 'мотоцикл', 'bicycle': 'велосипед', 'truck': 'грузовик', 'ambulance': 'скорая помощь',
    'police car': 'полицейская машина', 'street': 'улица', 'sidewalk': 'тротуар', 'tree': 'дерево',
    'building': 'здание', 'fountain': 'фонтан', 'pigeon': 'голубь', 'dog': 'собака', 'cat': 'кошка',

    // Люди и Детали
    'person': 'человек', 'sunglasses': 'солнцезащитные очки', 'spectacles': 'очки', 'glasses': 'очки',
    'backpack': 'рюкзак', 'handbag': 'сумка', 'umbrella': 'зонт', 'cap': 'кепка', 'hat': 'шляпа',
    'sneaker': 'кроссовок', 'suit': 'костюм', 't-shirt': 'футболка', 'jeans': 'джинсы',

    // Офис и Дом
    'cellular telephone': 'мобильный телефон', 'laptop': 'ноутбук', 'keyboard': 'клавиатура',
    'mouse': 'мышка', 'monitor': 'монитор', 'notebook': 'тетрадь', 'book': 'книга', 'pen': 'ручка',
    'pencil': 'карандаш', 'scissors': 'ножницы', 'paper': 'бумага', 'chair': 'стул', 'desk': 'стол',
    'couch': 'диван', 'cup': 'кружка', 'coffee mug': 'кружка', 'water bottle': 'бутылка воды',
    'plate': 'тарелка', 'fork': 'вилка', 'knife': 'нож', 'spoon': 'ложка', 'refrigerator': 'холодильник',
    'microwave': 'микроволновка', 'door': 'дверь', 'window shade': 'шторы', 'wall clock': 'часы'
};

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        video.srcObject = stream;
        track = stream.getVideoTracks()[0];
        
        // Загружаем мощную модель MobileNet (Глубокий анализ 1000+ объектов)
        statusText.innerHTML = '<span class="pulse" style="background:orange"></span> ЗАГРУЗКА БАЗЫ (1000+)...';
        classifier = await ml5.imageClassifier('MobileNet', video);
        
        statusText.innerHTML = '<span class="pulse"></span> СИСТЕМА ULTRA АКТИВНА';
        
        // Проверка поддержки фонарика
        const caps = track.getCapabilities();
        if (!caps.torch) torchBtn.style.display = 'none';
        
    } catch (e) {
        output.innerText = "ОШИБКА КАМЕРЫ: РАЗРЕШИТЕ ДОСТУП И ИСПОЛЬЗУЙТЕ HTTPS";
        speak("Ошибка доступа к камере");
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'ru-RU';
    msg.rate = 1.0;
    window.speechSynthesis.speak(msg);
}

// УПРАВЛЕНИЕ ФОНАРИКОМ
torchBtn.addEventListener('click', async () => {
    try {
        const current = track.getConstraints().advanced?.[0]?.torch || false;
        await track.applyConstraints({ advanced: [{ torch: !current }] });
    } catch (e) { console.error("Ошибка фонарика", e); }
});

// ГЛУБОКИЙ АНАЛИЗ (1000+ Предметов)
document.getElementById('obj-btn').addEventListener('click', () => {
    scanLine.style.display = 'block';
    output.innerText = "АНАЛИЗИРУЮ ДЕТАЛИ...";
    speak("Анализирую");

    classifier.classify((err, results) => {
        scanLine.style.display = 'none';
        if (err) {
            output.innerText = "ОШИБКА АНАЛИЗА";
            return;
        }
        if (results && results.length > 0) {
            // Берем самый вероятный результат (Split убирает синонимы через запятую)
            let rawName = results[0].label.split(',')[0].toLowerCase().trim();
            // Пытаемся перевести, если нет в словаре — оставляем как есть
            let russianName = translateMap[rawName] || rawName;
            let confidence = Math.round(results[0].confidence * 100);
            
            let message = "";
            if (confidence > 30) {
                message = "Это похоже на " + russianName;
            } else {
                message = "Не уверена, но похоже на " + russianName;
            }
            
            output.innerText = message.toUpperCase();
            speak(message);
        } else {
            speak("Ничего не обнаружено");
        }
    });
});

// ТОЧНОЕ РАСПОЗНАВАНИЕ СОМОВ
document.getElementById('text-btn').addEventListener('click', async () => {
    scanLine.style.display = 'block';
    output.innerText = "ИЩУ ЦИФРЫ НА КУПЮРЕ...";
    speak("Сканирую");
    
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    try {
        const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
        scanLine.style.display = 'none';
        
        // Очищаем текст: оставляем ТОЛЬКО цифры и пробелы
        const cleanText = text.replace(/[^0-9\s]/g, ' ');
        const words = cleanText.split(/\s+/).filter(w => w.length > 1); // Убираем одиночные цифры
        
        let foundNominal = "";
        
        // Строгий поиск точного совпадения (от большего к меньшему)
        if (words.includes('5000')) foundNominal = "Пять тысяч сом";
        else if (words.includes('2000')) foundNominal = "Две тысячи сом";
        else if (words.includes('1000')) foundNominal = "Одна тысяча сом";
        else if (words.includes('500')) foundNominal = "Пятьсот сом";
        else if (words.includes('200')) foundNominal = "Двести сом";
        else if (words.includes('100')) foundNominal = "Сто сом";
        else if (words.includes('50')) foundNominal = "Пятьдесят сом";
        else if (words.includes('20')) foundNominal = "Двадцать сом";

        if (foundNominal) {
            output.innerText = "НОМИНАЛ: " + foundNominal.toUpperCase();
            speak(foundNominal);
        } else {
            // Резервный поиск по кыргызским словам
            const lowText = text.toLowerCase();
            if (lowText.includes('миң')) speak("Одна тысяча сом");
            else if (lowText.includes('жүз')) speak("Сто сом");
            else {
                output.innerText = "НОМИНАЛ НЕ РАСПОЗНАН. ПОПРОБУЙТЕ БЛИЖЕ.";
                speak("Номинал не распознан");
            }
        }
    } catch (e) {
        scanLine.style.display = 'none';
        output.innerText = "ОШИБКА СИСТЕМЫ";
    }
});

// Старт инициализации
if (document.readyState === 'complete') { init(); }
else { window.addEventListener('load', init); }
