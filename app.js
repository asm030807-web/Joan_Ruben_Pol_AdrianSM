// ==========================================
// 1. NAVEGACIÓ DINÀMICA (SPA) AMB EFECTE
// ==========================================
function navigateTo(pageId, linkElement) {
    // 1. Amagar totes les pàgines
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => page.classList.add('hidden-page'));

    // 2. Mostrar la pàgina correcta
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden-page');
    }

    // 3. Actualitzar el menú i la línia lliscant
    const navLinks = document.querySelectorAll('#main-menu a');
    navLinks.forEach(link => link.classList.remove('active'));

    if (linkElement) {
        linkElement.classList.add('active');
        
        // --- EFECTE DE DESLIZAR ---
        const indicator = document.getElementById('slide-indicator');
        // Li donem l'amplada exacta de la paraula clicada
        indicator.style.width = `${linkElement.offsetWidth}px`;
        // El movemos a la posició exacta d'esquerra a dreta
        indicator.style.left = `${linkElement.offsetLeft}px`;
    }
}

// Inicialitzar la barrita a la posició "Home" quan carrega la pàgina
document.addEventListener("DOMContentLoaded", () => {
    const activeLink = document.querySelector('#main-menu a.active');
    if(activeLink) {
        const indicator = document.getElementById('slide-indicator');
        indicator.style.width = `${activeLink.offsetWidth}px`;
        indicator.style.left = `${activeLink.offsetLeft}px`;
    }
});

    const firebaseConfig = {
      apiKey: "TU_API_KEY",
      authDomain: "TU_PROYECTO.firebaseapp.com",
      projectId: "TU_PROJECT_ID",
      storageBucket: "TU_PROYECTO.appspot.com",
      messagingSenderId: "TU_MESSAGING_SENDER_ID",
      appId: "TU_APP_ID"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    const authSection = document.getElementById("auth-section");
    const verifySection = document.getElementById("verify-section");
    const appContent = document.getElementById("app-content");
    const statusBox = document.getElementById("statusBox");
    const userInfo = document.getElementById("user-info");
    const providerInfo = document.getElementById("provider-info");

    const emailInput = document.getElementById("email");
    const passInput = document.getElementById("pass");

    const btnEntrar = document.getElementById("btnEntrar");
    const btnRegistre = document.getElementById("btnRegistre");
    const btnGoogle = document.getElementById("btnGoogle");
    const btnReloadUser = document.getElementById("btnReloadUser");
    const btnResendVerification = document.getElementById("btnResendVerification");
    const btnLogoutVerify = document.getElementById("btnLogoutVerify");
    const btnLogOut = document.getElementById("btnLogOut");

    function showLoggedOut() {
      authSection.classList.remove("hidden");
      verifySection.classList.add("hidden");
      appContent.classList.add("hidden");
      statusBox.textContent = "Encara no has iniciat sessió.";
    }

    function showVerifyPending(user) {
      authSection.classList.add("hidden");
      verifySection.classList.remove("hidden");
      appContent.classList.add("hidden");
      userInfo.textContent = user.email || "Sense correu";
      providerInfo.textContent = "Compte creat amb correu i contrasenya. Falta verificar el correu.";
    }

    function showLoggedIn(user, providerName) {
      authSection.classList.add("hidden");
      verifySection.classList.add("hidden");
      appContent.classList.remove("hidden");
      userInfo.textContent = user.email || "Usuari sense correu";
      providerInfo.textContent = "Mètode d'accés: " + providerName;
    }

    function getMainProvider(user) {
      if (!user || !user.providerData || user.providerData.length === 0) {
        return "desconegut";
      }

      const ids = user.providerData.map(p => p.providerId);

      if (ids.includes("google.com")) return "Google";
      if (ids.includes("password")) return "Correu i contrasenya";
      return ids[0];
    }

    btnRegistre.onclick = async () => {
      const email = emailInput.value.trim();
      const pass = passInput.value;

      if (!email || !pass) {
        alert("Escriu el correu i la contrasenya.");
        return;
      }

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        await userCredential.user.sendEmailVerification();
        alert("Compte creat. T’hem enviat un correu de verificació.");
        showVerifyPending(userCredential.user);
      } catch (error) {
        alert(error.message);
      }
    };

    btnEntrar.onclick = async () => {
      const email = emailInput.value.trim();
      const pass = passInput.value;

      if (!email || !pass) {
        alert("Escriu el correu i la contrasenya.");
        return;
      }

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        await userCredential.user.reload();

        if (userCredential.user.emailVerified) {
          showLoggedIn(userCredential.user, "Correu i contrasenya");
        } else {
          showVerifyPending(userCredential.user);
        }
      } catch (error) {
        alert(error.message);
      }
    };

    btnGoogle.onclick = async () => {
      try {
        const result = await auth.signInWithPopup(googleProvider);
        showLoggedIn(result.user, "Google");
      } catch (error) {
        alert(error.message);
      }
    };

    btnReloadUser.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await user.reload();
        const updatedUser = auth.currentUser;

        if (updatedUser.emailVerified) {
          showLoggedIn(updatedUser, "Correu i contrasenya");
        } else {
          alert("Encara no consta com a verificat. Torna-ho a provar després de confirmar l’email.");
        }
      } catch (error) {
        alert(error.message);
      }
    };

    btnResendVerification.onclick = async () => {
      const user = auth.currentUser;
      if (!user) {
        alert("No hi ha cap usuari autenticat.");
        return;
      }

      try {
        await user.sendEmailVerification();
        alert("Correu de verificació reenviat.");
      } catch (error) {
        alert(error.message);
      }
    };

    btnLogoutVerify.onclick = () => auth.signOut();
    btnLogOut.onclick = () => auth.signOut();

    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        showLoggedOut();
        return;
      }

      try {
        await user.reload();
      } catch (e) {
        console.log(e);
      }

      const currentUser = auth.currentUser;
      const providerName = getMainProvider(currentUser);
      const providerIds = (currentUser.providerData || []).map(p => p.providerId);
      const isGoogleUser = providerIds.includes("google.com");

      if (isGoogleUser) {
        showLoggedIn(currentUser, providerName);
        return;
      }

      if (currentUser.emailVerified) {
        showLoggedIn(currentUser, providerName);
      } else {
        showVerifyPending(currentUser);
      }
    });
