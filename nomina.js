let allData = JSON.parse(localStorage.getItem("maestroData")) || [];
let barChart, barChartMeses;

// --- Función para convertir número de Excel a mes/año ---
function excelDateToMesAno(excelDate) {
  if(typeof excelDate === "number") {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    const mes = (date.getMonth() + 1).toString().padStart(2,"0");
    const ano = date.getFullYear();
    return `${mes}/${ano}`;
  }
  return excelDate; // si ya es texto
}

// --- Listeners ---
document.getElementById("excelFile").addEventListener("change", handleFile);
[
  "filterMes","filterLegajo","filterNombre","filterNomina",
  "filterSector","filterClasificacion","filterManoObra",
  "filterLinea","filterIncidencia"
].forEach(id => document.getElementById(id).addEventListener("input", renderTable));

// --- Carga Excel ---
function handleFile(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event){
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data,{type:"array"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if(!sheet){ alert("No se encontró hoja en el Excel"); return; }
    const jsonData = XLSX.utils.sheet_to_json(sheet,{header:1});
    const rows = jsonData.slice(1);

    const parsed = rows.map(r=>({
      mes: excelDateToMesAno(r[0] || ""), 
      legajo: r[1] || "",
      nombre: r[2] || "",
      nomina: r[3] || "",
      sector: r[4] || "",
      lineas: r[5] || "",
      clasificacion:"",
      manoObra:"",
      incidencia:"",
      observaciones:""
    })).filter(r=>r.legajo);

    // --- Evitar duplicados por legajo + mes ---
    parsed.forEach(newRow=>{
      const exists = allData.some(existing => 
        existing.legajo === newRow.legajo && existing.mes === newRow.mes
      );
      if(!exists) allData.push(newRow);
    });

    saveData();
    fillNominas();
    fillMeses();
    renderTable();
  };
  reader.readAsArrayBuffer(file);
}

// --- Render tabla ---
function renderTable(){
  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  const fMes = document.getElementById("filterMes").value.toLowerCase();
  const fLegajo = document.getElementById("filterLegajo").value.toLowerCase();
  const fNombre = document.getElementById("filterNombre").value.toLowerCase();
  const fNomina = document.getElementById("filterNomina").value.toLowerCase();
  const fSector = document.getElementById("filterSector").value.toLowerCase();
  const fClasif = document.getElementById("filterClasificacion").value.toLowerCase();
  const fMano = document.getElementById("filterManoObra").value.toLowerCase();
  const fLinea = document.getElementById("filterLinea").value.toLowerCase();
  const fInc = document.getElementById("filterIncidencia").value.toLowerCase();

  const filtered = allData.filter(r=>
    (!fMes || (r.mes && r.mes.toLowerCase().includes(fMes))) &&
    (!fLegajo || r.legajo.toLowerCase().includes(fLegajo)) &&
    (!fNombre || r.nombre.toLowerCase().includes(fNombre)) &&
    (!fNomina || (r.nomina && r.nomina.toLowerCase().includes(fNomina))) &&
    (!fSector || (r.sector && r.sector.toLowerCase().includes(fSector))) &&
    (!fClasif || (r.clasificacion && r.clasificacion.toLowerCase().includes(fClasif))) &&
    (!fMano || (r.manoObra && r.manoObra.toLowerCase().includes(fMano))) &&
    (!fLinea || (r.lineas && r.lineas.toLowerCase().includes(fLinea))) &&
    (!fInc || (r.incidencia && r.incidencia.toLowerCase().includes(fInc)))
  );

  filtered.forEach(r=>{
    const row = document.createElement("tr");
    row.innerHTML=`
      <td><input type="text" class="mesAno" value="${r.mes || ""}"></td>
      <td>${r.legajo}</td>
      <td>${r.nombre}</td>
      <td>${r.nomina}</td>
      <td>${r.sector}</td>
      <td>
        <select class="clasificacion">
          <option value="">--</option>
          <option value="Jornales" ${r.clasificacion==="Jornales"?"selected":""}>Jornales</option>
          <option value="Mensuales" ${r.clasificacion==="Mensuales"?"selected":""}>Mensuales</option>
        </select>
      </td>
      <td>
        <select class="manoObra">
          <option value="">--</option>
          <option value="Directa" ${r.manoObra==="Directa"?"selected":""}>Directa</option>
          <option value="Indirecta" ${r.manoObra==="Indirecta"?"selected":""}>Indirecta</option>
        </select>
      </td>
      <td>${r.lineas}</td>
      <td>
        <select class="incidencia">
          <option value="">--</option>
          <option value="Cambio de sector" ${r.incidencia==="Cambio de sector"?"selected":""}>Cambio de sector</option>
          <option value="Renuncia" ${r.incidencia==="Renuncia"?"selected":""}>Renuncia</option>
          <option value="Despido" ${r.incidencia==="Despido"?"selected":""}>Despido</option>
        </select>
      </td>
      <td><input type="text" class="observaciones" value="${r.observaciones || ""}"></td>
    `;
    tbody.appendChild(row);

    const mesInput = row.querySelector(".mesAno");
    const clasifSelect = row.querySelector(".clasificacion");
    const manoSelect = row.querySelector(".manoObra");
    const incSelect = row.querySelector(".incidencia");
    const obsInput = row.querySelector(".observaciones");

    // --- Edición Mes/Año ---
    mesInput.addEventListener("input", e=>{
      r.mes = e.target.value;
      saveData();
      renderCharts();
    });

    // --- Clasificación → Mano de Obra automática ---
    clasifSelect.addEventListener("change", e=>{
      r.clasificacion = e.target.value;

      const linea = r.lineas.trim().toLowerCase();

      if(r.clasificacion === "Mensuales"){
        r.manoObra = "Indirecta";
        manoSelect.value = "Indirecta";
        manoSelect.disabled = true;
      } else if(r.clasificacion === "Jornales") {
        if(["l06","l09","l12","l14","l21"].includes(linea)){
          r.manoObra = "Directa";
          manoSelect.value = "Directa";
          manoSelect.disabled = false;
        } else if(linea === "logistica"){  // <-- corrección definitiva
          r.manoObra = "Indirecta";
          manoSelect.value = "Indirecta";
          manoSelect.disabled = true;
        } else {
          r.manoObra = "";
          manoSelect.value = "";
          manoSelect.disabled = false;
        }
      }

      saveData();
      renderCharts();
    });

    // --- Otros selects y observaciones ---
    manoSelect.addEventListener("change", e=>{r.manoObra=e.target.value; saveData();});
    incSelect.addEventListener("change", e=>{r.incidencia=e.target.value; saveData();});
    obsInput.addEventListener("input", e=>{r.observaciones=e.target.value; saveData();});
  });

  enableDragFill();
  document.getElementById("totalContainer").innerText = `Total registros: ${filtered.length}`;
  renderCharts(filtered);
}

// --- Guardar datos ---
function saveData(){ localStorage.setItem("maestroData", JSON.stringify(allData)); }

// --- Llenar Meses ---
function fillMeses(){
  const select = document.getElementById("filterMes");
  const meses = [...new Set(allData.map(r=>r.mes))];
  select.innerHTML = `<option value="">Todos los Meses</option>`;
  meses.forEach(m=>{ if(m) select.innerHTML+=`<option value="${m}">${m}</option>`; });
}

// --- Llenar Nóminas ---
function fillNominas(){
  const select = document.getElementById("filterNomina");
  const nominas = [...new Set(allData.map(r=>r.nomina))];
  select.innerHTML = `<option value="">Todas las Nóminas</option>`;
  nominas.forEach(n=>{ if(n) select.innerHTML+=`<option value="${n}">${n}</option>`; });
}

// --- Gráficos (solo Nómina y Meses) ---
function renderCharts(data=allData){
  const ctxBar = document.getElementById("barChart").getContext("2d");
  const ctxMeses = document.getElementById("barChartMeses").getContext("2d");

  const nominaCounts = {};
  const mesCounts = {};

  data.forEach(r=>{
    if(r.nomina) nominaCounts[r.nomina] = (nominaCounts[r.nomina]||0)+1;
    if(r.mes) mesCounts[r.mes] = (mesCounts[r.mes]||0)+1;
  });

  if(barChart) barChart.destroy();
  if(barChartMeses) barChartMeses.destroy();

  barChart = new Chart(ctxBar,{
    type:"bar",
    data:{ labels:Object.keys(nominaCounts), datasets:[{label:"Por Nómina", data:Object.values(nominaCounts), backgroundColor:"#007BFF"}]},
    options:{responsive:true, plugins:{legend:{display:false}}}
  });

  barChartMeses = new Chart(ctxMeses,{
    type:"bar",
    data:{ labels:Object.keys(mesCounts), datasets:[{label:"Registros por Mes", data:Object.values(mesCounts), backgroundColor:"#28a745"}]},
    options:{responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}}}
  });
}

// --- Habilitar arrastrar Mes/Año ---
function enableDragFill() {
  let isMouseDown = false;
  let valueToFill = "";

  document.querySelectorAll(".mesAno").forEach(input => {
    input.addEventListener("mousedown", e => {
      isMouseDown = true;
      valueToFill = e.target.value;
      e.target.dispatchEvent(new Event('input'));
    });
    input.addEventListener("mouseover", e => {
      if (isMouseDown) {
        e.target.value = valueToFill;
        e.target.dispatchEvent(new Event('input'));
      }
    });
    input.addEventListener("mouseup", e => { isMouseDown = false; });
  });

  document.addEventListener("mouseup", () => { isMouseDown = false; });
}

// --- Botón Limpiar ---
document.getElementById("btnLimpiar")?.addEventListener("click", ()=>{
  if(confirm("¿Seguro que querés limpiar todos los datos?")){
    localStorage.removeItem("maestroData");
    allData = [];
    renderTable();
    fillMeses();
    fillNominas();
  }
});

// --- Inicial ---
if(allData.length>0){ fillMeses(); fillNominas(); renderTable(); }
