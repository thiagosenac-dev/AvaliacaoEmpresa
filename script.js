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
                
                // Limpa todas as estrelas
                stars.forEach(s => s.classList.remove("active"));
                
                // Preenche as estrelas até a clicada
                stars.forEach(s => {
                    if (parseInt(s.getAttribute("data-value")) <= value) {
                        s.classList.add("active");
                    }
                });
            });
        });
    }

    // Salvar a avaliação no "Banco de Dados" (LocalStorage)
    if (evaluationForm) {
        evaluationForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (!ratingValue.value) {
                alert("Por favor, selecione uma nota de estrela.");
                return;
            }

            // 1. Capturar os dados digitados
            const technician = document.getElementById("technician").value;
            const rating = ratingValue.value;
            const comments = document.getElementById("comments").value;
            const improvements = document.getElementById("improvements").value;
            const date = new Date().toLocaleDateString('pt-BR');

            // 2. Criar um objeto com a nova avaliação
            const newReview = {
                technician,
                rating,
                comments,
                improvements,
                date
            };

            // 3. Buscar avaliações existentes ou criar lista vazia
            let savedReviews = JSON.parse(localStorage.getItem("systemReviews")) || [];
            
            // 4. Adicionar a nova avaliação na lista
            savedReviews.push(newReview);
            
            // 5. Salvar a lista atualizada
            localStorage.setItem("systemReviews", JSON.stringify(savedReviews));

            // Finalizar
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

    // Função que busca e desenha os dados na tela
    function loadReviews() {
        if (!reviewsContainer) return; 
        
        reviewsContainer.innerHTML = ""; 
        
        let savedReviews = JSON.parse(localStorage.getItem("systemReviews")) || [];

        if (savedReviews.length === 0) {
            reviewsContainer.innerHTML = "<p style='text-align:center; color:#666;'>Nenhuma avaliação recebida ainda.</p>";
            return;
        }

        savedReviews.reverse().forEach(review => {
            
            let starsHTML = "";
            for(let i = 1; i <= 5; i++) {
                if(i <= review.rating) {
                    starsHTML += '<span class="star-active">&#9733;</span>';
                } else {
                    starsHTML += '<span style="color: #ccc;">&#9733;</span>';
                }
            }

            const card = document.createElement("div");
            card.classList.add("review-card");
            card.innerHTML = `
                <div class="review-header">
                    <h3>${review.technician}</h3>
                    <div class="review-stars">
                        ${starsHTML} (${review.rating}/5)
                    </div>
                </div>
                <p style="font-size: 0.8rem; color: #888; margin-bottom: 10px;">Data: ${review.date}</p>
                <p><strong>Comentário:</strong> ${review.comments ? review.comments : "<em>Nenhum comentário deixado.</em>"}</p>
                <p><strong>A melhorar:</strong> ${review.improvements ? review.improvements : "<em>Nada a declarar.</em>"}</p>
            `;
            
            reviewsContainer.appendChild(card);
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const user = document.getElementById("username").value;
            const pass = document.getElementById("password").value;

            if (user && pass) {
                loginScreen.classList.add("hidden");
                dashboardScreen.classList.remove("hidden");
                
                loadReviews(); 
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            dashboardScreen.classList.add("hidden");
            loginScreen.classList.remove("hidden");
            loginForm.reset();
        });
    }
});