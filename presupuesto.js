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
    const filasPresupuesto = document.querySelectorAll("#presupuesto-table tbody tr");
    const filasReal = document.querySelectorAll("#real-table tbody tr");
    const filasDif = document.querySelectorAll("#diferencia-table tbody tr");

    filasPresupuesto.forEach((filaPres, i) => {
        const filaReal = filasReal[i];
        const filaDif = filasDif[i];
        
        if (!filaReal || !filaDif) return;

        // Copiamos el nombre de la cuenta (columna 0)
        filaDif.cells[0].textContent = filaPres.cells[0].textContent;

        let acumuladoAnualDif = 0;

        // Bucle del mes 1 (Enero) al 12 (Diciembre)
        for (let mes = 1; mes <= 12; mes++) {
            const valPres = parseNumber(filaPres.cells[mes].textContent);
            const valReal = parseNumber(filaReal.cells[mes].textContent);
            
            const dif = valPres - valReal;
            acumuladoAnualDif += dif;

            // Renderizar mes a mes
            filaDif.cells[mes].textContent = formatNumber(dif);
            
            // Aplicar colores
            filaDif.cells[mes].classList.remove('positivo', 'negativo');
            if (dif > 0) filaDif.cells[mes].classList.add('positivo');
            else if (dif < 0) filaDif.cells[mes].classList.add('negativo');
        }

        // --- EL TOTAL FINAL (Columna 13) ---
        const celdaTotal = filaDif.cells[13]; // Asegúrate que tu HTML tenga 14 celdas (0 a 13)
        if (celdaTotal) {
            celdaTotal.textContent = formatNumber(acumuladoAnualDif);
            celdaTotal.classList.remove('positivo', 'negativo');
            if (acumuladoAnualDif > 0) celdaTotal.classList.add('positivo');
            else if (acumuladoAnualDif < 0) celdaTotal.classList.add('negativo');
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

