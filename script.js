const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const status = document.getElementById('status');

// 1. Запускаем камеру
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        status.innerText = "Ошибка доступа к камере";
    });

// 2. Функция распознавания и озвучки
captureBtn.addEventListener('click', async () => {
    status.innerText = "Распознаю текст...";
    
    const canvas = document.getElementById('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Используем Tesseract.js
    const { data: { text } } = await Tesseract.recognize(canvas, 'rus+eng');
    
    if (text.trim().length > 0) {
        status.innerText = "Читаю вслух...";
        speak(text);
    } else {
        status.innerText = "Текст не найден. Попробуйте еще раз.";
        speak("Текст не найден");
    }
});

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    window.speechSynthesis.speak(utterance);
}
