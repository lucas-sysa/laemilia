const endpoint = "https://script.google.com/macros/s/AKfycbwcK9dCB15BJZv9Ski0iWH_sr8ivmPhOeuojaPWAtAD7k3vi2IrFAkS4jjpKZ8kQiP7/exec";

// ---------------------------
// Funciones de parseo y formateo
// ---------------------------
function parseNumber(str) {
  if (!str) return 0;
  str = str.toString().trim();
  str = str.replace(/\./g, ""); // elimina separador de miles
  str = str.replace(",", ".");  // reemplaza coma decimal por punto
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
    if (idx === 0) return val; // nombre de la premisa
    if (fila[0].toLowerCase().includes("inflación")) return val; // mantiene %
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

    // Premisas
    actualizarTablaPremisas("premisas-table", data.premisas);

    // Presupuesto y Real
    actualizarTablaPresupuesto(data.presupuesto);
    actualizarTablaReal(data.real);

    // Crear filas de diferencias
    const diferenciaTable = document.querySelector("#diferencia-table tbody");
    diferenciaTable.innerHTML = "";
    if (data.presupuesto && data.real) {
      data.presupuesto.forEach(() => {
        const tr = document.createElement("tr");
        for (let i = 0; i <= 12; i++) { // 12 meses + total
          const td = document.createElement("td");
          tr.appendChild(td);
        }
        diferenciaTable.appendChild(tr);
      });
    }

    // Totales y diferencias
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
    filaDif.cells[filaDif.cells.length - 1].style.backgroundColor =
      suma > 0 ? "#d0f0c0" : suma < 0 ? "#f8d7da" : "";
  });
}

// ---------------------------
// Gráfico de barras
// ---------------------------
let presupuestoVsRealChart;
function crearGraficoTotalesMensuales() {
  const canvas = document.getElementById("presupuestoVsRealChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const filasPresupuesto = document.querySelectorAll("#presupuesto-table tbody tr");
  const filasReal = document.querySelectorAll("#real-table tbody tr");

  const totalesPresupuesto = Array(12).fill(0);
  const totalesReal = Array(12).fill(0);

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

  if (presupuestoVsRealChart) presupuestoVsRealChart.destroy();

  presupuestoVsRealChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        { label: "Presupuesto", data: totalesPresupuesto, backgroundColor: "rgba(4, 78, 71, 0.48)" },
        { label: "Gastos Reales", data: totalesReal, backgroundColor: "rgba(12, 175, 162, 0.57)" },
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
      },
      scales: {
        x: { stacked: false },
        y: {
          beginAtZero: true,
          ticks: { callback: (value) => formatNumber(value) },
        },
      },
    },
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
// Inicialización
// ---------------------------
window.addEventListener("DOMContentLoaded", () => {
  cargarDatosDesdeGoogleSheet();
});


  XLSX.writeFile(wb, "presupuesto_formateado.xlsx");
});

