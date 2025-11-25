// register-script.js - 修改后的版本
const translations = {
    en: {
        registrationTitle: "Client Registration",
        registrationSubtitle: "Please scan the QR code and register with your name",
        namePlaceholder: "Enter your name",
        registerButton: "Register",
        eventInfoTitle: "Event Information",
        eventInfo1: "The lottery will be held at the end of the meeting and winners will be announced on stage.",
        eventInfo2: "Participants who have already won will be excluded from subsequent rounds.",
        registrationSuccess: "Registration successful! Your lottery number is:",
        alreadyRegistered: "You are already registered! Your number is:",
        nameRequired: "Please enter your name",
        connectionError: "Connection error, please try again"
    },
    ar: {
        registrationTitle: "تسجيل العملاء",
        registrationSubtitle: "يرجى مسح الرمز الضوئي وتسجيل اسمك للمشاركة في السحب",
        namePlaceholder: "أدخل اسمك",
        registerButton: "تسجيل",
        eventInfoTitle: "معلومات الفعالية",
        eventInfo1: "سيتم إجراء السحب في نهاية الاجتماع وسيتم الإعلان عن الفائزين على المسرح.",
        eventInfo2: "سيتم استبعاد المشاركين الذين فازوا بالفعل من الجولات اللاحقة.",
        registrationSuccess: "تم التسجيل بنجاح! رقم السحب الخاص بك هو:",
        alreadyRegistered: "أنت مسجل بالفعل! رقمك هو:",
        nameRequired: "يرجى إدخال اسمك",
        connectionError: "خطأ في الاتصال، يرجى المحاولة مرة أخرى"
    }
};

let currentLanguage = 'ar';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    applyTranslations(currentLanguage);
});

// 切换语言
function switchLanguage(lang) {
    currentLanguage = lang;
    applyTranslations(lang);
    
    // 切换文本方向
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
}

// 应用翻译
function applyTranslations(lang) {
    const t = translations[lang];
    
    // 更新注册区域
    document.querySelector('h1').textContent = t.registrationTitle;
    document.querySelector('.subtitle').textContent = t.registrationSubtitle;
    document.getElementById('clientName').placeholder = t.namePlaceholder;
    document.querySelector('.registration-form button').textContent = t.registerButton;
    document.querySelector('.event-info h3').textContent = t.eventInfoTitle;
    document.querySelectorAll('.event-info p')[0].textContent = t.eventInfo1;
    document.querySelectorAll('.event-info p')[1].textContent = t.eventInfo2;
    
}

// 注册客户 - 修改为使用Firebase
async function registerClient() {
    const nameInput = document.getElementById('clientName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showRegistrationResult(translations[currentLanguage].nameRequired, 'error');
        return;
    }
    
    try {
        // 检查是否已经注册
        const snapshot = await database.ref('participants').once('value');
        const participants = snapshot.val() || {};
        
        const existingParticipant = Object.values(participants).find(
            p => p.name.toLowerCase() === name.toLowerCase()
        );
        
        if (existingParticipant) {
            showRegistrationResult(
                `${translations[currentLanguage].alreadyRegistered} ${existingParticipant.id}`, 
                'info'
            );
            nameInput.value = '';
            return;
        }
        
        // 生成唯一ID
        const id = generateUniqueId(participants);
        const participant = { 
            name, 
            id, 
            won: false,
            timestamp: Date.now()
        };
        
        // 保存到 Firebase
        await database.ref('participants/' + id).set(participant);
        
        showRegistrationResult(
            `${translations[currentLanguage].registrationSuccess} ${id}`, 
            'success'
        );
        nameInput.value = '';
        
    } catch (error) {
        console.error('Registration error:', error);
        showRegistrationResult(translations[currentLanguage].connectionError, 'error');
    }
}

// 生成唯一ID
function generateUniqueId(participants) {
    let id;
    let isUnique = false;
    
    while (!isUnique) {
        id = Math.floor(Math.random() * 9000) + 1000;
        isUnique = !participants[id];
    }
    
    return id;
}

// 显示注册结果
function showRegistrationResult(message, type) {
    const resultDiv = document.getElementById('registrationResult');
    resultDiv.innerHTML = message;
    
    // 根据类型设置样式
    resultDiv.className = 'registration-result';
    if (type === 'success') {
        resultDiv.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        resultDiv.style.color = '#4CAF50';
        resultDiv.style.borderColor = 'rgba(76, 175, 80, 0.3)';
    } else if (type === 'error') {
        resultDiv.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
        resultDiv.style.color = '#F44336';
        resultDiv.style.borderColor = 'rgba(244, 67, 54, 0.3)';
    } else {
        resultDiv.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        resultDiv.style.color = '#2196F3';
        resultDiv.style.borderColor = 'rgba(33, 150, 243, 0.3)';
    }
}
