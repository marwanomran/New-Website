document.getElementById('submitButton').addEventListener('click', function () {
    const query = document.getElementById('userInput').value;
    if (!query) return;

    fetch(`http://3dsoftwareemergence.zapto.org:11434/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('responseArea').textContent = data.response;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('responseArea').textContent = 'An error occurred. Please check the server logs.';
        });
});
