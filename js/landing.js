// Landing: nome e contatos do config.js, botões de contato, topo ao rolar e entrada das seções. Sem dependências.
(() => {
    "use strict";
    const config = window.WMS_LANDING || {};
    const preenchido = (valor) => typeof valor === "string" && valor.trim() !== "" && !/^\[.*\]$/.test(valor.trim());

    // O nome já vem escrito no HTML (para buscadores e sem JS); o config.js só confirma, se for trocado.
    if (preenchido(config.produto)) {
        document.querySelectorAll("[data-marca]").forEach((el) => { el.textContent = config.produto; });
    }

    document.querySelectorAll("[data-ano]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

    // Contatos: só mailto: e wa.me, com a mensagem já escrita. Nada é enviado pela página.
    const destinos = {
        email: preenchido(config.email)
            ? `mailto:${config.email}?subject=${encodeURIComponent(config.assunto || "")}&body=${encodeURIComponent(config.mensagem || "")}`
            : null,
        whatsapp: preenchido(config.whatsapp) && /^\d{10,15}$/.test(config.whatsapp)
            ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(config.mensagem || "")}`
            : null,
    };
    const textos = { email: config.email, whatsapp: config.whatsapp };
    let faltaContato = false;
    document.querySelectorAll("[data-cta]").forEach((el) => {
        const tipo = el.getAttribute("data-cta");
        const href = destinos[tipo];
        if (!href) {
            faltaContato = true;
            el.setAttribute("title", "Contato ainda não configurado");
            return;
        }
        el.setAttribute("href", href);
        el.removeAttribute("aria-disabled");
        if (tipo === "whatsapp") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
        if (el.hasAttribute("data-texto")) { el.textContent = tipo === "whatsapp" ? `WhatsApp +${textos.whatsapp}` : textos.email; }
    });
    if (faltaContato) {
        document.querySelectorAll("[data-aviso-contato]").forEach((el) => { el.hidden = false; });
    }

    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Topo ganha a borda depois de rolar.
    const topo = document.querySelector("[data-topo]");
    const marcarTopo = () => topo && topo.classList.toggle("topo--rolado", window.scrollY > 8);
    window.addEventListener("scroll", marcarTopo, { passive: true });
    marcarTopo();

    // Como funciona: no desktop, os passos viram uma lista que troca a tela ao lado. Avança sozinho enquanto a seção
    // está à vista (e o visitante não pediu menos movimento); para ao passar o mouse ou focar, e o clique escolhe o passo.
    const lista = document.querySelector("[data-passos]");
    if (lista) {
        const DURACAO = 6000;
        const botoes = [...lista.querySelectorAll(".passo-botao")];
        const telas = [...lista.querySelectorAll(".passo-tela")];
        const desktop = window.matchMedia("(min-width: 1025px)");
        let atual = 0, temporizador = null, visivel = false, pausado = false;
        lista.style.setProperty("--passo-duracao", `${DURACAO}ms`);

        const mostrar = (indice) => {
            atual = (indice + botoes.length) % botoes.length;
            botoes.forEach((b, i) => b.setAttribute("aria-expanded", String(i === atual)));
            telas.forEach((t, i) => t.classList.toggle("ativa", i === atual));
            reiniciar();
        };
        const parar = () => { clearTimeout(temporizador); temporizador = null; lista.classList.remove("passos--rodando"); };
        const reiniciar = () => {
            parar();
            if (!desktop.matches || reduzir || !visivel || pausado) { return; }
            void lista.offsetWidth; // recomeça a barra de progresso do passo
            lista.classList.add("passos--rodando");
            temporizador = setTimeout(() => mostrar(atual + 1), DURACAO);
        };
        const modo = () => {
            if (desktop.matches) {
                lista.classList.add("passos--interativo");
                mostrar(atual);
            } else {
                parar();
                lista.classList.remove("passos--interativo");
                botoes.forEach((b) => b.removeAttribute("aria-expanded"));
                telas.forEach((t) => t.classList.remove("ativa"));
            }
        };

        botoes.forEach((b, i) => b.addEventListener("click", () => { if (desktop.matches) { mostrar(i); } }));
        lista.addEventListener("keydown", (e) => {
            if (!desktop.matches || !["ArrowDown", "ArrowUp"].includes(e.key)) { return; }
            e.preventDefault();
            mostrar(atual + (e.key === "ArrowDown" ? 1 : -1));
            botoes[atual].focus();
        });
        lista.addEventListener("mouseenter", () => { pausado = true; reiniciar(); });
        lista.addEventListener("mouseleave", () => { pausado = false; reiniciar(); });
        lista.addEventListener("focusin", () => { pausado = true; reiniciar(); });
        lista.addEventListener("focusout", (e) => { if (!lista.contains(e.relatedTarget)) { pausado = false; reiniciar(); } });
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(([entrada]) => { visivel = entrada.isIntersecting; reiniciar(); }, { threshold: 0.35 }).observe(lista);
        }
        desktop.addEventListener("change", modo);
        modo();
    }

    // Entrada das seções: só com IntersectionObserver e sem pedido de redução de movimento.
    if (!reduzir && "IntersectionObserver" in window) {
        document.documentElement.classList.add("js");
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visivel");
                    observador.unobserve(entrada.target);
                }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
        document.querySelectorAll(".revelar").forEach((el, i) => {
            el.style.transitionDelay = `${Math.min(i % 4, 3) * 60}ms`;
            observador.observe(el);
        });
    }
})();
