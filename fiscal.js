document.addEventListener('DOMContentLoaded', function() {
    loadPositions();
    loadEntries();

    document.getElementById('entryForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const orden = document.getElementById('orden').value.trim();
        const modelo = document.getElementById('modelo').value.trim();
        const cantidad = document.getElementById('cantidad').value.trim();
        const estado = document.getElementById('estado').value.trim();
        const contenedor = document.getElementById('contenedor').value.trim();
        const calle = document.getElementById('calle').value.trim();
        const sector = document.getElementById('sector').value.trim();
        const posicion = document.getElementById('posicion').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();

        const fechaIngreso = new Date().toISOString().split('T')[0];
        const positionId = `${sector}-${posicion}`;
        const positionElement = document.getElementById(positionId);

        if (positionElement) {
            if (positionElement.classList.contains('occupied')) {
                alert('La posición ya está ocupada. Primero libérela antes de agregar una nueva entrada.');
                return;
            }

            positionElement.classList.add('occupied');
            positionElement.textContent = orden; // Muestra la orden en la posición

            const table = document.getElementById('entriesTable').getElementsByTagName('tbody')[0];
            const newRow = table.insertRow();

            const selectCell = newRow.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            selectCell.appendChild(checkbox);

            newRow.insertCell(1).textContent = orden;
            newRow.insertCell(2).textContent = modelo;
            newRow.insertCell(3).textContent = cantidad;
            newRow.insertCell(4).textContent = estado;
            newRow.insertCell(5).textContent = contenedor;
            newRow.insertCell(6).textContent = calle;
            newRow.insertCell(7).textContent = sector;
            newRow.insertCell(8).textContent = posicion;
            newRow.insertCell(9).textContent = descripcion; // Nuevo campo
            newRow.insertCell(10).textContent = fechaIngreso; // Fecha de Ingreso
            newRow.insertCell(11).textContent = '0'; // Días de Guardado inicial

            const commentCell = newRow.insertCell(12);
            const commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.className = 'comment-input';
            commentInput.disabled = true; // Deshabilitado por defecto
            commentCell.appendChild(commentInput);

            checkbox.addEventListener('change', function() {
                commentInput.disabled = !checkbox.checked;
                if (!commentInput.disabled) {
                    commentInput.focus(); // Enfocar el campo de comentario cuando se habilite
                }
                updatePositionColor(positionElement, commentInput.value);
            });

             commentInput.addEventListener('input', function() {
                saveEntries();
                updatePositionColor(positionElement, commentInput.value);
            });

            updatePositionState(positionElement, estado);

            saveEntries();
            savePositions();
        } else {
            alert('La posición ingresada no existe.');
        }

        this.reset();
    });


    document.getElementById('exportDataBtn').addEventListener('click', exportDataToExcel);

    document.getElementById('importDataBtn').addEventListener('click', function() {
        document.getElementById('importDataInput').click();
    });

    document.getElementById('importDataInput').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = JSON.parse(e.target.result);
                importData(data);
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('search').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#entriesTable tbody tr');
        rows.forEach(row => {
            const cells = row.getElementsByTagName('td');
            const matches = Array.from(cells).some(cell => cell.textContent.toLowerCase().includes(searchTerm));
            row.style.display = matches ? '' : 'none';
        });
    });

    document.getElementById('changeStateBtn').addEventListener('click', function() {
        const selectedRows = document.querySelectorAll('#entriesTable tbody input[type="checkbox"]:checked');
        selectedRows.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const stateCell = row.cells[4];
            const currentState = stateCell.textContent;
            const newState = currentState === 'No Liberado' ? 'Liberado' : 'No Liberado';
            stateCell.textContent = newState;
            const sector = row.cells[7].textContent;
            const posicion = row.cells[8].textContent;
            const positionId = `${sector}-${posicion}`;
            const positionElement = document.getElementById(positionId);
            if (positionElement) {
                updatePositionState(positionElement, newState);
            }
            const diasGuardado = calcularDiasGuardado(row.cells[10].textContent);
            row.cells[11].textContent = diasGuardado;
            actualizarColorDiasGuardado(row.cells[11], diasGuardado);
        });
        saveEntries();
        savePositions();
    });

    document.getElementById('deleteSelectedBtn').addEventListener('click', function() {
        const selectedRows = document.querySelectorAll('#entriesTable tbody input[type="checkbox"]:checked');
        selectedRows.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const sector = row.cells[7].textContent;
            const posicion = row.cells[8].textContent;
            const positionId = `${sector}-${posicion}`;
            const positionElement = document.getElementById(positionId);
            if (positionElement) {
                positionElement.classList.remove('occupied');
                positionElement.textContent = positionElement.getAttribute('data-position'); // Muestra el número de posición
                updatePositionState(positionElement, 'Libre'); // Actualiza el color al gris
            }
            row.remove();
        });
        saveEntries();
        savePositions();
    });

    interact('.position')
        .draggable({
            onmove: function(event) {
                const target = event.target;
                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
                target.style.transform = `translate(${x}px, ${y}px)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);
                savePositions();
            }
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true }
        })
        .on('resizemove', function(event) {
            const target = event.target;
            let x = parseFloat(target.getAttribute('data-x')) || 0;
            let y = parseFloat(target.getAttribute('data-y')) || 0;
            target.style.width = `${event.rect.width}px`;
            target.style.height = `${event.rect.height}px`;
            x += event.deltaRect.left;
            y += event.deltaRect.top;
            target.style.transform = `translate(${x}px, ${y}px)`;
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            savePositions();
        });

    function savePositions() {
        const positions = {};
        document.querySelectorAll('.position').forEach(position => {
            positions[position.id] = {
                x: parseFloat(position.getAttribute('data-x')) || 0,
                y: (parseFloat(position.getAttribute('data-y')) || 0),
                width: position.style.width || '50px',
                height: position.style.height || '50px',
                occupied: position.classList.contains('occupied'),
                orden: position.classList.contains('occupied') ? position.textContent : '',
                estado: position.dataset.estado || 'Libre'
            };
        });
        localStorage.setItem('positions', JSON.stringify(positions));
    }

    function loadPositions() {
        const positions = JSON.parse(localStorage.getItem('positions')) || {};
        Object.keys(positions).forEach(id => {
            const position = document.getElementById(id);
            const data = positions[id];
            if (position) {
                position.style.transform = `translate(${data.x}px, ${data.y}px)`;
                position.style.width = data.width;
                position.style.height = data.height;
                position.classList.toggle('occupied', data.occupied);
                position.textContent = data.occupied ? data.orden : position.getAttribute('data-position'); // Muestra el número de posición
                updatePositionState(position, data.estado);
                position.setAttribute('data-x', data.x);
                position.setAttribute('data-y', data.y);
            }
        });
    }

    function saveEntries() {
        const entries = [];
        document.querySelectorAll('#entriesTable tbody tr').forEach(row => {
            const cells = row.getElementsByTagName('td');
            entries.push({
                orden: cells[1].textContent,
                modelo: cells[2].textContent,
                cantidad: cells[3].textContent,
                estado: cells[4].textContent,
                contenedor: cells[5].textContent,
                calle: cells[6].textContent,
                sector: cells[7].textContent,
                posicion: cells[8].textContent,
                descripcion: cells[9].textContent, // Nuevo campo
                fechaIngreso: cells[10].textContent, // Fecha de Ingreso
                diasGuardado: cells[11].textContent, // Días de Guardado
                comentario: cells[12].querySelector('.comment-input').value // Guardar el comentario
            });
        });
        localStorage.setItem('entries', JSON.stringify(entries));
    }

 function loadEntries() {
        const entries = JSON.parse(localStorage.getItem('entries')) || [];
        const table = document.getElementById('entriesTable').getElementsByTagName('tbody')[0];
        entries.forEach(entry => {
            const newRow = table.insertRow();

            const selectCell = newRow.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            selectCell.appendChild(checkbox);

            newRow.insertCell(1).textContent = entry.orden;
            newRow.insertCell(2).textContent = entry.modelo;
            newRow.insertCell(3).textContent = entry.cantidad;
            newRow.insertCell(4).textContent = entry.estado;
            newRow.insertCell(5).textContent = entry.contenedor;
            newRow.insertCell(6).textContent = entry.calle;
            newRow.insertCell(7).textContent = entry.sector;
            newRow.insertCell(8).textContent = entry.posicion;
            newRow.insertCell(9).textContent = entry.descripcion; // Nuevo campo
            newRow.insertCell(10).textContent = entry.fechaIngreso; // Fecha de Ingreso

            const diasGuardado = calcularDiasGuardado(entry.fechaIngreso);
            const diasCell = newRow.insertCell(11);
            diasCell.textContent = diasGuardado; // Días de Guardado

            const commentCell = newRow.insertCell(12);
            const commentInput = document.createElement('input');
            commentInput.type = 'text';
            commentInput.className = 'comment-input';
            commentInput.value = entry.comentario || ''; // Cargar el comentario si ya existe
            commentInput.disabled = true; // Deshabilitado por defecto
            commentCell.appendChild(commentInput);

            checkbox.addEventListener('change', function() {
                commentInput.disabled = !checkbox.checked;
                if (!commentInput.disabled) {
                    commentInput.focus(); // Enfocar el campo de comentario cuando se habilite
                }
                updatePositionColor(document.getElementById(`${entry.sector}-${entry.posicion}`), commentInput.value);
            });

            commentInput.addEventListener('input', function() {
                saveEntries();
                updatePositionColor(document.getElementById(`${entry.sector}-${entry.posicion}`), commentInput.value);
            });

            // Actualiza el color de la celda según los días de guardado
            actualizarColorDiasGuardado(diasCell, diasGuardado);
        });
    }


    function calcularDiasGuardado(fechaIngreso) {
        const fechaActual = new Date();
        const fechaIngresoDate = new Date(fechaIngreso);
        const diferenciaTiempo = fechaActual - fechaIngresoDate;
        const diferenciaDias = Math.floor(diferenciaTiempo / (1000 * 3600 * 24));
        return diferenciaDias;
    }

    function actualizarColorDiasGuardado(celda, dias) {
        if (dias > 25) {
            celda.style.backgroundColor = '#ff0000'; // Rojo brillante
        } else if (dias > 15) {
            celda.style.backgroundColor = '#ffa500'; // Naranja brillante
        } else if (dias < 14) {
            celda.style.backgroundColor = '#00ff00'; // Verde brillante
        } else {
            celda.style.backgroundColor = '#00ff00'; // Blanco (sin color)
        }
    }

    function updatePositionState(positionElement, state) {
        if (state === 'Liberado') {
            positionElement.style.backgroundColor = 'green';
        } else if (state === 'No Liberado') {
            positionElement.style.backgroundColor = 'red';
        } else {
            positionElement.style.backgroundColor = 'gray';
        }
        positionElement.dataset.estado = state; // Guarda el estado en dataset
    }
    function updatePositionColor(positionElement, comment) {
        if (comment.trim()) {
            positionElement.style.backgroundColor = 'yellow'; // Cambiar color si hay comentario
        } else {
            positionElement.style.backgroundColor = ''; // Restaurar color original si no hay comentario
        }
    }

function exportDataToExcel() {
    const table = document.getElementById('entriesTable');
    if (!table) {
        console.error('No se encontró la tabla con id "entriesTable".');
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws_data = [];

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText);
    if (headers.length === 0) {
        console.error('No se encontraron encabezados en la tabla.');
        return;
    }
    ws_data.push(headers);

    Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).map((td, index) => {
            // Verificar si es la celda de comentario
            if (index === 12) {
                const commentInput = td.querySelector('.comment-input');
                return commentInput ? commentInput.value : ''; // Obtener el valor del comentario
            }
            return td.innerText;
        });
        if (cells.length > 0) {
            ws_data.push(cells);
        }
    });
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Datos");

    // Exportar el archivo
    XLSX.writeFile(wb, 'datos.xlsx');
}

    document.getElementById('exportAllBtn').addEventListener('click', exportAll);

    function exportAll() {
        const positions = JSON.parse(localStorage.getItem('positions')) || {};
        const entries = JSON.parse(localStorage.getItem('entries')) || {};

        // Exportar estilos
        const css = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');

        const data = {
            positions,
            entries,
            css
        };

        // Convertir el objeto a una cadena JSON
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

        // Crear un enlace para descargar el archivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'configuracion.json';
        a.click();

        // Liberar el objeto URL
        URL.revokeObjectURL(url);
    }

    function importData(data) {
        // Cargar posiciones
        localStorage.setItem('positions', JSON.stringify(data.positions || {}));
        loadPositions();

        // Cargar entradas
        localStorage.setItem('entries', JSON.stringify(data.entries || []));
        loadEntries();

        // Aplicar estilos
        if (data.css) {
            const style = document.createElement('style');
            style.textContent = data.css;
            document.head.appendChild(style);
        }
    }
    document.getElementById('selectAllCheckbox').addEventListener('change', function() {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll('#entriesTable tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });

});








document.addEventListener('DOMContentLoaded', function() {
    // Función para exportar la configuración
    function exportAll() {
        const positions = JSON.parse(localStorage.getItem('positions')) || {};
        const entries = JSON.parse(localStorage.getItem('entries')) || [];

        const data = {
            positions,
            entries
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'configuracion.json';
        document.body.appendChild(a); // Necesario para Firefox
        a.click();
        document.body.removeChild(a); // Limpiar
        URL.revokeObjectURL(url);

        // Guarda la marca de tiempo de la exportación
        localStorage.setItem('lastExport', new Date().getTime());
    }

    // Función para exportar la configuración automáticamente cada una hora
    function exportarConfiguracionAutomatica() {
        const lastExport = localStorage.getItem('lastExport');
        const now = new Date().getTime();

        // Si no hay una exportación previa o ha pasado una hora, exporta
        if (!lastExport || now - lastExport >= 3600000) {
            exportAll();
            console.log("Configuración exportada automáticamente a las " + new Date().toLocaleTimeString());
        } else {
            console.log("No ha pasado una hora desde la última exportación. No se realiza la exportación.");
        }
    }

    // Configura un intervalo para que se ejecute cada una hora (3600000 ms)
    setInterval(exportarConfiguracionAutomatica, 3600000); // 3600000 ms = 1 hora
});











document.addEventListener('DOMContentLoaded', function() {
    console.log("El DOM está completamente cargado.");

    // Inicializar el gráfico de barras para posiciones
    const ctxPosition = document.getElementById('positionChart').getContext('2d');
    let positionChart;

    function updateCharts() {
        const positionStats = calculatePositionStats();
        const orderStats = calculateOrderStats();
        console.log("Datos para el gráfico de posiciones:", positionStats);
        console.log("Datos para el total de órdenes:", orderStats);

        // Actualizar los totales en la interfaz
        document.getElementById('totalPositions').textContent = `Total de Posiciones: ${positionStats.totalPositions}`;
        document.getElementById('totalOrders').textContent = `Total de Órdenes: ${orderStats.totalOrders}`;

        if (positionChart) {
            positionChart.destroy();
        }

        positionChart = new Chart(ctxPosition, {
            type: 'bar',
            data: {
                labels: ['Ocupadas', 'Libres', 'Liberadas', 'No Liberadas'],
                datasets: [{
                    label: 'Posiciones',
                    data: [
                        positionStats.occupiedPositions, 
                        positionStats.freePositions, 
                        positionStats.liberadoPositions, 
                        positionStats.noLiberadoPositions
                    ],
                    backgroundColor: ['#ff6384', '#36a2eb', '#4CAF50', '#f44336']
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    function calculatePositionStats() {
        const positions = document.querySelectorAll('.position');
        let totalPositions = positions.length;
        let occupiedPositions = 0;
        let freePositions = 0;
        let liberadoPositions = 0;
        let noLiberadoPositions = 0;

        positions.forEach(position => {
            if (position.classList.contains('occupied')) {
                occupiedPositions++;
                const estado = position.getAttribute('data-estado');
                if (estado === 'Liberado') {
                    liberadoPositions++;
                } else if (estado === 'No Liberado') {
                    noLiberadoPositions++;
                }
            } else {
                freePositions++;
            }
        });

        return {
            totalPositions: totalPositions,
            occupiedPositions: occupiedPositions,
            freePositions: freePositions,
            liberadoPositions: liberadoPositions,
            noLiberadoPositions: noLiberadoPositions
        };
    }

    function calculateOrderStats() {
        const positions = document.querySelectorAll('.position');
        const orders = new Set(); // Usar un Set para almacenar órdenes únicas

        positions.forEach(position => {
            const order = position.getAttribute('data-orden');
            if (order) {
                orders.add(order); // Añadir la orden al Set (solo se añadirá una vez)
            }
        });

        return {
            totalOrders: orders.size // El tamaño del Set es el número de órdenes únicas
        };
    }

    function loadPositions() {
        console.log("Cargando posiciones...");
        const positions = JSON.parse(localStorage.getItem('positions')) || {};
        Object.keys(positions).forEach(id => {
            const position = document.getElementById(id);
            const data = positions[id];
            if (position) {
                position.classList.toggle('occupied', data.occupied);
                position.textContent = data.occupied ? data.orden : position.getAttribute('data-position'); // Muestra el número de posición
                position.setAttribute('data-orden', data.orden || ''); // Asegúrate de tener el atributo data-orden
                updatePositionState(position, data.estado);
            }
        });
    }

    function updatePositionState(positionElement, estado) {
        if (estado === 'Liberado') {
            positionElement.style.backgroundColor = '#4CAF50'; // Verde
        } else if (estado === 'No Liberado') {
            positionElement.style.backgroundColor = '#f44336'; // Rojo
        } else {
            positionElement.style.backgroundColor = '#C0C0C0'; // Gris
        }
        positionElement.setAttribute('data-estado', estado);
    }

    // Cargar posiciones y actualizar gráficos
    loadPositions();
    updateCharts();

    // Actualizar automáticamente el gráfico cada 30 segundos (30000 ms)
    setInterval(() => {
        console.log("Actualizando gráficos...");
        updateCharts();
    }, 30000); // Puedes ajustar el intervalo según tus necesidades
});
function calcularTotalCantidad() {
    let totalCantidad = 0;
    const filas = document.querySelectorAll('#entriesTable tbody tr');

    filas.forEach(fila => {
        const cantidad = parseInt(fila.cells[3].textContent, 10); // Obtén el valor de la columna "cantidad"
        if (!isNaN(cantidad)) {
            totalCantidad += cantidad;
        }
    });

    console.log("Total de Cantidades:", totalCantidad);
    return totalCantidad;
}

// Llama a la función cuando necesites calcular el total
document.addEventListener('DOMContentLoaded', function() {
    const totalCantidad = calcularTotalCantidad();
    document.getElementById('totalCantidadDisplay').textContent = `Total de Cantidades: ${totalCantidad}`;
});








function calculatePositionStats() {
    const positions = document.querySelectorAll('.position');
    let totalPositions = positions.length;
    let occupiedPositions = 0;
    let freePositions = 0;
    let liberadoPositions = 0;
    let noLiberadoPositions = 0;

    positions.forEach(position => {
        const estado = position.getAttribute('data-estado');
        if (position.classList.contains('occupied')) {
            occupiedPositions++;
            if (estado === 'Liberado') {
                liberadoPositions++;
            } else if (estado === 'No Liberado') {
                noLiberadoPositions++;
            }
        } else {
            freePositions++;
        }
    });

    console.log("Total Positions:", totalPositions);
    console.log("Occupied Positions:", occupiedPositions);
    console.log("Free Positions:", freePositions);
    console.log("Liberado Positions:", liberadoPositions);
    console.log("No Liberado Positions:", noLiberadoPositions);

    return {
        totalPositions: totalPositions,
        occupiedPositions: occupiedPositions,
        freePositions: freePositions,
        liberadoPositions: liberadoPositions,
        noLiberadoPositions: noLiberadoPositions
    };
}

function updateCharts() {
    const positionStats = calculatePositionStats();
    const orderStats = calculateOrderStats();

    // Actualiza el total en la interfaz
    document.getElementById('totalPositions').textContent = `Total de Posiciones: ${positionStats.totalPositions}`;
    document.getElementById('totalOrders').textContent = `Total de Órdenes: ${orderStats.totalOrders}`;

    if (positionChart) {
        positionChart.destroy();
    }

    positionChart = new Chart(ctxPosition, {
        type: 'bar',
        data: {
            labels: ['Ocupadas', 'Libres', 'Liberadas', 'No Liberadas'],
            datasets: [{
                label: 'Posiciones',
                data: [
                    positionStats.occupiedPositions, 
                    positionStats.freePositions, 
                    positionStats.liberadoPositions, 
                    positionStats.noLiberadoPositions
                ],
                backgroundColor: ['#ff6384', '#36a2eb', '#4CAF50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadPositions();
    updateCharts();
    // Otros eventos y funcionalidades
});

