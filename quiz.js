document.addEventListener("DOMContentLoaded", () => {

  const beepSound = document.getElementById("beep-sound");

  /* ================= STORAGE ================= */

  const teamScores = JSON.parse(localStorage.getItem("teamScores")) || {
    verde: 0, vermelha: 0, amarela: 0, azul: 0
  };

  const teamAjudas = JSON.parse(localStorage.getItem("teamAjudas")) || {
    verde: [], vermelha: [], amarela: [], azul: []
  };

  const teamPerguntas = JSON.parse(localStorage.getItem("teamPerguntas")) || {
    verde: {}, vermelha: {}, amarela: {}, azul: {}
  };
const perguntasUsadasGlobal = JSON.parse(
  localStorage.getItem("perguntasUsadasGlobal")
) || {
  seguranca: [],
  qualidade: [],
  meio_ambiente: []
};


  /* ================= ESTADO ================= */

  let currentTeam = "";
  let currentTheme = "";
  let currentQuestionIndex = -1;

  let tempoRestante = 20;
  let timer = null;
  let timerPausado = false;

// CONTROLE DAS RODADAS
let rodada = 1;
let perguntasRespondidas = 0;
let perguntasMataMata = 0;

let equipesEmpatadas = [];
let equipesMataMataAtual = [];
let perguntasUsadasMataMata = {
  seguranca: [],
  qualidade: [],
  meio_ambiente: []
};
let equipesMataMata = 0;
let cicloMataMata = [];

const LIMITE_RODADA_1 = 40;
const LIMITE_RODADA_2 = 3;

let perguntasDesempate = 0;
let jogoEncerrado = false;

function atualizarContadorRodada() {
  const contador =
    document.getElementById("contador-rodada");

  if (!contador) return;

const titulo =
  document.getElementById("titulo-rodada");

if (titulo) {

  if (rodada === 1) {
    titulo.textContent = "Rodada 1";
  } else if (rodada === 2) {
    titulo.textContent = "Rodada 2 - Desempate";
  }

else {
	titulo.textContent =
	"Rodada 3 - Mata-Mata";
}
}
    if (rodada === 1) {

  contador.textContent =
    `${perguntasRespondidas} / ${LIMITE_RODADA_1} perguntas`;

} else if (rodada === 2) {

  contador.textContent =
    `${perguntasRespondidas} / ${
      equipesEmpatadas.length * LIMITE_RODADA_2
    } perguntas (Desempate)`;

} else {

  contador.textContent =
    `${perguntasMataMata} perguntas (Mata-Mata)`;

}

  if (perguntasRespondidas >= LIMITE_RODADA_1) {

  const ranking = Object.entries(teamScores)
    .sort((a, b) => b[1] - a[1]);

  const maiorPontuacao = ranking[0][1];

  equipesEmpatadas = ranking
    .filter(t => t[1] === maiorPontuacao)
    .map(t => t[0]);

  if (equipesEmpatadas.length === 1) {

    alert(
      `🏆 VENCEDOR: ${equipesEmpatadas[0].toUpperCase()}`
    );

    jogoEncerrado = true;

  } else {

    rodada = 2;
    perguntasRespondidas = 0;

    alert(
      `⚖️ Empate entre ${equipesEmpatadas.join(", ")}.\nIniciando rodada de desempate.`
    );
}
  }
}
  /* ================= TIMER ================= */

  function iniciarTimer() {
    clearInterval(timer);
    tempoRestante = 20;
    timerPausado = false;
    atualizarTimer();

    timer = setInterval(() => {
      if (timerPausado) return;

      tempoRestante--;
      atualizarTimer();

      if (tempoRestante <= 5 && tempoRestante > 0 && beepSound) {
        beepSound.currentTime = 0;
        beepSound.play();
      }

      if (tempoRestante <= 0) {
        clearInterval(timer);
        bloquearPorTempo();
      }
    }, 1000);
  }

  function atualizarTimer() {
    const el = document.getElementById("timer");
    if (el) el.textContent = `⏱️ Tempo: ${tempoRestante}s`;
  }

  function pausarTimer() { timerPausado = true; }
  function retomarTimer() { timerPausado = false; }

  function bloquearPorTempo() {
    document.querySelectorAll(".option").forEach(b => b.disabled = true);
    alert("⏱️ Tempo esgotado! A equipe perdeu a vez.");
    document.getElementById("next-btn").style.display = "inline-block";
  }

  /* ================= RANKING ================= */

  function updateRanking() {

  const list =
    document.getElementById("ranking-list");

  list.innerHTML = "";

  const ranking = Object.entries(teamScores)
    .sort((a, b) => b[1] - a[1]);

  ranking.forEach(([team, pts], index) => {

    const li =
      document.createElement("li");

   if (index === 0 && pts > 0) {

      li.innerHTML =
        `🏆 <strong>Equipe ${team.toUpperCase()}: ${pts} ponto(s)</strong>`;

      li.style.color = "#d4af37";
      li.style.fontWeight = "bold";

    }
   else if (index === 1 && ranking[0][1] > 0) {

      li.innerHTML =
        `🥈 Equipe ${team.toUpperCase()}: ${pts} ponto(s)`;

    }
    else if (index === 2 && ranking[0][1] > 0) {

      li.innerHTML =
        `🥉 Equipe ${team.toUpperCase()}: ${pts} ponto(s)`;

    }
    else {

      li.innerHTML =
        `Equipe ${team.toUpperCase()}: ${pts} ponto(s)`;

    }

    list.appendChild(li);

  });

}

  /* ================= AJUDAS ================= */

  function toggleAjudas() {
    const usadas = teamAjudas[currentTeam] || [];
    ["cartas", "time", "pular"].forEach(tipo => {
      const btn = document.getElementById("ajuda-" + tipo);
      if (btn) btn.style.display = usadas.includes(tipo) ? "none" : "inline-block";
    });
  }

  function usarAjuda(tipo) {
    if (teamAjudas[currentTeam].includes(tipo)) return;

    teamAjudas[currentTeam].push(tipo);
    localStorage.setItem("teamAjudas", JSON.stringify(teamAjudas));
    toggleAjudas();

    pausarTimer();

   if (tipo === "cartas") {

  document.getElementById("card-choices").style.display = "block";

}
   
    else if (tipo === "time") {
      alert("🤝 Ajuda do time: discutam juntos!");
    }
    else if (tipo === "pular") {

  alert("⏭️ Pergunta pulada.");

  returnToStart();

}
  }

  /* ================= QUIZ ================= */

  function showQuestion() {


  let usadas;

if (rodada === 3) {

  usadas =
    perguntasUsadasMataMata[currentTheme] || [];

} else {

  usadas =
    perguntasUsadasGlobal[currentTheme] || [];

}

const disponiveis = perguntas[currentTheme]
  .map((_, i) => i)
  .filter(i => !usadas.includes(i));

    if (disponiveis.length === 0) {
      alert("Todas as perguntas desse tema foram respondidas.");
      returnToStart();
      return;
    }

  currentQuestionIndex = disponiveis[Math.floor(Math.random() * disponiveis.length)];

console.log(
  "PERGUNTA:",
  currentTheme,
  currentQuestionIndex
);

const q = perguntas[currentTheme][currentQuestionIndex];

    const container = document.getElementById("question-container");

container.style.display = "block";
container.style.visibility = "visible";

container.innerHTML = `<h2 style="color:black;">
${q.q}
</h2>
`;

    q.a.forEach((alt, i) => {

  const btn = document.createElement("button");

  btn.className = "option";
  btn.textContent = alt;

  btn.onclick = () => {

 if (
  rodada === 2 &&
  !equipesEmpatadas.includes(currentTeam)
) {

  alert("⛔ Esta equipe não participa desta rodada.");
  return;

}
/*
if (
  rodada === 3 &&
  equipesMataMataAtual.length > 0 &&
  !equipesMataMataAtual.includes(currentTeam)
) {

  alert("⛔ Esta equipe não participa desta rodada.");
  return;

}
*/
  currentTeam =
    document.getElementById("team-select").value;


    clearInterval(timer);

    document.querySelectorAll(".option")
      .forEach(b => b.disabled = true);

    if (i === q.c) {

      btn.classList.add("correct");

      teamScores[currentTeam]++;

      localStorage.setItem(
        "teamScores",
        JSON.stringify(teamScores)
      );

      updateRanking();

    } else {

      btn.classList.add("incorrect");

    }

    document.getElementById("next-btn").style.display =
      "inline-block";

  };

container.appendChild(btn);
container.appendChild(document.createElement("br"));

});

    toggleAjudas();

document.getElementById("start-timer-btn")
  .style.display = "inline-block";
  }

function endQuestion() {
console.log(
  "ENDQUESTION",
  currentTeam,
  "RODADA",
  rodada,
"MATA",
perguntasMataMata
);


  if (rodada === 3) {

  perguntasUsadasMataMata[currentTheme]
    .push(currentQuestionIndex);

} else {

  perguntasUsadasGlobal[currentTheme]
    .push(currentQuestionIndex);

  localStorage.setItem(
    "perguntasUsadasGlobal",
    JSON.stringify(perguntasUsadasGlobal)
  );

}

localStorage.setItem(
  "perguntasUsadasGlobal",
  JSON.stringify(perguntasUsadasGlobal)
);

  perguntasRespondidas++;
if (
  rodada === 2 &&
  perguntasRespondidas >=
  (equipesEmpatadas.length * LIMITE_RODADA_2)
) {

  const ranking = Object.entries(teamScores)
    .sort((a, b) => b[1] - a[1]);

  const maiorPontuacao = ranking[0][1];

  const vencedores = ranking
    .filter(t => t[1] === maiorPontuacao);

  if (vencedores.length === 1) {

    alert(
      `🏆 CAMPEÃO: ${vencedores[0][0].toUpperCase()}`
);
mostrarCampeao(
  vencedores[0][0]
);


    jogoEncerrado = true;

  } else {

    rodada = 3;
perguntasMataMata = 0;
perguntasUsadasMataMata = {
  seguranca: [],
  qualidade: [],
  meio_ambiente: []
};

    equipesEmpatadas = vencedores
  .map(t => t[0]);

equipesMataMataAtual =
  [...equipesEmpatadas];
cicloMataMata =
  [...equipesEmpatadas];
equipesMataMata =
equipesEmpatadas.length;

console.log(
  "CICLO MATA-MATA:",
  cicloMataMata
);


equipesMataMata =
  equipesEmpatadas.length;
    alert(
  `🔥 Mata-Mata entre: ${equipesEmpatadas.join(", ")}`
);

atualizarContadorRodada();

returnToStart();
return;

  }

}
if (rodada === 3) {
console.log(
  "MATA-MATA INICIO:",
  perguntasMataMata
);
  perguntasMataMata++;
console.log(
  "CONTADOR:",
  perguntasMataMata,
  "/",
cicloMataMata.length,
"EMPATADAS:",
equipesEmpatadas.length
);
console.log(
  "EQUIPES:",
  equipesEmpatadas
);
 if (
  perguntasMataMata <
  cicloMataMata.length
)	{

    atualizarContadorRodada();
    returnToStart();
    return;

  }
perguntasMataMata = 0;

const ranking = Object.entries(teamScores)
  .sort((a, b) => b[1] - a[1]);

const maiorPontuacao = ranking[0][1];

const novosLideres = ranking
  .filter(t => t[1] === maiorPontuacao)
  .map(t => t[0]);
if (novosLideres.length === 1) {


   alert(
  `🏆 CAMPEÃO: ${novosLideres[0].toUpperCase()}`
);
mostrarCampeao(
novosLideres[0]
);
  jogoEncerrado = true;

  returnToStart();

  return;

}

 else {

 equipesEmpatadas = [...novosLideres];
equipesMataMataAtual = [...novosLideres];

cicloMataMata = [...novosLideres];

perguntasMataMata = 0;

alert(
  `🔥 Mata-Mata continua entre: ${equipesEmpatadas.join(", ")}`
);
}
}

atualizarContadorRodada();
returnToStart();

}
function mostrarCampeao(equipe) {

  const box =
    document.getElementById("campeao-box");

  const texto =
    document.getElementById("campeao-texto");

  if (!box || !texto) return;

  texto.textContent =
  `🥇 EQUIPE ${equipe.toUpperCase()}`;

  box.style.display = "block";

}

  function returnToStart() {
    clearInterval(timer);
    document.getElementById("quiz").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("card-choices").style.display = "none";
	document.getElementById("start-timer-btn")
	.style.display = "none";
  }

  /* ================= EVENTOS ================= */

document.querySelectorAll("[data-theme]").forEach(btn => {

  btn.onclick = () => {

    currentTeam =
      document.getElementById("team-select").value;

    currentTheme = btn.dataset.theme;

    if (!teamPerguntas[currentTeam][currentTheme]) {
      teamPerguntas[currentTeam][currentTheme] = [];
    }

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz").style.display = "block";

    showQuestion();

  };

});

  document.getElementById("next-btn").onclick = endQuestion;
document.getElementById("start-timer-btn")
  .onclick = () => {

    iniciarTimer();

    document.getElementById("start-timer-btn")
      .style.display = "none";

  };

  ["cartas", "time", "pular"].forEach(tipo => {
    const btn = document.getElementById("ajuda-" + tipo);
    if (btn) btn.onclick = () => usarAjuda(tipo);
  });

  document.querySelectorAll(".card-btn").forEach(btn => {
    btn.onclick = () => {
      const effect = parseInt(btn.dataset.effect);
      let removed = 0;

      document.querySelectorAll(".option").forEach((b, i) => {
        if (i !== perguntas[currentTheme][currentQuestionIndex].c && removed < effect) {
          b.style.display = "none";
          removed++;
        }
      });

      document.getElementById("card-choices").style.display = "none";
      retomarTimer();
    };
  });

  const resetBtn = document.getElementById("reset-scores");
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (!confirm("Zerar perguntas, ajudas e pontuação?")) return;
      localStorage.clear();
      alert("✅ Jogo zerado!");
      location.reload();
    };
  }

updateRanking();
atualizarContadorRodada();
});