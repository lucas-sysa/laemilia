// Función para contar las diferencias positivas y negativas
function updateDifferencesCount() {
    let positiveCount = 0;
    let negativeCount = 0;

    // Recorremos todas las filas de la tabla de conteo
    document.querySelectorAll('#conteoBody tr').forEach(row => {
        const diferencia = parseFloat(row.querySelector('.diferencia').value) || 0;
        if (diferencia > 0) {
            positiveCount++;
        } else if (diferencia < 0) {
            negativeCount++;
        }
    });

    // Actualizamos los contadores en la interfaz
    document.getElementById('positiveCount').textContent = positiveCount;
    document.getElementById('negativeCount').textContent = negativeCount;
}

// Función para contar los racks ocupados y vacíos
function updateRackStatusCount() {
    let occupiedCount = 0;
    let emptyCount = 0;

    // Recorremos todas las filas de la tabla de conteo
    document.querySelectorAll('.estado-rack').forEach(select => {
        if (select.value === 'ocupado') {
            occupiedCount++;
        } else if (select.value === 'vacío') {
            emptyCount++;
        }
    });

    // Actualizamos los contadores en la interfaz
    document.getElementById('occupiedCount').textContent = occupiedCount;
    document.getElementById('emptyCount').textContent = emptyCount;
}

// Nueva función para contar las posiciones agregadas
function updatePositionCount() {
    const positionCount = document.querySelectorAll('#conteoBody tr').length; // Contar filas
    document.getElementById('positionCount').textContent = positionCount; // Actualizar contador en la interfaz
}

// Función para guardar datos en localStorage
function saveData() {
    const rowsData = [];
    document.querySelectorAll('#conteoBody tr').forEach(row => {
        const rowData = {
            calle: row.querySelector('.calle').value,
            posicion: row.querySelector('.posicion').value,
            orden: row.querySelector('.orden').value,
            descripcion: row.querySelector('.descripcion').value,
            palletSistema: row.querySelector('.pallet-sistema').value,
            palletFisico: row.querySelector('.pallet-fisico').value,
            diferencia: row.querySelector('.diferencia').value,
            estadoRack: row.querySelector('.estado-rack').value,
            observaciones: row.querySelector('.observaciones').value,
        };
        rowsData.push(rowData);
    });
    localStorage.setItem('conteoData', JSON.stringify(rowsData));
}

// Función para cargar datos desde localStorage
function loadData() {
    const storedData = localStorage.getItem('conteoData');
    if (storedData) {
        const rowsData = JSON.parse(storedData);
        rowsData.forEach(data => {
            addRow(data);
        });
    }
}

// Función para añadir una nueva fila en la Planilla de Conteo
function addRow(data = {}) {
    const tableBody = document.getElementById('conteoBody');

    // Crear una nueva fila con los campos
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>
            <select class="calle">
                <option value="Calle 1" ${data.calle === 'Calle 1' ? 'selected' : ''}>Calle 1</option>
                <option value="Calle 2" ${data.calle === 'Calle 2' ? 'selected' : ''}>Calle 2</option>
                <option value="Calle 3" ${data.calle === 'Calle 3' ? 'selected' : ''}>Calle 3</option>
                <option value="Calle 4" ${data.calle === 'Calle 4' ? 'selected' : ''}>Calle 4</option>
                <option value="Calle 5" ${data.calle === 'Calle 5' ? 'selected' : ''}>Calle 5</option>
            </select>
        </td>
        <td><input type="text" class="posicion" value="${data.posicion || ''}"></td>
        <td><input type="text" class="orden" value="${data.orden || ''}"></td>
        <td><input type="text" class="descripcion" value="${data.descripcion || ''}"></td>
        <td><input type="number" class="pallet-sistema" value="${data.palletSistema || 0}"></td>
        <td><input type="number" class="pallet-fisico" value="${data.palletFisico || 0}"></td>
        <td><input type="text" class="diferencia" value="${data.diferencia || ''}" readonly></td>
        <td>
            <select class="estado-rack">
                <option value="vacío" ${data.estadoRack === 'vacío' ? 'selected' : ''}>Vacío</option>
                <option value="ocupado" ${data.estadoRack === 'ocupado' ? 'selected' : ''}>Ocupado</option>
            </select>
        </td>
        <td><input type="text" class="observaciones" value="${data.observaciones || ''}"></td>
        <td><button class="deleteRow">Eliminar</button></td> <!-- Botón para eliminar -->
    `;

    // Añadir la nueva fila a la tabla
    tableBody.appendChild(newRow);

    // Agregar el evento para calcular la diferencia entre los pallets
    newRow.querySelector('.pallet-fisico').addEventListener('input', function () {
        const palletSistema = parseFloat(newRow.querySelector('.pallet-sistema').value) || 0;
        const palletFisico = parseFloat(this.value) || 0;
        
        const diferencia = palletFisico - palletSistema;
        newRow.querySelector('.diferencia').value = diferencia;

        // Actualizamos los contadores de diferencias
        updateDifferencesCount();
        saveData(); // Guardar datos en localStorage
    });

    // Evento para actualizar el estado del rack
    newRow.querySelector('.estado-rack').addEventListener('change', () => {
        updateRackStatusCount();
        saveData(); // Guardar datos en localStorage
    });

    // Agregar el evento para las observaciones
    newRow.querySelector('.observaciones').addEventListener('input', saveData);

    // Agregar el evento para eliminar la fila
    newRow.querySelector('.deleteRow').addEventListener('click', function () {
        newRow.remove(); // Eliminar la fila
        saveData(); // Guardar datos en localStorage después de eliminar
        updateDifferencesCount(); // Actualizar contadores de diferencias
        updateRackStatusCount(); // Actualizar contadores de racks
        updatePositionCount(); // Actualizar contador de posiciones
    });

    // Actualizar contadores
    updateDifferencesCount();
    updateRackStatusCount();
    updatePositionCount(); // Actualizar contador de posiciones
    saveData(); // Guardar datos en localStorage
}

// Al cargar la página, cargamos los datos existentes
window.onload = () => {
    loadData();
    document.getElementById('exportExcel').addEventListener('click', exportToExcel); // Evento de exportación
    document.getElementById('addRow').addEventListener('click', addRow); // Evento para agregar filas
};

// Función para exportar los datos de la tabla a Excel
function exportToExcel() {
    const tableData = []; // Arreglo para almacenar los datos de la tabla
    const headers = ['Calle', 'Posición', 'Orden', 'Descripción', 'Pallet Sistema', 'Pallet Físico', 'Diferencia', 'Estado Rack', 'Observaciones'];

    // Agregar los encabezados de la sección de estadísticas
    const statsHeaders = ['Estadísticas', 'Valores'];
    const statsData = [
        ['Diferencias Positivas', document.getElementById('positiveCount').textContent || 0], 
        ['Diferencias Negativas', document.getElementById('negativeCount').textContent || 0], 
        ['Racks Ocupados', document.getElementById('occupiedCount').textContent || 0], 
        ['Racks Vacíos', document.getElementById('emptyCount').textContent || 0], 
        ['Cantidad de Posiciones', document.getElementById('positionCount').textContent || 0]
    ];
    
    // Agregar encabezados al arreglo de datos
    tableData.push(statsHeaders);
    statsData.forEach(stat => tableData.push(stat));

    // Agregar una fila vacía para separar
    tableData.push([]);

    // Agregar encabezados de la tabla
    tableData.push(headers);

    // Recorremos todas las filas de la tabla de conteo
    document.querySelectorAll('#conteoBody tr').forEach(row => {
        const rowData = [];
        rowData.push(row.querySelector('.calle').value);
        rowData.push(row.querySelector('.posicion').value);
        rowData.push(row.querySelector('.orden').value);
        rowData.push(row.querySelector('.descripcion').value);
        rowData.push(row.querySelector('.pallet-sistema').value);
        rowData.push(row.querySelector('.pallet-fisico').value);
        rowData.push(row.querySelector('.diferencia').value);
        rowData.push(row.querySelector('.estado-rack').value);
        rowData.push(row.querySelector('.observaciones').value);
        tableData.push(rowData); // Agregar datos de la fila al arreglo
    });

    // Convertir los datos a una hoja de Excel y descargar
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conteo');
    XLSX.writeFile(workbook, 'planilla_conteo.xlsx'); // Descargar archivo Excel
}

