
const API_BASE_URL = 'http://127.0.0.1:3000';

const title = document.querySelector('#payment-title');
const message = document.querySelector('#payment-message');
const status = document.querySelector('#payment-status');

const backButton = document.querySelector('#back-to-dashboard');
const retryButton = document.querySelector('#retry-payment');
const checkButton = document.querySelector('#check-payment-status');

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order_id');

function hideAllButtons() {
  backButton.hidden = true;
  retryButton.hidden = true;
  checkButton.hidden = true;
}

async function verifyPayment() {
  hideAllButtons();

  if (!orderId) {
    title.textContent = 'Unable to verify payment';
    message.textContent = 'The payment order ID is missing.';
    status.textContent = 'Please return to FinTrack and try again.';
    backButton.hidden = false;
    return;
  }

  checkButton.disabled = true;
  checkButton.textContent = 'Checking...';

  try {
    const response = await fetch(`${API_BASE_URL}/orders/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      title.textContent = 'Please log in again';
      message.textContent = 'Your login session could not be verified.';
      status.textContent = 'Log in to check your membership.';
      backButton.textContent = 'Go to Login';
      backButton.onclick = () => {
        window.location.href = 'login.html';
      };
      backButton.hidden = false;
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed.');
    }

    if (data.status === 'SUCCESSFUL') {
      title.textContent = 'Payment Successful!';
      message.textContent =
        'Your ₹500 Premium Membership has been activated.';
      status.textContent =
        data.message || 'Welcome to Premium Membership.';
      status.style.color = '#159b72';

      backButton.hidden = false;

    } else if (data.status === 'FAILED') {
      title.textContent = 'Transaction Failed';
      message.textContent =
        'Your Premium Membership was not activated.';

      status.textContent =
        data.failureReason ||
        data.reason ||
        data.message ||
        'Your payment could not be completed.';

      status.style.color = '#e15f68';

      retryButton.hidden = false;
      backButton.hidden = false;

    } else {
      title.textContent = 'Payment Pending';
      message.textContent =
        'Your payment is still being processed.';

      status.textContent =
        'Please check the payment status again. Do not make another payment yet.';

      status.style.color = '#b8860b';

      checkButton.hidden = false;
      backButton.hidden = false;
    }

  } catch (error) {
    console.error('Payment verification error:', error);

    title.textContent = 'Could not verify payment';
    message.textContent =
      'We could not confirm your payment right now.';

    status.textContent =
      error.message || 'Please check your internet connection and try again.';

    checkButton.hidden = false;
    backButton.hidden = false;

  } finally {
    checkButton.disabled = false;
    checkButton.textContent = 'Check Payment Status';
  }
}

checkButton.addEventListener('click', verifyPayment);

retryButton.addEventListener('click', () => {
  window.location.href = 'index.html';
});

backButton.addEventListener('click', () => {
  window.location.href = 'index.html';
});

verifyPayment();