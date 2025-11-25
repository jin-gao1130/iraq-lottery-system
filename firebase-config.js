// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyBcphaIdlM5cTs-3aNB0DYKrXw9RyF0toc",
    authDomain: "danaher-lottery.firebaseapp.com",
    databaseURL: "https://danaher-lottery-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "danaher-lottery",
    storageBucket: "danaher-lottery.firebasestorage.app",
    messagingSenderId: "830354678742",
    appId: "1:830354678742:web:2c9586ef524a8bec8dfa77"
};

// 初始化 Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// 创建数据库引用
const database = firebase.database();
