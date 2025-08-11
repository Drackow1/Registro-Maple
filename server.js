const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DADOS_FILE = path.join(__dirname, "dados.json");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

function carregarDados() {
  try {
    if (!fs.existsSync(DADOS_FILE)) {
      fs.writeFileSync(DADOS_FILE, JSON.stringify([]));
      return [];
    }
    const conteudo = fs.readFileSync(DADOS_FILE, "utf-8");
    if (!conteudo || conteudo.trim() === "") return [];
    return JSON.parse(conteudo);
  } catch (err) {
    console.error("Erro ao carregar dados.json:", err);
    fs.writeFileSync(DADOS_FILE, JSON.stringify([]));
    return [];
  }
}

function salvarDados(dados) {
  fs.writeFileSync(DADOS_FILE, JSON.stringify(dados, null, 2));
}

// Rota para retornar todos os personagens
app.get("/api/dados", (req, res) => {
  const dados = carregarDados();
  res.json(dados);
});

// Rota para adicionar ganho
app.post("/api/dados", (req, res) => {
  const dados = carregarDados();
  const { nome, ganho } = req.body;

  const hoje = new Date();
  const mesAno = `${hoje.getMonth() + 1}-${hoje.getFullYear()}`;

  // Procura personagem com mesmo nome e mesAno
  let personagem = dados.find(p => p.nome === nome && p.mesAno === mesAno);

  if (!personagem) {
    personagem = { nome, mesAno, ganhos: [] };
    dados.push(personagem);
  }

  personagem.ganhos.push({
    data: hoje.toISOString().split("T")[0],
    ganho,
  });

  salvarDados(dados);
  res.json({ status: "ok" });
});

// Rota para calcular e retornar resultados com filtro por mês (corrigido para timezone)
app.get("/api/resultado", (req, res) => {
  const dados = carregarDados();
  const hoje = new Date();
  const mesAno = `${hoje.getMonth() + 1}-${hoje.getFullYear()}`;
  const filtrados = dados.filter(p => p.mesAno === mesAno);

  let totalMensal = 0;
  let totalPool5 = 0;
  let totalPool10 = 0;
  let totalSeu = 0;

  let resultadoPorPersonagem = [];

  filtrados.forEach(p => {
    let total = 0;
    let pool5 = 0;
    let pool10 = 0;
    let seu = 0;

    p.ganhos.forEach(g => {
      const [year, month, day] = g.data.split("-").map(Number);
      const dataUTC = new Date(Date.UTC(year, month - 1, day));
      const diaSemana = dataUTC.getUTCDay(); // 0=Domingo, 6=Sábado

      if (diaSemana >= 1 && diaSemana <= 5) {
        // Segunda a sexta
        pool5 += g.ganho * 0.05;
        pool10 += g.ganho * 0.10;
        seu += g.ganho * 0.85;
        total += g.ganho;
      } else {
        // Sábado e domingo
        // Pools 0%
        seu += g.ganho * 1.00; // 100%
        total += g.ganho;
      }
    });

    totalMensal += total;
    totalPool5 += pool5;
    totalPool10 += pool10;
    totalSeu += seu;

    resultadoPorPersonagem.push({
      nome: p.nome,
      totalMensal: total,
      pool5,
      pool10,
      seu,
    });
  });

  res.json({
    totalMensal,
    totalPool5,
    totalPool10,
    totalSeu,
    resultadoPorPersonagem,
  });
});

// Remover personagem (todos ganhos do personagem no mês atual)
app.delete("/api/personagem/:nome", (req, res) => {
  const nome = req.params.nome;
  const dados = carregarDados();
  const hoje = new Date();
  const mesAno = `${hoje.getMonth() + 1}-${hoje.getFullYear()}`;

  const novosDados = dados.filter(p => !(p.nome === nome && p.mesAno === mesAno));

  salvarDados(novosDados);
  res.json({ status: "personagem removido" });
});

// Remover ganho (passa nome e data no body)
app.delete("/api/ganho", (req, res) => {
  const { nome, data } = req.body;
  const dados = carregarDados();
  const hoje = new Date();
  const mesAno = `${hoje.getMonth() + 1}-${hoje.getFullYear()}`;

  let personagem = dados.find(p => p.nome === nome && p.mesAno === mesAno);
  if (!personagem) return res.status(404).json({ error: "Personagem não encontrado" });

  personagem.ganhos = personagem.ganhos.filter(g => g.data !== data);

  // Se ficar sem ganhos, remove personagem
  if (personagem.ganhos.length === 0) {
    const index = dados.indexOf(personagem);
    dados.splice(index, 1);
  }

  salvarDados(dados);
  res.json({ status: "ganho removido" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
