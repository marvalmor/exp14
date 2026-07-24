const portada = document.getElementById("portada");
const seccionExpedientes = document.getElementById("seccionExpedientes");
const btnIniciar = document.getElementById("iniciar");

btnIniciar.addEventListener("click", function() {
  portada.classList.add("oculto");
  seccionExpedientes.classList.remove("oculto");

  setTimeout(function() {
    seccionExpedientes.classList.add("mostrar");
  }, 50);
});

const expedientes = [
  { numero: 1,  fecha: "2026-07-23" },
  { numero: 2,  fecha: "2026-07-24" },
  { numero: 3,  fecha: "2026-07-25" },
  { numero: 4,  fecha: "2026-07-26" },
  { numero: 5,  fecha: "2026-07-27" },
  { numero: 6,  fecha: "2026-07-28" },
  { numero: 7,  fecha: "2026-07-29" },
  { numero: 8,  fecha: "2026-07-30" },
  { numero: 9,  fecha: "2026-07-31" },
  { numero: 10, fecha: "2026-08-01" },
  { numero: 11, fecha: "2026-08-02" },
  { numero: 12, fecha: "2026-08-03" },
  { numero: 13, fecha: "2026-08-04" },
  { numero: 14, fecha: "2026-08-05" },
  { numero: 15, fecha: "2026-08-06" }
];

async function fechaDeHoy() {
  try {
    const respuesta = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=Europe/Paris");
    const datos = await respuesta.json();
    return `${datos.year}-${String(datos.month).padStart(2, "0")}-${String(datos.day).padStart(2, "0")}`;
  } catch (error) {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  }
}

async function estaDesbloqueado(fechaExpediente) {
  const hoy = await fechaDeHoy();
  return hoy >= fechaExpediente;; // 👈 recuerda revertir a "return hoy >= fechaExpediente;" antes del 23
}

// --- Progreso guardado en el navegador ---
function marcarCompletado(numero) {
  localStorage.setItem(`exp_${numero}_completado`, "true");
}

function estaCompletado(numero) {
  return localStorage.getItem(`exp_${numero}_completado`) === "true";
}

// --- Función de cifrado/descifrado César ---
function cesar(texto, desplazamiento) {
  return texto.replace(/[a-zA-ZñÑ]/g, function (c) {
    const esMayus = c === c.toUpperCase();
    const base = esMayus ? 65 : 97;
    let codigo = c.charCodeAt(0) - base;
    codigo = (codigo + desplazamiento + 26) % 26;
    return String.fromCharCode(codigo + base);
  });
}

// --- Lógica del puzzle (recorte automático via canvas) ---
let piezaSeleccionada = null;

function generarPuzzle(numero, tamano, imagenSrc) {
  const crop = { top: 20, bottom: 100, left: 5, right: 95 };

  const total = tamano * tamano;
  let posiciones = Array.from({ length: total }, (_, i) => i);

  for (let i = posiciones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [posiciones[i], posiciones[j]] = [posiciones[j], posiciones[i]];
  }

  modalReto.innerHTML = `
    <div id="puzzleGrid" style="display:grid; grid-template-columns:repeat(${tamano}, 1fr); gap:2px; max-width:320px; margin:15px auto;"></div>
    <p class="pista" id="puzzleEstado">Ordena la imagen haciendo clic en dos piezas para intercambiarlas.</p>
  `;

  const grid = document.getElementById("puzzleGrid");
  const img = new Image();

  img.onload = function () {
    const cropX = img.naturalWidth * (crop.left / 100);
    const cropY = img.naturalHeight * (crop.top / 100);
    const cropW = img.naturalWidth * ((crop.right - crop.left) / 100);
    const cropH = img.naturalHeight * ((crop.bottom - crop.top) / 100);
    const pieceW = cropW / tamano;
    const pieceH = cropH / tamano;

    posiciones.forEach((posOriginal) => {
      const fila = Math.floor(posOriginal / tamano);
      const columna = posOriginal % tamano;

      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        cropX + columna * pieceW, cropY + fila * pieceH, pieceW, pieceH,
        0, 0, 200, 200
      );

      const pieza = document.createElement("div");
      pieza.classList.add("pieza-puzzle");
      pieza.dataset.posOriginal = posOriginal;
      pieza.style.backgroundImage = `url(${canvas.toDataURL()})`;
      pieza.style.backgroundSize = "cover";

      pieza.addEventListener("click", () => manejarClicPieza(pieza, numero, tamano));
      grid.appendChild(pieza);
    });
  };

  img.src = imagenSrc;
}

function manejarClicPieza(pieza, numero, tamano) {
  if (!piezaSeleccionada) {
    piezaSeleccionada = pieza;
    pieza.classList.add("pieza-activa");
    return;
  }

  if (piezaSeleccionada === pieza) {
    pieza.classList.remove("pieza-activa");
    piezaSeleccionada = null;
    return;
  }

  const tempImg = pieza.style.backgroundImage;
  const tempOriginal = pieza.dataset.posOriginal;

  pieza.style.backgroundImage = piezaSeleccionada.style.backgroundImage;
  pieza.dataset.posOriginal = piezaSeleccionada.dataset.posOriginal;

  piezaSeleccionada.style.backgroundImage = tempImg;
  piezaSeleccionada.dataset.posOriginal = tempOriginal;

  piezaSeleccionada.classList.remove("pieza-activa");
  piezaSeleccionada = null;

  verificarPuzzleCompleto(numero, tamano);
}

function verificarPuzzleCompleto(numero, tamano) {
  const piezas = document.querySelectorAll(".pieza-puzzle");
  const completo = Array.from(piezas).every((p, i) => parseInt(p.dataset.posOriginal, 10) === i);

  if (completo) {
    const data = contenidoExpedientes[numero];
    document.getElementById("puzzleEstado").textContent = "¡Imagen reconstruida!";
    modalRecompensa.style.whiteSpace = "pre-line";
    modalRecompensa.style.textAlign = "left";
    modalRecompensa.textContent = data.recompensa;
    modalRecompensa.classList.remove("oculto");
    marcarCompletado(numero);
    actualizarEstadoCasilla(numero);
  }
}

// --- Lógica del tablero de ajedrez ---
function generarTablero(matriz) {
  let html = '<div class="tablero-ajedrez">';
  matriz.forEach((fila, i) => {
    fila.forEach((pieza, j) => {
      const clase = (i + j) % 2 === 0 ? "casilla-clara" : "casilla-oscura";
      html += `<div class="casilla ${clase}">${pieza}</div>`;
    });
  });
  html += '</div>';
  return html;
}

// --- Contenido de cada expediente ---
const contenidoExpedientes = {
  1: {
    titulo: "EXPEDIENTE 01 — La primera pista",
    evidencia: "ARCHIVO 01. Tipo: mensaje cifrado. Estado: parcialmente corrupto.",
    tipoReto: "cesar",
    cifrado: "ef sljhlvj le fsavkf",
    pista: "El desplazamiento coincide con el día del mes en que el objeto fue registrado por primera vez.",
    respuestaEsperada: "no busques un objeto",
    recompensa: "INFORME PRELIMINAR\n\nLa primera pista contradice la hipótesis inicial. El objetivo de búsqueda podría no ser un objeto convencional.\n\nSe recomienda continuar recopilando evidencia antes de establecer conclusiones.\n\nHipótesis actual: el objeto podría no ser físico.\nNivel de confianza: bajo"
  },
  2: {
    titulo: "EXPEDIENTE 02 — La memoria visual",
    evidencia: "ARCHIVO 02. Tipo: registro fotográfico. Estado: fragmentado.",
    tipoReto: "puzzle",
    preguntaNumerica: "ARCHIVO 02-B: Sistema de ecuaciones parcialmente recuperado.\n\n2x + 3y − z = 41\nx − 4y + 2z = −7\n5x + y + z = 38\n\nProcedimiento de validación:\n1. Resuelve el sistema para obtener los valores de x, y, z.\n2. Conserva los resultados únicamente para verificar que el sistema es consistente.\n3. El código solicitado corresponde al número de incógnitas utilizadas en la resolución.",
    respuestaNumerica: 3,
    imagen: "media/evidencia_2.jpg",
    recompensa: "EVIDENCIA RECUPERADA\n\nUbicación identificada. Este lugar contiene un fragmento relacionado con el objeto perdido.\n\nLa naturaleza del objeto continúa sin determinar.\n\nHipótesis actual: el objeto existe, pero su composición sigue sin determinar.\nNivel de confianza: bajo-medio"
  },
  3: {
    titulo: "EXPEDIENTE 03 — La partida imposible",
    evidencia: "ARCHIVO 03. Tipo: registro estratégico. Estado: en análisis.",
    tipoReto: "ajedrez",
    partida: "1. e4 e5\n2. Bc4 Nc6\n3. Qh5 Nf6??",
    tablero: [
      ["♜","","♝","♛","♚","♝","","♜"],
      ["♟","♟","♟","♟","","♟","♟","♟"],
      ["","","♞","","","♞","",""],
      ["","","","","♟","","","♕"],
      ["","","♗","","♙","","",""],
      ["","","","","","","",""],
      ["♙","♙","♙","♙","","♙","♙","♙"],
      ["♖","♘","♗","","♔","","♘","♖"]
    ],
    pista: "El mate se logra capturando una pieza, no moviendo a una casilla vacía. Formato del código: pieza-archivo-fila (ej. 17-8-7).",
    codigoEsperado: "17-6-7",
    recompensa: "ANÁLISIS ESTRATÉGICO\n\nEl registro muestra señales de haber sido manipulado por alguien con pensamiento no lineal. Se detectan múltiples intentos fallidos antes de cada acierto.\n\nConclusión preliminar: el sujeto no buscaba la respuesta rápida — buscaba la correcta.\n\nHipótesis actual: el objeto podría estar relacionado con un patrón de pensamiento, no con un lugar físico.\nNivel de confianza: medio"
  },
  4: {
    titulo: "EXPEDIENTE 04 — El mensaje oculto",
    evidencia: "ARCHIVO 04. Tipo: registro verbal. Estado: incompleto.",
    tipoReto: "adivinanza",
    enunciado: "Una vieja larga y seca,\nque le escurre la manteca.\n\n¿Qué es?",
    pista: "No es lo que tu mente maliciosa está pensando. Piensa en algo que se derrite lentamente.",
    respuestaEsperada: "vela",
    recompensa: "REGISTRO VERBAL ANALIZADO\n\nLa frase no contenía información cifrada, sino una estructura de doble lectura. El significado real no estaba oculto — estaba disfrazado de otra cosa, esperando a que alguien mirara más allá de la primera interpretación.\n\nSe empieza a sospechar que el objeto perdido comparte esa misma característica.\n\nHipótesis actual: lo que se busca podría estar a la vista todo este tiempo, disfrazado de algo cotidiano.\nNivel de confianza: medio-alto"
  },
  5: {
    titulo: "EXPEDIENTE 05 — Frecuencia perdida",
    evidencia: "ARCHIVO 05. Tipo: esquema técnico. Estado: con anomalía.",
    tipoReto: "circuito",
    diagrama: "CIRCUITO RECUPERADO (orden de conexión, de positivo a negativo):\n\nFuente 9V (+) → Resistencia 220Ω → LED: cátodo → ánodo → Fuente 9V (−)",
    opciones: [
      "La resistencia es demasiado baja y quemará el LED",
      "El LED está conectado con la polaridad invertida",
      "Falta un capacitor de filtrado",
      "La fuente de 9V es insuficiente para encender el LED"
    ],
    respuestaCorrecta: 1,
    recompensa: "CORRECCIÓN DETECTADA\n\nEl esquema fue corregido por un tercero no identificado antes de ser archivado. La corrección no buscaba que \"funcionara\" — buscaba que funcionara bien.\n\nDistinción relevante para el perfil del sujeto.\n\nHipótesis actual: quien diseñó estos archivos no se conforma con lo mínimo — revisa, corrige, perfecciona.\nNivel de confianza: medio-alto"
  },

  6: {
    titulo: "EXPEDIENTE 06 — La ecuación",
    evidencia: "ARCHIVO 06. Tipo: registro numérico. Estado: encadenado.",
    tipoReto: "cadena",
    pista: "El lugar donde ocurrió todo esto tenía dados y cartas por todas partes. Sigue la cadena con cuidado: cada resultado abre el siguiente paso.",
    pasos: [
      { enunciado: "PASO 1:\n\nUn dado estándar tiene 6 caras. Multiplícalo por el número de palos en una baraja española de cartas (4).", respuesta: 24 },
      { enunciado: "PASO 2:\n\nSuma el resultado anterior a la cantidad de cartas que se reparten a cada jugador al inicio de una partida de UNO (7).", respuesta: 31 }
    ],
    recompensa: "CADENA NUMÉRICA RESUELTA\n\nLos cálculos no eran aleatorios — dependían unos de otros. Como si nada de lo registrado existiera por separado.\n\nHipótesis actual: los eventos registrados parecen conectados entre sí, no aislados.\nNivel de confianza: alto"
  },

  7: {
    titulo: "EXPEDIENTE 07 — Archivo corrupto",
    evidencia: "ARCHIVO 07. Tipo: imagen. Estado: con mensaje oculto.",
    tipoReto: "estegano",
    mensajeOculto: "objeto o sujeto, aun sin resolver",
    recompensa: "MENSAJE OCULTO EXTRAÍDO\n\nEl archivo no estaba dañado — estaba diseñado para pasar desapercibido. La información nunca dejó de estar ahí, solo esperaba el ajuste correcto para hacerse visible.\n\nHipótesis actual: el objeto —o el sujeto, según qué archivo se consulte— parece originarse en la misma fuente."
  }
};

// --- Referencias del modal ---
const modalOverlay = document.getElementById("modalOverlay");
const modalTitulo = document.getElementById("modalTitulo");
const modalEvidencia = document.getElementById("modalEvidencia");
const modalReto = document.getElementById("modalReto");
const modalRecompensa = document.getElementById("modalRecompensa");
const cerrarModal = document.getElementById("cerrarModal");

function abrirExpediente(numero) {
  const data = contenidoExpedientes[numero];
  if (!data) return;

  modalTitulo.textContent = data.titulo;
  modalEvidencia.textContent = data.evidencia;
  modalRecompensa.classList.add("oculto");
  modalRecompensa.textContent = "";

  if (estaCompletado(numero)) {
    modalReto.innerHTML = `<p class="pista">Ya recuperaste este fragmento.</p>`;
    modalRecompensa.style.whiteSpace = "pre-line";
    modalRecompensa.style.textAlign = "left";
    modalRecompensa.textContent = data.recompensa;
    modalRecompensa.classList.remove("oculto");
    modalOverlay.classList.remove("oculto");
    return;
  }

  if (data.tipoReto === "cesar") {
    modalReto.innerHTML = `
      <p class="cifrado">${data.cifrado}</p>
      <p class="pista">Pista: ${data.pista}</p>
      <input type="number" id="inputDesplazamiento" placeholder="Número de desplazamiento">
      <button id="btnDescifrar">Descifrar</button>
      <p class="error" id="errorReto"></p>
    `;

    document.getElementById("btnDescifrar").addEventListener("click", function () {
      const desplazamiento = parseInt(document.getElementById("inputDesplazamiento").value, 10);
      if (isNaN(desplazamiento)) return;

      const resultado = cesar(data.cifrado, -desplazamiento).toLowerCase();

      if (resultado.trim() === data.respuestaEsperada.trim()) {
        modalReto.innerHTML = `<p class="cifrado">${resultado}</p>`;
        modalRecompensa.style.whiteSpace = "pre-line";
        modalRecompensa.style.textAlign = "left";
        modalRecompensa.textContent = data.recompensa;
        modalRecompensa.classList.remove("oculto");
        marcarCompletado(numero);
        actualizarEstadoCasilla(numero);
      } else {
        document.getElementById("errorReto").textContent = "Desplazamiento incorrecto. Intenta de nuevo.";
      }
    });

  } else if (data.tipoReto === "puzzle") {
    modalReto.innerHTML = `
      <p class="cifrado" style="white-space: pre-line; text-align:left;">${data.preguntaNumerica}</p>
      <input type="number" step="1" id="inputPuzzle" placeholder="Tu respuesta">
      <button id="btnResolverPuzzle">Confirmar</button>
      <p class="error" id="errorPuzzle"></p>
    `;

    document.getElementById("btnResolverPuzzle").addEventListener("click", function () {
      const valorInput = document.getElementById("inputPuzzle").value;

      if (valorInput.trim() === "") return;

      if (!Number.isInteger(Number(valorInput)) || valorInput.includes(".")) {
        document.getElementById("errorPuzzle").textContent = "La respuesta debe ser un número entero.";
        return;
      }

      const respuesta = parseInt(valorInput, 10);

      if (respuesta === data.respuestaNumerica) {
        generarPuzzle(numero, respuesta, data.imagen);
      } else if (Math.abs(respuesta - data.respuestaNumerica) === 1) {
        document.getElementById("errorPuzzle").innerHTML = `
          Cerca...<br><br>
          <em>Registro del investigador 01: "Intenté resolver el sistema completo. Los números no llevaban a ningún lado. Revisar interpretación del problema."</em>
        `;
      } else {
        document.getElementById("errorPuzzle").textContent = "Respuesta incorrecta. Intenta de nuevo.";
      }
    });

  } else if (data.tipoReto === "ajedrez") {
    modalReto.innerHTML = `
      <p class="cifrado" style="white-space: pre-line; text-align:left;">${data.partida}</p>
      ${generarTablero(data.tablero)}
      <p class="pista">${data.pista}</p>
      <input type="text" id="inputAjedrez" placeholder="Código (ej. 17-8-7)">
      <button id="btnResolverAjedrez">Confirmar</button>
      <p class="error" id="errorAjedrez"></p>
    `;

    document.getElementById("btnResolverAjedrez").addEventListener("click", function () {
      const valorInput = document.getElementById("inputAjedrez").value.trim().replace(/\s+/g, "");

      if (valorInput === "") return;

      if (valorInput === data.codigoEsperado) {
        modalRecompensa.style.whiteSpace = "pre-line";
        modalRecompensa.style.textAlign = "left";
        modalRecompensa.textContent = data.recompensa;
        modalRecompensa.classList.remove("oculto");
        marcarCompletado(numero);
        actualizarEstadoCasilla(numero);
      } else {
        document.getElementById("errorAjedrez").textContent = "Código incorrecto. Revisa la jugada.";
      }
    });

  } else if (data.tipoReto === "adivinanza") {
    modalReto.innerHTML = `
      <p class="cifrado" style="white-space: pre-line; text-align:left;">${data.enunciado}</p>
      <p class="pista">${data.pista}</p>
      <input type="text" id="inputAdivinanza" placeholder="Tu respuesta">
      <button id="btnResolverAdivinanza">Confirmar</button>
      <p class="error" id="errorAdivinanza"></p>
    `;

    document.getElementById("btnResolverAdivinanza").addEventListener("click", function () {
      const valorInput = document.getElementById("inputAdivinanza").value
        .trim()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (valorInput === "") return;

      if (valorInput === data.respuestaEsperada) {
        modalReto.innerHTML = `<p class="cifrado" style="white-space:pre-line; text-align:left;">${data.enunciado}</p>`;
        modalRecompensa.style.whiteSpace = "pre-line";
        modalRecompensa.style.textAlign = "left";
        modalRecompensa.textContent = data.recompensa;
        modalRecompensa.classList.remove("oculto");
        marcarCompletado(numero);
        actualizarEstadoCasilla(numero);
      } else {
        document.getElementById("errorAdivinanza").textContent = "No es correcto. Intenta de nuevo.";
      }
    });

  } else if (data.tipoReto === "circuito") {
    let botonesHTML = "";
    data.opciones.forEach((opcion, index) => {
      botonesHTML += `<button class="opcion-circuito" data-index="${index}">${opcion}</button>`;
    });

    modalReto.innerHTML = `
      <p class="cifrado" style="white-space: pre-line; text-align:left;">${data.diagrama}</p>
      <div class="opciones-circuito">${botonesHTML}</div>
      <p class="error" id="errorCircuito"></p>
    `;

    document.querySelectorAll(".opcion-circuito").forEach((boton) => {
      boton.addEventListener("click", function () {
        const indexSeleccionado = parseInt(this.dataset.index, 10);
        if (indexSeleccionado === data.respuestaCorrecta) {
          modalReto.innerHTML = `
            <p class="cifrado" style="white-space:pre-line; text-align:left;">${data.diagrama}</p>
            <p class="pista">✔ ${data.opciones[indexSeleccionado]}</p>
          `;
          modalRecompensa.style.whiteSpace = "pre-line";
          modalRecompensa.style.textAlign = "left";
          modalRecompensa.textContent = data.recompensa;
          modalRecompensa.classList.remove("oculto");
          marcarCompletado(numero);
          actualizarEstadoCasilla(numero);
        } else {
          document.getElementById("errorCircuito").textContent = "Esa no es la falla. Revisa el esquema de nuevo.";
        }
      });
    });
  } else if (data.tipoReto === "cadena") {
    let pasoActual = 0;

    function mostrarPaso() {
      const paso = data.pasos[pasoActual];
      modalReto.innerHTML = `
        <p class="cifrado" style="white-space: pre-line; text-align:left;">${paso.enunciado}</p>
        <p class="pista">${data.pista}</p>
        <input type="number" id="inputCadena" placeholder="Resultado">
        <button id="btnConfirmarCadena">Confirmar</button>
        <p class="error" id="errorCadena"></p>
      `;

      document.getElementById("btnConfirmarCadena").addEventListener("click", function () {
        const valorInput = document.getElementById("inputCadena").value;
        if (valorInput.trim() === "") return;

        const respuesta = parseInt(valorInput, 10);

        if (respuesta === paso.respuesta) {
          pasoActual++;
          if (pasoActual < data.pasos.length) {
            mostrarPaso();
          } else {
            modalReto.innerHTML = `<p class="pista">Cadena completa.</p>`;
            modalRecompensa.style.whiteSpace = "pre-line";
            modalRecompensa.style.textAlign = "left";
            modalRecompensa.textContent = data.recompensa;
            modalRecompensa.classList.remove("oculto");
            marcarCompletado(numero);
            actualizarEstadoCasilla(numero);
          }
        } else {
          document.getElementById("errorCadena").textContent = "Ese no es el resultado correcto para este paso.";
        }
      });
    }

    mostrarPaso();
  } else if (data.tipoReto === "estegano") {
    modalReto.innerHTML = `
      <div id="cajaEstegano">
        <p id="mensajeEstegano">${data.mensajeOculto}</p>
      </div>
      <label class="pista" for="sliderContraste">Ajusta el contraste:</label>
      <input type="range" id="sliderContraste" min="0" max="100" value="0">
      <input type="text" id="inputEstegano" placeholder="Escribe el mensaje que leas">
      <button id="btnConfirmarEstegano">Confirmar</button>
      <p class="error" id="errorEstegano"></p>
    `;

    const slider = document.getElementById("sliderContraste");
    const mensaje = document.getElementById("mensajeEstegano");

    slider.addEventListener("input", function () {
      const nivel = slider.value;
      // el color del texto va de casi igual al fondo (#0a0a0a) hasta blanco (#fff)
      const intensidad = Math.round((nivel / 100) * 255);
      mensaje.style.color = `rgb(${intensidad}, ${intensidad}, ${intensidad})`;
    });

    document.getElementById("btnConfirmarEstegano").addEventListener("click", function () {
      const valorInput = document.getElementById("inputEstegano").value
        .trim()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const esperado = data.mensajeOculto
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (valorInput === "") return;

      if (valorInput === esperado) {
        modalReto.innerHTML = `<p class="cifrado">${data.mensajeOculto}</p>`;
        modalRecompensa.style.whiteSpace = "pre-line";
        modalRecompensa.style.textAlign = "left";
        modalRecompensa.textContent = data.recompensa;
        modalRecompensa.classList.remove("oculto");
        marcarCompletado(numero);
        actualizarEstadoCasilla(numero);
      } else {
        document.getElementById("errorEstegano").textContent = "El mensaje no coincide. Sigue ajustando el contraste.";
      }
    });
  }

  modalOverlay.classList.remove("oculto");
}

cerrarModal.addEventListener("click", function () {
  modalOverlay.classList.add("oculto");
});

function actualizarEstadoCasilla(numero) {
  const casilla = document.querySelector(`.expediente[data-numero="${numero}"]`);
  if (casilla) {
    casilla.classList.add("completado");
  }
}

async function construirPagina() {
  const contenedor = document.getElementById("contenedor");

  for (const exp of expedientes) {
    const desbloqueado = await estaDesbloqueado(exp.fecha);

    const casilla = document.createElement("div");
    casilla.classList.add("expediente");
    casilla.dataset.numero = exp.numero;

    if (desbloqueado) {
      casilla.classList.add("desbloqueado");
      casilla.textContent = estaCompletado(exp.numero)
        ? `✅ EXPEDIENTE ${exp.numero}`
        : `EXPEDIENTE ${exp.numero}`;
      if (estaCompletado(exp.numero)) casilla.classList.add("completado");
      casilla.addEventListener("click", () => abrirExpediente(exp.numero));
    } else {
      casilla.classList.add("bloqueado");
      casilla.textContent = `🔒 EXPEDIENTE ${exp.numero}`;
    }

    contenedor.appendChild(casilla);
  }
}

construirPagina();