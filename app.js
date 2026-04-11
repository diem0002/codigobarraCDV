// ===== CONFIGURACION DEL LECTOR =====
// Modifica esta URL para que apunte al 'productos.json' de tu carta-web.
// Ejemplo: "https://diem0002.github.io/carta-web/data/productos.json"
var URL_CATALOGO = "https://diem0002.github.io/tachyon-corona/carta-web/data/productos.json"; 
// ====================================

var estadoApp = {
    productos: [],
    cargando: true,
    errorBase: false
};

var timeoutReinicio;

// --- Funciones de Utilidad ---
function ocultarPantallas() {
    var pantallas = document.querySelectorAll('.pantalla');
    for (var i = 0; i < pantallas.length; i++) {
        pantallas[i].className = 'pantalla';
    }
}

function mostrarPantalla(idPantalla) {
    ocultarPantallas();
    document.getElementById(idPantalla).className = 'pantalla activa';
    enfocarInput(); // Siempre intentar re-enfocar al cambiar
}

function formatPrecio(p) {
    if (typeof p === 'number') {
        return '$' + p.toLocaleString('es-AR');
    }
    if (typeof p === 'string' && p.trim() !== '') {
        return '$' + p;
    }
    return 'Consultar';
}

function enfocarInput() {
    var inp = document.getElementById('barcode-input');
    if (inp) {
        inp.focus();
    }
}

// --- Carga de JSON (ES5 para Android 4) ---
function cargarProductos() {
    var estadoMsg = document.getElementById('estado-datos');
    var xhr = new XMLHttpRequest();
    // Agregamos paramento aleatorio para evitar caché agresivo de tablets viejas
    var cacheBuster = "?t=" + new Date().getTime();
    xhr.open('GET', URL_CATALOGO + cacheBuster, true);

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                var respuesta = JSON.parse(xhr.responseText);
                // Extraer el array principal que viene del POS (se llama catalogo)
                estadoApp.productos = respuesta.catalogo || [];
                estadoApp.cargando = false;
                estadoMsg.innerText = "¡Base lista! Productos: " + estadoApp.productos.length;
                estadoMsg.style.color = "#81c784";
            } catch(e) {
                estadoApp.errorBase = true;
                estadoMsg.innerText = "Error leyendo datos.";
                estadoMsg.style.color = "#ef5350";
            }
        } else {
            estadoApp.errorBase = true;
            estadoMsg.innerText = "Error descargando: " + xhr.status;
            estadoMsg.style.color = "#ef5350";
        }
    };
    
    xhr.onerror = function() {
        estadoApp.errorBase = true;
        estadoMsg.innerText = "Falló la conexión a Internet.";
        estadoMsg.style.color = "#ef5350";
    };

    xhr.send();
}

// --- Procesamiento de Lecturas ---
function buscarProducto(codigo) {
    codigo = codigo.trim();
    if(codigo === "") return null;
    
    for (var i = 0; i < estadoApp.productos.length; i++) {
        var p = estadoApp.productos[i];
        // Comprobar que p.barcode exista y coincida
        if (p.barcode && String(p.barcode) === codigo) {
            return p;
        }
    }
    return null;
}

function procesarLectura(codigo) {
    if (estadoApp.cargando || estadoApp.errorBase) return;

    var producto = buscarProducto(codigo);
    
    if (timeoutReinicio) clearTimeout(timeoutReinicio);

    if (producto) {
        // Exito
        document.getElementById('producto-nombre').innerText = producto.vino || 'Sin Nombre';
        document.getElementById('producto-bodega').innerText = producto.bodega || 'Otras';
        document.getElementById('producto-precio').innerText = formatPrecio(producto.precio);
        mostrarPantalla('pantalla-resultado');
    } else {
        // Fallo
        mostrarPantalla('pantalla-error');
    }

    // Volver a la pantalla de espera después de 5 segundos
    timeoutReinicio = setTimeout(function() {
        mostrarPantalla('pantalla-espera');
    }, 5000);
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', function() {
    var inp = document.getElementById('barcode-input');
    
    // El escáner emula un teclado. Cuando lee, tira los numeros y un Enter
    inp.addEventListener('keypress', function(e) {
        if (e.keyCode === 13 || e.which === 13) {
            var codigo = inp.value;
            inp.value = ""; // limpiar para el proximo escaneo
            procesarLectura(codigo);
        }
    });

    // Mantener siempre el foco aunque el usuario toque la pantalla
    document.body.addEventListener('click', enfocarInput);
    
    // Cargar datos al instante
    cargarProductos();
    
    // Prevenir que haga zoom en doble tap (Android)
    document.addEventListener('dblclick', function(e) { e.preventDefault(); });
});

// Reforzar foco cada segundo (por si acaso el sistema del SO lo roba)
setInterval(enfocarInput, 1000);
