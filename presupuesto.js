// --- Funciones de parseo y formateo ---
function parseNumber(str) {
  if (!str) return 0;
  return Number(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatNumber(num) {
  return Number(num || 0)
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// --- Inflación ---
function saveInflacion(data) { localStorage.setItem('inflacionProyectada', JSON.stringify(data)); }
function loadInflacion() { return JSON.parse(localStorage.getItem('inflacionProyectada')) || null; }

function getInflacionMeses() {
  const inflacionFila = document.querySelector('#premisas-table tbody tr:first-child');
  const inflacionValores = [];
  for (let i = 1; i < inflacionFila.cells.length; i++) {
    let val = inflacionFila.cells[i].textContent.trim().replace('%','').replace(',', '.');
    inflacionValores.push(parseFloat(val)/100);
  }
  return inflacionValores;
}

function calcularPresupuesto() {
  const filas = document.querySelectorAll('#presupuesto-table tbody tr');
  const inflacion = getInflacionMeses();
  filas.forEach(fila => {
    const celdas = fila.cells;
    let nuevoValor = parseNumber(celdas[1].textContent); // Mes Anterior
    for (let mes = 1; mes <= 12; mes++) {
      nuevoValor = nuevoValor * (1 + inflacion[mes-1]);
      celdas[mes+1].textContent = formatNumber(nuevoValor); // escribe Enero..Dic
    }
  });

  actualizarTotalesPresupuesto();
  calcularDiferencias();
}

// --- Inflación editable ---
function habilitarEdicionInflacion() {
  const inflacionFila = document.querySelector('#premisas-table tbody tr:first-child');
  for (let i=1;i<inflacionFila.cells.length;i++) {
    const celda = inflacionFila.cells[i];
    celda.contentEditable='true';
    celda.title="Editar inflación (%)";
    celda.addEventListener('blur',()=> {
      let val = celda.textContent.trim().replace('%','').replace(/[^\d,\.]/g,'');
      if(val==='') val='0';
      celda.textContent = val.replace('.',',')+'%';
      guardarInflacionDesdeTabla();
      calcularPresupuesto();
      savePresupuestoBase();
    });
    celda.addEventListener('keydown', e=> { if(e.key==='Enter'){e.preventDefault(); celda.blur();}});
  }
}

function guardarInflacionDesdeTabla() {
  const inflacionFila = document.querySelector('#premisas-table tbody tr:first-child');
  const datos = [];
  for(let i=1;i<inflacionFila.cells.length;i++){
    let val = inflacionFila.cells[i].textContent.trim().replace('%','').replace(',', '.');
    datos.push(val);
  }
  saveInflacion(datos);
}

function cargarInflacionGuardada() {
  const datos = loadInflacion();
  if(!datos) return;
  const inflacionFila = document.querySelector('#premisas-table tbody tr:first-child');
  for(let i=1;i<inflacionFila.cells.length;i++){
    if(datos[i-1]!==undefined)
      inflacionFila.cells[i].textContent = datos[i-1].replace('.',',')+'%';
  }
}

// --- Presupuesto Mes Anterior ---
function habilitarGastoMesAnterior() {
  const filas = document.querySelectorAll('#presupuesto-table tbody tr');
  const saved = JSON.parse(localStorage.getItem('gastoMesAnterior'))||[];
  filas.forEach((fila,i)=>{
    const celda=fila.cells[1];
    celda.contentEditable='true';
    celda.title="Editar gasto mes anterior";
    if(saved[i]) celda.textContent=saved[i];
    celda.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault(); celda.blur();}});
    celda.addEventListener('blur', ()=> {
      celda.textContent=formatCellValue(celda.textContent);
      savePresupuestoBase();
      calcularPresupuesto();
    });
  });
}

function savePresupuestoBase() {
  const filas = document.querySelectorAll('#presupuesto-table tbody tr');
  const valores = Array.from(filas).map(f=>f.cells[1].textContent);
  localStorage.setItem('gastoMesAnterior', JSON.stringify(valores));
}

// --- Gastos Reales ---
function formatCellValue(value) {
  let num = parseFloat(value.replace(/\./g,'').replace(',', '.'));
  if(isNaN(num)) return '';
  return num.toLocaleString('es-AR',{minimumFractionDigits:2, maximumFractionDigits:2});
}

const realTable = document.querySelector('#real-table tbody');

function loadRealTable(){
  const saved = JSON.parse(localStorage.getItem('gastosReales'))||[];
  Array.from(realTable.rows).forEach((row,i)=>{
    Array.from(row.cells).forEach((cell,j)=>{
      if(j>0 && j<=12){ 
        cell.contentEditable='true';
        if(saved[i]&&saved[i][j]) cell.textContent=saved[i][j];
        cell.addEventListener('keydown', e=>{if(e.key==='Enter'){e.preventDefault(); cell.blur();}});
        cell.addEventListener('blur', ()=> {
          cell.textContent=formatCellValue(cell.textContent);
          saveRealTable();
          actualizarTotalesReales();
        });
      }
    });
  });
  actualizarTotalesReales();
}

function saveRealTable(){
  const data = Array.from(realTable.rows).map(row=>{
    const arr = [];
    for(let j=1;j<=12;j++){
      arr[j] = row.cells[j].textContent;
    }
    return arr;
  });
  localStorage.setItem('gastosReales', JSON.stringify(data));
  calcularDiferencias();
}

// --- Totales ---
function actualizarTotalesPresupuesto(){
  const filas = document.querySelectorAll('#presupuesto-table tbody tr');
  filas.forEach(fila=>{
    const celdas = fila.cells;
    let suma = 0;
    for(let j=2;j<=13;j++) suma += parseNumber(celdas[j].textContent);
    const idxTotal = celdas.length - 1;
    celdas[idxTotal].textContent = formatNumber(suma);
  });
}

function actualizarTotalesReales(){
  const filas = document.querySelectorAll('#real-table tbody tr');
  filas.forEach(fila=>{
    const celdas = fila.cells;
    let suma = 0;
    for(let j=1;j<=12;j++) suma += parseNumber(celdas[j].textContent);
    const idxTotal = celdas.length - 1;
    celdas[idxTotal].textContent = formatNumber(suma);
  });
}

// --- Diferencias ---
function calcularDiferencias() {
  const filasPresupuesto = document.querySelectorAll('#presupuesto-table tbody tr');
  const filasReal = document.querySelectorAll('#real-table tbody tr');
  const filasDif = document.querySelectorAll('#diferencia-table tbody tr');

  filasPresupuesto.forEach((filaPres,i)=>{
    const filaReal = filasReal[i];
    const filaDif = filasDif[i];
    filaDif.cells[0].textContent = filaPres.cells[0].textContent;

    let suma = 0;
    for(let mes=1;mes<=12;mes++){
      const valPres=parseNumber(filaPres.cells[mes+1].textContent); 
      const valReal=parseNumber(filaReal.cells[mes].textContent);   
      const dif=valPres-valReal;
      suma += dif;

      filaDif.cells[mes].textContent=formatNumber(dif);
      filaDif.cells[mes].style.backgroundColor=dif>0?'#d0f0c0':dif<0?'#f8d7da':'';
    }

    const idxTotal = filaDif.cells.length - 1;
    filaDif.cells[idxTotal].textContent = formatNumber(suma);
    filaDif.cells[idxTotal].style.backgroundColor = suma>0?'#d0f0c0':suma<0?'#f8d7da':'';
  });
}

// --- Comentarios ---
const listaComentarios = document.getElementById('lista-comentarios');
const selectMes = document.getElementById('mes-comentario');

function cargarComentarios(){
  const mes = selectMes.value;
  listaComentarios.innerHTML = localStorage.getItem(`comentarios-${mes}`)||'';
  Array.from(listaComentarios.children).forEach(li=>{
    li.contentEditable='true';
    li.addEventListener('blur', guardarComentarios);
  });
}

function guardarComentarios(){
  const mes = selectMes.value;
  localStorage.setItem(`comentarios-${mes}`, listaComentarios.innerHTML);
}

selectMes.addEventListener('change', cargarComentarios);

document.getElementById('agregar-comentario').addEventListener('click',()=>{
  const li=document.createElement('li');
  li.textContent="Nuevo comentario";
  li.contentEditable='true';
  li.style.padding="5px"; li.style.border="1px solid #ccc"; li.style.marginBottom="4px";
  li.addEventListener('blur', guardarComentarios);
  listaComentarios.appendChild(li);
  guardarComentarios();
});

document.getElementById('eliminar-comentario').addEventListener('click',()=>{
  if(listaComentarios.lastElementChild) listaComentarios.removeChild(listaComentarios.lastElementChild);
  guardarComentarios();
});

listaComentarios.addEventListener('input', guardarComentarios);

// --- Exportar / Importar ---
document.getElementById('export-config').addEventListener('click', () => {
  const dataStr = JSON.stringify(localStorage, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "Presupuesto.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import-btn').addEventListener('click', () => {
  document.getElementById('import-config').click();
});

document.getElementById('import-config').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);
      localStorage.clear();
      for(const key in importedData){
        localStorage.setItem(key, importedData[key]);
      }
      alert("Configuración importada correctamente. Recarga la página.");
      location.reload();
    } catch(err) {
      alert("Error al importar la configuración: "+err);
    }
  };
  reader.readAsText(file);
});

// --- Obtener datos fila por mes ---
function obtenerDatosFilaPorMes(fila, tipo="presupuesto") {
  const celdas = fila.querySelectorAll("td");
  const datos = [];
  let startIdx = tipo === "presupuesto" ? 2 : 1;
  for (let i=startIdx; i<=startIdx+11; i++){
    let valor = celdas[i].textContent.trim().replace(/\./g,'').replace(',', '.');
    datos.push(parseFloat(valor)||0);
  }
  return datos;
}

// --- Gráfico Presupuesto vs Real ---
let presupuestoVsRealChart;

function crearGraficoTotalesMensuales() {
  const ctx = document.getElementById('presupuestoVsRealChart').getContext('2d');
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const filasPresupuesto = document.querySelectorAll("#presupuesto-table tbody tr");
  const filasReal = document.querySelectorAll("#real-table tbody tr");

  const totalesPresupuesto = Array(12).fill(0);
  const totalesReal = Array(12).fill(0);

  filasPresupuesto.forEach(fila=>{
    const datos = obtenerDatosFilaPorMes(fila, "presupuesto");
    datos.forEach((v, idx)=> totalesPresupuesto[idx]+=v);
  });

  filasReal.forEach(fila=>{
    const datos = obtenerDatosFilaPorMes(fila, "real");
    datos.forEach((v, idx)=> totalesReal[idx]+=v);
  });

  if(presupuestoVsRealChart) presupuestoVsRealChart.destroy();

  presupuestoVsRealChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: meses,
      datasets:[
        {
          label:'Presupuesto',
          data: totalesPresupuesto,
          backgroundColor:'rgba(54,162,235,0.7)',
          borderColor:'rgba(54,162,235,1)',
          borderWidth:1
        },
        {
          label:'Gastos Reales',
          data: totalesReal,
          backgroundColor:'rgba(255,99,132,0.7)',
          borderColor:'rgba(255,99,132,1)',
          borderWidth:1
        }
      ]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:true, position:'top'},
        tooltip:{
          mode:'index',
          intersect:false,
          callbacks:{
            label:function(context){
              return context.dataset.label+': '+context.raw.toLocaleString('es-AR',{minimumFractionDigits:2});
            }
          }
        }
      },
      scales:{
        x:{stacked:false},
        y:{
          beginAtZero:true,
          ticks:{
            callback:function(value){ return value.toLocaleString('es-AR',{minimumFractionDigits:2}); }
          }
        }
      }
    }
  });
}

// --- Actualizar gráfico al editar ---
function habilitarEdicionYActualizar(idTabla){
  const celdas = document.querySelectorAll(`#${idTabla} tbody td`);
  celdas.forEach(celda=>{
    celda.setAttribute("contenteditable","true");
    celda.addEventListener("input", ()=>crearGraficoTotalesMensuales());
  });
}

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', ()=>{
  cargarInflacionGuardada();
  habilitarEdicionInflacion();
  habilitarGastoMesAnterior();
  calcularPresupuesto();
  loadRealTable();
  calcularDiferencias();
  cargarComentarios();
  crearGraficoTotalesMensuales();
  habilitarEdicionYActualizar("presupuesto-table");
  habilitarEdicionYActualizar("real-table");
});



