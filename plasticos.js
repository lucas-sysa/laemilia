document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('stockTable').querySelector('tbody');
    const actionDialog = document.getElementById('actionDialog');
    const entradaBtn = document.getElementById('entradaBtn');
    const salidaBtn = document.getElementById('salidaBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const logContainer = document.getElementById('logContainer');
    const logList = document.getElementById('logList');
    const closeLogBtn = document.getElementById('closeLogBtn');
    const cardModal = document.getElementById('cardModal');
    const cardOverlay = document.getElementById('cardOverlay');
    const cardInput = document.getElementById('cardInput');
    const cancelCardBtn = document.getElementById('cancelCardBtn');
    const actionOverlay = document.getElementById('actionOverlay');

    let currentBarcode = '';
    let actionType = '';
    let cardNumber = '';

    // Cargar datos desde localStorage al cargar la página
    const savedData = JSON.parse(localStorage.getItem('stockData')) || [];
    if (savedData.length > 0) {
        savedData.forEach(item => addProductToTable(item));
    } else {
        console.log('No hay datos guardados en el localStorage.');
    }

    // Mostrar el historial de movimientos guardado en el log al cargar la página
    updateLog();

    document.getElementById('barcodeInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            currentBarcode = this.value.trim();
            if (currentBarcode) {
                showActionDialog(currentBarcode);
                this.value = '';  // Limpiar el campo después de leer el código
            } else {
                alert('Por favor, ingresa un código de barras válido.');
            }
        }
    });

    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault(); // Evitar el envío del formulario
        const codigo = document.getElementById('codigo').value.trim();
        const modelo = document.getElementById('modelo').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();

        if (codigo && modelo && descripcion) {
            const newProduct = {
                codigo,
                modelo,
                descripcion,
                stock: 0 // Inicializar el stock en 0
            };
            addProductToTable(newProduct);
            document.getElementById('productForm').reset(); // Limpiar el formulario
            updateLocalStorage(); // Actualizar el localStorage
        } else {
            alert('Por favor, completa todos los campos.');
        }
    });

    entradaBtn.addEventListener('click', function() {
        showCardModal('entrada');
    });

    salidaBtn.addEventListener('click', function() {
        showCardModal('salida');
    });

    cancelBtn.addEventListener('click', function() {
        hideActionDialog();
    });

    cardInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            cardNumber = this.value.trim();
            if (cardNumber) {
                processBarcode(currentBarcode, actionType);
                hideActionDialog();
                hideCardModal();
            } else {
                alert('Por favor, ingresa un número de tarjeta válido.');
            }
            this.value = '';
        }
    });

    cancelCardBtn.addEventListener('click', function() {
        hideCardModal();
    });

    function showCardModal(action) {
        actionType = action;
        cardModal.style.display = 'block';
        cardOverlay.style.display = 'block';
        cardInput.focus();
    }

    function hideCardModal() {
        cardModal.style.display = 'none';
        cardOverlay.style.display = 'none';
    }

    function showActionDialog(barcode) {
        const rows = document.querySelectorAll('#stockTable tbody tr');
        let productFound = false;
        let productDetails = '';

        rows.forEach(row => {
            const codigo = row.children[0].textContent.trim();
            if (codigo === barcode) {
                productFound = true;
                const modelo = row.children[1].textContent.trim();
                const descripcion = row.children[2].textContent.trim();
                productDetails = `Código: ${codigo}, Modelo: ${modelo}, Descripción: ${descripcion}`;
            }
        });

        if (productFound) {
            document.getElementById('dialogMessage').textContent = `Producto encontrado: ${productDetails}. ¿Qué acción quieres realizar?`;
            actionDialog.style.display = 'block';
            actionOverlay.style.display = 'block';
        } else {
            alert('Producto no encontrado para el código: ' + barcode);
        }
    }

    function hideActionDialog() {
        actionDialog.style.display = 'none';
        actionOverlay.style.display = 'none';
    }

    function processBarcode(barcode, action) {
        const rows = document.querySelectorAll('#stockTable tbody tr');
        let productFound = false;

        rows.forEach(row => {
            const codigo = row.children[0].textContent.trim();
            if (codigo === barcode) {
                productFound = true;
                const stockCell = row.querySelector('.stock');
                let currentStock = parseInt(stockCell.textContent, 10);
                let newStock = currentStock;

                if (action === 'entrada') {
                    newStock = currentStock + 1;
                } else if (action === 'salida') {
                    newStock = currentStock - 1;
                }

                if (newStock >= 0) {
                    stockCell.textContent = newStock;
                    updateMovements(barcode, `Código: ${codigo} - ${action === 'entrada' ? 'Entrada' : 'Salida'}: 1 unidad`, cardNumber);
                    updateLocalStorage();
                } else {
                    alert('El stock no puede ser negativo.');
                }
            }
        });

        if (!productFound) {
            alert('Producto no encontrado para el código: ' + barcode);
        }
    }

function addProductToTable(item) {
    const table = document.getElementById('stockTable').querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${item.codigo}</td>
        <td>${item.modelo}</td>
        <td>${item.descripcion}</td>
        <td class="stock">${item.stock}</td>
        <td><input type="text" class="estanteria" value="${item.estanteria || ''}"></td> <!-- Columna estantería -->
        <td><input type="number" class="entrada" min="0"></td>
        <td><input type="number" class="salida" min="0"></td>
        <td><input type="number" class="canasto" min="0" value="${item.canasto || 0}"></td>
        <td class="diferencia">${(item.stock * (item.canasto || 0)).toFixed(2)}</td>
       <td><button class="deleteBtn">Eliminar</button></td>
    `;
    table.appendChild(newRow);
    attachInputEvents(newRow);
    attachDeleteEvent(newRow);
    attachEstanteriaEvent(newRow); // Adjuntar evento a la columna estantería
}

function attachEstanteriaEvent(row) {
    const estanteriaInput = row.querySelector('.estanteria');
    estanteriaInput.addEventListener('input', function () {
        const codigo = row.children[0].textContent.trim();
        saveEstanteriaToLocalStorage(codigo, this.value);
    });
}

function saveEstanteriaToLocalStorage(codigo, estanteriaValue) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const updatedData = stockData.map(item => {
        if (item.codigo === codigo) {
            item.estanteria = estanteriaValue;
        }
        return item;
    });
    localStorage.setItem('stockData', JSON.stringify(updatedData));
}

    function attachInputEvents(row) {
        row.querySelector('.entrada').addEventListener('input', function() {
            const stockCell = row.querySelector('.stock');
            let currentStock = parseInt(stockCell.textContent, 10);
            const entradaValue = parseInt(this.value, 10) || 0;

            currentStock += entradaValue;
            stockCell.textContent = currentStock;
            this.value = '';
            updateCanastoCalculation(row);  // Actualiza la diferencia al cambiar el stock
            updateMovements(row.children[0].textContent.trim(), `Entrada: ${entradaValue} unidades`, cardNumber);
            updateLocalStorage();
        });

        row.querySelector('.salida').addEventListener('input', function() {
            const stockCell = row.querySelector('.stock');
            let currentStock = parseInt(stockCell.textContent, 10);
            const salidaValue = parseInt(this.value, 10) || 0;

            if (currentStock >= salidaValue) {
                currentStock -= salidaValue;
                stockCell.textContent = currentStock;
                this.value = '';
                updateCanastoCalculation(row);  // Actualiza la diferencia al cambiar el stock
                updateMovements(row.children[0].textContent.trim(), `Salida: ${salidaValue} unidades`, cardNumber);
                updateLocalStorage();
            } else {
                alert('No hay suficiente stock para la salida.');
            }
        });

        row.querySelector('.canasto').addEventListener('input', function() {
            updateCanastoCalculation(row);  // Actualiza la diferencia al cambiar la cantidad por canasto

    function updateCanastoCalculation(row) {
        const stockCell = row.querySelector('.stock');
        const canastoCell = row.querySelector('.canasto');
        const diferenciaCell = row.querySelector('.diferencia');

        let stock = parseInt(stockCell.textContent, 10);
        let canastoQuantity = parseInt(canastoCell.value, 10) || 0; // Asegúrate de que no sea 0 para evitar errores

        // Realizar la multiplicación y mostrarla en la columna "diferencia"
        let multiplicacion = stock * canastoQuantity;
        diferenciaCell.textContent = multiplicacion.toFixed(2);
    }
});
    row.querySelector('.canasto').addEventListener('input', function() {
        const stockCell = row.querySelector('.stock');
        const canastoCell = row.querySelector('.canasto');
        const diferenciaCell = row.querySelector('.diferencia');

        let stock = parseInt(stockCell.textContent, 10);
        let canastoQuantity = parseInt(canastoCell.value, 10) || 1; // Asegurarse de que no sea 0 para evitar errores

        // Realizar la multiplicación y mostrarla en la columna "diferencia"
        let multiplicacion = stock * canastoQuantity;
        diferenciaCell.textContent = multiplicacion.toFixed(2);

        // Guardar el dato actualizado en localStorage
        updateLocalStorage();
    });
}

function saveCanastoToLocalStorage(codigo, canastoQuantity) {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const updatedData = stockData.map(item => {
        if (item.codigo === codigo) {
            item.canasto = canastoQuantity;
            item.diferencia = item.stock * canastoQuantity; // Actualizar la diferencia si es necesario
        }
        return item;
    });
    localStorage.setItem('stockData', JSON.stringify(updatedData));
}

    function attachDeleteEvent(row) {
        row.querySelector('.deleteBtn').addEventListener('click', function() {
            if (confirm('¿Está seguro de que desea eliminar este producto?')) {
                row.remove();
                updateLocalStorage();
            }
        });
    }

function updateMovements(productCode, actionDetails, cardNumber) {
    const validCards = JSON.parse(localStorage.getItem('validCards')) || {};
    const cardOwner = validCards[cardNumber] || 'Desconocido';

    const logItem = document.createElement('li');
    logItem.textContent = `${new Date().toLocaleString()} - Producto: ${productCode} - Acción: ${actionDetails} - Tarjeta: ${cardNumber} - Nombre: ${cardOwner}`;
    logList.appendChild(logItem);

    localStorage.setItem('movementsLog', logList.innerHTML);
}

    function updateLog() {
        const savedLog = localStorage.getItem('movementsLog');
        if (savedLog) {
            logList.innerHTML = savedLog;
        }
    }

function updateLocalStorage() {
    const rows = document.querySelectorAll('#stockTable tbody tr');
    const stockData = [];

    rows.forEach(row => {
        stockData.push({
            codigo: row.children[0].textContent.trim(),
            modelo: row.children[1].textContent.trim(),
            descripcion: row.children[2].textContent.trim(),
            stock: parseInt(row.querySelector('.stock').textContent, 10),
            estanteria: row.querySelector('.estanteria').value.trim(), // Guardar estantería
            canasto: parseFloat(row.querySelector('.canasto').value) || 0,
            diferencia: parseFloat(row.querySelector('.diferencia').textContent) || 0
        });
    });

    localStorage.setItem('stockData', JSON.stringify(stockData));
    console.log('Datos guardados en localStorage:', stockData);
}

    document.getElementById('showLogBtn').addEventListener('click', function() {
        logContainer.style.display = 'block';
    });

    closeLogBtn.addEventListener('click', function() {
        logContainer.style.display = 'none';
    });
});


// Inicializar las tarjetas válidas
const validCards = {
    '6771931': 'Lucas Crocetti',
    '0669215203': 'Gimena ',
    '2761687200': 'Claudo Marti',
    '0521390102': 'Florencia ',
}; // Lista de tarjetas válidas con nombres asociados
localStorage.setItem('validCards', JSON.stringify(validCards));

// Listener para el botón de exportación
document.getElementById('exportLogBtn').addEventListener('click', function() {
    exportLogToExcel();
});

// Función de exportación
function exportLogToExcel() {
    const logItems = document.querySelectorAll('#logList li');

    const data = Array.from(logItems).map(item => {
        const logText = item.textContent;

        // Dividir la cadena con seguridad
        const [datetime, rest] = logText.split(' - Producto: ') || ['', ''];
        const [date, time] = datetime ? datetime.split(', ') : ['', ''];
        const [product, actionRest] = rest ? rest.split(' - Acción: ') : ['', ''];
        const [actionDetail, cardRest] = actionRest ? actionRest.split(' - Tarjeta: ') : ['', ''];
        const [cardNumber, cardOwner] = cardRest ? cardRest.split(' - Nombre: ') : ['', ''];

        const isEntrada = actionDetail.includes('Entrada');
        const isSalida = actionDetail.includes('Salida');
        const entrada = isEntrada ? actionDetail.split('Entrada: ')[1]?.split(' ')[0] : '';
        const salida = isSalida ? actionDetail.split('Salida: ')[1]?.split(' ')[0] : '';

        return {
            Fecha: date || 'Desconocido',
            Hora: time || 'Desconocido',
            Producto: product || 'Desconocido',
            Acción: isEntrada ? 'Entrada' : (isSalida ? 'Salida' : 'Desconocido'),
            Entrada: entrada || '',
            Salida: salida || '',
            Tarjeta: cardNumber ? cardNumber.trim() : 'Desconocido',
            Nombre: cardOwner ? cardOwner.trim() : 'Desconocido'
        };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Historial de Movimientos');
    XLSX.writeFile(wb, 'Historial_Movimientos.xlsx');
}

document.getElementById('exportStockBtn').addEventListener('click', function() {
    exportStockData();
});

function exportStockData() {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    const blob = new Blob([JSON.stringify(stockData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stockData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
document.getElementById('importStockBtn').addEventListener('click', function() {
    document.getElementById('importStockFile').click();
});

document.getElementById('importStockFile').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('stockData', JSON.stringify(data));
            location.reload(); // Recargar la página para mostrar los datos importados
        };
        reader.readAsText(file);
    } else {
        alert('Por favor, selecciona un archivo JSON válido.');
    }
});
document.getElementById('syncDataBtn').addEventListener('click', function() {
    syncData();
});

function syncData() {
    const stockData = JSON.parse(localStorage.getItem('stockData')) || [];
    fetch('https://example.com/api/uploadStockData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockData)
    })
    .then(response => response.json())
    .then(data => console.log('Datos sincronizados:', data))
    .catch(error => console.error('Error al sincronizar datos:', error));
}
fetch('https://example.com/api/getStockData')
    .then(response => response.json())
    .then(data => {
        localStorage.setItem('stockData', JSON.stringify(data));
        location.reload(); // Recargar la página para mostrar los datos importados
    })
    .catch(error => console.error('Error al recuperar datos:', error));

document.getElementById('clearAllBtn').addEventListener('click', function() {
    if (confirm('¿Estás seguro de que deseas limpiar todos los datos?')) {
        clearAllData();
    }
});

function clearAllData() {
    // Limpiar datos de la tabla
    const tableBody = document.querySelector('#stockTable tbody');
    tableBody.innerHTML = '';

    // Limpiar localStorage
    localStorage.removeItem('stockData');
    localStorage.removeItem('movementsLog');
    localStorage.removeItem('validCards');

    // Opcionalmente, recargar la página para asegurar que los cambios se reflejen
    location.reload();
}
document.getElementById('searchInput').addEventListener('input', function () {
    const searchValue = this.value.toLowerCase();
    const rows = document.querySelectorAll('#stockTable tbody tr');

    rows.forEach(row => {
        const codigo = row.children[0].textContent.toLowerCase();
        const modelo = row.children[1].textContent.toLowerCase();
        const descripcion = row.children[2].textContent.toLowerCase();
        const estanteria = row.children[4].textContent.toLowerCase();

        if (codigo.includes(searchValue) || modelo.includes(searchValue) || descripcion.includes(searchValue) || estanteria.includes(searchValue)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});
window.addEventListener('resize', adjustTable);

function adjustTable() {
    const table = document.getElementById('stockTable');
    const tableWrapper = table.parentElement;

    // Asegúrate de que la tabla se ajuste al contenedor principal
    table.style.width = `${tableWrapper.offsetWidth}px`;

    // Si tienes columnas con inputs ajustables
    const inputs = table.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.width = '100%';
    });
}

// Llama la función al cargar la página por primera vez
adjustTable();
function addProductToTable(item) {
    const table = document.getElementById('stockTable').querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${item.codigo}</td>
        <td>${item.modelo}</td>
        <td>${item.descripcion}</td>
        <td class="stock">${item.stock}</td>
        <td><input type="text" class="estanteria" value="${item.estanteria || ''}"></td>
        <td><input type="number" class="entrada" min="0"></td>
        <td><input type="number" class="salida" min="0"></td>
        <td><input type="number" class="canasto" min="0" value="${item.canasto || 0}"></td>
        <td class="diferencia">${(item.stock * (item.canasto || 0)).toFixed(2)}</td>

    `;
    table.appendChild(newRow);
    attachInputEvents(newRow);
    attachDeleteEvent(newRow);
    attachEstanteriaEvent(newRow);

    adjustTable(); // Ajusta la tabla tras agregar una nueva fila
}
window.addEventListener('resize', adjustTableFontSize);

function adjustTableFontSize() {
    const table = document.getElementById('stockTable');
    const viewportWidth = window.innerWidth;

    if (viewportWidth < 768) {
        table.style.fontSize = '0.85rem'; // Tamaño de fuente más pequeño
    } else if (viewportWidth < 1024) {
        table.style.fontSize = '1rem'; // Tamaño medio
    } else {
        table.style.fontSize = '1.15rem'; // Tamaño normal en pantallas grandes
    }
}

// Llamar al ajuste inicial al cargar la página
adjustTableFontSize();
const rows = document.querySelectorAll('#stockTable tbody tr');
rows.forEach(row => {
    row.style.fontSize = '14px'; // Cambia este valor según sea necesario
});
const specificCell = document.querySelector('#stockTable tbody tr:nth-child(1) td:nth-child(2)');
specificCell.style.fontSize = '16px'; // Cambia el tamaño de letra de la segunda celda de la primera fila
function addProductToTable(item) {
    const table = document.getElementById('stockTable').querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td style="font-size: 14px;">${item.codigo}</td>
        <td style="font-size: 14px;">${item.modelo}</td>
        <td style="font-size: 14px;">${item.descripcion}</td>
        <td class="stock" style="font-size: 14px;">${item.stock}</td>
        <td><input type="text" class="estanteria" value="${item.estanteria || ''}" style="font-size: 14px;"></td>
        <td><input type="number" class="entrada" min="0" style="font-size: 14px;"></td>
        <td><input type="number" class="salida" min="0" style="font-size: 14px;"></td>
        <td><input type="number" class="canasto" min="0" value="${item.canasto || 0}" style="font-size: 14px;"></td>
        <td class="diferencia" style="font-size: 14px;">${(item.stock * (item.canasto || 0)).toFixed(2)}</td>

    `;
    table.appendChild(newRow);
    attachInputEvents(newRow);
    attachDeleteEvent(newRow);
    attachEstanteriaEvent(newRow);
}

