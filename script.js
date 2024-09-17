document.getElementById('compareButton').addEventListener('click', function() {
    const sapFile = document.getElementById('sapFile').files[0];
    const controlFisicoFile = document.getElementById('controlFisicoFile').files[0];

    if (sapFile && controlFisicoFile) {
        // Aquí puedes implementar la lógica para leer y comparar los archivos Excel
        // Usando una librería como xlsx.js para manejar los archivos Excel en el frontend.

        // Luego de comparar, puedes mostrar los resultados en la tabla:
        const resultTable = document.getElementById('resultTable').querySelector('tbody');
        resultTable.innerHTML = ''; // Limpiar resultados anteriores

        // Ejemplo de datos comparados (esto se reemplazará con los datos reales)
        const exampleData = [
            { codigo: 'A001', descripcion: 'Pieza 1', cantidadSAP: 100, cantidadControlFisico: 95 },
            { codigo: 'A002', descripcion: 'Pieza 2', cantidadSAP: 50, cantidadControlFisico: 50 },
            { codigo: 'A003', descripcion: 'Pieza 3', cantidadSAP: 75, cantidadControlFisico: 80 },
        ];

        exampleData.forEach(row => {
            const difference = row.cantidadSAP - row.cantidadControlFisico;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.codigo}</td>
                <td>${row.descripcion}</td>
                <td>${row.cantidadSAP}</td>
                <td>${row.cantidadControlFisico}</td>
                <td>${difference}</td>
            `;
            resultTable.appendChild(tr);
        });
    } else {
        alert('Por favor, selecciona ambos archivos antes de comparar.');
    }
});
