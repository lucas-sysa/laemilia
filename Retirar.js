document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('modal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const cardCodeInput = document.getElementById('cardCode');
    const cantidadRetirarInput = document.getElementById('cantidadRetirar');
    let selectedRow;  // Para rastrear la fila seleccionada

    // Manejar el clic en el botón "Retirar"
    document.querySelectorAll('.retirarBtn').forEach(button => {
        button.addEventListener('click', function () {
            // Abrir el modal y guardar la fila seleccionada
            selectedRow = this.closest('tr');
            modal.style.display = 'block';
            console.log('Fila seleccionada:', selectedRow);
        });
    });

    // Confirmar el retiro
    confirmBtn.addEventListener('click', function (event) {
        event.preventDefault();  // Evitar el comportamiento por defecto del formulario
        const cardCode = cardCodeInput.value;

        // Validar el código de la tarjeta
        if (validateCardCode(cardCode)) {
            // Obtener la cantidad en la fila seleccionada
            let cantidadCelda = selectedRow.querySelector('td:nth-child(5)');
            let cantidad = parseInt(cantidadCelda.textContent);
            console.log('Cantidad original:', cantidad);

            // Obtener la cantidad a retirar del input del modal
            let cantidadRetirar = parseInt(cantidadRetirarInput.value); 

            // Validar que la cantidad ingresada sea válida
            if (!isNaN(cantidadRetirar) && cantidadRetirar > 0 && cantidadRetirar <= cantidad) {
                // Actualizar la cantidad en la tabla
                cantidadCelda.textContent = cantidad - cantidadRetirar;
                alert('Retiro confirmado. Nueva cantidad: ' + (cantidad - cantidadRetirar));
            } else {
                alert('Cantidad inválida');
            }

            // Cerrar el modal
            modal.style.display = 'none';
        } else {
            alert('Código de tarjeta incorrecto');
        }

        // Limpiar los campos
        cardCodeInput.value = '';
        cantidadRetirarInput.value = '';
    });

    // Cancelar la operación
    cancelBtn.addEventListener('click', function () {
        modal.style.display = 'none';
        cardCodeInput.value = '';
        cantidadRetirarInput.value = '';
    });

    // Función para validar el código de la tarjeta
    function validateCardCode(code) {
        const validCode = '1234';  // Puedes cambiar este valor o hacer una validación más robusta
        return code === validCode;
    }
});

