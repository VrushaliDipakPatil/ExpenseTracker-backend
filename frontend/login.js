
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.querySelector('#login-email').value.trim();
  const password = document.querySelector('#login-password').value;

  loginMessage.textContent = '';
  loginMessage.style.color = '#e15f68';

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Logging in...';

  try {
    const response = await fetch('http://127.0.0.1:3000/users/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    loginMessage.style.color = '#159b72';
    loginMessage.textContent = `Welcome back, ${data.user.name}!`;

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);

  } catch (error) {
    loginMessage.style.color = '#e15f68';
    loginMessage.textContent =
      error.message || 'Could not connect to the server.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Log In';
  }
});


// Forgot Password elements
const forgotPasswordLink = document.querySelector('#forgot-password-link');
const forgotLinkSection = forgotPasswordLink.parentElement;

const forgotPasswordSection = document.querySelector('#forgot-password-section');
const forgotPasswordForm = document.querySelector('#forgot-password-form');
const forgotPasswordMessage = document.querySelector('#forgot-password-message');
const backToLogin = document.querySelector('#back-to-login');


// Show Forgot Password form
forgotPasswordLink.addEventListener('click', (event) => {
  event.preventDefault();

  loginForm.classList.add('hidden');
  forgotLinkSection.classList.add('hidden');
  forgotPasswordSection.classList.remove('hidden');
});


// Back to Login
backToLogin.addEventListener('click', (event) => {
  event.preventDefault();

  forgotPasswordSection.classList.add('hidden');
  loginForm.classList.remove('hidden');
  forgotLinkSection.classList.remove('hidden');
});


// Submit Forgot Password form
forgotPasswordForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.querySelector('#forgot-email').value.trim();
  const submitButton = forgotPasswordForm.querySelector('button[type="submit"]');

  forgotPasswordMessage.textContent = '';
  forgotPasswordMessage.style.color = '#e15f68';

  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const response = await axios.post(
      'http://127.0.0.1:3000/password/forgotpassword',
      { email }
    );

    forgotPasswordMessage.style.color = '#159b72';
    forgotPasswordMessage.textContent = response.data.message;

  } catch (error) {
    forgotPasswordMessage.style.color = '#e15f68';
    forgotPasswordMessage.textContent =
      error.response?.data?.message ||
      'Unable to send email. Please try again.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit';
  }
});
