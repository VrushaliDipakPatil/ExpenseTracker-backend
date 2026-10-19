
const signupForm = document.querySelector('#signup-form');
const signupMessage = document.querySelector('#signup-message');

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.querySelector('#signup-name').value.trim();
  const email = document.querySelector('#signup-email').value.trim();
  const password = document.querySelector('#signup-password').value;
  const confirmPassword = document.querySelector('#confirm-password').value;

  signupMessage.textContent = '';
  signupMessage.style.color = '#e15f68';

  if (!name || !email || !password || !confirmPassword) {
    signupMessage.textContent = 'Please fill in all fields.';
    return;
  }

  if (password.length < 8) {
    signupMessage.textContent =
      'Password must be at least 8 characters.';
    return;
  }

  if (password !== confirmPassword) {
    signupMessage.textContent = 'Passwords do not match.';
    return;
  }

  const submitButton = signupForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Creating account...';

  try {
    const response = await fetch('http://localhost:3000/users/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to create account.');
    }

    signupMessage.style.color = '#159b72';
    signupMessage.textContent =
      'Account created successfully! You can now log in.';

    signupForm.reset();
  } catch (error) {
    signupMessage.style.color = '#e15f68';
    signupMessage.textContent =
      error.message || 'Could not connect to the server.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Create account';
  }
});
