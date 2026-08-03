// Tudo dentro dessa função (IIFE) para nunca dar erro de "já declarado"
// caso o script seja recarregado/reinjetado (ex: pelo Live Server)
(function () {

// ==== CONFIG SUPABASE ====
const SUPABASE_URL = "https://yboawjaseqxeierjvxdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlib2F3amFzZXF4ZWllcmp2eGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDEwNjUsImV4cCI6MjA4NzcxNzA2NX0.ng4z-K5BkHkkm7sn6cD6mOZUDBpWlmJ-Ii39dVVS25U";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // LÓGICA DA PÁGINA DE AVALIAÇÃO (index.html)
    // ==========================================
    const stars = document.querySelectorAll(".star");
    const ratingValue = document.getElementById("ratingValue");
    const evaluationForm = document.getElementById("evaluationForm");

    // Sistema de clique nas estrelas
    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener("click", () => {
                let value = parseInt(star.getAttribute("data-value"));
                ratingValue.value = value;

                stars.forEach(s => s.classList.remove("active"));

                stars.forEach(s => {
                    if (parseInt(s.getAttribute("data-value")) <= value) {
                        s.classList.add("active");
                    }
                });
            });
        });
    }

    // Salvar a avaliação no Supabase
    if (evaluationForm) {
        evaluationForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!ratingValue.value) {
                alert("Por favor, selecione uma nota de estrela.");
                return;
            }

            const technician = document.getElementById("technician").value;
            const rating = parseInt(ratingValue.value);
            const comments = document.getElementById("comments").value;
            const improvements = document.getElementById("improvements").value;

            const submitBtn = evaluationForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            const { error } = await supabaseClient
                .from("reviews")
                .insert([{ technician, rating, comments, improvements }]);

            if (submitBtn) submitBtn.disabled = false;

            if (error) {
                console.error(error);
                alert("Ops, não foi possível enviar sua avaliação. Tente novamente.");
                return;
            }

            alert("Muito obrigado! Sua avaliação foi enviada com sucesso.");
            evaluationForm.reset();
            stars.forEach(s => s.classList.remove("active"));
            ratingValue.value = "";
        });
    }


    // ==========================================
    // LÓGICA DO PAINEL DO GESTOR (dashboard.html)
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    const loginScreen = document.getElementById("loginScreen");
    const dashboardScreen = document.getElementById("dashboardScreen");
    const logoutBtn = document.getElementById("logoutBtn");
    const reviewsContainer = document.getElementById("reviewsContainer");
    const filterTechnician = document.getElementById("filterTechnician");
    const filterRating = document.getElementById("filterRating");

    // Busca e desenha os dados na tela (aplicando filtros, se houver)
    async function loadReviews() {
        if (!reviewsContainer) return;

        reviewsContainer.innerHTML = "<p style='text-align:center; color:#666;'>Carregando...</p>";

        let query = supabaseClient
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false });

        const technicianValue = filterTechnician ? filterTechnician.value : "";
        const ratingValue = filterRating ? filterRating.value : "";

        if (technicianValue) {
            query = query.eq("technician", technicianValue);
        }
        if (ratingValue) {
            query = query.eq("rating", parseInt(ratingValue));
        }

        const { data: savedReviews, error } = await query;

        if (error) {
            console.error(error);
            reviewsContainer.innerHTML = "<p style='text-align:center; color:#c00;'>Erro ao carregar avaliações.</p>";
            return;
        }

        reviewsContainer.innerHTML = "";

        if (!savedReviews || savedReviews.length === 0) {
            const temFiltro = technicianValue || ratingValue;
            reviewsContainer.innerHTML = temFiltro
                ? "<p style='text-align:center; color:#666;'>Nenhuma avaliação encontrada com esse filtro.</p>"
                : "<p style='text-align:center; color:#666;'>Nenhuma avaliação recebida ainda.</p>";
            return;
        }

        savedReviews.forEach(review => {
            let starsHTML = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= review.rating) {
                    starsHTML += '<span class="star-active">&#9733;</span>';
                } else {
                    starsHTML += '<span style="color: #ccc;">&#9733;</span>';
                }
            }

            const dataFormatada = new Date(review.created_at).toLocaleDateString('pt-BR');

            const card = document.createElement("div");
            card.classList.add("review-card");
            card.innerHTML = `
                <div class="review-header">
                    <h3>${review.technician}</h3>
                    <div class="review-stars">
                        ${starsHTML} (${review.rating}/5)
                    </div>
                </div>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 10px;">Data: ${dataFormatada}</p>
                <p><strong>Comentário:</strong> ${review.comments ? review.comments : "<em>Nenhum comentário deixado.</em>"}</p>
                <p><strong>A melhorar:</strong> ${review.improvements ? review.improvements : "<em>Nada a declarar.</em>"}</p>
            `;

            reviewsContainer.appendChild(card);
        });
    }

    // Verifica se já existe uma sessão ativa ao abrir o dashboard
    async function checkSession() {
        if (!dashboardScreen) return;

        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            loginScreen.classList.add("hidden");
            dashboardScreen.classList.remove("hidden");
            loadReviews();
        }
    }
    checkSession();

    // Recarrega a lista sempre que um filtro for alterado
    if (filterTechnician) {
        filterTechnician.addEventListener("change", loadReviews);
    }
    if (filterRating) {
        filterRating.addEventListener("change", loadReviews);
    }

    // Login real com Supabase Auth
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const submitBtn = loginForm.querySelector("button[type='submit']");
            if (submitBtn) submitBtn.disabled = true;

            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (submitBtn) submitBtn.disabled = false;

            if (error) {
                alert("Usuário ou senha inválidos.");
                return;
            }

            loginScreen.classList.add("hidden");
            dashboardScreen.classList.remove("hidden");
            loadReviews();
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await supabaseClient.auth.signOut();
            dashboardScreen.classList.add("hidden");
            loginScreen.classList.remove("hidden");
            loginForm.reset();
        });
    }
});

})();
