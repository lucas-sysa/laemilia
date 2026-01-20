(() => {
    const endpoint = "https://script.google.com/macros/s/AKfycbwcK9dCB15BJZv9Ski0iWH_sr8ivmPhOeuojaPWAtAD7k3vi2IrFAkS4jjpKZ8kQiP7/exec";
  let presupuestoVsRealChart;

  // Selectores comunes
  const UI = {
    presupuestoBody: document.querySelector("#presupuesto-table tbody"),
    realBody: document.querySelector("#real-table tbody"),
    diferenciaBody: document.querySelector("#diferencia-table tbody"),
    canvas: document.getElementById("presupuestoVsRealChart")
  };

  // --- Utilidades ---
  const parseNumber = (str) => {
    if (!str) return 0;
    const clean = str.toString().replace(/\./g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const formatNumber = (num) => {
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // --- Lógica de Negocio Unificada ---
  function actualizarTablaGenerica(datos, tbody, esEditable = false) {
    tbody.innerHTML = "";
    datos.forEach(fila => {
      const tr = document.createElement("tr");
      Object.values(fila).forEach((valor, idx) => {
        const td = document.createElement("td");
        td.textContent = (idx === 0) ? valor : formatNumber(parseNumber(valor));
        if (esEditable && idx > 0 && idx < 13) {
          td.contentEditable = "true";
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function recalcularTodo() {
    actualizarTotales("presupuesto-table");
    actualizarTotales("real-table");
    calcularDiferencias();
    renderizarGrafico();
  }

  function actualizarTotales(idTabla) {
    const filas = document.querySelectorAll(`#${idTabla} tbody tr`);
    filas.forEach(fila => {
      let suma = 0;
      for (let j = 1; j <= 12; j++) {
        suma += parseNumber(fila.cells[j].textContent);
      }
      fila.cells[fila.cells.length - 1].textContent = formatNumber(suma);
    });
  }

  function calcularDiferencias() {
    const filasPres = UI.presupuestoBody.rows;
    const filasReal = UI.realBody.rows;
    const filasDif = UI.diferenciaBody.rows;

    Array.from(filasPres).forEach((fPres, i) => {
      if (!filasDif[i]) return;
      filasDif[i].cells[0].textContent = fPres.cells[0].textContent;
      
      let totalDif = 0;
      for (let m = 1; m <= 13; m++) { // Incluye la columna total
        const vP = parseNumber(fPres.cells[m].textContent);
        const vR = parseNumber(filasReal[i].cells[m].textContent);
        const dif = vP - vR;
        totalDif += (m < 13) ? dif : 0;
        
        const celdaDif = filasDif[i].cells[m];
        celdaDif.textContent = formatNumber(m === 13 ? totalDif : dif);
        celdaDif.className = dif >= 0 ? "positivo" : "negativo";
      }
    });
  }

  // --- Inicialización ---
  async function cargarDashboard() {
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      
      actualizarTablaGenerica(data.presupuesto, UI.presupuestoBody, true);
      actualizarTablaGenerica(data.real, UI.realBody, true);
      
      // Crear filas de diferencia vacías
      UI.diferenciaBody.innerHTML = UI.presupuestoBody.innerHTML;
      
      recalcularTodo();
    } catch (err) {
      console.error("Error:", err);
    }
  }

  // Delegación de eventos para edición (Más eficiente)
  document.addEventListener("input", (e) => {
    if (e.target.contentEditable === "true") {
      recalcularTodo();
    }
  });

  window.addEventListener("DOMContentLoaded", cargarDashboard);
})();
