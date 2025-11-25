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
        adminSectionTitle: "Data Management (Admin Only)",
        exportButton: "Export Data",
        resetButton: "Clear All Data",
        exportSuccess: "Data exported successfully! Copy the text below and paste it into the admin page.",
        resetSuccess: "All data has been cleared.",
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
        adminSectionTitle: "إدارة البيانات (للمسؤول فقط)",
        exportButton: "تصدير البيانات",
        resetButton: "مسح جميع البيانات",
        exportSuccess: "تم تصدير البيانات بنجاح! انسخ النص أدناه والصقه في صفحة المسؤول.",
        resetSuccess: "تم مسح جميع البيانات.",
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
    
    // 更新管理员区域
    if (document.querySelector('.admin-export-section h3')) {
        document.querySelector('.admin-export-section h3').textContent = t.adminSectionTitle;
        document.querySelectorAll('.export-controls button')[0].textContent = t.exportButton;
        document.querySelectorAll('.export-controls button')[1].textContent = t.resetButton;
    }
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

// 导出数据 - 现在从Firebase获取数据
async function exportData() {
    try {
        const snapshot = await database.ref('participants').once('value');
        const participants = snapshot.val() || {};
        
        if (Object.keys(participants).length === 0) {
            showExportResult('No data to export', 'info');
            return;
        }
        
        const dataStr = JSON.stringify(participants, null, 2);
        
        // 创建临时文本区域进行复制
        const textArea = document.createElement('textarea');
        textArea.value = dataStr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // 显示导出结果
        showExportResult(`
            ${translations[currentLanguage].exportSuccess}
            <br><br>
            <textarea readonly style="width: 100%; height: 150px; padding: 10px; font-family: monospace; font-size: 12px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9;">${dataStr}</textarea>
        `, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showExportResult('Error exporting data', 'error');
    }
}

// 重置所有数据 - 现在重置Firebase数据
async function resetAllData() {
    if (confirm(currentLanguage === 'ar' ? 
        'هل أنت متأكد أنك تريد مسح جميع البيانات؟' : 
        'Are you sure you want to clear all data?')) {
        
        try {
            await database.ref('participants').remove();
            await database.ref('winners').remove();
            showExportResult(translations[currentLanguage].resetSuccess, 'success');
        } catch (error) {
            console.error('Reset error:', error);
            showExportResult('Error resetting data', 'error');
        }
    }
}

// 显示导出结果
function showExportResult(message, type) {
    const resultDiv = document.getElementById('exportResult');
    resultDiv.innerHTML = message;
    
    // 根据类型设置样式
    resultDiv.className = 'export-result';
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