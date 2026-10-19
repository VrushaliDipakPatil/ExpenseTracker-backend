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
    const response = await fetch('http://localhost:3000/users/login', {
      method: 'POST',
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

    // Save basic user information for the current browser session.
    sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

    // Redirect to the expense dashboard after successful login.
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