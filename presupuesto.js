(() => {
  const endpoint = "https://script.google.com/macros/s/AKfycbwcK9dCB15BJZv9Ski0iWH_sr8ivmPhOeuojaPWAtAD7k3vi2IrFAkS4jjpKZ8kQiP7/exec";

  // ---------------------------
  // Funciones de parseo y formateo
  // ---------------------------
  function parseNumber(str) {
    if (!str) return 0;
    str = str.toString().trim();
    str = str.replace(/\./g, "");
    str = str.replace(",", ".");
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  }

  function formatNumber(num) {
    if (isNaN(num)) return num;
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ---------------------------
  // Premisas
  // ---------------------------
  function formatearPremisa(fila) {
    return fila.map((val, idx) => {
      if (idx === 0) return val;
      if (fila[0].toLowerCase().includes("inflación")) return val;
      return formatNumber(parseNumber(val));
    });
  }

  function actualizarTablaPremisas(idTabla, datos) {
    const tabla = document.getElementById(idTabla);
    const tbody = tabla.querySelector("tbody");
    tbody.innerHTML = "";
    datos.forEach((fila) => {
      const tr = document.createElement("tr");
      const filaFormateada = formatearPremisa(Object.values(fila));
      filaFormateada.forEach((celda) => {
        const td = document.createElement("td");
        td.textContent = celda;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  // ---------------------------
  // Presupuesto y Real
  // ---------------------------
  function actualizarTablaPresupuesto(datos) {
    const tabla = document.querySelector("#presupuesto-table tbody");
    tabla.innerHTML = "";
    datos.forEach((fila) => {
      const tr = document.createElement("tr");
      Object.values(fila).forEach((valor, idx) => {
        const td = document.createElement("td");
        td.textContent = idx === 0 ? valor : formatNumber(parseNumber(valor));
        tr.appendChild(td);
      });
      tabla.appendChild(tr);
    });
  }

  function actualizarTablaReal(datos) {
    const tabla = document.querySelector("#real-table tbody");
    tabla.innerHTML = "";
    datos.forEach((fila) => {
      const tr = document.createElement("tr");
      Object.values(fila).forEach((valor, idx) => {
        const td = document.createElement("td");
        td.textContent = idx === 0 ? valor : formatNumber(parseNumber(valor));
        tr.appendChild(td);
      });
      tabla.appendChild(tr);
    });
  }

  // ---------------------------
  // Cargar datos desde Google Sheet
  // ---------------------------
  async function cargarDatosDesdeGoogleSheet() {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      actualizarTablaPremisas("premisas-table", data.premisas);
      actualizarTablaPresupuesto(data.presupuesto);
      actualizarTablaReal(data.real);

      const diferenciaTable = document.querySelector("#diferencia-table tbody");
      diferenciaTable.innerHTML = "";
      if (data.presupuesto && data.real) {
        data.presupuesto.forEach(() => {
          const tr = document.createElement("tr");
          for (let i = 0; i <= 12; i++) {
            const td = document.createElement("td");
            tr.appendChild(td);
          }
          diferenciaTable.appendChild(tr);
        });
      }

      actualizarTotalesPresupuesto();
      actualizarTotalesReales();
      calcularDiferencias();
      crearGraficoTotalesMensuales();
      habilitarEdicionYActualizar("presupuesto-table");
      habilitarEdicionYActualizar("real-table");
    } catch (err) {
      console.error("Error cargando datos desde Google Sheet:", err);
    }
  }

  // ---------------------------
  // Inflación
  // ---------------------------
  function getInflacionMeses() {
    const inflacionFila = document.querySelector("#premisas-table tbody tr:first-child");
    const inflacionValores = [];
    for (let i = 1; i < inflacionFila.cells.length; i++) {
      let val = inflacionFila.cells[i].textContent.trim().replace("%", "");
      inflacionValores.push(parseNumber(val) / 100);
    }
    return inflacionValores;
  }

  // ---------------------------
  // Presupuesto (aplica inflación)
  // ---------------------------
  function calcularPresupuesto() {
    const filas = document.querySelectorAll("#presupuesto-table tbody tr");
    const inflacion = getInflacionMeses();
    filas.forEach((fila) => {
      const celdas = fila.cells;
      const valorBase = parseNumber(celdas[1].textContent);
      for (let mes = 1; mes <= 12; mes++) {
        let nuevoValor = valorBase * (1 + inflacion[mes - 1]);
        celdas[mes].textContent = formatNumber(nuevoValor);
      }
    });
    actualizarTotalesPresupuesto();
    calcularDiferencias();
    crearGraficoTotalesMensuales();
  }

  // ---------------------------
  // Totales
  // ---------------------------
  function actualizarTotalesPresupuesto() {
    const filas = document.querySelectorAll("#presupuesto-table tbody tr");
    filas.forEach((fila) => {
      let suma = 0;
      for (let j = 1; j <= 12; j++) suma += parseNumber(fila.cells[j].textContent);
      fila.cells[fila.cells.length - 1].textContent = formatNumber(suma);
    });
  }

  function actualizarTotalesReales() {
    const filas = document.querySelectorAll("#real-table tbody tr");
    filas.forEach((fila) => {
      let suma = 0;
      for (let j = 1; j <= 12; j++) suma += parseNumber(fila.cells[j].textContent);
      fila.cells[fila.cells.length - 1].textContent = formatNumber(suma);
    });
  }

  // ---------------------------
  // Diferencias
  // ---------------------------
  function calcularDiferencias() {
    const filasPresupuesto = document.querySelectorAll("#presupuesto-table tbody tr");
    const filasReal = document.querySelectorAll("#real-table tbody tr");
    const filasDif = document.querySelectorAll("#diferencia-table tbody tr");

    filasPresupuesto.forEach((filaPres, i) => {
      const filaReal = filasReal[i];
      const filaDif = filasDif[i];
      if (!filaReal || !filaDif) return;
      filaDif.cells[0].textContent = filaPres.cells[0].textContent;
      let suma = 0;
      for (let mes = 1; mes <= 12; mes++) {
        const valPres = parseNumber(filaPres.cells[mes].textContent);
        const valReal = parseNumber(filaReal.cells[mes].textContent);
        const dif = valPres - valReal;
        suma += dif;
        filaDif.cells[mes].textContent = formatNumber(dif);
        filaDif.cells[mes].style.backgroundColor = dif > 0 ? "#d0f0c0" : dif < 0 ? "#f8d7da" : "";
      }
      filaDif.cells[filaDif.cells.length - 1].textContent = formatNumber(suma);
      filaDif.cells[filaDif.cells.length - 1].style.backgroundColor = suma > 0 ? "#d0f0c0" : suma < 0 ? "#f8d7da" : "";
    });
  }

  // ---------------------------
  // Gráfico de barras (con diferencia positiva y colores condicionales)
  // ---------------------------
  let presupuestoVsRealChart;

  function crearGraficoTotalesMensuales() {
    const canvas = document.getElementById("presupuestoVsRealChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];

    const filasPresupuesto = document.querySelectorAll("#presupuesto-table tbody tr");
    const filasReal = document.querySelectorAll("#real-table tbody tr");

    const totalesPresupuesto = Array(12).fill(0);
    const totalesReal = Array(12).fill(0);

    // Sumar valores por mes
    filasPresupuesto.forEach((fila) => {
      for (let mes = 0; mes < 12; mes++) {
        totalesPresupuesto[mes] += parseNumber(fila.cells[mes + 1].textContent);
      }
    });
    filasReal.forEach((fila) => {
      for (let mes = 0; mes < 12; mes++) {
        totalesReal[mes] += parseNumber(fila.cells[mes + 1].textContent);
      }
    });

    // Diferencia absoluta y colores
    const totalesDiferencia = totalesPresupuesto.map((v, i) => Math.abs(v - totalesReal[i]));
    const coloresDiferencia = totalesPresupuesto.map((v, i) =>
      totalesReal[i] > v ? "#FFB3B3" : "#d0f0c0"
    );

    if (presupuestoVsRealChart) presupuestoVsRealChart.destroy();

    presupuestoVsRealChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: meses,
        datasets: [
          {
            label: "Presupuesto",
            data: totalesPresupuesto,
            backgroundColor: "rgba(4, 78, 71, 0.6)"
          },
          {
            label: "Gastos Reales",
            data: totalesReal,
            backgroundColor: "rgba(12, 175, 162, 0.7)"
          },
          {
            label: "Diferencia",
            data: totalesDiferencia,
            backgroundColor: coloresDiferencia
          }
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: "top" },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: (ctx) => ctx.dataset.label + ": " + formatNumber(ctx.raw),
            },
          },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#000',
            font: { weight: 'bold', size: 12 },
            formatter: (value) => formatNumber(value)
          }
        },
        scales: {
          x: { stacked: false },
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => formatNumber(value) },
          },
        },
      },
      plugins: [ChartDataLabels]
    });
  }

  // ---------------------------
  // Edición de celdas y actualización
  // ---------------------------
  function habilitarEdicionYActualizar(idTabla) {
    const celdas = document.querySelectorAll(`#${idTabla} tbody td`);
    celdas.forEach((celda) => {
      celda.setAttribute("contenteditable", "true");
      celda.addEventListener("input", () => {
        actualizarTotalesPresupuesto();
        actualizarTotalesReales();
        calcularDiferencias();
        crearGraficoTotalesMensuales();
      });
    });
  }

  // ---------------------------
  // Comentarios
  // ---------------------------
  const STORAGE_KEY_COMMENTS = "presupuesto:comentarios:v1";
  let comentarios = [];

  function cargarComentariosDeStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
      comentarios = raw ? JSON.parse(raw) : [];
    } catch {
      comentarios = [];
    }
  }

  function guardarComentariosEnStorage() {
    localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(comentarios));
  }

  function renderizarComentarios() {
    const ul = document.getElementById("lista-comentarios");
    if (!ul) return;
    ul.innerHTML = "";
    comentarios.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.mes} — ${c.text} (${c.fecha})`;
      li.title = c.text;
      ul.appendChild(li);
    });
  }

  function agregarComentarioHandler() {
    const select = document.getElementById("mes-comentario");
    if (!select) return;
    const mes = select.value || select.options[select.selectedIndex]?.text || "Mes";
    const texto = prompt(`Agregar comentario para ${mes}:`);
    if (texto === null) return;
    const t = texto.trim();
    if (t === "") {
      alert("No se agregó: comentario vacío.");
      return;
    }
    comentarios.push({ mes, text: t, fecha: new Date().toLocaleString() });
    guardarComentariosEnStorage();
    renderizarComentarios();
  }

  function eliminarComentarioHandler() {
    if (comentarios.length === 0) {
      alert("No hay comentarios para eliminar.");
      return;
    }
    const ultimo = comentarios[comentarios.length - 1];
    const confirmDel = confirm(`¿Eliminar último comentario de ${ultimo.mes}?\n\n"${ultimo.text}"`);
    if (!confirmDel) return;
    comentarios.pop();
    guardarComentariosEnStorage();
    renderizarComentarios();
  }

  function setupComentarios() {
    cargarComentariosDeStorage();
    renderizarComentarios();
    const btnAdd = document.getElementById("agregar-comentario");
    const btnDel = document.getElementById("eliminar-comentario");
    if (btnAdd) btnAdd.addEventListener("click", agregarComentarioHandler);
    if (btnDel) btnDel.addEventListener("click", eliminarComentarioHandler);
  }

  // ---------------------------
  // Inicialización
  // ---------------------------
  window.addEventListener("DOMContentLoaded", () => {
    cargarDatosDesdeGoogleSheet();
    setupComentarios();
  });

})();
