(() => {
    const endpoint = "https://script.google.com/macros/s/AKfycbwcK9dCB15BJZv9Ski0iWH_sr8ivmPhOeuojaPWAtAD7k3vi2IrFAkS4jjpKZ8kQiP7/exec";
    let presupuestoVsRealChart;

    const parseNumber = (str) => {
        if (!str) return 0;
        let s = str.toString().trim().replace(/\./g, "").replace(",", ".");
        return parseFloat(s) || 0;
    };

    const formatNumber = (num) => {
        return Number(num).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    function actualizarTotales(idTabla) {
        const filas = document.querySelectorAll(`#${idTabla} tbody tr`);
        filas.forEach(fila => {
            let suma = 0;
            // Enero (1) a Diciembre (12)
            for (let j = 1; j <= 12; j++) {
                suma += parseNumber(fila.cells[j].textContent);
            }
            // Celda 13 es el Total
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
            let totalDifAnual = 0;

            // Procesar meses (1-12) y columna Total (13)
            for (let j = 1; j <= 13; j++) {
                const valP = parseNumber(fPres.cells[j].textContent);
                const valR = parseNumber(fReal.cells[j].textContent);
                const dif = valP - valR;

                if (j <= 12) totalDifAnual += dif;
                
                const celdaTarget = (j === 13) ? totalDifAnual : dif;
                fDif.cells[j].textContent = formatNumber(celdaTarget);

                // Colores
                fDif.cells[j].classList.remove('positivo', 'negativo');
                if (celdaTarget > 0) fDif.cells[j].classList.add('positivo');
                else if (celdaTarget < 0) fDif.cells[j].classList.add('negativo');
            }
        });
    }

    function renderizarGrafico() {
        const ctx = document.getElementById("presupuestoVsRealChart").getContext("2d");
        const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        const totPres = Array(12).fill(0);
        const totReal = Array(12).fill(0);

        document.querySelectorAll("#presupuesto-table tbody tr").forEach(f => {
            for (let i = 0; i < 12; i++) totPres[i] += parseNumber(f.cells[i+1].textContent);
        });
        document.querySelectorAll("#real-table tbody tr").forEach(f => {
            for (let i = 0; i < 12; i++) totReal[i] += parseNumber(f.cells[i+1].textContent);
        });

        if (presupuestoVsRealChart) presupuestoVsRealChart.destroy();

        presupuestoVsRealChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: mesesLabels,
                datasets: [
                    { label: "Presupuesto", data: totPres, backgroundColor: "#048C7C" },
                    { label: "Real", data: totReal, backgroundColor: "#AEAAAA" }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { datalabels: { display: false } } // Desactivado para limpieza, puedes activarlo si prefieres
            }
        });
    }

    async function cargarTodo() {
        // Ejecución inmediata para mostrar gráfico aunque el fetch tarde
        actualizarTotales("presupuesto-table");
        actualizarTotales("real-table");
        calcularDiferencias();
        renderizarGrafico();

        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            // Si data tiene valores, aquí se rellenarían las tablas.
            // Luego recalculamos:
            actualizarTotales("presupuesto-table");
            actualizarTotales("real-table");
            calcularDiferencias();
            renderizarGrafico();
        } catch (e) { console.warn("Fetch falló, usando datos locales."); }

        // Habilitar edición manual
        document.querySelectorAll("td").forEach(td => {
            if(td.cellIndex > 0 && td.closest('table').id !== 'diferencia-table') {
                td.contentEditable = true;
                td.addEventListener("input", () => {
                    actualizarTotales("presupuesto-table");
                    actualizarTotales("real-table");
                    calcularDiferencias();
                    renderizarGrafico();
                });
            }
        });
    }

    window.addEventListener("DOMContentLoaded", cargarTodo);
})();
