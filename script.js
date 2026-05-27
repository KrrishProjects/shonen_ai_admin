import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDA-XzgOQvOcXJCWQpxGY-CJYsbELtIbO4",
  authDomain: "shonen-ai-fae8e.firebaseapp.com",
  projectId: "shonen-ai-fae8e",
  appId: "1:190591711079:web:3d36e6e150bededb60e1c2",
};

const BACKEND_URL = "https://shonen-ai-backend.onrender.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const authCard = document.getElementById("authCard");
const userCard = document.getElementById("userCard");
const dashboard = document.getElementById("dashboard");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

const userEmail = document.getElementById("userEmail");
const backendStatus = document.getElementById("backendStatus");
const backendMessage = document.getElementById("backendMessage");
const adminStatus = document.getElementById("adminStatus");
const adminMessage = document.getElementById("adminMessage");
const versionStatus = document.getElementById("versionStatus");
const versionMessage = document.getElementById("versionMessage");
const latestVersionValue = document.getElementById("latestVersionValue");
const latestBuildValue = document.getElementById("latestBuildValue");
const minBuildValue = document.getElementById("minBuildValue");
const forceUpdateValue = document.getElementById("forceUpdateValue");
const apkLink = document.getElementById("apkLink");
const websiteLink = document.getElementById("websiteLink");
const changelogList = document.getElementById("changelogList");
const rawOutput = document.getElementById("rawOutput");

loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

refreshBtn.addEventListener("click", async () => {
  await refreshDashboard();
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authCard.classList.remove("hidden");
    userCard.classList.add("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  authCard.classList.add("hidden");
  userCard.classList.remove("hidden");
  dashboard.classList.remove("hidden");

  userEmail.textContent = user.email || "Unknown email";

  await refreshDashboard();
});

async function refreshDashboard() {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  rawOutput.textContent = "Checking admin backend...";

  try {
    const token = await user.getIdToken(true);

    const adminResponse = await fetch(`${BACKEND_URL}/admin/health`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const adminData = await adminResponse.json();

    if (adminResponse.ok && adminData.success) {
      backendStatus.textContent = "Healthy";
      backendMessage.textContent = adminData.message || "Backend is working.";

      adminStatus.textContent = "Verified";
      adminMessage.textContent = `Admin: ${adminData.adminEmail}`;
    } else {
      backendStatus.textContent = "Blocked";
      backendMessage.textContent = "Backend responded but admin access failed.";

      adminStatus.textContent = "Not allowed";
      adminMessage.textContent =
        adminData.error || "Your email is not allowed as admin.";
    }

    const versionResponse = await fetch(`${BACKEND_URL}/app-version`);
    const versionData = await versionResponse.json();

    if (versionResponse.ok && versionData.success) {
      versionStatus.textContent = `v${versionData.latestVersion}`;
      versionMessage.textContent = `Build ${versionData.latestBuild} • Force update: ${versionData.forceUpdate}`;

      latestVersionValue.textContent = `v${versionData.latestVersion}`;
      latestBuildValue.textContent = versionData.latestBuild;
      minBuildValue.textContent = versionData.minRequiredBuild;
      forceUpdateValue.textContent = versionData.forceUpdate ? "ON" : "OFF";

      forceUpdateValue.classList.remove("good", "warning", "danger");
      forceUpdateValue.classList.add(versionData.forceUpdate ? "danger" : "good");

      apkLink.href = versionData.apkUrl || "#";
      apkLink.textContent = versionData.apkUrl || "APK URL not available";

      websiteLink.href = versionData.websiteUrl || "#";
      websiteLink.textContent = versionData.websiteUrl || "Website URL not available";

      changelogList.innerHTML = "";

      if (Array.isArray(versionData.changelog) && versionData.changelog.length > 0) {
        versionData.changelog.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          changelogList.appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.textContent = "No changelog available.";
        changelogList.appendChild(li);
      }
    } else {
      versionStatus.textContent = "Error";
      versionMessage.textContent = "Could not load app version.";
    }

    rawOutput.textContent = JSON.stringify(
      {
        admin: adminData,
        version: versionData,
      },
      null,
      2
    );
  } catch (error) {
    backendStatus.textContent = "Error";
    backendMessage.textContent = error.message;

    adminStatus.textContent = "Failed";
    adminMessage.textContent = "Could not verify admin access.";

    rawOutput.textContent = error.stack || error.message;
  }
}
