// admin-script.js - 简化版本 (移除了数据导入功能)
const translations = {
    en: {
        adminTitle: "Lottery Admin Panel",
        totalParticipants: "Total Participants:",
        prizesRemaining: "Prizes Remaining:",
        winnersSoFar: "Winners So Far:",
        readyText: "Ready to start...",
        startButton: "Start Lottery",
        stopButton: "Stop & Select Winner",
        resetButton: "Reset Lottery",
        noParticipants: "No participants available",
        allPrizesAwarded: "All prizes have been awarded!",
        winnerText: "WINNER!",
        participantsList: "Participants List",
        winnersTitle: "Winners",
        connected: "Connected - Real-time",
        disconnected: "Disconnected",
        connecting: "Connecting..."
    },
    ar: {
        adminTitle: "لوحة سحب الجوائز",
        totalParticipants: "إجمالي المشاركين:",
        prizesRemaining: "الجوائز المتبقية:",
        winnersSoFar: "الفائزون حتى الآن:",
        readyText: "جاهز للبدء...",
        startButton: "بدء السحب",
        stopButton: "توقف واختيار الفائز",
        resetButton: "إعادة تعيين السحب",
        noParticipants: "لا يوجد مشاركون متاحون",
        allPrizesAwarded: "تم منح جميع الجوائز!",
        winnerText: "فائز!",
        participantsList: "قائمة المشاركين",
        winnersTitle: "الفائزون",
        connected: "متصل - تحديث فوري",
        disconnected: "غير متصل",
        connecting: "جاري الاتصال..."
    }
};

let currentLanguage = 'ar';
let participants = [];
let winners = [];
let lotteryInterval;
let isLotteryRunning = false;
const TOTAL_PRIZES = 8;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    displayParticipants();
    displayWinners();
    applyTranslations(currentLanguage);
    setupFirebaseListeners();
});

// 设置 Firebase 监听器
function setupFirebaseListeners() {
    // 监听连接状态
    database.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val();
        updateConnectionStatus(connected);
    });

    // 监听参与者数据变化
    database.ref('clients').on('value', (snapshot) => {
        participants = [];
        const data = snapshot.val() || {};
        Object.keys(data).forEach(key => {
            participants.push({
                id: key,
                ...data[key]
            });
        });
        updateStats();
        displayParticipants();
    });

    // 监听获奖者数据变化
    database.ref('winners').on('value', (snapshot) => {
        winners = [];
        const data = snapshot.val() || {};
        Object.keys(data).forEach(key => {
            winners.push({
                id: key,
                ...data[key]
            });
        });
        updateStats();
        displayWinners();
    });
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = translations[currentLanguage].connected;
            statusElement.style.color = '#4CAF50';
        } else {
            statusElement.textContent = translations[currentLanguage].disconnected;
            statusElement.style.color = '#F44336';
        }
    }
}

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
    
    // 更新界面文本
    document.querySelector('h1').textContent = t.adminTitle;
    document.querySelectorAll('.stat-label')[0].textContent = t.totalParticipants;
    document.querySelectorAll('.stat-label')[1].textContent = t.prizesRemaining;
    document.querySelectorAll('.stat-label')[2].textContent = t.winnersSoFar;
    document.getElementById('startButton').textContent = t.startButton;
    document.getElementById('stopButton').textContent = t.stopButton;
    document.querySelectorAll('.lottery-controls button')[2].textContent = t.resetButton;
    document.querySelector('.participants-section h2').textContent = t.participantsList;
    document.querySelector('.winners-section h2').textContent = t.winnersTitle;
    
    // 如果没有运行抽奖，更新显示文本
    if (!isLotteryRunning) {
        document.getElementById('currentDisplay').textContent = t.readyText;
    }
    
    // 更新连接状态文本
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = t.connected;
        statusElement.style.color = '#4CAF50';
    }
}

// 开始抽奖
function startLottery() {
    if (isLotteryRunning) return;
    
    const availableParticipants = participants.filter(p => !p.won);
    
    if (availableParticipants.length === 0) {
        document.getElementById('currentDisplay').textContent = translations[currentLanguage].noParticipants;
        return;
    }
    
    if (winners.length >= TOTAL_PRIZES) {
        document.getElementById('currentDisplay').textContent = translations[currentLanguage].allPrizesAwarded;
        return;
    }
    
    isLotteryRunning = true;
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    
    lotteryInterval = setInterval(() => {
        const available = participants.filter(p => !p.won);
        if (available.length === 0) {
            stopLottery();
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * available.length);
        const current = available[randomIndex];
        document.getElementById('currentDisplay').textContent = `${current.name} - ${current.id}`;
    }, 100);
}

// 停止抽奖并选择获奖者
async function stopLottery() {
    if (!isLotteryRunning) return;
    
    clearInterval(lotteryInterval);
    isLotteryRunning = false;
    document.getElementById('startButton').disabled = false;
    document.getElementById('stopButton').disabled = true;
    
    const availableParticipants = participants.filter(p => !p.won);
    
    if (availableParticipants.length === 0) {
        document.getElementById('currentDisplay').textContent = translations[currentLanguage].noParticipants;
        return;
    }
    
    const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
    const winner = availableParticipants[winnerIndex];
    
    try {
        // 标记为已获奖
        await db.collection('clients').doc(winner.id).update({ won: true });
        
        // 添加到获奖者集合
        await db.collection('winners').doc(winner.id).set({
            name: winner.name,
            id: winner.id,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 显示获奖者
        document.getElementById('currentDisplay').innerHTML = 
            `<span style="color: #AF272F; font-size: 4rem;">${translations[currentLanguage].winnerText}</span><br>${winner.name} - ${winner.id}`;
        
        // 播放音效
        playWinnerSound();
        
    } catch (error) {
        console.error('Error selecting winner:', error);
        alert('Error selecting winner. Please try again.');
    }
}

// 重置抽奖
async function resetLottery() {
    const confirmText = currentLanguage === 'ar' 
        ? 'هل أنت متأكد أنك تريد إعادة تعيين السحب؟ هذا سيحذف جميع المشاركين والفائزين.'
        : 'Are you sure you want to reset the lottery? This will clear all participants and winners.';
    
    if (confirm(confirmText)) {
        try {
            // 删除所有参与者
            const clientsSnapshot = await db.collection('clients').get();
            clientsSnapshot.forEach((doc) => {
                db.collection('clients').doc(doc.id).delete();
            });
            
            // 删除所有获奖者
            const winnersSnapshot = await db.collection('winners').get();
            winnersSnapshot.forEach((doc) => {
                db.collection('winners').doc(doc.id).delete();
            });
            
            document.getElementById('currentDisplay').textContent = translations[currentLanguage].readyText;
        } catch (error) {
            console.error('Error resetting lottery:', error);
            alert('Error resetting lottery. Please try again.');
        }
    }
}

// 更新统计信息
function updateStats() {
    const totalParticipants = participants.length;
    const winnersCount = winners.length;
    const prizesRemaining = TOTAL_PRIZES - winnersCount;
    
    document.getElementById('totalParticipants').textContent = totalParticipants;
    document.getElementById('prizesRemaining').textContent = prizesRemaining;
    document.getElementById('winnersCount').textContent = winnersCount;
    document.getElementById('participantsCount').textContent = totalParticipants;
    document.getElementById('winnersListCount').textContent = winnersCount;
}

// 显示参与者列表
function displayParticipants() {
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = '';
    
    participants.forEach(participant => {
        const participantCard = document.createElement('div');
        participantCard.className = participant.won ? 'winner-card' : 'participant-card';
        participantCard.innerHTML = `
            <div class="${participant.won ? 'winner-name' : 'participant-name'}">${participant.name}</div>
            <div class="${participant.won ? 'winner-id' : 'participant-id'}">${participant.id}</div>
            ${participant.won ? '<div style="font-size:12px;margin-top:5px;">✓ فائز</div>' : ''}
        `;
        participantsList.appendChild(participantCard);
    });
}

// 显示获奖者列表
function displayWinners() {
    const winnersList = document.getElementById('winnersList');
    winnersList.innerHTML = '';
    
    winners.forEach(winner => {
        const winnerCard = document.createElement('div');
        winnerCard.className = 'winner-card';
        winnerCard.innerHTML = `
            <div class="winner-name">${winner.name}</div>
            <div class="winner-id">${winner.id}</div>
        `;
        winnersList.appendChild(winnerCard);
    });
}

// 播放获奖音效
function playWinnerSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not available');
    }
}
