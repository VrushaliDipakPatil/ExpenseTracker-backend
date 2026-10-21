
const API_URL = 'http://127.0.0.1:3000/expenses';

const state = {
  transactions: [],
  currentView: 'daily',
  chart: null
};

const $ = (selector) => document.querySelector(selector);

const today = () => {
  const now = new Date();
  const localDate = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const money = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(Number(amount) || 0);

const escapeHTML = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

function showMessage(message, isError = true) {
  const element = $('#form-message');
  element.textContent = message;
  element.style.color = isError ? '#e15f68' : '#159b72';
}


async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.location.replace('login.html');
    throw new Error('Please log in to continue.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}


function calculateTotals(transactions) {
  return transactions.reduce((totals, transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === 'credit') {
      totals.income += amount;
    } else {
      totals.expense += amount;
    }

    return totals;
  }, { income: 0, expense: 0 });
}

function renderSummary(transactions) {
  const totals = calculateTotals(transactions);

  $('#balance-amount').textContent = money(
    totals.income - totals.expense
  );
  $('#income-amount').textContent = money(totals.income);
  $('#expense-amount').textContent = money(totals.expense);
}

function renderEmptyRow(message, columnCount) {
  return `
    <tr>
      <td colspan="${columnCount}" class="empty-state">
        <div class="empty-icon">₹</div>
        <strong>${escapeHTML(message)}</strong>
        <p>Your transactions will appear here.</p>
      </td>
    </tr>
  `;
}

function renderTransactions(transactions, target, includeActions = false) {
  const list = $(target);
  const columnCount = includeActions ? 6 : 5;

  if (!transactions.length) {
    list.innerHTML = renderEmptyRow('No transactions found', columnCount);
    return;
  }

  list.innerHTML = transactions.map((transaction) => {
    const isIncome = transaction.type === 'credit';
    const amountClass = isIncome ? 'income-amount' : 'expense-amount';
    const sign = isIncome ? '+' : '−';

    return `
      <tr>
        <td>${escapeHTML(transaction.description)}</td>
        <td>${escapeHTML(transaction.category)}</td>
        <td>${escapeHTML(transaction.date)}</td>
        <td>
          <span class="type-badge ${isIncome ? 'credit' : 'debit'}">
            ${isIncome ? 'Credit' : 'Debit'}
          </span>
        </td>
        <td class="amount-cell ${amountClass}">
          ${sign}${money(transaction.amount)}
        </td>
        ${includeActions ? `
          <td>
            <button
              class="action-button"
              data-edit="${Number(transaction.id)}"
              type="button"
            >Edit</button>
            <button
              class="action-button"
              data-delete="${Number(transaction.id)}"
              type="button"
            >Delete</button>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('');
}

function filteredTransactions(period) {
  if (period === 'daily') {
    const date = $('#daily-date').value;
    return state.transactions.filter((item) => item.date === date);
  }

  if (period === 'monthly') {
    const month = $('#report-month').value;
    return state.transactions.filter((item) =>
      item.date.startsWith(month)
    );
  }

  if (period === 'yearly') {
    const year = $('#report-year').value;
    return state.transactions.filter((item) =>
      item.date.startsWith(`${year}-`)
    );
  }

  return state.transactions;
}

function renderDaily() {
  const transactions = filteredTransactions('daily');
  const totals = calculateTotals(transactions);

  renderSummary(transactions);
  renderTransactions(transactions, '#transaction-list', true);

  $('#transaction-count').textContent =
    `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} on this date`;
}

function renderReport(period) {
  const transactions = filteredTransactions(period);
  const totals = calculateTotals(transactions);
  const prefix = period === 'monthly' ? 'monthly' : 'yearly';

  $(`#${prefix}-totals`).innerHTML = `
    <div class="report-total">
      <span>Total income</span>
      <strong class="income-amount">${money(totals.income)}</strong>
    </div>
    <div class="report-total">
      <span>Total expenses</span>
      <strong class="expense-amount">${money(totals.expense)}</strong>
    </div>
    <div class="report-total">
      <span>Net balance</span>
      <strong>${money(totals.income - totals.expense)}</strong>
    </div>
  `;

  renderTransactions(transactions, `#${prefix}-list`);
}

function renderChart() {
  const year = $('#chart-year').value;
  const monthlyTotals = Array.from({ length: 12 }, () => ({
    income: 0,
    expense: 0
  }));

  state.transactions
    .filter((item) => item.date.startsWith(`${year}-`))
    .forEach((item) => {
      const monthIndex = Number(item.date.slice(5, 7)) - 1;

      if (monthIndex < 0 || monthIndex > 11) return;

      if (item.type === 'credit') {
        monthlyTotals[monthIndex].income += Number(item.amount);
      } else {
        monthlyTotals[monthIndex].expense += Number(item.amount);
      }
    });

  const canvas = $('#finance-chart');

  if (state.chart) {
    state.chart.destroy();
  }

  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML =
      '<p>Chart library could not load. Check your internet connection and refresh.</p>';
    return;
  }

  state.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      datasets: [
        {
          label: 'Income',
          data: monthlyTotals.map((item) => item.income),
          backgroundColor: '#159b72',
          borderRadius: 5
        },
        {
          label: 'Expenses',
          data: monthlyTotals.map((item) => item.expense),
          backgroundColor: '#e15f68',
          borderRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => '₹' + Number(value).toLocaleString('en-IN')
          }
        }
      }
    }
  });
}


function populateYearOptions() {
  const currentYear = Number(today().slice(0, 4));
  const years = new Set();

  // Show 10 years before and 5 years after the current year.
  for (let year = currentYear - 10; year <= currentYear + 5; year++) {
    years.add(String(year));
  }

  // Also include any years present in saved transactions.
  state.transactions.forEach((item) => {
    if (item.date) {
      years.add(item.date.slice(0, 4));
    }
  });

  const options = [...years]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) =>
      `<option value="${escapeHTML(year)}">${escapeHTML(year)}</option>`
    )
    .join('');

  ['#report-year', '#chart-year'].forEach((selector) => {
    const select = $(selector);
    const previousValue = select.value;

    select.innerHTML = options;
    select.value = years.has(previousValue)
      ? previousValue
      : String(currentYear);
  });
}


function renderCurrentView() {
  if (state.currentView === 'daily') {
    renderDaily();
  } else if (state.currentView === 'monthly') {
    renderReport('monthly');
  } else if (state.currentView === 'yearly') {
    renderReport('yearly');
  } else if (state.currentView === 'charts') {
    renderChart();
  }
}

function setView(view) {
  state.currentView = view;
  $('#add-transaction-btn').classList.toggle('hidden', view !== 'daily');
  $('#daily-summary').classList.toggle('hidden', view !== 'daily');
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === view);
  });

  ['daily', 'monthly', 'yearly', 'charts'].forEach((name) => {
    $(`#${name}-panel`).classList.toggle(
      'hidden',
      name !== view
    );
  });

  const titles = {
    daily: ['Daily Overview', 'A clear picture of your money, every day.'],
    monthly: ['Monthly Reports', 'Review your finances month by month.'],
    yearly: ['Yearly Reports', 'See your financial progress over the year.'],
    charts: ['Analytics', 'Compare your income and spending.']
  };

  $('#page-title').textContent = titles[view][0];
  $('#page-subtitle').textContent = titles[view][1];

  renderCurrentView();
}

async function loadTransactions() {
  try {
    const transactions = await request(API_URL);

    if (!Array.isArray(transactions)) {
      throw new Error('Unexpected response from the server.');
    }

    state.transactions = transactions;
    populateYearOptions();
    renderCurrentView();
  } catch (error) {
    console.error('Could not load transactions:', error);
    $('#transaction-list').innerHTML = renderEmptyRow(
      'Could not load transactions.',
      6
    );
  }
}

function openModal(transaction = null) {
  $('#transaction-form').reset();
  $('#form-message').textContent = '';

  $('#modal-title').textContent = transaction
    ? 'Edit transaction'
    : 'Add transaction';

  $('#transaction-form').dataset.editId = transaction
    ? transaction.id
    : '';

  $('#amount').value = transaction ? transaction.amount : '';
  $('#description').value = transaction ? transaction.description : '';
  $('#category').value = transaction ? transaction.category : '';
  $('#transaction-date').value = transaction ? transaction.date : today();

  const type = transaction ? transaction.type : 'credit';
  const radio = document.querySelector(`input[name="type"][value="${type}"]`);

  if (radio) radio.checked = true;

  $('#transaction-modal').classList.remove('hidden');
  $('#amount').focus();
}

function closeModal() {
  $('#transaction-modal').classList.add('hidden');
  $('#transaction-form').dataset.editId = '';
}

async function saveTransaction(event) {
  event.preventDefault();
  showMessage('');

  const form = event.currentTarget;
  const editId = form.dataset.editId;

  const transaction = {
    amount: $('#amount').value,
    description: $('#description').value.trim(),
    category: $('#category').value,
    type: document.querySelector('input[name="type"]:checked').value,
    date: $('#transaction-date').value
  };

  if (
    !transaction.description ||
    !transaction.category ||
    !transaction.date ||
    !Number.isFinite(Number(transaction.amount)) ||
    Number(transaction.amount) <= 0
  ) {
    showMessage('Please complete all fields with a valid amount.');
    return;
  }

  const saveButton = $('.submit-button');
  saveButton.disabled = true;
  saveButton.textContent = 'Saving...';

  try {
    if (editId) {
      await request(`${API_URL}/${encodeURIComponent(editId)}`, {
        method: 'PUT',
        body: JSON.stringify(transaction)
      });
    } else {
      await request(`${API_URL}/add`, {
        method: 'POST',
        body: JSON.stringify(transaction)
      });
    }

    closeModal();
    await loadTransactions();
  } catch (error) {
    showMessage(error.message || 'Unable to save transaction.');
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = 'Save transaction';
  }
}

async function deleteTransaction(id) {
  const transaction = state.transactions.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!transaction) return;

  if (!confirm(`Delete "${transaction.description}"? This cannot be undone.`)) {
    return;
  }

  try {
    await request(`${API_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });

    await loadTransactions();
  } catch (error) {
    alert(error.message || 'Unable to delete transaction.');
  }
}

function exportPDF(period) {
  if (!window.jspdf?.jsPDF) {
    alert('PDF library could not load. Check your internet connection.');
    return;
  }

  const transactions = filteredTransactions(period);
  const totals = calculateTotals(transactions);
  const title = period === 'monthly' ? 'Monthly Expense Report' : 'Yearly Expense Report';
  const periodValue = period === 'monthly'
    ? $('#report-month').value
    : $('#report-year').value;

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(18);
  pdf.text('FinTrack', 14, 18);

  pdf.setFontSize(12);
  pdf.text(title, 14, 28);
  pdf.setFontSize(10);
  pdf.text(`Period: ${periodValue}`, 14, 36);
  pdf.text(`Total income: ${money(totals.income)}`, 14, 46);
  pdf.text(`Total expenses: ${money(totals.expense)}`, 14, 53);
  pdf.text(`Net balance: ${money(totals.income - totals.expense)}`, 14, 60);

  let y = 73;
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(9);
  pdf.text('Date', 14, y);
  pdf.text('Description', 40, y);
  pdf.text('Category', 100, y);
  pdf.text('Type', 140, y);
  pdf.text('Amount (INR)', 165, y);
  y += 7;

  pdf.line(14, y - 4, 195, y - 4);

  transactions.forEach((item) => {
    if (y > pageHeight - 15) {
      pdf.addPage();
      y = 18;
    }

    pdf.text(String(item.date || '').slice(0, 10), 14, y);
    pdf.text(pdf.splitTextToSize(String(item.description || ''), 52)[0], 40, y);
    pdf.text(pdf.splitTextToSize(String(item.category || ''), 35)[0], 100, y);
    pdf.text(item.type === 'credit' ? 'Credit' : 'Debit', 140, y);
    pdf.text(Number(item.amount).toFixed(2), 165, y);
    y += 7;
  });

  pdf.save(`fintrack-${period}-${periodValue}.pdf`);
}

function initializeApp() {
  $('#daily-date').value = today();
  $('#transaction-date').value = today();
  $('#report-month').value = today().slice(0, 7);

  populateYearOptions();

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.view));
  });

  $('#add-transaction-btn').addEventListener('click', () => openModal());
  $('#close-modal').addEventListener('click', closeModal);
  $('#transaction-form').addEventListener('submit', saveTransaction);

  $('#transaction-modal').addEventListener('click', (event) => {
    if (event.target === $('#transaction-modal')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  $('#daily-date').addEventListener('change', renderDaily);
  $('#report-month').addEventListener('change', () => renderReport('monthly'));

  $('#report-year').addEventListener('change', () => renderReport('yearly'));
  $('#chart-year').addEventListener('change', renderChart);

  $('#monthly-pdf').addEventListener('click', () => exportPDF('monthly'));
  $('#yearly-pdf').addEventListener('click', () => exportPDF('yearly'));

  $('#transaction-list').addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit]');
    const deleteButton = event.target.closest('[data-delete]');

    if (editButton) {
      const transaction = state.transactions.find(
        (item) => Number(item.id) === Number(editButton.dataset.edit)
      );

      if (transaction) openModal(transaction);
    }

    if (deleteButton) {
      deleteTransaction(deleteButton.dataset.delete);
    }
  });

  loadTransactions();
}

document.addEventListener('DOMContentLoaded', initializeApp);
