// Unity Portugal — loja com carrinho (encomendas pelo Instagram)
(function () {
  const CHAVE = 'unity-carrinho';
  const ENVIO_MINIMO = 30;

  // ---------- utilitários ----------
  const euros = n => n.toFixed(2).replace('.', ',') + '€';
  const numero = txt => parseFloat(String(txt).replace('€', '').replace(',', '.')) || 0;
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch (_) { return memoria; } }
  function guardar(itens) { memoria = itens; try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (_) {} }
  let memoria = [];

  function aviso(texto) {
    let t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = texto; t.classList.add('mostrar');
    clearTimeout(aviso.t); aviso.t = setTimeout(() => t.classList.remove('mostrar'), 3800);
  }

  // Estatísticas (Umami): regista ações sem nunca bloquear a loja
  function registar(nome, dados) { try { if (window.umami) window.umami.track(nome, dados); } catch (_) {} }

  // ---------- carrinho ----------
  const painel = document.getElementById('carrinho');
  const fundo = document.querySelector('.carrinho-fundo');

  function abrir() { painel.classList.add('aberto'); painel.setAttribute('aria-hidden', 'false'); fundo.hidden = false; document.body.classList.add('sem-scroll'); painel.querySelector('.fechar').focus(); }
  function fechar() { painel.classList.remove('aberto'); painel.setAttribute('aria-hidden', 'true'); fundo.hidden = true; document.body.classList.remove('sem-scroll'); }

  function mensagem(itens) {
    const linhas = itens.map(i => `• ${i.nome} · tamanho ${i.tamanho} · ${i.qtd} × ${euros(i.preco)}`);
    const total = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
    return [
      'Olá Unity Portugal! Quero encomendar:',
      ...linhas,
      '',
      `Total: ${euros(total)}` + (total >= ENVIO_MINIMO ? ' (envio grátis em Portugal continental)' : ''),
      '',
      'Nome:',
      'Morada:',
      'Pagamento (MB WAY, transferência ou Revolut):'
    ].join('\n');
  }

  function desenhar() {
    const itens = ler();
    const qtd = itens.reduce((s, i) => s + i.qtd, 0);
    document.querySelectorAll('[data-contagem]').forEach(b => { b.textContent = qtd; b.classList.toggle('tem', qtd > 0); });
    if (!painel) return;
    const lista = painel.querySelector('[data-lista]');
    lista.innerHTML = '';
    itens.forEach((i, k) => {
      const li = document.createElement('li');
      li.innerHTML = `<img src="${i.img}" alt="">
        <div class="item-info"><b>${i.nome}</b><span>Tamanho ${i.tamanho}</span>
          <div class="qtd"><button type="button" data-menos aria-label="Menos uma">−</button><output>${i.qtd}</output><button type="button" data-mais aria-label="Mais uma">+</button></div>
        </div>
        <div class="item-fim"><span>${euros(i.preco * i.qtd)}</span><button type="button" data-tirar>Remover</button></div>`;
      li.querySelector('[data-menos]').onclick = () => mudar(k, -1);
      li.querySelector('[data-mais]').onclick = () => mudar(k, 1);
      li.querySelector('[data-tirar]').onclick = () => mudar(k, -i.qtd);
      lista.appendChild(li);
    });
    const total = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
    painel.querySelector('[data-vazio]').hidden = itens.length > 0;
    painel.querySelector('[data-fim]').hidden = itens.length === 0;
    painel.querySelector('[data-subtotal]').textContent = euros(total);
    painel.querySelector('[data-envio]').textContent = total >= ENVIO_MINIMO ? 'Grátis · Portugal continental' : `Grátis a partir de ${euros(ENVIO_MINIMO)}`;
    painel.querySelector('[data-total]').textContent = euros(total);
    painel.querySelector('#mensagem-encomenda').value = mensagem(itens);
  }

  function mudar(k, d) {
    const itens = ler();
    itens[k].qtd += d;
    if (itens[k].qtd <= 0) itens.splice(k, 1);
    guardar(itens); desenhar();
  }

  function adicionar(item) {
    const itens = ler();
    const igual = itens.find(i => i.id === item.id && i.tamanho === item.tamanho);
    if (igual) igual.qtd += 1; else itens.push({ ...item, qtd: 1 });
    guardar(itens); desenhar(); abrir();
  }

  if (painel) {
    document.querySelectorAll('.abrir-carrinho').forEach(b => b.addEventListener('click', () => { registar('Abrir carrinho'); abrir(); }));
    document.querySelectorAll('[data-fechar]').forEach(b => b.addEventListener('click', fechar));
    painel.querySelector('[data-fechar-link]').addEventListener('click', fechar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && painel.classList.contains('aberto')) fechar(); });

    // Finalizar: copia a encomenda e abre a conversa do Instagram (o link segue normalmente)
    painel.querySelector('[data-finalizar]').addEventListener('click', () => {
      const itens = ler();
      registar('Encomendar pelo Instagram', { pecas: itens.reduce((s, i) => s + i.qtd, 0), total: itens.reduce((s, i) => s + i.preco * i.qtd, 0).toFixed(2) });
      const texto = mensagem(itens);
      const caixa = painel.querySelector('[data-copia]');
      try {
        navigator.clipboard.writeText(texto).then(
          () => aviso('Encomenda copiada. Cola-a na conversa do Instagram.'),
          () => { caixa.hidden = false; caixa.querySelector('textarea').select(); }
        );
      } catch (_) { caixa.hidden = false; }
    });
  }

  // ---------- página de peça ----------
  const produto = document.querySelector('.produto');
  if (produto) {
    const d = produto.dataset;
    const erro = produto.querySelector('.erro');
    const tamanhos = produto.querySelector('.tamanhos');
    produto.querySelectorAll('.tamanhos input').forEach(i => i.addEventListener('change', () => {
      if (erro) erro.textContent = '';
      const a = produto.querySelector('[data-escolhido]'); if (a) a.textContent = i.value;
      const b = document.querySelector('[data-escolhido-barra]'); if (b) b.textContent = 'Tamanho ' + i.value;
    }));
    document.querySelectorAll('[data-adicionar]').forEach(b => b.addEventListener('click', () => {
      const t = produto.querySelector('.tamanhos input:checked');
      if (!t) { erro.textContent = 'Escolhe primeiro o tamanho.'; tamanhos.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      registar('Adicionar ao carrinho', { peca: d.nome, tamanho: t.value });
      adicionar({ id: d.id, nome: d.nome, preco: numero(d.preco), img: d.img, tamanho: t.value });
    }));
    const avisar = produto.querySelector('[data-avisar]');
    if (avisar) avisar.addEventListener('click', () => {
      registar('Avisa-me quando voltar', { peca: d.nome });
      const texto = `Olá Unity Portugal! Quero ser avisado/a quando a ${d.nome} voltar.`;
      try { navigator.clipboard.writeText(texto).then(() => aviso('Mensagem copiada. Cola-a na conversa do Instagram.'), () => {}); } catch (_) {}
    });

    // Barra de compra fixa no telemóvel
    const barra = document.querySelector('.barra-compra');
    const acoes = produto.querySelector('.acoes');
    if (barra && acoes && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => barra.classList.toggle('mostrar', !es[0].isIntersecting)).observe(acoes);
    }
  }


  desenhar();
})();
