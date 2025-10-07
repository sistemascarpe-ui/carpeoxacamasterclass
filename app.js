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

// Selectores del modal de ERROR
const modalError = document.getElementById('error-modal');
const closeBtnError = document.getElementById('error-close');
const errorMessage = document.getElementById('error-message');

// Funciones para el modal de ÉXITO
function openTicketModal() {
  modalTicket.hidden = false;
  modalTicket.setAttribute('aria-hidden', 'false');
}

function closeTicketModal() {
  modalTicket.hidden = true;
  modalTicket.setAttribute('aria-hidden', 'true');
}

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

// Event Listeners
closeBtnTicket.addEventListener('click', closeTicketModal);
modalTicket.addEventListener('click', (e) => {
  if (e.target === modalTicket) { closeTicketModal(); }
});

closeBtnError.addEventListener('click', closeErrorModal);
modalError.addEventListener('click', (e) => {
  if (e.target === modalError) { closeErrorModal(); }
});

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

// Event Listener para descargar el boleto en PDF de alta calidad
downloadBtn.addEventListener('click', () => {
  const nombre = ticketNombre.textContent.trim();
  const numeroCompleto = ticketNumero.textContent.trim();

  if (!nombre || !numeroCompleto) {
    alert('Primero genera tu boleto enviando el formulario.');
    return;
  }

  // Crea una nueva instancia de jsPDF en orientación vertical (portrait), milímetros y tamaño A4
  const doc = new jsPDF('p', 'mm', 'a4');

  // --- DIBUJAMOS EL FONDO Y DISEÑO DEL BOLETO ---
  const ticketWidth = 180;
  const ticketHeight = 80;
  const posX = (doc.internal.pageSize.getWidth() - ticketWidth) / 2; // Centrar el boleto
  const posY = 30;

  // Sombra suave
  doc.setFillColor(200, 200, 200);
  doc.roundedRect(posX + 1, posY + 1, ticketWidth, ticketHeight, 5, 5, 'F');

  // Fondo principal del boleto
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(posX, posY, ticketWidth, ticketHeight, 5, 5, 'F');

  // Cabecera azul
  doc.setFillColor(28, 78, 216); // Un azul similar al de tu botón
  doc.rect(posX, posY, ticketWidth, 25, 'F');

  // --- AÑADIMOS EL LOGO ---
  // Tomamos el logo del HTML. Asegúrate de que tu logo en el modal tenga el id "modal-logo"
  const logoImg = document.getElementById('modal-logo');
  if (logoImg) {
    doc.addImage(logoImg, 'JPEG', posX + 5, posY + 5, 35, 15);
  }

  // --- AÑADIMOS EL TEXTO ---
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EVENTO OAXACA', posX + ticketWidth - 5, posY + 15, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Nombre del Asistente:', posX + 15, posY + 40);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(nombre, posX + 15, posY + 48);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('Número de Boleto:', posX + 15, posY + 60);

  doc.setFontSize(20);
  doc.setTextColor(28, 78, 216);
  doc.setFont('Helvetica', 'bold');
  doc.text(numeroCompleto, posX + 15, posY + 69);

  // --- LÍNEA PUNTEADA DE CORTE ---
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.5);
  doc.setDrawColor(180, 180, 180);
  doc.line(posX + 115, posY + 30, posX + 115, posY + ticketHeight - 5);

  // --- GENERAMOS Y AÑADIMOS EL CÓDIGO QR ---
  try {
    const qrText = `Boleto: ${numeroCompleto}\nNombre: ${nombre}\nEvento: Oaxaca`;
    const qr = qrcode(0, 'L');
    qr.addData(qrText);
    qr.make();
    const qrImg = qr.createDataURL(4);
    doc.addImage(qrImg, 'PNG', posX + 125, posY + 35, 45, 45);
  } catch(e) {
    console.error("No se pudo generar el código QR", e);
  }

  // --- GUARDAMOS EL ARCHIVO ---
  doc.save(`boleto-${numeroCompleto}.pdf`);
});