
const SUPABASE_URL = "https://ufnekybrltekupbhdsoe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gMjkBoNO_rRWPytj35gK0Q_YKE22un0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);

// Telas
const authView = document.getElementById("auth-view");
const recoveryView = document.getElementById("recovery-view");
const resetView = document.getElementById("reset-view");
const welcomeView = document.getElementById("welcome-view");

// Elementos da tela de login
const loginForm = document.getElementById("login-form");
const userInput = document.getElementById("user");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("toggle-password");
const loginMessage = document.getElementById("login-message");

const emailInput = document.getElementById("email");
const emailGroup = document.getElementById("email-group");

const formTitle = document.getElementById("form-title");
const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginSubmitButton = loginForm.querySelector('button[type="submit"]');

// Elementos de recuperação
const forgotPasswordLink = document.getElementById("forgot-password-link");
const recoveryForm = document.getElementById("recovery-form");
const recoveryEmailInput = document.getElementById("recovery-email");
const recoveryMessage = document.getElementById("recovery-message");
const backToLoginButton = document.getElementById("back-to-login");

// Elementos de redefinição
const resetForm = document.getElementById("reset-form");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const resetMessage = document.getElementById("reset-message");

// Elementos da tela de boas-vindas
const welcomeUsername = document.getElementById("welcome-username");
const logoutButton = document.getElementById("logout-button");

let authMode = "login";
let isSubmitting = false;
let isSigningOut = false;
let isRecoveryFlow = false;

// Alternar entre login e cadastro
function setAuthMode(mode) {
    authMode = mode;

    const isSignup = mode === "signup";

    formTitle.textContent = isSignup ? "Criar conta" : "Entrar";
    loginSubmitButton.textContent = isSignup ? "Cadastrar" : "Entrar";

    emailGroup.hidden = !isSignup;
    emailInput.required = isSignup;
    emailInput.autocomplete = isSignup ? "email" : "off";

    passwordInput.autocomplete = isSignup
        ? "new-password"
        : "current-password";

    forgotPasswordLink.hidden = isSignup;

    loginTab.classList.toggle("active", !isSignup);
    signupTab.classList.toggle("active", isSignup);

    clearLoginMessage();
}

loginTab.addEventListener("click", () => {
    if (!isSubmitting) {
        setAuthMode("login");
    }
});

signupTab.addEventListener("click", () => {
    if (!isSubmitting) {
        setAuthMode("signup");
    }
});

// Mostrar a tela de login ou boas-vindas
function updateAuthScreen(session) {
    if (isRecoveryFlow) {
        return;
    }

    const isLoggedIn = Boolean(session) && !isSigningOut;

    authView.hidden = isLoggedIn;
    recoveryView.hidden = true;
    resetView.hidden = true;
    welcomeView.hidden = !isLoggedIn;

    if (isLoggedIn) {
        const username =
            session.user.user_metadata?.username ||
            session.user.email ||
            "usuário";

        welcomeUsername.textContent = username;
    }
}

// Ícones do campo de senha
const eyeOpen = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
`;

const eyeClosed = `
    <svg xmlns="http://www.w3.org/2000/svg"
        width="20" height="20" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">
        <path d="m3 3 18 18"/>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
        <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3 3.8"/>
        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1 0 2-.2 2.9-.5"/>
    </svg>
`;

togglePassword.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";
    togglePassword.innerHTML = isPasswordHidden ? eyeClosed : eyeOpen;

    togglePassword.setAttribute(
        "aria-label",
        isPasswordHidden ? "Ocultar senha" : "Mostrar senha"
    );
});

// Mensagens
function clearLoginMessage() {
    loginMessage.textContent = "";
    loginMessage.style.color = "#fca5a5";
}

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "#86efac" : "#fca5a5";
}

userInput.addEventListener("input", clearLoginMessage);
passwordInput.addEventListener("input", clearLoginMessage);
emailInput.addEventListener("input", clearLoginMessage);

recoveryEmailInput.addEventListener("input", () => {
    recoveryMessage.textContent = "";
});

newPasswordInput.addEventListener("input", () => {
    resetMessage.textContent = "";
});

confirmPasswordInput.addEventListener("input", () => {
    resetMessage.textContent = "";
});

// Navegação entre as telas
function showLoginView() {
    isRecoveryFlow = false;

    authView.hidden = false;
    recoveryView.hidden = true;
    resetView.hidden = true;
    welcomeView.hidden = true;

    recoveryMessage.textContent = "";
    resetMessage.textContent = "";

    recoveryForm.reset();
    resetForm.reset();

    setAuthMode("login");
}

forgotPasswordLink.addEventListener("click", () => {
    authView.hidden = true;
    recoveryView.hidden = false;
    resetView.hidden = true;
    welcomeView.hidden = true;

    recoveryMessage.textContent = "";

    // Se o e-mail já estiver preenchido no cadastro, reutilizá-lo.
    recoveryEmailInput.value = emailInput.value.trim();
    recoveryEmailInput.focus();
});

backToLoginButton.addEventListener("click", showLoginView);

// Login e cadastro
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const username = userInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    clearLoginMessage();

    isSubmitting = true;
    loginSubmitButton.disabled = true;

    try {
        if (authMode === "login") {
            loginSubmitButton.textContent = "Entrando...";

            const { data, error } =
                await supabaseClient.functions.invoke("LoginComNome", {
                    body: {
                        username,
                        password
                    }
                });

            if (error) throw error;

            if (!data?.access_token || !data?.refresh_token) {
                throw new Error(
                    "A função não retornou uma sessão válida."
                );
            }

            const { error: sessionError } =
                await supabaseClient.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token
                });

            if (sessionError) throw sessionError;

            showMessage(
                loginMessage,
                "Login realizado com sucesso!",
                true
            );

            return;
        }

        // Validações do cadastro
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            showMessage(
                loginMessage,
                "Use de 3 a 20 letras, números ou underscores no usuário."
            );
            return;
        }

        if (!email || !emailInput.validity.valid) {
            showMessage(loginMessage, "Digite um e-mail válido.");
            return;
        }

        if (password.length < 6) {
            showMessage(
                loginMessage,
                "A senha precisa ter pelo menos 6 caracteres."
            );
            return;
        }

        loginSubmitButton.textContent = "Cadastrando...";

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });

        if (error) throw error;

        if (data.session) {
            showMessage(
                loginMessage,
                "Conta criada com sucesso! Você já pode entrar.",
                true
            );
        } else {
            showMessage(
                loginMessage,
                "Cadastro recebido! Confira seu e-mail, se a confirmação estiver ativada.",
                true
            );
        }
    } catch (error) {
        console.error("Erro na autenticação:", error);

        if (authMode === "login") {
            showMessage(
                loginMessage,
                "Nome de usuário ou senha inválidos. Tente novamente."
            );
        } else {
            showMessage(
                loginMessage,
                "Não foi possível criar a conta. Confira os dados ou tente outro nome de usuário."
            );
        }
    } finally {
        isSubmitting = false;
        loginSubmitButton.disabled = false;

        loginSubmitButton.textContent =
            authMode === "signup" ? "Cadastrar" : "Entrar";
    }
});

// Solicitar e-mail de recuperação
recoveryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const email = recoveryEmailInput.value.trim();

    if (!recoveryEmailInput.validity.valid || !email) {
        showMessage(recoveryMessage, "Digite um e-mail válido.");
        return;
    }

    const button = recoveryForm.querySelector('button[type="submit"]');

    isSubmitting = true;
    button.disabled = true;
    button.textContent = "Enviando...";

    try {
        // Mantém o caminho atual, tanto no Live Server quanto no site publicado.
        const redirectTo =
            window.location.origin + window.location.pathname;

        const { error } =
            await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo
            });

        if (error) throw error;

        showMessage(
            recoveryMessage,
            "Se houver uma conta associada a esse e-mail, você receberá um link de recuperação. Confira também o spam.",
            true
        );
    } catch (error) {
        console.error("Erro ao solicitar recuperação:", error);

        showMessage(
            recoveryMessage,
            "Não foi possível enviar o link. Confira a configuração do Supabase e tente novamente."
        );
    } finally {
        isSubmitting = false;
        button.disabled = false;
        button.textContent = "Enviar link de recuperação";
    }
});

// Exibir a tela para criar uma nova senha
function showResetView() {
    isRecoveryFlow = true;

    authView.hidden = true;
    recoveryView.hidden = true;
    resetView.hidden = false;
    welcomeView.hidden = true;

    resetMessage.textContent = "";
    resetForm.reset();

    newPasswordInput.focus();
}

// Salvar a nova senha
resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (newPassword.length < 6) {
        showMessage(
            resetMessage,
            "A senha precisa ter pelo menos 6 caracteres."
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage(resetMessage, "As senhas não coincidem.");
        return;
    }

    const button = resetForm.querySelector('button[type="submit"]');

    isSubmitting = true;
    button.disabled = true;
    button.textContent = "Salvando...";

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showMessage(
            resetMessage,
            "Senha alterada com sucesso! Agora você pode entrar com a nova senha.",
            true
        );

        // Encerrar a sessão de recuperação e voltar ao login.
        const { error: signOutError } =
            await supabaseClient.auth.signOut();

        if (signOutError) {
            console.error(
                "A senha foi alterada, mas não foi possível encerrar a sessão:",
                signOutError
            );
        }

        isRecoveryFlow = false;

        authView.hidden = false;
        recoveryView.hidden = true;
        resetView.hidden = true;
        welcomeView.hidden = true;

        loginForm.reset();
        passwordInput.type = "password";
        togglePassword.innerHTML = eyeOpen;
        togglePassword.setAttribute("aria-label", "Mostrar senha");

        setAuthMode("login");

        showMessage(
            loginMessage,
            "Senha alterada com sucesso! Entre com sua nova senha.",
            true
        );
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);

        showMessage(
            resetMessage,
            "Não foi possível alterar a senha. O link pode ter expirado ou ser inválido. Solicite outro link e tente novamente."
        );
    } finally {
        isSubmitting = false;
        button.disabled = false;
        button.textContent = "Salvar nova senha";
    }
});

// Monitorar alterações na autenticação do Supabase
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        showResetView();
        return;
    }

    if (event === "SIGNED_OUT") {
        if (!isRecoveryFlow) {
            updateAuthScreen(null);
        }
        return;
    }

    if (!isRecoveryFlow && !isSigningOut) {
        updateAuthScreen(session);
    }
});

// Restaurar a sessão ao carregar ou atualizar a página
async function restoreSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        // O evento PASSWORD_RECOVERY controla a tela de redefinição.
        if (!isRecoveryFlow) {
            updateAuthScreen(data.session);
        }
    } catch (error) {
        console.error("Erro ao restaurar a sessão:", error);
        updateAuthScreen(null);
    }
}

restoreSession();

// Encerrar a sessão
logoutButton.addEventListener("click", async () => {
    if (isSigningOut) return;

    isSigningOut = true;
    logoutButton.disabled = true;
    logoutButton.textContent = "Saindo...";

    updateAuthScreen(null);

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        loginForm.reset();

        passwordInput.type = "password";
        togglePassword.innerHTML = eyeOpen;
        togglePassword.setAttribute("aria-label", "Mostrar senha");

        setAuthMode("login");
        clearLoginMessage();
    } catch (error) {
        console.error("Erro ao sair:", error);

        const { data } = await supabaseClient.auth.getSession();
        updateAuthScreen(data?.session ?? null);

        alert("Não foi possível sair da conta. Tente novamente.");
    } finally {
        isSigningOut = false;
        logoutButton.disabled = false;
        logoutButton.textContent = "Sair da conta";
    }
});

// Inicialização
setAuthMode("login");

// SLR
