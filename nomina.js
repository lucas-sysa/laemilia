let allData = JSON.parse(localStorage.getItem("dotacionData")) || [];
let barChart, pieChart;

// Listeners para carga de Excel y filtros
document.getElementById("excelFile").addEventListener("change", handleFile);
["filterSector","filterMoi","filterNomina","filterLegajo","filterNombre","filterClasificacion","filterLinea"]
  .forEach(id => document.getElementById(id).addEventListener("input", renderTable));

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets["DETALLE"];
    if (!sheet) {
      alert("No se encontró la hoja 'DETALLE'");
      return;
    }

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const rows = jsonData.slice(2);

    const parsed = rows.map(r => ({
      legajo: r[1],
      nombre: r[2],
      nomina: r[3],
      sector: r[4],
      clasificacion: r[5],
      moi: r[6],
      linea: r[7]
    })).filter(r => r.legajo);

    allData = allData.concat(parsed);
    localStorage.setItem("dotacionData", JSON.stringify(allData));

    fillFilters();
    renderTable();
  };

  reader.readAsArrayBuffer(file);
}

function renderTable() {
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const sector = document.getElementById("filterSector").value.toLowerCase();
  const moi = document.getElementById("filterMoi").value.toLowerCase();
  const nomina = document.getElementById("filterNomina").value.toLowerCase();
  const legajo = document.getElementById("filterLegajo").value.toLowerCase();
  const nombre = document.getElementById("filterNombre").value.toLowerCase();
  const clasificacion = document.getElementById("filterClasificacion").value.toLowerCase();
  const linea = document.getElementById("filterLinea").value.toLowerCase();

  const filtered = allData.filter(r =>
    (!sector || (r.sector && r.sector.toLowerCase().includes(sector))) &&
    (!moi || (r.moi && r.moi.toLowerCase().includes(moi))) &&
    (!nomina || (r.nomina && r.nomina.toLowerCase().includes(nomina))) &&
    (!legajo || (r.legajo && String(r.legajo).toLowerCase().includes(legajo))) &&
    (!nombre || (r.nombre && r.nombre.toLowerCase().includes(nombre))) &&
    (!clasificacion || (r.clasificacion && r.clasificacion.toLowerCase().includes(clasificacion))) &&
    (!linea || (r.linea && r.linea.toLowerCase().includes(linea)))
  );

  filtered.forEach(r => {
    const row = `<tr>
      <td>${r.legajo}</td>
      <td>${r.nombre}</td>
      <td>${r.nomina}</td>
      <td>${r.sector}</td>
      <td>${r.clasificacion || ''}</td>
      <td>${r.moi}</td>
      <td>${r.linea || ''}</td>
    </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  });

  // Total general
  document.getElementById("totalContainer").innerText = `Total registros: ${filtered.length}`;

  // Fila de totales por sector
  const sectorCounts = {};
  filtered.forEach(r => {
    sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1;
  });

  const totalRow = `<tr class="total-row">
    <td colspan="3">Totales por Sector:</td>
    <td colspan="4">${Object.entries(sectorCounts).map(([s, c]) => `${s}: ${c}`).join(' | ')}</td>
  </tr>`;
  tbody.insertAdjacentHTML("beforeend", totalRow);

  renderCharts(filtered);
}

function renderCharts(data = allData) {
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxPie = document.getElementById("pieChart").getContext("2d");

  const sectorCounts = {};
  data.forEach(r => {
    sectorCounts[r.sector] = (sectorCounts[r.sector] || 0) + 1;
  });

  const labels = Object.keys(sectorCounts);
  const values = Object.values(sectorCounts);

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(ctxBar, {
    type: "bar",
    data: { labels, datasets: [{ label: "Dotación por Sector", data: values, backgroundColor: "#007BFF" }] },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  pieChart = new Chart(ctxPie, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Distribución por Sector",
        data: values,
        backgroundColor: [
          "#4e79a7","#f28e2b","#e15759","#76b7b2",
          "#59a14f","#edc948","#b07aa1","#ff9da7",
          "#9c755f","#bab0ab"
        ],
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      cutout: "60%",
      plugins: {
        legend: { position: "right", labels: { boxWidth: 20, padding: 15, font: { size: 14 } } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a,b)=>a+b,0);
              const value = context.parsed;
              const percentage = ((value/total)*100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function fillFilters() {
  const sectors = [...new Set(allData.map(r => r.sector))];
  const mois = [...new Set(allData.map(r => r.moi))];
  const nominas = [...new Set(allData.map(r => r.nomina))];

  fillSelect("filterSector", sectors);
  fillSelect("filterMoi", mois);
  fillSelect("filterNomina", nominas);
}

function fillSelect(id, values) {
  const select = document.getElementById(id);
  const current = select.value;
  select.innerHTML = `<option value="">Todos</option>`;
  values.forEach(v => { if(v) select.innerHTML += `<option value="${v}">${v}</option>`; });
  select.value = current;
}

// Render inicial si hay datos guardados
if(allData.length > 0){
  fillFilters();
  renderTable();
}

