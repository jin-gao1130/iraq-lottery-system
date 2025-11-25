// register-script.js - 简化版本 (移除了管理员功能)
const translations = {
    en: {
        registrationTitle: "Client Registration",
        registrationSubtitle: "Please scan the QR code and register with your name",
        namePlaceholder: "Enter your name",
        registerButton: "Register",
        eventInfoTitle: "Event Information",
        eventInfo1: "The lottery will be held at the end of the meeting and winners will be announced on stage.",
        eventInfo2: "Participants who have already won will be excluded from subsequent rounds.",
        registrationSuccess: "Registration successful!",
        alreadyRegistered: "You are already registered!",
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
        registrationSuccess: "تم التسجيل بنجاح!",
        alreadyRegistered: "أنت مسجل بالفعل!",
        nameRequired: "يرجى إدخال اسمك",
        connectionError: "خطأ في الاتصال، يرجى المحاولة مرة أخرى"
    }
};

let currentLanguage = 'ar';

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    applyTranslations(currentLanguage);
    
    // 允许按Enter键提交表单
    document.getElementById('clientName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            registerClient();
        }
    });
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

// 注册客户 - 使用Firestore
async function registerClient() {
    const nameInput = document.getElementById('clientName');
    const name = nameInput.value.trim();
    
    if (!name) {
        showRegistrationResult(translations[currentLanguage].nameRequired, 'error');
        return;
    }
    
    try {
        // 检查是否已经注册
        const clientsRef = db.collection('clients');
        const snapshot = await clientsRef
            .where('name', '==', name)
            .get();
        
        if (!snapshot.empty) {
            showRegistrationResult(translations[currentLanguage].alreadyRegistered, 'info');
            nameInput.value = '';
            return;
        }
        
        // 保存到 Firestore
        await clientsRef.add({
            name: name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            registered: true
        });
        
        showRegistrationResult(translations[currentLanguage].registrationSuccess, 'success');
        nameInput.value = '';
        
        // 3秒后清除成功消息
        setTimeout(() => {
            const resultDiv = document.getElementById('registrationResult');
            resultDiv.textContent = '';
            resultDiv.className = 'registration-result';
        }, 3000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showRegistrationResult(translations[currentLanguage].connectionError, 'error');
    }
}

// 显示注册结果
function showRegistrationResult(message, type) {
    const resultDiv = document.getElementById('registrationResult');
    resultDiv.textContent = message;
    
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
