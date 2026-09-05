/* ---------------- MALHAR RESIDENCY DIGITAL BILL SCRIPT ---------------- */

let rowsData = [
  { date: "Lodging Charges", particulars: "1400 x 1", rupees: 1400, ps: "00" }
];

document.addEventListener('DOMContentLoaded', () => {
  renderRows();
  calculateTotal();
});

function updateHeaderTitle(val) {
  const el = document.getElementById('brandTitleHeader');
  if (el) {
    el.textContent = val ? val.toUpperCase() : 'MALHAR RESIDENCY';
  }
}

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function renderRows() {
  const tbody = document.getElementById('billTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  rowsData.forEach((row, index) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>
        <input type="text" class="row-date-input" id="date-input-${index}" value="${escapeHtml(row.date)}" oninput="updateRowData(${index}, 'date', this.value)">
      </td>
      <td>
        <input type="text" class="row-part-input" id="part-input-${index}" value="${escapeHtml(row.particulars)}" oninput="updateRowData(${index}, 'particulars', this.value)">
      </td>
      <td class="col-rupees">
        <input type="number" class="row-rupees-input" id="rupees-input-${index}" value="${row.rupees !== '' ? row.rupees : ''}" oninput="updateRowData(${index}, 'rupees', this.value)" style="text-align: right;">
      </td>
      <td class="col-ps">
        <input type="text" class="row-ps-input" value="${escapeHtml(row.ps || '00')}" oninput="updateRowData(${index}, 'ps', this.value)" style="text-align: right;">
      </td>
      <td class="col-action">
        <button class="row-delete-btn" onclick="removeRow(${index})" title="Delete row">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateRowData(index, field, value) {
  if (!rowsData[index]) return;

  if (field === 'date') {
    const capitalized = capitalizeFirstLetter(value);
    rowsData[index].date = capitalized;
    
    const dateInput = document.getElementById(`date-input-${index}`);
    if (dateInput && dateInput.value !== capitalized) {
      const start = dateInput.selectionStart;
      const end = dateInput.selectionEnd;
      dateInput.value = capitalized;
      if (typeof start === 'number') {
        dateInput.setSelectionRange(start, end);
      }
    }
  } else if (field === 'particulars') {
    rowsData[index].particulars = value;
    
    // Auto-detect multiplication expressions like "1400 x 2", "1400 * 2", "1400 x 3"
    const match = value.match(/(\d+(?:\.\d+)?)\s*[*xX×]\s*(\d+(?:\.\d+)?)/);
    if (match) {
      const rate = parseFloat(match[1]);
      const qty = parseFloat(match[2]);
      if (!isNaN(rate) && !isNaN(qty)) {
        const calculated = Math.round(rate * qty * 100) / 100;
        rowsData[index].rupees = calculated;
        
        const rupeesInput = document.getElementById(`rupees-input-${index}`);
        if (rupeesInput) {
          rupeesInput.value = calculated;
        }
      }
    }
    calculateTotal();
  } else if (field === 'rupees') {
    rowsData[index].rupees = value === '' ? '' : parseFloat(value) || 0;
    calculateTotal();
  } else {
    rowsData[index][field] = value;
  }
}

function updateRatePerDay(newRateVal) {
  const rate = parseFloat(newRateVal);
  if (isNaN(rate)) return;

  if (rowsData.length > 0) {
    const part = rowsData[0].particulars;
    const match = part.match(/(\d+(?:\.\d+)?)\s*([*xX×]\s*\d+(?:\.\d+)?)/);
    if (match) {
      const qtyStr = match[2];
      const qtyMatch = qtyStr.match(/(\d+(?:\.\d+)?)/);
      const qty = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      
      const newPart = `${rate} ${qtyStr}`;
      rowsData[0].particulars = newPart;
      rowsData[0].rupees = Math.round(rate * qty * 100) / 100;

      const partInput = document.getElementById('part-input-0');
      const rupeesInput = document.getElementById('rupees-input-0');
      if (partInput) partInput.value = newPart;
      if (rupeesInput) rupeesInput.value = rowsData[0].rupees;
    }
  }
  calculateTotal();
}

function addRow(date = '', particulars = '', rupees = '', ps = '00') {
  rowsData.push({ date: capitalizeFirstLetter(date), particulars, rupees, ps });
  renderRows();
  calculateTotal();
}

function removeRow(index) {
  rowsData.splice(index, 1);
  renderRows();
  calculateTotal();
}

function clearRows() {
  rowsData = [];
  renderRows();
  calculateTotal();
}

function calculateTotal() {
  let total = 0;
  rowsData.forEach(r => {
    const val = parseFloat(r.rupees);
    if (!isNaN(val)) {
      total += val;
    }
  });

  const totalEl = document.getElementById('totalAmount');
  if (totalEl) {
    totalEl.textContent = total.toFixed(0);
  }
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0].slice(-2);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${day}/${month}/${year}`;
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function downloadPDF() {
  const source = document.getElementById('receiptBox');
  if (!source) return;

  // Build offscreen PDF container with fixed 800px width for consistent mobile/desktop PDF rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.height = 'auto';
  container.style.display = 'flex';
  container.style.justifyContent = 'center';
  container.style.alignItems = 'flex-start';
  container.style.padding = '20px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';
  container.style.background = '#ffffff';

  const clone = source.cloneNode(true);
  clone.classList.add('pdf-mode');
  clone.style.width = '680px';
  clone.style.maxWidth = '680px';
  clone.style.margin = '0 auto';

  // Replace each input / textarea with a SINGLE text span
  clone.querySelectorAll('input, textarea').forEach(input => {
    const span = document.createElement('span');
    span.style.fontWeight = '600';
    span.style.color = '#000000';
    span.style.display = 'inline-block';
    span.style.fontFamily = 'inherit';
    span.style.fontSize = '0.9rem';

    if (input.type === 'date') {
      span.textContent = formatDateDisplay(input.value);
    } else if (input.type === 'time') {
      span.textContent = formatTimeDisplay(input.value);
    } else {
      span.textContent = input.value;
    }

    if (input.parentNode) {
      input.parentNode.replaceChild(span, input);
    }
  });

  // Remove action column headers and delete buttons in clone
  clone.querySelectorAll('.col-action, .add-row-container').forEach(el => el.remove());

  container.appendChild(clone);
  document.body.appendChild(container);

  const billNoInput = document.getElementById('billNo');
  const billNo = billNoInput ? billNoInput.value : 'draft';

  const opt = {
    margin: [6, 6, 8, 6],
    filename: `MalharResidency_Bill_${billNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).save().finally(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
}
