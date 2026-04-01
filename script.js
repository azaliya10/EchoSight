const video = document.getElementById('video');
const output = document.getElementById('output-text');
const scanner = document.querySelector('.scanner');
let track;

// 12 Цветов для функции №4
const colors = [
    { n: "Черный", r: 30, g: 30, b: 30 }, { n: "Белый", r: 230, g: 230, b: 230 },
    { n: "Красный", r: 200, g: 40, b: 40 }, { n: "Синий", r: 40, g: 40, b: 200 },
    { n: "Зеленый", r: 40, g: 180, b: 40 }, { n: "Желтый", r: 230, g: 230, b: 40 },
    { n: "Розовый", r: 255, g: 150, b: 200 }, { n: "Коричневый", r: 100, g: 50, b: 20 },
    { n: "Оранжевый", r: 255, g: 130, b: 0 }, { n: "Фиолетовый", r: 130, g: 0, b: 255 },
    { n: "Серый", r: 120, g: 120, b: 120 }, { n: "Голубой", r: 100, g: 200, b: 255 }
];

async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;
    track = stream.getVideoTracks()[0];
    
    // Функция №2: Радар препятствий (Автоматически)
    setInterval(detectObstacle, 1000);
}

function speak(t) {
    window.speechSynthesis.cancel();
    const m = new SpeechSynthesisUtterance(t);
    m.lang = 'ru-RU';
    window.speechSynthesis.speak(m);
}

// ФУНКЦИЯ №2: РАДАР (Вибрация если объект слишком близко)
async function detectObstacle() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100; canvas.height = 100;
    ctx.drawImage(video, 0, 0, 100, 100);
    const data = ctx.getImageData(0,0,100,100).data;
    
    // Простая логика: если в центре кадра слишком много яркого или темного объекта в упор
    let brightness = 0;
    for(let i=0; i<data.length; i+=4) brightness += (data[i]+data[i+1]+data[i+2])/3;
    let avg = brightness / (data.length/4);
    
    if (avg < 30 || avg > 225) { // Если объект перекрыл камеру
        navigator.vibrate(200); 
    }
}

// ФУНКЦИЯ №4: УЗНАТЬ ЦВЕТ
document.getElementById('color-btn').addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const p = ctx.getImageData(canvas.width/2, canvas.height/2, 1, 1).data;
    
    let closest = colors[0];
    let minD = Infinity;
    colors.forEach(c => {
        const d = Math.sqrt((c.r-p[0])**2 + (c.g-p[1])**2 + (c.b-p[2])**2);
        if(d < minD) { minD = d; closest = c; }
    });
    output.innerText = "ЦВЕТ: " + closest.n;
    speak("Цвет " + closest.n);
});

// ТВОЯ РАБОЧАЯ ЧАСТЬ: СОМЫ
document.getElementById('money-btn').addEventListener('click', async () => {
    scanner.style.display = 'block';
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
    scanner.style.display = 'none';
    const clean = text.replace(/[^0-9]/g, ' ');
    const nums = clean.split(/\s+/);
    
    let found = "";
    if (nums.includes('5000')) found = "Пять тысяч сом";
    else if (nums.includes('2000')) found = "Две тысячи сом";
    else if (nums.includes('1000')) found = "Одна тысяча сом";
    else if (nums.includes('500')) found = "Пятьсот сом";
    else if (nums.includes('200')) found = "Двести сом";
    else if (nums.includes('100')) found = "Сто сом";
    else if (nums.includes('50')) found = "Пятьдесят сом";
    else if (nums.includes('20')) found = "Двадцать сом";

    if (found) { output.innerText = found; speak(found); navigator.vibrate([100,50,100]); }
    else { speak("Не вижу цифр"); }
});

// ФУНКЦИЯ №7: ГДЕ Я? (БИШКЕК ГИД)
document.getElementById('geo-btn').addEventListener('click', () => {
    output.innerText = "ОПРЕДЕЛЯЮ АДРЕС...";
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Используем бесплатный сервис OpenStreetMap для получения адреса
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const address = data.address.road || "неизвестной улице";
            const house = data.address.house_number || "";
            const msg = `Вы на улице ${address} ${house}`;
            output.innerText = msg;
            speak(msg);
        } catch(e) { speak("Ошибка связи с картами"); }
    }, () => speak("Включите GPS"));
});

init();
