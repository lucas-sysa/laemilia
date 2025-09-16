document.addEventListener("DOMContentLoaded", () => {

  const scriptURL = "https://script.google.com/macros/s/AKfycbwic815TCF9mLI5JlE2fgnfDtfAmkAnNPjLFb_3PSQVD6akq7VPyuu1PcOBoBO7YLXv/exec"; 
  const formProduccion = document.getElementById("formProduccion");
  const formKit = document.getElementById("formKit");

  window.mostrarFormulario = function(tipo) {
    formProduccion.style.display = (tipo === "produccion") ? "block" : "none";
    formKit.style.display = (tipo === "kit") ? "block" : "none";

    if(tipo === "produccion") cargarHistorial("historialProduccion", "historialProduccionLS");
    else if(tipo === "kit") cargarHistorial("historialKit", "historialKitLS");
  }

  function cargarHistorial(historialId, keyLocalStorage) {
    const contenedor = document.getElementById(historialId);
    if (!contenedor) return;
    const registros = JSON.parse(localStorage.getItem(keyLocalStorage)) || [];
    contenedor.innerHTML = "";
    registros.reverse().forEach(data => {
      const registro = document.createElement("div");
      let texto = "";
      for (const k in data) {
        if (k !== "tipo") texto += `${k}: ${data[k]} | `;
      }
      registro.textContent = texto.slice(0, -3);
      contenedor.appendChild(registro);
    });
  }

  function handleSubmit(form, tipo, localStorageKey, historialDiv, camposNumericos = []) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = { tipo };

      for (const input of form.querySelectorAll("[required]")) {
        if (!input.value) {
          alert(`Por favor completa el campo: ${input.name}`);
          input.focus();
          return;
        }
      }

      formData.forEach((value, key) => { 
        data[key] = value; 
      });

      camposNumericos.forEach(campo => {
        if (data[campo] !== undefined) data[campo] = Number(data[campo]) || 0;
      });

      let historial = JSON.parse(localStorage.getItem(localStorageKey)) || [];
      historial.push(data);
      localStorage.setItem(localStorageKey, JSON.stringify(historial));

      cargarHistorial(historialDiv, localStorageKey);

      console.log(`Datos a enviar ${tipo}:`, data);

      fetch(scriptURL, {
        method: "POST",
        body: JSON.stringify(data)
      })
      .then(res => res.json())
      .then(res => alert("Registro guardado"))
      .catch(err => alert("Error al enviar: " + err));

      form.reset();
    });
  }

  handleSubmit(formProduccion, "produccion", "historialProduccionLS", "historialProduccion", ["cantidadProducir","cantidadProducida","cantidadFaltante","cantidadRotura"]);
  handleSubmit(formKit, "kit", "historialKitLS", "historialKit", ["cantidadKit","fundaAsientos","baseAsientos"]);

  window.limpiarHistorial = function(localStorageKey, divId) {
    localStorage.removeItem(localStorageKey);
    cargarHistorial(divId, localStorageKey);
  }

});
function mostrarFormulario(tipo) {
  const formProduccion = document.getElementById('formProduccion');
  const formKit = document.getElementById('formKit');

  if(tipo === 'produccion') {
    formProduccion.style.display = 'block';
    formKit.style.display = 'none';
  } else {
    formProduccion.style.display = 'none';
    formKit.style.display = 'block';
  }
}

function limpiarHistorial(localStorageKey, historialId) {
  localStorage.removeItem(localStorageKey);
  document.getElementById(historialId).innerHTML = '';
}

// Inicialmente mostramos el formulario Producción
mostrarFormulario('produccion');


