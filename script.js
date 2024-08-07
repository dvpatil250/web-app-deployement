document.getElementById('myForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the values from the form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // Display the success message with the entered details
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = `<p>Submission Successful!</p><p>Name: ${name}</p><p>Email: ${email}</p>`;

    // Optionally clear the form fields
    document.getElementById('myForm').reset();
});
