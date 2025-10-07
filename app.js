const SUPABASE_URL = 'https://yeuestihxpklqkkpgrsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlldWVzdGloeHBrbHFra3BncnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTA4ODQsImV4cCI6MjA3NTQyNjg4NH0.g1JNVpQ2rHHRkA-KT2IdEOsL_m3qxUMte64VHci3JVE';

const clienteSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Selectores de elementos del DOM
const form = document.querySelector('.form');
const btn = document.querySelector('.form .btn');

// Selectores del modal de ÉXITO (Ticket)
const modalTicket = document.getElementById('ticket-modal');
const closeBtnTicket = document.getElementById('ticket-close');
const ticketNombre = document.getElementById('ticket-nombre');
const ticketNumero = document.getElementById('ticket-numero');
const downloadBtn = document.getElementById('download-ticket');

// --- INICIA CÓDIGO NUEVO ---
// Selectores del modal de ERROR
const modalError = document.getElementById('error-modal');
const closeBtnError = document.getElementById('error-close');
const errorMessage = document.getElementById('error-message');
// --- TERMINA CÓDIGO NUEVO ---

// Funciones para el modal de ÉXITO
function openTicketModal() {
  modalTicket.hidden = false;
  modalTicket.setAttribute('aria-hidden', 'false');
}

function closeTicketModal() {
  modalTicket.hidden = true;
  modalTicket.setAttribute('aria-hidden', 'true');
}

// --- INICIA CÓDIGO NUEVO ---
// Funciones para el modal de ERROR
function openErrorModal(message) {
  errorMessage.textContent = message;
  modalError.hidden = false;
  modalError.setAttribute('aria-hidden', 'false');
}

function closeErrorModal() {
  modalError.hidden = true;
  modalError.setAttribute('aria-hidden', 'true');
}
// --- TERMINA CÓDIGO NUEVO ---

// Event Listeners
closeBtnTicket.addEventListener('click', closeTicketModal);
modalTicket.addEventListener('click', (e) => {
  if (e.target === modalTicket) { closeTicketModal(); }
});

// --- INICIA CÓDIGO NUEVO ---
closeBtnError.addEventListener('click', closeErrorModal);
modalError.addEventListener('click', (e) => {
  if (e.target === modalError) { closeErrorModal(); }
});
// --- TERMINA CÓDIGO NUEVO ---


form.addEventListener('submit', async (e) => {
  e.preventDefault();
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  const payload = {
    nombre: form.nombre.value.trim(),
    email: form.email.value.trim(),
    telefono: form.telefono.value.trim(),
    curso: form.curso.value.trim()
  };

  try {
    const { data, error } = await clienteSupabase
      .from('registros')
      .insert([payload])
      .select();

    if (error) {
      if (error.code === '23505') {
        // --- LÍNEA MODIFICADA ---
        openErrorModal('Este correo electrónico ya ha sido registrado. Por favor, utiliza otro.');
      } else {
        console.error('Error de Supabase:', error);
        openErrorModal(error.message || 'Ocurrió un error inesperado al registrar.');
      }
    } else {
      const nuevoRegistro = data[0];
      ticketNombre.textContent = nuevoRegistro.nombre;
      ticketNumero.textContent = nuevoRegistro.id;
      openTicketModal();
      form.reset();
    }
  } catch (err) {
    console.error('Error de conexión:', err);
    openErrorModal('No se pudo conectar con el servidor. Revisa tu conexión.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar registro';
  }
});

// Código para descargar PDF (sin cambios)
downloadBtn.addEventListener('click', async () => {
  // ... (este bloque de código no necesita cambios)
  const nombre = ticketNombre.textContent.trim();
  const numero = ticketNumero.textContent.trim();
  if (!nombre || !numero) {
    alert('Primero genera tu boleto enviando el formulario.');
    return;
  }
  const pdfNombre = document.getElementById('pdf-nombre');
  const pdfNumero = document.getElementById('pdf-numero');
  pdfNombre.textContent = nombre;
  pdfNumero.textContent = numero;
  const ticketPdfEl = document.getElementById('ticket-pdf');
  ticketPdfEl.hidden = false;
  ticketPdfEl.style.position = 'fixed';
  ticketPdfEl.style.left = '-10000px';
  const canvas = await html2canvas(ticketPdfEl, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = doc.internal.pageSize.getWidth();
  const imgProps = doc.getImageProperties(imgData);
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  const marginTop = 20;
  doc.addImage(imgData, 'PNG', 0, marginTop, pdfWidth, pdfHeight, undefined, 'FAST');
  doc.setProperties({ title: `Boleto-${numero}` });
  doc.save(`boleto-${numero}.pdf`);
  ticketPdfEl.hidden = true;
  ticketPdfEl.style.position = 'static';
});