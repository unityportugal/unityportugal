/* =========================================================
   Unity Portugal — CONFIGURAÇÃO
   Muda só estas linhas para atualizar o site inteiro.
   ========================================================= */
const CONFIG = {
  // Número de WhatsApp com indicativo, só algarismos (ex.: '351912345678').
  // Enquanto estiver vazio, o botão de WhatsApp fica escondido.
  whatsapp: '',

  // Nome de utilizador do Instagram (sem @)
  instagram: 'unityportugal',

  // Email de contacto
  email: 'unityoficial@gmail.com',

  // Endereço do formulário da newsletter (Brevo ou Mailchimp).
  // Enquanto estiver vazio, quem subscreve envia-te um email a pedir para entrar na lista.
  newsletterAction: ''
};

/* ========================================================= */

document.documentElement.classList.add('js');

// Aviso flutuante
function mostrarAviso(texto) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = texto;
  t.classList.add('mostrar');
  clearTimeout(mostrarAviso._timer);
  mostrarAviso._timer = setTimeout(() => t.classList.remove('mostrar'), 3500);
}

// Navegação por secções na página inicial (#inicio, #colecoes, #sobre)
function mostrarSecao() {
  const secoes = document.querySelectorAll('section.secao');
  if (!secoes.length) return;
  const hash = window.location.hash || '#inicio';
  let encontrou = false;
  secoes.forEach(sec => {
    const ativa = '#' + sec.id === hash;
    sec.classList.toggle('visivel', ativa);
    if (ativa) encontrou = true;
  });
  if (!encontrou) secoes[0].classList.add('visivel');
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.toggle('ativo', a.getAttribute('href').endsWith(hash));
  });
  window.scrollTo(0, 0);
}

// Contactos e ano
function preencherContactos() {
  document.querySelectorAll('[data-email]').forEach(el => {
    el.textContent = CONFIG.email;
    el.href = 'mailto:' + CONFIG.email;
  });
  document.querySelectorAll('[data-ano]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

// Newsletter
function prepararNewsletter() {
  document.querySelectorAll('form.newsletter').forEach(form => {
    const msg = form.querySelector('.newsletter-msg');
    if (CONFIG.newsletterAction) {
      form.action = CONFIG.newsletterAction;
      form.method = 'post';
      form.target = '_blank';
      form.addEventListener('submit', () => {
        msg.textContent = 'Obrigado! Confirma a subscrição no teu email.';
        setTimeout(() => form.reset(), 100);
      });
    } else {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value.trim();
        const assunto = encodeURIComponent('Subscrever newsletter Unity Portugal');
        const corpo = encodeURIComponent('Olá! Quero receber as novidades da Unity Portugal neste email: ' + email);
        window.location.href = 'mailto:' + CONFIG.email + '?subject=' + assunto + '&body=' + corpo;
        msg.textContent = 'Obrigado! Envia o email que se abriu para confirmar.';
        form.reset();
      });
    }
  });
}

// Página de produto: tamanho, quantidade e encomenda
function prepararProduto() {
  const pagina = document.querySelector('.produto-pagina');
  if (!pagina) return;

  const nome = pagina.dataset.nome;
  const preco = pagina.dataset.preco;
  const esgotado = pagina.dataset.esgotado === 'true';
  const erro = pagina.querySelector('.erro');
  const qtdOut = pagina.querySelector('.quantidade output');
  let qtd = 1;

  pagina.querySelectorAll('.quantidade button').forEach(b => {
    b.addEventListener('click', () => {
      qtd = Math.max(1, Math.min(10, qtd + Number(b.dataset.passo)));
      qtdOut.textContent = qtd;
    });
  });

  pagina.querySelectorAll('.tamanhos input').forEach(r => {
    r.addEventListener('change', () => { erro.textContent = ''; });
  });

  function montarMensagem() {
    if (esgotado) {
      return `Olá Unity Portugal! Quero ser avisado/a quando a ${nome} voltar a estar disponível.`;
    }
    const escolhido = pagina.querySelector('.tamanhos input:checked');
    if (!escolhido) {
      erro.textContent = 'Escolhe primeiro o tamanho.';
      pagina.querySelector('.tamanhos').scrollIntoView({ behavior: 'smooth', block: 'center' });
      return null;
    }
    return `Olá Unity Portugal! Quero encomendar:\n• ${nome}\n• Tamanho: ${escolhido.value}\n• Quantidade: ${qtd}\n• Preço: ${preco} cada\n\nComo posso pagar?`;
  }

  const btnWhats = pagina.querySelector('[data-encomendar="whatsapp"]');
  const btnInsta = pagina.querySelector('[data-encomendar="instagram"]');

  if (btnWhats) {
    if (!CONFIG.whatsapp) {
      btnWhats.hidden = true;
    } else {
      btnWhats.addEventListener('click', e => {
        e.preventDefault();
        const m = montarMensagem();
        if (!m) return;
        window.open('https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(m), '_blank', 'noopener');
      });
    }
  }

  if (btnInsta) {
    btnInsta.addEventListener('click', async e => {
      e.preventDefault();
      const m = montarMensagem();
      if (!m) return;
      let copiado = false;
      try { await navigator.clipboard.writeText(m); copiado = true; } catch (_) {}
      mostrarAviso(copiado
        ? 'Mensagem copiada! Cola-a na conversa do Instagram.'
        : 'Abre o Instagram e diz-nos qual é a peça.');
      setTimeout(() => {
        window.open('https://ig.me/m/' + CONFIG.instagram, '_blank', 'noopener');
      }, copiado ? 900 : 0);
    });
  }
}

// Esconde fotos que ainda não foram carregadas para o site
function esconderFotosEmFalta() {
  document.querySelectorAll('img[data-opcional]').forEach(img => {
    const esconder = () => {
      const caixa = img.closest('.foto-cliente') || img;
      caixa.remove();
      const grelha = document.querySelector('.galeria-grid');
      if (grelha && !grelha.children.length) {
        grelha.closest('.galeria-inicio').hidden = true;
      }
    };
    if (img.complete && img.naturalWidth === 0) esconder();
    else img.addEventListener('error', esconder);
  });
}

window.addEventListener('hashchange', mostrarSecao);
document.addEventListener('DOMContentLoaded', () => {
  mostrarSecao();
  preencherContactos();
  prepararNewsletter();
  prepararProduto();
  esconderFotosEmFalta();
});
