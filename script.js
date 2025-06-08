const backendURL = "https://enchanted-backend.onrender.com";
const connectWalletBtn = document.getElementById("connectWalletBtn");
const mainContent = document.getElementById("mainContent");
const walletAddressSpan = document.getElementById("walletAddress");

// Verificação inicial
if (typeof window.ethereum === 'undefined') {
  connectWalletBtn.textContent = "Instale a MetaMask";
  connectWalletBtn.onclick = () => window.open("https://metamask.io/download.html", "_blank");
  console.error("MetaMask não instalada!");
} else {
  console.log("MetaMask detectada!");
}

// Função principal de conexão
async function connectWallet() {
  console.log("Iniciando conexão...");
  
  try {
    // 1. Solicitar acesso à conta
    const accounts = await window.ethereum.request({ 
      method: "eth_requestAccounts" 
    }).catch(err => {
      console.error("Erro ao solicitar contas:", err);
      throw new Error(err.message || "Usuário rejeitou a conexão");
    });

    const wallet = accounts[0];
    console.log("Carteira conectada:", wallet);
    
    // 2. Obter nonce do backend
    const nonceRes = await fetch(`${backendURL}/get-nonce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet })
    });
    
    if (!nonceRes.ok) {
      const error = await nonceRes.json();
      throw new Error(error.error || "Falha ao obter nonce");
    }
    
    const { nonce } = await nonceRes.json();
    console.log("Nonce recebido:", nonce);
    
    // 3. Assinar mensagem
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [nonce, wallet]
    }).catch(err => {
      console.error("Erro na assinatura:", err);
      throw new Error("Assinatura cancelada");
    });
    
    console.log("Assinatura gerada:", signature);
    
    // 4. Verificar no backend
    const verifyRes = await fetch(`${backendURL}/verify-signature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet, signature, originalNonce: nonce })
    });
    
    if (!verifyRes.ok) {
      const error = await verifyRes.json();
      throw new Error(error.error || "Verificação falhou");
    }
    
    // 5. Conexão bem-sucedida
    walletAddressSpan.textContent = `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
    mainContent.style.display = "block";
    connectWalletBtn.style.display = "none";
    console.log("Conexão completa!");
    
  } catch (err) {
    console.error("Erro na conexão:", err);
    alert(`Erro: ${err.message}`);
  }
}

// Event Listener corrigido
connectWalletBtn.addEventListener("click", connectWallet);

// Opcional: Verificar se já está conectado
window.addEventListener('load', async () => {
  if (window.ethereum && window.ethereum.selectedAddress) {
    console.log("Já conectado:", window.ethereum.selectedAddress);
    connectWallet(); // Autoconectar se já tiver permissão
  }
});
