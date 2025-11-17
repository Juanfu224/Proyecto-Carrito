// ========================================
// CARRITO DE COMPRAS MEJORADO
// Proyecto con funcionalidades avanzadas
// ========================================

// *** VARIABLES GLOBALES ***
const carrito = document.querySelector('#carrito');
const contenedorCarrito = document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn = document.querySelector('#vaciar-carrito');
const listaCursos = document.querySelector('#lista-cursos');
const buscador = document.querySelector('#buscador');
const badgeCarrito = document.querySelector('#badge-carrito');
const totalCarrito = document.querySelector('#total-carrito');
const toggleThemeBtn = document.querySelector('#toggle-theme');
const filtrosBtns = document.querySelectorAll('.btn-categoria');

let articulosCarrito = [];
const MAX_CANTIDAD = 10; // Límite máximo de unidades por curso

// ========================================
// INICIALIZACIÓN
// ========================================

// Cargar datos guardados y configurar tema
inicializarApp();

function inicializarApp() {
    // Cargar carrito guardado
    articulosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Cargar tema guardado
    const temaGuardado = localStorage.getItem('tema') || detectarPreferenciaTema();
    aplicarTema(temaGuardado);
    
    // Renderizar carrito inicial
    carritoHTML();
    
    // Cargar event listeners
    cargarEventListeners();
}

// Detectar preferencia de tema del sistema
function detectarPreferenciaTema() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// ========================================
// EVENT LISTENERS
// ========================================

function cargarEventListeners() {
    // Eventos del carrito
    listaCursos.addEventListener('click', añadirCurso);
    carrito.addEventListener('click', eliminarCurso);
    vaciarCarritoBtn.addEventListener('click', confirmarVaciarCarrito);
    
    // Búsqueda en tiempo real
    buscador.addEventListener('keyup', filtrarCursos);
    
    // Tema oscuro/claro
    toggleThemeBtn.addEventListener('click', toggleTema);
    
    // Filtros de categoría
    filtrosBtns.forEach(btn => {
        btn.addEventListener('click', filtrarPorCategoria);
    });
    
    // Cargar carrito al iniciar
    document.addEventListener('DOMContentLoaded', () => {
        carritoHTML();
        actualizarBadge();
    });
}

// ========================================
// FUNCIONES DEL CARRITO
// ========================================

// Añadir curso al carrito
function añadirCurso(e) {
    e.preventDefault();
    
    if (e.target.classList.contains('agregar-carrito')) {
        const cursoSeleccionado = e.target.parentElement.parentElement;
        leerDatosCurso(cursoSeleccionado);
    }
}

// Leer información del curso
function leerDatosCurso(curso) {
    const infoCurso = {
        imagen: curso.querySelector('img').src,
        titulo: curso.querySelector('h4').textContent,
        precio: curso.querySelector('.precio span').textContent,
        id: curso.querySelector('a').getAttribute('data-id'),
        cantidad: 1
    };
    
    // Verificar si el curso ya existe
    const existe = articulosCarrito.some(curso => curso.id === infoCurso.id);
    
    if (existe) {
        // Actualizar cantidad con validación
        const cursos = articulosCarrito.map(curso => {
            if (curso.id === infoCurso.id) {
                if (curso.cantidad < MAX_CANTIDAD) {
                    curso.cantidad++;
                    mostrarNotificacion(`Cantidad actualizada: ${curso.titulo}`, 'success', '✓');
                } else {
                    mostrarNotificacion(`Máximo ${MAX_CANTIDAD} unidades por curso`, 'error', '⚠');
                }
                return curso;
            } else {
                return curso;
            }
        });
        articulosCarrito = [...cursos];
    } else {
        // Añadir nuevo curso
        articulosCarrito = [...articulosCarrito, infoCurso];
        mostrarNotificacion(`${infoCurso.titulo} añadido al carrito`, 'success', '🛒');
    }
    
    // Actualizar interfaz y guardar
    carritoHTML();
    sincronizarStorage();
}

// Eliminar curso del carrito
function eliminarCurso(e) {
    if (e.target.classList.contains('borrar-curso')) {
        const cursoId = e.target.getAttribute('data-id');
        
        // Obtener nombre del curso antes de eliminarlo
        const cursoEliminado = articulosCarrito.find(curso => curso.id === cursoId);
        
        // Eliminar del array
        articulosCarrito = articulosCarrito.filter(curso => curso.id !== cursoId);
        
        // Mostrar notificación
        mostrarNotificacion(`${cursoEliminado.titulo} eliminado del carrito`, 'info', '🗑️');
        
        // Actualizar interfaz y guardar
        carritoHTML();
        sincronizarStorage();
    }
}

// Confirmar antes de vaciar el carrito
function confirmarVaciarCarrito(e) {
    e.preventDefault();
    
    if (articulosCarrito.length === 0) {
        mostrarNotificacion('El carrito ya está vacío', 'info', 'ℹ️');
        return;
    }
    
    mostrarModal(
        '¿Vaciar carrito?',
        '¿Estás seguro de que quieres eliminar todos los cursos del carrito?',
        () => {
            vaciarCarrito();
        }
    );
}

// Vaciar carrito
function vaciarCarrito() {
    articulosCarrito = [];
    limpiarHTML();
    sincronizarStorage();
    mostrarNotificacion('Carrito vaciado', 'success', '✓');
}

// ========================================
// RENDERIZADO DEL CARRITO
// ========================================

// Mostrar carrito en el HTML
function carritoHTML() {
    limpiarHTML();
    
    // Si el carrito está vacío
    if (articulosCarrito.length === 0) {
        mostrarCarritoVacio();
        actualizarTotal(0);
        actualizarBadge();
        return;
    }
    
    // Renderizar cada curso
    articulosCarrito.forEach(curso => {
        const { imagen, titulo, precio, cantidad, id } = curso;
        const precioNumerico = parseFloat(precio.replace('€', ''));
        const subtotal = (precioNumerico * cantidad).toFixed(2);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${imagen}" width="100" alt="${titulo}">
            </td>
            <td>${titulo}</td>
            <td>${precio}</td>
            <td>${cantidad}</td>
            <td>
                <a href="#" class="borrar-curso" data-id="${id}" aria-label="Eliminar ${titulo}">✕</a>
            </td>
        `;
        
        contenedorCarrito.appendChild(row);
    });
    
    // Calcular y mostrar total
    calcularTotal();
    actualizarBadge();
}

// Mostrar mensaje cuando el carrito está vacío
function mostrarCarritoVacio() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td colspan="5" class="carrito-vacio">
            <div class="carrito-vacio-icon">🛒</div>
            <p>Tu carrito está vacío</p>
            <p style="font-size: 12px;">¡Añade algunos cursos!</p>
        </td>
    `;
    contenedorCarrito.appendChild(row);
}

// Limpiar HTML del carrito
function limpiarHTML() {
    while (contenedorCarrito.firstChild) {
        contenedorCarrito.removeChild(contenedorCarrito.firstChild);
    }
}

// ========================================
// CÁLCULO DE TOTALES
// ========================================

// Calcular total del carrito
function calcularTotal() {
    const total = articulosCarrito.reduce((acc, curso) => {
        const precio = parseFloat(curso.precio.replace('€', ''));
        return acc + (precio * curso.cantidad);
    }, 0);
    
    actualizarTotal(total);
}

// Actualizar visualización del total
function actualizarTotal(total) {
    totalCarrito.textContent = `${total.toFixed(2)}€`;
}

// Actualizar badge del carrito
function actualizarBadge() {
    const totalArticulos = articulosCarrito.reduce((acc, curso) => acc + curso.cantidad, 0);
    
    badgeCarrito.textContent = totalArticulos;
    
    if (totalArticulos > 0) {
        badgeCarrito.classList.add('show');
        badgeCarrito.classList.add('pulse');
        setTimeout(() => badgeCarrito.classList.remove('pulse'), 500);
    } else {
        badgeCarrito.classList.remove('show');
    }
}

// ========================================
// BÚSQUEDA Y FILTRADO
// ========================================

// Filtrar cursos por búsqueda
function filtrarCursos(e) {
    const textoBusqueda = e.target.value.toLowerCase();
    const cursos = document.querySelectorAll('#lista-cursos .four.columns');
    
    cursos.forEach(curso => {
        const titulo = curso.querySelector('h4').textContent.toLowerCase();
        const profesor = curso.querySelector('.info-card p').textContent.toLowerCase();
        
        if (titulo.includes(textoBusqueda) || profesor.includes(textoBusqueda)) {
            curso.classList.remove('oculto');
            curso.style.display = 'block';
        } else {
            curso.classList.add('oculto');
            setTimeout(() => {
                if (curso.classList.contains('oculto')) {
                    curso.style.display = 'none';
                }
            }, 400);
        }
    });
}

// Filtrar por categoría
function filtrarPorCategoria(e) {
    const categoriaSeleccionada = e.target.getAttribute('data-categoria');
    const cursos = document.querySelectorAll('#lista-cursos .four.columns');
    
    // Actualizar botones activos
    filtrosBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Limpiar búsqueda
    buscador.value = '';
    
    // Filtrar cursos
    cursos.forEach(curso => {
        const categoriaCurso = curso.getAttribute('data-categoria');
        
        if (categoriaSeleccionada === 'todos' || categoriaCurso === categoriaSeleccionada) {
            curso.classList.remove('oculto');
            curso.style.display = 'block';
        } else {
            curso.classList.add('oculto');
            setTimeout(() => {
                if (curso.classList.contains('oculto')) {
                    curso.style.display = 'none';
                }
            }, 400);
        }
    });
}

// ========================================
// MODO OSCURO/CLARO
// ========================================

// Cambiar tema
function toggleTema() {
    const temaActual = document.documentElement.getAttribute('data-theme');
    const nuevoTema = temaActual === 'dark' ? 'light' : 'dark';
    
    aplicarTema(nuevoTema);
    localStorage.setItem('tema', nuevoTema);
}

// Aplicar tema
function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    
    const icon = toggleThemeBtn.querySelector('.theme-icon');
    icon.textContent = tema === 'dark' ? '☀️' : '🌙';
}

// ========================================
// NOTIFICACIONES
// ========================================

// Mostrar notificación toast
function mostrarNotificacion(mensaje, tipo = 'info', icono = 'ℹ️') {
    // Crear contenedor si no existe
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${icono}</span>
        <span class="toast-message">${mensaje}</span>
        <button class="toast-close" aria-label="Cerrar">×</button>
    `;
    
    // Añadir al contenedor
    container.appendChild(toast);
    
    // Cerrar al hacer click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        cerrarToast(toast);
    });
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        cerrarToast(toast);
    }, 3000);
}

// Cerrar toast
function cerrarToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// ========================================
// MODAL DE CONFIRMACIÓN
// ========================================

// Mostrar modal de confirmación
function mostrarModal(titulo, mensaje, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    overlay.innerHTML = `
        <div class="modal">
            <h3>${titulo}</h3>
            <p>${mensaje}</p>
            <div class="modal-buttons">
                <button class="btn-cancelar">Cancelar</button>
                <button class="btn-confirmar">Confirmar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Eventos
    overlay.querySelector('.btn-cancelar').addEventListener('click', () => {
        cerrarModal(overlay);
    });
    
    overlay.querySelector('.btn-confirmar').addEventListener('click', () => {
        onConfirm();
        cerrarModal(overlay);
    });
    
    // Cerrar al hacer click fuera
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            cerrarModal(overlay);
        }
    });
}

// Cerrar modal
function cerrarModal(overlay) {
    overlay.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        overlay.remove();
    }, 300);
}

// ========================================
// LOCAL STORAGE
// ========================================

// Sincronizar con localStorage
function sincronizarStorage() {
    localStorage.setItem('carrito', JSON.stringify(articulosCarrito));
}

// ========================================
// UTILIDADES
// ========================================

// Sanitizar texto para prevenir XSS
function sanitizarTexto(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ========================================
// ACCESIBILIDAD
// ========================================

// Mejorar navegación por teclado
document.addEventListener('keydown', (e) => {
    // Esc para cerrar modales
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) cerrarModal(modal);
    }
});

// Anunciar cambios para lectores de pantalla
function anunciarCambio(mensaje) {
    const anuncio = document.createElement('div');
    anuncio.setAttribute('role', 'status');
    anuncio.setAttribute('aria-live', 'polite');
    anuncio.className = 'sr-only';
    anuncio.textContent = mensaje;
    document.body.appendChild(anuncio);
    
    setTimeout(() => anuncio.remove(), 1000);
}

// ========================================
// INICIALIZACIÓN FINAL
// ========================================

console.log('🚀 Carrito de compras mejorado cargado correctamente');
console.log('✨ Funcionalidades disponibles:');
console.log('  - Búsqueda en tiempo real');
console.log('  - Filtrado por categorías');
console.log('  - Modo oscuro/claro');
console.log('  - Notificaciones toast');
console.log('  - Cálculo de totales');
console.log('  - Persistencia en localStorage');
console.log('  - Validaciones de cantidad');
console.log('  - Mejoras de accesibilidad');
