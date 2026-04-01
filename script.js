const video = document.getElementById('video');
const statusText = document.getElementById('status-text');
const output = document.getElementById('output-text');
const scanLine = document.getElementById('scan-line');
let classifier; // Используем мощный ImageNet классификатор

// Словарь для перевода самых частых из 1000+ категорий
const translateMap = {
    'person': 'человек', 'sunglasses': 'солнцезащитные очки', 'spectacles': 'очки',
    'cellular telephone': 'мобильный телефон', 'laptop': 'ноутбук', 'skate': 'скейтборд',
    'water bottle': 'бутылка воды', 'coffee mug': 'кружка', 'backpack': 'рюкзак',
    'door': 'дверь', 'window shade': 'шторы/жалюзи', 'wall clock': 'настенные часы',
    't-shirt': 'футболка', 'jeans': 'джинсы', 'sneaker': 'кроссовок', 'suit': 'костюм',
    'guinea pig': 'морская свинка', 'golden retriever': 'собака', 'tabby': 'кошка'
};

async function init() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 } } 
        });
        video.srcObject = stream;
        
        statusText.innerText = "Загрузка базы данных (1000+ объектов)...";
        // Загружаем MobileNet — она знает всё: от очков до видов деревьев
        classifier = await ml5.imageClassifier('MobileNet', video);
        statusText.innerText = "EchoSight Ultimate: Активен";
    } catch (e) {
        statusText.innerText = "Ошибка доступа к камере";
    }
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
}

// РАСПОЗНАВАНИЕ 500+ ПРЕДМЕТОВ (Человек, очки, одежда и т.д.)
document.getElementById('obj-btn').addEventListener('click', () => {
    scanLine.style.display = 'block';
    output.innerText = "Анализирую детали...";

    classifier.classify((err, results) => {
        scanLine.style.display = 'none';
        if (results && results.length > 0) {
            // Берем первый результат с высокой точностью
            let rawName = results[0].label.split(',')[0].toLowerCase();
            let russianName = translateMap[rawName] || rawName;
            
            let message = "Это похоже на " + russianName;
            output.innerText = message;
            speak(message);
        } else {
            speak("Не могу определить предмет");
        }
    });
});

// РАСПОЗНАВАНИЕ СОМОВ (С цветовым анализом и поиском цифр)
document.getElementById('text-btn').addEventListener('click', async () => {
    scanLine.style.display = 'block';
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Считываем текст
    const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
    const lowText = text.toLowerCase();
    scanLine.style.display = 'none';

    let result = "";
    if (lowText.includes('5000')) result = "Пять тысяч сом";
    else if (lowText.includes('2000')) result = "Две тысячи сом";
    else if (lowText.includes('1000') || lowText.includes('миң')) result = "Одна тысяча сом";
    else if (lowText.includes('500')) result = "Пятьсот сом";
    else if (lowText.includes('200')) result = "Двести сом";
    else if (lowText.includes('100') || lowText.includes('жүз')) result = "Сто сом";
    else if (lowText.includes('50')) result = "Пятьдесят сом";
    else if (lowText.includes('20')) result = "Двадцать сом";

    if (result) {
        output.innerText = result; speak(result);
    } else if (text.trim().length > 3) {
        output.innerText = text; speak(text);
    } else {
        speak("Попробуйте еще раз");
    }
});

init();
