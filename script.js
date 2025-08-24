let medicines = [];
let settings = {
    notificationsEnabled: true,
    familyAlerts: false,
    sound: ''
};

// فتح التبويب
function openTab(tabName) {
    const tabs = document.getElementsByClassName('tab-content');
    for (let tab of tabs) tab.classList.remove('active');
    document.getElementById(tabName).classList.add('active');

    const tabButtons = document.getElementsByClassName('tab');
    for (let btn of tabButtons) btn.classList.remove('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'medicines') loadMedicines();
}

// تحميل الأدوية
function loadMedicines() {
    const saved = localStorage.getItem('medicines');
    medicines = saved ? JSON.parse(saved) : [];

    const container = document.getElementById('medicines-list');
    container.innerHTML = '';

    medicines.forEach(med => {
        const card = document.createElement('div');
        card.className = 'medicine-card';
        card.innerHTML = `
            <div class="medicine-image">
                ${med.image ? `<img src="${med.image}" alt="${med.name}" style="max-width:100%; max-height:100%;">` : '💊'}
            </div>
            <div class="medicine-info">
                <div class="medicine-name">${med.name}</div>
                <div class="medicine-dosage">${med.dosage} - ${med.type}</div>
                ${med.reminderTimes.map(t => `<span class="reminder-time">${t.time} - ${t.dose}</span>`).join('')}
                <div>
                    <button class="edit-btn" onclick="editMedicine('${med.id}')">تعديل</button>
                    <button class="delete-btn" onclick="deleteMedicine('${med.id}')">حذف</button>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

// حذف دواء
function deleteMedicine(id) {
    if (!confirm('هل تريد حذف هذا الدواء؟')) return;
    medicines = medicines.filter(m => m.id !== id);
    localStorage.setItem('medicines', JSON.stringify(medicines));
    loadMedicines();
}

// تعديل دواء
function editMedicine(id) {
    const med = medicines.find(m => m.id === id);
    if (!med) return;

    openTab('add-medicine');

    document.getElementById('medicine-id').value = med.id;
    document.getElementById('medicine-name').value = med.name;
    document.getElementById('medicine-dosage').value = med.dosage;
    document.getElementById('medicine-type').value = med.type;
    document.getElementById('medicine-notes').value = med.notes;

    const reminders = document.getElementById('reminder-times');
    reminders.innerHTML = '';
    med.reminderTimes.forEach(t => addReminderTime(t.time, t.dose));

    if (med.image) {
        document.getElementById('captured-image').src = med.image;
        document.getElementById('captured-image').classList.remove('hidden');
        document.getElementById('camera-preview').classList.add('hidden');
    }
}

// إضافة وقت تذكير
function addReminderTime(time = '', dose = '') {
    const div = document.createElement('div');
    div.className = 'time-input-container';
    div.innerHTML = `
        <input type="time" class="time-input" value="${time}" required>
        <input type="number" min="0.5" step="0.5" value="${dose || 1}" required>
        <span class="remove-time" onclick="this.parentElement.remove()">✕</span>`;
    document.getElementById('reminder-times').appendChild(div);
}

// التقاط صورة
function captureImage() {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const image = document.getElementById('captured-image');
    image.src = canvas.toDataURL('image/png');
    image.classList.remove('hidden');
    video.classList.add('hidden');
}

// تشغيل الكاميرا
async function startCamera() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const rear = devices.find(d => d.kind === 'videoinput' && d.label.toLowerCase().includes('back'));
        const stream = await navigator.mediaDevices.getUserMedia({
            video: rear ? { deviceId: rear.deviceId } : { facingMode: 'environment' }
        });
        const video = document.getElementById('camera-preview');
        video.srcObject = stream;
        video.classList.remove('hidden');
        document.getElementById('camera-placeholder').classList.add('hidden');
        document.getElementById('camera-controls').classList.remove('hidden');
    } catch {
        document.getElementById('camera-placeholder').textContent = 'لا يمكن الوصول إلى الكاميرا';
    }
}

// حفظ الإعدادات
function saveSettings() {
    settings.notificationsEnabled = document.getElementById('notifications-enabled').checked;
    settings.familyAlerts = document.getElementById('family-alerts').checked;

    const file = document.getElementById('notification-sound').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            settings.sound = e.target.result;
            localStorage.setItem('settings', JSON.stringify(settings));
            document.getElementById('custom-audio').src = settings.sound;
            document.getElementById('custom-audio').classList.remove('hidden');
            alert('تم حفظ الإعدادات!');
        };
        reader.readAsDataURL(file);
    } else {
        localStorage.setItem('settings', JSON.stringify(settings));
        alert('تم حفظ الإعدادات!');
    }
}

// تحميل الإعدادات
function loadSettings() {
    const saved = localStorage.getItem('settings');
    if (saved) {
        settings = JSON.parse(saved);
        document.getElementById('notifications-enabled').checked = settings.notificationsEnabled;
        document.getElementById('family-alerts').checked = settings.familyAlerts;
        if (settings.sound) {
            const audio = document.getElementById('custom-audio');
            audio.src = settings.sound;
            audio.classList.remove('hidden');
        }
    }
}

// حفظ دواء جديد
document.getElementById('medicine-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const idField = document.getElementById('medicine-id');
    const id = idField.value || Date.now().toString();

    const name = document.getElementById('medicine-name').value;
    const dosage = document.getElementById('medicine-dosage').value;
    const type = document.getElementById('medicine-type').value;
    const notes = document.getElementById('medicine-notes').value;
    const image = document.getElementById('captured-image').src || '';

    const reminderTimes = Array.from(document.querySelectorAll('.time-input-container')).map(div => ({
        time: div.querySelector('input[type="time"]').value,
        dose: div.querySelector('input[type="number"]').value
    }));

    const existingIndex = medicines.findIndex(m => m.id === id);
    const newMed = {
        id, name, dosage, type, image, notes, reminderTimes,
        createdAt: new Date().toISOString()
    };

    if (existingIndex !== -1) {
        medicines[existingIndex] = newMed;
    } else {
        medicines.push(newMed);
    }

    localStorage.setItem('medicines', JSON.stringify(medicines));
    alert('تم حفظ الدواء!');

    this.reset();
    document.getElementById('reminder-times').innerHTML = '';
    document.getElementById('captured-image').classList.add('hidden');
    document.getElementById('camera-preview').classList.remove('hidden');
    document.getElementById('medicine-id').value = '';
    openTab('medicines');
});

// التذكير بالتنبيه
setInterval(() => {
    if (!settings.notificationsEnabled || !settings.sound) return;
    const now = new Date();
    const current = now.toTimeString().slice(0, 5);
    medicines.forEach(med => {
        med.reminderTimes.forEach(t => {
            if (t.time === current) {
                const audio = new Audio(settings.sound);
                audio.play();
                alert(`حان وقت تناول ${med.name}`);
            }
        });
    });
}, 60000);

// الوضع الليلي
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// عند التحميل
window.onload = function () {
    loadMedicines();
    loadSettings();
    addReminderTime();
    document.querySelector('.tab[onclick*="add-medicine"]').addEventListener('click', startCamera);
};

