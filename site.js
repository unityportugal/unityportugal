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
  function fechar() { painel.classList.remove('aberto', 'a-preencher', 'concluida'); const r = painel.querySelector('[data-resumo]'); if (r) { r.hidden = false; painel.querySelector('[data-dados]').hidden = true; } desenhar(); painel.setAttribute('aria-hidden', 'true'); fundo.hidden = true; document.body.classList.remove('sem-scroll'); }

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
    const concluida = painel.classList.contains('concluida') && itens.length === 0;
    painel.querySelector('[data-ok]').hidden = !concluida;
    painel.querySelector('[data-vazio]').hidden = itens.length > 0 || concluida;
    painel.querySelector('[data-fim]').hidden = itens.length === 0;
    painel.querySelector('[data-subtotal]').textContent = euros(total);
    painel.querySelector('[data-envio]').textContent = total >= ENVIO_MINIMO ? 'Grátis · Portugal continental' : `Grátis a partir de ${euros(ENVIO_MINIMO)}`;
    painel.querySelector('[data-total]').textContent = euros(total);
  }

  function mudar(k, d) {
    const itens = ler();
    if (d > 0 && itens[k].max && itens[k].qtd >= itens[k].max) { aviso(`Só temos ${itens[k].max} em ${itens[k].tamanho}.`); return; }
    itens[k].qtd += d;
    if (itens[k].qtd <= 0) itens.splice(k, 1);
    guardar(itens); desenhar();
  }

  function adicionar(item) {
    const itens = ler();
    const igual = itens.find(i => i.id === item.id && i.tamanho === item.tamanho);
    if (igual && item.max && igual.qtd >= item.max) { aviso(`Só temos ${item.max} em ${item.tamanho}.`); abrir(); return; }
    if (igual) { igual.qtd += 1; igual.max = item.max; } else itens.push({ ...item, qtd: 1 });
    painel && painel.classList.remove('concluida');
    guardar(itens); desenhar(); abrir();
  }

  if (painel) {
    document.querySelectorAll('.abrir-carrinho').forEach(b => b.addEventListener('click', () => { registar('Abrir carrinho'); abrir(); }));
    document.querySelectorAll('[data-fechar]').forEach(b => b.addEventListener('click', fechar));
    painel.querySelectorAll('[data-fechar-link]').forEach(a => a.addEventListener('click', fechar));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && painel.classList.contains('aberto')) fechar(); });

    // Finalizar: os dados vão para o Google Form "Encomendas Unity"
    const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSc58acMXb8dgXoZV4E4rhsHl-E4CLJBuHaLprMghOjIPaz-SQ/formResponse';
    const CAMPOS = { nome: 'entry.183027301', email: 'entry.421766355', telefone: 'entry.1237621320', morada: 'entry.1266005092', cp: 'entry.1801305759', pagamento: 'entry.1808031775', encomenda: 'entry.115500475', total: 'entry.358657491' };
    const form = painel.querySelector('[data-dados]');
    const erroCk = form.querySelector('[data-erro-checkout]');
    const passo = nome => {
      painel.classList.toggle('a-preencher', nome === 'dados');
      painel.querySelector('[data-resumo]').hidden = nome !== 'resumo';
      form.hidden = nome !== 'dados';
      if (nome === 'dados') { painel.querySelector('[data-total-botao]').textContent = euros(ler().reduce((s, i) => s + i.preco * i.qtd, 0)); setTimeout(() => form.querySelector('input').focus(), 50); }
    };
    painel.querySelector('[data-checkout]').addEventListener('click', () => { registar('Finalizar encomenda'); passo('dados'); });
    form.querySelector('[data-voltar]').addEventListener('click', () => passo('resumo'));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const falta = ['nome', 'email', 'telefone', 'morada', 'cp', 'localidade'].filter(k => !(f[k] || '').trim());
      if (falta.length) { erroCk.textContent = 'Preenche todos os campos.'; form.querySelector(`[name="${falta[0]}"]`).focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { erroCk.textContent = 'Confirma o teu email.'; form.email.focus(); return; }
      if ((f.telefone.match(/\d/g) || []).length < 9) { erroCk.textContent = 'Confirma o teu número de telefone.'; form.telefone.focus(); return; }
      if (!f.pagamento) { erroCk.textContent = 'Escolhe a forma de pagamento.'; return; }
      erroCk.textContent = '';
      const itens = ler();
      const total = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
      const dados = new URLSearchParams();
      dados.append(CAMPOS.nome, f.nome.trim());
      dados.append(CAMPOS.email, f.email.trim());
      dados.append(CAMPOS.telefone, f.telefone.trim());
      dados.append(CAMPOS.morada, f.morada.trim());
      dados.append(CAMPOS.cp, f.cp.trim() + ' ' + f.localidade.trim());
      dados.append(CAMPOS.pagamento, f.pagamento);
      dados.append(CAMPOS.encomenda, itens.map(i => `${i.nome} · tamanho ${i.tamanho} · ${i.qtd} × ${euros(i.preco)}`).join('\n'));
      dados.append(CAMPOS.total, euros(total));
      const botao = form.querySelector('[data-confirmar]');
      botao.disabled = true; botao.dataset.texto = botao.innerHTML; botao.textContent = 'A enviar…';
      try {
        await fetch(FORM, { method: 'POST', mode: 'no-cors', body: dados });
        registar('Encomenda enviada', { pecas: itens.reduce((s, i) => s + i.qtd, 0), total: total.toFixed(2), pagamento: f.pagamento });
        guardar([]);
        form.reset();
        const ok = painel.querySelector('[data-ok]');
        ok.querySelector('[data-ok-nome]').textContent = f.nome.trim().split(' ')[0];
        ok.querySelector('[data-ok-total]').textContent = euros(total);
        ok.querySelector('[data-ok-pagamento]').textContent = f.pagamento;
        painel.classList.add('concluida');
        passo('resumo');
        desenhar();
      } catch (_) {
        erroCk.innerHTML = 'Não conseguimos enviar a encomenda. Verifica a ligação à internet e tenta outra vez, ou fala connosco no <a href="https://www.instagram.com/unityportugal" target="_blank" rel="noopener">Instagram</a>.';
      } finally {
        botao.disabled = false; botao.innerHTML = botao.dataset.texto;
      }
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
      adicionar({ id: d.id, nome: d.nome, preco: numero(d.preco), img: d.img, tamanho: t.value, max: Number(t.dataset.stock) || 0 });
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
