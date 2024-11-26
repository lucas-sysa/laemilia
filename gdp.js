document.addEventListener('DOMContentLoaded', function () {
    const positions = document.querySelectorAll('.position');
    const fontSizeControl = document.getElementById('font-size');

    // Configuración inicial para cada posición
    positions.forEach(position => {
        const id = position.getAttribute('id'); // Se asume que cada posición tiene un ID único

        // Restaurar la posición desde localStorage
        let storedPosition = JSON.parse(localStorage.getItem(`position_${id}`));
        
        if (storedPosition) {
            position.style.top = `${storedPosition.top}px`;
            position.style.left = `${storedPosition.left}px`;
            // Tamaño fijo
            position.style.width = '21px'; 
            position.style.height = '28px';
            position.style.fontSize = `${storedPosition.fontSize}px`;
        } else {
            // Inicializar posición con tamaño fijo
            position.style.width = '21px'; // Tamaño fijo
            position.style.height = '28px'; // Tamaño fijo
            position.style.fontSize = '8px'; // Tamaño de fuente inicial
        }

        // Crear un "handle" para redimensionar
        const resizer = document.createElement('div');
        resizer.style.width = '10px';
        resizer.style.height = '10px';
        resizer.style.backgroundColor = 'gray';
        resizer.style.position = 'absolute';
        resizer.style.right = '0';
        resizer.style.bottom = '0';
        resizer.style.cursor = 'se-resize';
        position.appendChild(resizer);

        // Ajustar el tamaño de la fuente para que se ajuste al tamaño de la posición
        function adjustFontSize() {
            const width = position.offsetWidth;
            const height = position.offsetHeight;
            let fontSize = Math.min(width, height) / 3; // Ajustar el divisor para reducir el tamaño de la fuente

            position.style.fontSize = `${fontSize}px`;
        }

        // Llamar a la función para ajustar el tamaño de la fuente
        adjustFontSize();

        let isResizing = false;
        let isMoving = false;

        // Mover posición
        position.addEventListener('mousedown', onMouseDown);

        // Redimensionar posición
        resizer.addEventListener('mousedown', onResizeMouseDown);

        function onMouseDown(event) {
            if (isResizing) return; // Evitar mover mientras se redimensiona
            isMoving = true; // Marcar que está moviendo

            const pos = {
                top: position.offsetTop,
                left: position.offsetLeft,
                fontSize: parseInt(window.getComputedStyle(position).fontSize, 10),
            };

            const startX = event.clientX;
            const startY = event.clientY;

            function onMouseMove(event) {
                if (isMoving) {
                    const deltaX = event.clientX - startX;
                    const deltaY = event.clientY - startY;

                    position.style.top = `${pos.top + deltaY}px`;
                    position.style.left = `${pos.left + deltaX}px`;

                    event.preventDefault();
                }
            }

            function onMouseUp() {
                if (isMoving) {
                    // Guardar la posición en localStorage
                    savePosition();

                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    isMoving = false; // Terminar el movimiento
                }
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function onResizeMouseDown(event) {
            event.stopPropagation(); // Evitar conflicto con mover
            isResizing = true; // Marcar que está redimensionando

            const startX = event.clientX;
            const startY = event.clientY;

            function onResizeMouseMove(event) {
                // El tamaño se mantiene fijo, solo mover si es necesario
                event.preventDefault();
            }

            function onResizeMouseUp() {
                if (isResizing) {
                    // Guardar la posición en localStorage
                    savePosition();
                    isResizing = false; // Terminar el redimensionamiento

                    document.removeEventListener('mousemove', onResizeMouseMove);
                    document.removeEventListener('mouseup', onResizeMouseUp);
                }
            }

            document.addEventListener('mousemove', onResizeMouseMove);
            document.addEventListener('mouseup', onResizeMouseUp);
        }

        function savePosition() {
            localStorage.setItem(`position_${id}`, JSON.stringify({
                top: position.offsetTop,
                left: position.offsetLeft,
                fontSize: parseInt(window.getComputedStyle(position).fontSize, 10)
            }));
        }
    });

    // Cambiar el tamaño de la fuente de la posición seleccionada
    fontSizeControl.addEventListener('input', function () {
        const selectedPositions = document.querySelectorAll('.position.selected');
        const newFontSize = fontSizeControl.value;

        selectedPositions.forEach(position => {
            position.style.fontSize = `${newFontSize}px`;
            adjustFontSize(position); // Asegurarse de ajustar el tamaño de fuente
            savePosition(position); // Guardar tamaño de fuente en localStorage
        });
    });

    function adjustFontSize(position) {
        const width = position.offsetWidth;
        const height = position.offsetHeight;
        let fontSize = Math.min(width, height) / 3; // Ajustar el divisor para reducir el tamaño de la fuente

        position.style.fontSize = `${fontSize}px`;
    }

    function savePosition(position) {
        const id = position.getAttribute('id');
        localStorage.setItem(`position_${id}`, JSON.stringify({
            top: position.offsetTop,
            left: position.offsetLeft,
            fontSize: parseInt(window.getComputedStyle(position).fontSize, 10)
        }));
    }
});








document.addEventListener('DOMContentLoaded', function () {
    const deleteAllButton = document.getElementById('deleteAllButton');
    const orderTableBody = document.querySelector('#orderTable tbody');

    // Función para eliminar todos los datos de la tabla y localStorage
    function deleteAllData() {
        // Eliminar todas las filas de la tabla
        while (orderTableBody.firstChild) {
            orderTableBody.removeChild(orderTableBody.firstChild);
        }

        // Limpiar localStorage
        localStorage.removeItem('orderTableData');

        // Opcional: También puedes limpiar localStorage para las posiciones
        const positions = document.querySelectorAll('.position');
        positions.forEach(position => {
            const id = position.getAttribute('id');
            localStorage.removeItem(`position_${id}`);
        });
    }

    // Manejar el clic en el botón de eliminar
    deleteAllButton.addEventListener('click', function () {
        if (confirm('¿Estás seguro de que quieres eliminar todos los datos?')) {
            deleteAllData();
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.querySelector('#orderTable tbody');

    // Función para eliminar una fila de la tabla y actualizar localStorage
    function deleteRow(row) {
        const posicion = row.cells[4].textContent;

        // Eliminar la fila de la tabla
        orderTableBody.removeChild(row);

        // Actualizar localStorage
        const tableData = JSON.parse(localStorage.getItem('orderTableData')) || [];
        const updatedData = tableData.filter(data => data.posicion !== posicion);
        localStorage.setItem('orderTableData', JSON.stringify(updatedData));

        // Eliminar el color de la posición en el plano
        pintarPosicion(posicion, '');
    }

    // Manejar el clic en el botón de eliminar de la fila
    orderTableBody.addEventListener('click', function (event) {
        if (event.target.classList.contains('deleteRowButton')) {
            const row = event.target.closest('tr');
            if (confirm('¿Estás seguro de que quieres eliminar esta fila?')) {
                deleteRow(row);
            }
        }
    });
});
function deleteRow(row) {
    const posicion = row.cells[4].textContent;

    // Eliminar la fila de la tabla
    orderTableBody.removeChild(row);

    // Actualizar localStorage
    const tableData = JSON.parse(localStorage.getItem('orderTableData')) || [];
    const updatedData = tableData.filter(data => data.posicion !== posicion);
    localStorage.setItem('orderTableData', JSON.stringify(updatedData));

    // Restaurar el color de la posición al color de origen
    const positionDiv = document.getElementById(posicion);
    if (positionDiv) {
        // Limpiar color aplicado anteriormente
        positionDiv.style.backgroundColor = '';

        // Opcional: Puedes aplicar un color de fondo específico para indicar que está disponible
        positionDiv.style.backgroundColor = 'lightgray'; // O el color que prefieras
    }
}













document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('depositForm');
    const orderTableBody = document.querySelector('#orderTable tbody');

    // Función para generar un código de pallet aleatorio
    function generarCodigoPallet() {
        return 'PAL-' + Math.floor(Math.random() * 10000);
    }

function pintarPosicion(posicion, estado) {
    const positionDiv = document.getElementById(posicion);
    if (positionDiv) {
        // Limpiar colores previos
        positionDiv.style.backgroundColor = '';

        // Aplicar color basado en el estado
        switch (estado) {
            case 'ok':
                positionDiv.style.backgroundColor = 'green';
                break;
            case 'retenido':
                positionDiv.style.backgroundColor = 'red';
                break;
            case 'intervenido':
                positionDiv.style.backgroundColor = 'yellow';
                break;
            default:
                // Color de origen si no hay un estado específico
                positionDiv.style.backgroundColor = 'lightgray'; // O el color de origen que prefieras
        }
    }
}

function addRowToTable(orden, modelo, descripcion, cantidad, posicion, codigoPallet, estado) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${orden}</td>
        <td>${modelo}</td>
        <td>${descripcion}</td>
        <td>${cantidad}</td>
        <td>${posicion}</td>
        <td>${codigoPallet}</td>
        <td class="estado">${estado}</td>
        <td>
            <select class="estado-select">
                <option value="ok" ${estado === 'ok' ? 'selected' : ''}>OK</option>
                <option value="retenido" ${estado === 'retenido' ? 'selected' : ''}>Retenido</option>
                <option value="intervenido" ${estado === 'intervenido' ? 'selected' : ''}>Intervenido</option>
            </select>
        </td>
        <td><button class="deleteRowButton">Eliminar</button></td>
    `;
    orderTableBody.appendChild(newRow);
    saveTableData(); // Guardar la tabla en localStorage después de agregar una fila
    pintarPosicion(posicion, estado); // Pintar la posición con el color correcto
}

    // Función para guardar la tabla en localStorage
    function saveTableData() {
        const rows = Array.from(orderTableBody.getElementsByTagName('tr'));
        const tableData = rows.map(row => {
            const cells = row.getElementsByTagName('td');
            return {
                orden: cells[0].textContent,
                modelo: cells[1].textContent,
                descripcion: cells[2].textContent,
                cantidad: cells[3].textContent,
                posicion: cells[4].textContent,
                codigoPallet: cells[5].textContent,
                estado: cells[6].textContent
            };
        });
        localStorage.setItem('orderTableData', JSON.stringify(tableData));
    }

    // Función para cargar los datos de la tabla desde localStorage
    function loadTableData() {
        const tableData = JSON.parse(localStorage.getItem('orderTableData')) || [];
        tableData.forEach(data => {
            addRowToTable(data.orden, data.modelo, data.descripcion, data.cantidad, data.posicion, data.codigoPallet, data.estado);
        });
    }

    // Manejar el envío del formulario
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Obtener los valores del formulario
        const orden = document.getElementById('orden').value.trim();
        const modelo = document.getElementById('modelo').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();
        const cantidad = document.getElementById('cantidad').value.trim();
        const posicion = document.getElementById('posicion').value.trim();
        const estado = document.getElementById('estado').value.trim();

        if (!orden || !modelo || !descripcion || !cantidad || !posicion || !estado) {
            alert('Por favor, completa todos los campos del formulario.');
            return;
        }

        // Generar automáticamente el código de pallet
        const codigoPallet = generarCodigoPallet();
        document.getElementById('codigoPallet').value = codigoPallet;

        // Agregar fila a la tabla
        addRowToTable(orden, modelo, descripcion, cantidad, posicion, codigoPallet, estado);

        // Resetear el formulario
        form.reset();
    });

    // Manejar el cambio del select
    orderTableBody.addEventListener('change', function (event) {
        if (event.target.classList.contains('estado-select')) {
            const row = event.target.closest('tr');
            const estadoCell = row.querySelector('.estado');
            const posicion = row.cells[4].textContent;
            const nuevoEstado = event.target.value;

            // Actualizar el estado en la celda
            estadoCell.textContent = nuevoEstado;

            // Pintar la posición con el nuevo color
            pintarPosicion(posicion, nuevoEstado);

            // Guardar los cambios en localStorage
            saveTableData();
        }
    });

    // Cargar los datos al cargar la página
    loadTableData();
});




document.addEventListener('DOMContentLoaded', function () {
    const exportButton = document.getElementById('exportButton');
    const orderTable = document.getElementById('orderTable');

    // Función para exportar la tabla a un archivo Excel
    function exportTableToExcel(tableID, filename = '') {
        // Obtener la tabla
        let table = document.getElementById(tableID);
        let wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });

        // Generar el archivo Excel
        let wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

        // Función para convertir los datos a formato binario adecuado
        function s2ab(s) {
            var buf = new ArrayBuffer(s.length);
            var view = new Uint8Array(buf);
            for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }

        // Guardar el archivo usando FileSaver.js
        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), filename || 'data.xlsx');
    }

    // Manejar el clic en el botón de exportación
    exportButton.addEventListener('click', function () {
        exportTableToExcel('orderTable', 'datos_inventario.xlsx');
    });
});

