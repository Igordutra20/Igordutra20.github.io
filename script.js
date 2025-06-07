const backendURL = "https://enchanted-backend.onrender.com"; // Altere para sua URL do Render

const connectWalletBtn = document.getElementById("connectWalletBtn");
const mainContent = document.getElementById("mainContent");
const walletAddressSpan = document.getElementById("walletAddress");
const registerBtn = document.getElementById("registerBtn");
const registerMsg = document.getElementById("registerMsg");

let currentWallet = "";

async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask não encontrada.");
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const wallet = accounts[0];
    currentWallet = wallet;
    walletAddressSpan.textContent = wallet;

    // Obter nonce do backend
    const nonceRes = await fetch(`${backendURL}/get-nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });

    const { nonce } = await nonceRes.json();

    // Assinar nonce com a carteira
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [nonce, wallet]
    });

    // Verificar assinatura no backend (código atualizado)
const verifyRes = await fetch(`${backendURL}/verify-signature`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ 
    wallet: wallet.toLowerCase(), // Garante lowercase
    signature,
    originalNonce: nonces[wallet] // Envia o nonce original para comparação
  })
});

if (!verifyRes.ok) {
  const errorData = await verifyRes.json();
  throw new Error(errorData.error || "Falha na verificação");
}

const { success, message } = await verifyRes.json();

if (success) {
  mainContent.style.display = "block";
  connectWalletBtn.style.display = "none";
} else {
  throw new Error(message || "Assinatura inválida");
}
    
async function registerUser() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!username || !email) {
    registerMsg.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const res = await fetch(`${backendURL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: currentWallet, username, email })
    });

    const data = await res.json();

    if (res.ok) {
      registerMsg.style.color = "lime";
      registerMsg.textContent = "Cadastro realizado com sucesso!";
    } else {
      registerMsg.textContent = data.error || "Erro ao cadastrar.";
    }
  } catch (err) {
    registerMsg.textContent = "Erro ao conectar ao servidor.";
  }
}

connectWalletBtn.addEventListener("click", connectWallet);
registerBtn.addEventListener("click", registerUser);
