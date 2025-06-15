function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(response => response.json())
    .then(data => {
      const messageDiv = document.getElementById("message");
      if (data.message && data.user_id) {
        // ← Save the returned user_id in localStorage
        localStorage.setItem("userId", data.user_id);
        window.location.href = "frontend/index.html";
      } else if (data.error) {
        messageDiv.style.color = "red";
        messageDiv.innerText = data.error;
      }
    })
    .catch(error => {
      document.getElementById("message").innerText = "Something went wrong.";
      console.error("Error:", error);
    });
}
