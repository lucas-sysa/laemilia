(() => {
    const endpoint = "https://script.google.com/macros/s/AKfycbwcK9dCB15BJZv9Ski0iWH_sr8ivmPhOeuojaPWAtAD7k3vi2IrFAkS4jjpKZ8kQiP7/exec";
    let presupuestoVsRealChart;

    // --- Funciones de Utilidad ---
    const parseNumber = (str) => {
        if (!str) return 0;
        let s = str.toString().trim().replace(/\./g, "").replace(",", ".");
        return parseFloat(s) || 0;
    };

    const formatNumber = (num) => {
        return Number(num).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // --- Lógica de Tablas ---
    function actualizarTotales(idTabla) {
        const filas = document.querySelectorAll(`#${idTabla} tbody tr`);
        filas.forEach(fila => {
            let suma = 0;
            // Sumamos de la celda 1 a la 12 (Ene a Dic)
            for (let j = 1; j <= 12; j++) {
                suma += parseNumber(fila.cells[j].textContent);
            }
            // El total va en la celda 13
            if (fila.cells[13]) fila.cells[13].textContent = formatNumber(suma);
        });
    }

    function calcularDiferencias() {
        const filasPres = document.querySelectorAll("#presupuesto-table tbody tr");
        const filasReal = document.querySelectorAll("#real-table tbody tr");
        const filasDif = document.querySelectorAll("#diferencia-table tbody tr");

        filasPres.forEach((fPres, i) => {
            const fReal = filasReal[i];
            const fDif = filasDif[i];
            if (!fReal || !fDif) return;

            fDif.cells[0].textContent = fPres.cells[0].textContent;
            let sumaDifAnual = 0;

            // Recorremos Enero a Diciembre (1 al 12) + Total (13)
            for (let j = 1; j <= 13; j++) {
                const valP = parseNumber(fPres.cells[j].textContent);
                const valR = parseNumber(fReal.cells[j].textContent);
                const dif = valP - valR;
                
                if (j < 13) sumaDifAnual += dif;

                const celdaDif = fDif.cells[j];
                celdaDif.textContent = formatNumber(j === 13 ? sumaDifAnual : dif);
                
                // Colores
                celdaDif.classList.remove('positivo', 'negativo');
                const valorAComparar = (j === 13) ? sumaDifAnual : dif;
                if (valorAComparar > 0) celdaDif.classList.add('positivo');
                else if (valorAComparar < 0) celdaDif.classList.add('negativo');
            }
        });
    }

    // --- Gráfico ---
// --- Función de Renderizado Mejorada ---
  function renderizarGrafico() {
    const canvas = document.getElementById("presupuestoVsRealChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const totalesPres = Array(12).fill(0);
    const totalesReal = Array(12).fill(0);

    // Sumamos lo que haya actualmente en las tablas (aunque estén vacías al inicio)
    document.querySelectorAll("#presupuesto-table tbody tr").forEach(f => {
      for (let i = 0; i < 12; i++) totalesPres[i] += parseNumber(f.cells[i + 1].textContent);
    });
    document.querySelectorAll("#real-table tbody tr").forEach(f => {
      for (let i = 0; i < 12; i++) totalesReal[i] += parseNumber(f.cells[i + 1].textContent);
    });

    if (presupuestoVsRealChart) presupuestoVsRealChart.destroy();

    presupuestoVsRealChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: meses,
        datasets: [
          { label: "Presupuesto", data: totalesPres, backgroundColor: "#048C7C" },
          { label: "Real", data: totalesReal, backgroundColor: "#AEAAAA" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Importante para que respete el alto del div
        plugins: {
          legend: { position: 'top' },
          datalabels: {
            anchor: 'end', align: 'top',
            formatter: (v) => v > 0 ? formatNumber(v) : '',
            font: { size: 10, weight: 'bold' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  // --- Carga Inicial con Prioridad ---
  async function cargarDatos() {
    // 1. Dibujar gráfico inmediatamente (con ceros o datos iniciales del HTML)
    renderizarGrafico();

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      // Si los datos vienen de afuera, aquí actualizarías el innerHTML de los tbodys
      // ... lógica de actualización de tablas ...

      // 2. Recalcular todo
      actualizarTotales("presupuesto-table");
      actualizarTotales("real-table");
      calcularDiferencias();
      
      // 3. Actualizar el gráfico con los datos nuevos
      renderizarGrafico();

      // 4. Habilitar edición en tiempo real
      document.querySelectorAll("td[contenteditable='true']").forEach(td => {
        td.addEventListener("input", () => {
          actualizarTotales("presupuesto-table");
          actualizarTotales("real-table");
          calcularDiferencias();
          renderizarGrafico(); // El gráfico se actualiza mientras escribes
        });
      });

    } catch (e) {
      console.error("Error al cargar datos:", e);
      // Si falla el fetch, calculamos lo que ya hay en el HTML por defecto
      actualizarTotales("presupuesto-table");
      actualizarTotales("real-table");
      calcularDiferencias();
      renderizarGrafico();
    }
  }
    // --- Carga Inicial ---
    async function cargarDatos() {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();

            // Aquí podrías llenar las tablas dinámicamente si quisieras, 
            // pero si ya están en el HTML, llamamos a los cálculos:
            actualizarTotales("presupuesto-table");
            actualizarTotales("real-table");
            calcularDiferencias();
            renderizarGrafico();
            
            // Habilitar edición
            document.querySelectorAll("td[contenteditable='true']").forEach(td => {
                td.addEventListener("input", () => {
                    actualizarTotales("presupuesto-table");
                    actualizarTotales("real-table");
                    calcularDiferencias();
                    renderizarGrafico();
                });
            });
        } catch (e) { console.error("Error cargando datos", e); }
    }

    window.addEventListener("DOMContentLoaded", cargarDatos);
})();

