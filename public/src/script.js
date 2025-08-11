async function carregarPersonagens() {
  const res = await fetch("/api/dados");
  const dados = await res.json();
  const select = document.getElementById("personagemSelect");

  select.innerHTML = `<option value="">-- Selecione --</option>`;

  // nomes únicos
  const nomesUnicos = [...new Set(dados.map(p => p.nome))];

  nomesUnicos.forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });

  carregarLista(dados);
}

function carregarLista(dados) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  dados.forEach(p => {
    p.ganhos.forEach(g => {
      const li = document.createElement("li");
      li.textContent = `${p.nome} - ${g.data} - NESOS ${g.ganho.toFixed(2)}`;

      // Botão remover ganho
      const btnRemoverGanho = document.createElement("button");
      btnRemoverGanho.textContent = "🗑️";
      btnRemoverGanho.style.marginLeft = "10px";
      btnRemoverGanho.onclick = async () => {
        if (!confirm(`Remover ganho do ${p.nome} em ${g.data}?`)) return;

        await fetch("/api/ganho", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome: p.nome, data: g.data }),
        });
        carregarPersonagens();
      };

      li.appendChild(btnRemoverGanho);
      lista.appendChild(li);
    });

    // Botão remover personagem após listar ganhos
    const liPersonagem = document.createElement("li");
    liPersonagem.style.fontWeight = "bold";
    liPersonagem.textContent = `Remover personagem "${p.nome}" `;
    const btnRemoverPersonagem = document.createElement("button");
    btnRemoverPersonagem.textContent = "❌";
    btnRemoverPersonagem.style.marginLeft = "10px";
    btnRemoverPersonagem.onclick = async () => {
      if (!confirm(`Remover personagem ${p.nome} e todos os ganhos?`)) return;

      await fetch(`/api/personagem/${encodeURIComponent(p.nome)}`, { method: "DELETE" });
      carregarPersonagens();
    };
    liPersonagem.appendChild(btnRemoverPersonagem);
    lista.appendChild(liPersonagem);
  });
}

document.getElementById("salvar").addEventListener("click", async () => {
  const selectNome = document.getElementById("personagemSelect").value;
  const novoNome = document.getElementById("novoPersonagem").value.trim();
  const nome = novoNome || selectNome;

  const ganho = parseFloat(document.getElementById("ganho").value);

  if (!nome || isNaN(ganho)) {
    alert("Preencha todos os campos!");
    return;
  }

  await fetch("/api/dados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, ganho }),
  });

  document.getElementById("novoPersonagem").value = "";
  document.getElementById("ganho").value = "";
  carregarPersonagens();
});

document.getElementById("verResultados").addEventListener("click", async () => {
  const res = await fetch("/api/resultado");
  const resultados = await res.json();

  const modo = document.getElementById("modoResultado").value;
  const container = document.getElementById("resultados");
  container.innerHTML = "";

  if (modo === "total") {
    container.innerHTML = `
      <h3>💰 Ganho Mensal Total: ${resultados.totalMensal.toFixed(2)} NESOS</h3>
      <h3>🎲 Soma Pool 5%: ${resultados.totalPool5.toFixed(2)} NESOS</h3>
      <h3>🎲 Soma Pool 10%: ${resultados.totalPool10.toFixed(2)} NESOS</h3>
      <h3>🧾 Total Seu: ${resultados.totalSeu.toFixed(2)} NESOS</h3>
    `;
  } else {
    const tabela = document.createElement("table");

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr style="background:#3498db; color:white;">
        <th>Personagem</th>
        <th>Ganho Mensal (NESOS)</th>
        <th>Pool 5% (NESOS):</th>
        <th>Pool 10% (NESOS):</th>
        <th>Total Seu (NESOS):</th>
      </tr>
    `;
    tabela.appendChild(thead);

    const tbody = document.createElement("tbody");
    resultados.resultadoPorPersonagem.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nome}</td>
        <td>NESOS ${p.totalMensal.toFixed(2)}</td>
        <td>NESOS ${p.pool5.toFixed(2)}</td>
        <td>NESOS ${p.pool10.toFixed(2)}</td>
        <td>NESOS ${p.seu.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
    tabela.appendChild(tbody);

    container.appendChild(tabela);
  }
});


// Carrega os personagens ao abrir a página
carregarPersonagens();
