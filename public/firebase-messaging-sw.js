importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAhaZMN2Wx98k3ee9oyPFWbLs_VGmZFwQ8",
  authDomain: "growy-5a9b8.firebaseapp.com",
  projectId: "growy-5a9b8",
  messagingSenderId: "115841280290",
  appId: "1:115841280290:web:bfecc6defca80537015d7b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = "Growy Alert", body = "" } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: "/image.png",
  });
});
