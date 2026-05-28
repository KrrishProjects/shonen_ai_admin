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
const totalUsersValue = document.getElementById("totalUsersValue");
const activeUsersValue = document.getElementById("activeUsersValue");
const verifiedUsersValue = document.getElementById("verifiedUsersValue");
const disabledUsersValue = document.getElementById("disabledUsersValue");
const recentUsersTable = document.getElementById("recentUsersTable");
const premiumUsersValue = document.getElementById("premiumUsersValue");
const freeUsersValue = document.getElementById("freeUsersValue");
const expiredPremiumValue = document.getElementById("expiredPremiumValue");
const usersCheckedValue = document.getElementById("usersCheckedValue");
const premiumUsersTable = document.getElementById("premiumUsersTable");
const manualPremiumEmail = document.getElementById("manualPremiumEmail");
const manualPremiumDays = document.getElementById("manualPremiumDays");
const manualPremiumNote = document.getElementById("manualPremiumNote");
const activatePremiumBtn = document.getElementById("activatePremiumBtn");
const manualPremiumStatus = document.getElementById("manualPremiumStatus");
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

activatePremiumBtn.addEventListener("click", async () => {
  await activatePremiumManually();
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


async function activatePremiumManually() {
  const user = auth.currentUser;

  if (!user) {
    alert("Please login as admin first.");
    return;
  }

  const email = manualPremiumEmail.value.trim().toLowerCase();
  const durationDays = Number(manualPremiumDays.value || 30);
  const note = manualPremiumNote.value.trim();

  if (!email || !email.includes("@")) {
    manualPremiumStatus.textContent = "Enter a valid user email.";
    manualPremiumStatus.className = "status-line danger";
    return;
  }

  if (!durationDays || durationDays < 1) {
    manualPremiumStatus.textContent = "Duration must be at least 1 day.";
    manualPremiumStatus.className = "status-line danger";
    return;
  }

  activatePremiumBtn.disabled = true;
  activatePremiumBtn.textContent = "Activating...";
  manualPremiumStatus.textContent = "Sending request to backend...";
  manualPremiumStatus.className = "status-line";

  try {
    const token = await user.getIdToken(true);

    const response = await fetch(`${BACKEND_URL}/admin/activate-premium`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        durationDays,
        note,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Premium activation failed.");
    }

    manualPremiumStatus.textContent = `Premium activated for ${data.user.email} until ${data.user.premiumUntil}`;
    manualPremiumStatus.className = "status-line good";

    manualPremiumEmail.value = "";
    manualPremiumNote.value = "";

    await refreshDashboard();
  } catch (error) {
    manualPremiumStatus.textContent = error.message;
    manualPremiumStatus.className = "status-line danger";
  } finally {
    activatePremiumBtn.disabled = false;
    activatePremiumBtn.textContent = "Activate Premium";
  }
}


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

      document.getElementById("latestVersionValue").textContent = `v${versionData.latestVersion}`;
      document.getElementById("latestBuildValue").textContent = versionData.latestBuild;
      document.getElementById("minBuildValue").textContent = versionData.minRequiredBuild;
      document.getElementById("forceUpdateValue").textContent = versionData.forceUpdate ? "ON" : "OFF";

      document.getElementById("forceUpdateValue").classList.remove("good", "warning", "danger");
      document.getElementById("forceUpdateValue").classList.add(versionData.forceUpdate ? "danger" : "good");

      document.getElementById("apkLink").href = versionData.apkUrl || "#";
      document.getElementById("apkLink").textContent = versionData.apkUrl || "APK URL not available";

      document.getElementById("websiteLink").href = versionData.websiteUrl || "#";
      document.getElementById("websiteLink").textContent = versionData.websiteUrl || "Website URL not available";

      document.getElementById("changelogList").innerHTML = "";

      if (Array.isArray(versionData.changelog) && versionData.changelog.length > 0) {
        versionData.changelog.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          document.getElementById("changelogList").appendChild(li);
        });
      } else {
        const li = document.createElement("li");
        li.textContent = "No changelog available.";
        document.getElementById("changelogList").appendChild(li);
      }
    } else {
      versionStatus.textContent = "Error";
      versionMessage.textContent = "Could not load app version.";
    }

    const usersResponse = await fetch(`${BACKEND_URL}/admin/users-overview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const usersData = await usersResponse.json();

    if (usersResponse.ok && usersData.success) {
      totalUsersValue.textContent = usersData.totalUsers ?? "-";
      activeUsersValue.textContent = usersData.activeUsers ?? "-";
      verifiedUsersValue.textContent = usersData.verifiedEmailUsers ?? "-";
      disabledUsersValue.textContent = usersData.disabledUsers ?? "-";

      recentUsersTable.innerHTML = "";

      if (Array.isArray(usersData.recentUsers) && usersData.recentUsers.length > 0) {
        usersData.recentUsers.forEach((user) => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${user.email || "-"}</td>
            <td>${user.displayName || "-"}</td>
            <td><span class="pill ${user.emailVerified ? "yes" : "no"}">${user.emailVerified ? "Yes" : "No"}</span></td>
            <td><span class="pill ${user.disabled ? "no" : "yes"}">${user.disabled ? "Yes" : "No"}</span></td>
            <td>${user.lastSignInAt || user.createdAt || "-"}</td>
          `;

          recentUsersTable.appendChild(tr);
        });
      } else {
        recentUsersTable.innerHTML = `<tr><td colspan="5">No users found.</td></tr>`;
      }
    } else {
      totalUsersValue.textContent = "Error";
      activeUsersValue.textContent = "-";
      verifiedUsersValue.textContent = "-";
      disabledUsersValue.textContent = "-";
      recentUsersTable.innerHTML = `<tr><td colspan="5">${usersData.error || "Could not load users."}</td></tr>`;
    }

    const premiumResponse = await fetch(`${BACKEND_URL}/admin/premium-overview`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const premiumData = await premiumResponse.json();

    if (premiumResponse.ok && premiumData.success) {
      premiumUsersValue.textContent = premiumData.premiumUsers ?? "-";
      freeUsersValue.textContent = premiumData.freeUsers ?? "-";
      expiredPremiumValue.textContent = premiumData.expiredPremiumUsers ?? "-";
      usersCheckedValue.textContent = premiumData.totalUsersChecked ?? "-";

      premiumUsersTable.innerHTML = "";

      if (Array.isArray(premiumData.users) && premiumData.users.length > 0) {
        premiumData.users.forEach((user) => {
          const tr = document.createElement("tr");

          const planClass =
            user.plan === "premium" && !user.isExpired ? "yes" : "no";

          tr.innerHTML = `
            <td>${user.email || "-"}</td>
            <td>${user.displayName || "-"}</td>
            <td><span class="pill ${planClass}">${user.plan || "free"}</span></td>
            <td>${user.isExpired ? "Expired" : user.status || "-"}</td>
            <td>${user.premiumUntil || "-"}</td>
            <td>${user.lastPaymentId || "-"}</td>
          `;

          premiumUsersTable.appendChild(tr);
        });
      } else {
        premiumUsersTable.innerHTML = `<tr><td colspan="6">No users found.</td></tr>`;
      }
    } else {
      premiumUsersValue.textContent = "Error";
      freeUsersValue.textContent = "-";
      expiredPremiumValue.textContent = "-";
      usersCheckedValue.textContent = "-";
      premiumUsersTable.innerHTML = `<tr><td colspan="6">${premiumData.error || "Could not load premium users."}</td></tr>`;
    }

    rawOutput.textContent = JSON.stringify(
      {
        admin: adminData,
        version: versionData,
        users: usersData,
        premium: premiumData,
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
