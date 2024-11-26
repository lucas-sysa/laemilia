document.getElementById('input-excel').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Agrupar filas por "Lote"
        const groupedData = {};
        excelRows.slice(1).forEach(row => {
            const lote = row[2]; // Suponiendo que la columna "Lote" está en el índice 2
            if (!groupedData[lote]) {
                groupedData[lote] = [];
            }
            groupedData[lote].push(row);
        });

        // Guardar datos en localStorage
        localStorage.setItem('excelData', JSON.stringify(groupedData));

        // Renderizar la tabla
        renderTable(groupedData);
    };

    reader.readAsArrayBuffer(file);
});

// Función para renderizar la tabla desde los datos almacenados en localStorage
function renderTable(groupedData) {
    const tableBody = document.querySelector('#excel-table tbody');
    tableBody.innerHTML = ''; // Limpiar tabla

    // Crear filas para cada grupo de "Lote"
    Object.keys(groupedData).forEach(lote => {
        groupedData[lote].forEach(row => {
            const newRow = tableBody.insertRow();

            // Insertar las celdas de los datos del archivo Excel
            row.forEach((cell) => {
                const newCell = newRow.insertCell();
                newCell.textContent = cell;
            });

            // Agregar la celda de conteo al final, vacía y editable
            const countCell = newRow.insertCell();
            countCell.contentEditable = true;

            // Agregar la celda de diferencia
            const differenceCell = newRow.insertCell();
            differenceCell.textContent = '';

            // Actualizar la columna de diferencia cuando cambie la columna de conteo
            countCell.addEventListener('input', function () {
                const cantidad = parseFloat(row[4]) || 0; // Valor de la columna "Cantidad"
                const conteo = parseFloat(countCell.textContent) || 0;
                differenceCell.textContent = cantidad - conteo;
            });
        });

        // Agregar una fila vacía entre los grupos de "Lote" para separarlos visualmente
        const emptyRow = tableBody.insertRow();
        const emptyCell = emptyRow.insertCell();
        emptyCell.colSpan = 7; // Ajustar el colSpan al número de columnas en la tabla
        emptyCell.style.height = '10px'; // Espacio visual
    });
}

// Cargar los datos de localStorage al cargar la página
window.addEventListener('load', function () {
    const storedData = localStorage.getItem('excelData');
    if (storedData) {
        const groupedData = JSON.parse(storedData);
        renderTable(groupedData);
    }
});

// Exportar a Excel
document.getElementById('export-btn').addEventListener('click', function() {
    const table = document.getElementById('excel-table');
    const wb = XLSX.utils.table_to_book(table, {sheet: "Sheet1"});
    XLSX.writeFile(wb, 'inventario.xlsx');
});

// Resetear Tabla
document.getElementById('reset-btn').addEventListener('click', function() {
    // Limpiar el contenido del tbody de la tabla
    const tableBody = document.querySelector('#excel-table tbody');
    tableBody.innerHTML = '';

    // Limpiar los datos almacenados en localStorage
    localStorage.removeItem('excelData');
});
document.getElementById('print-btn').addEventListener('click', function() {
    window.print();
});

