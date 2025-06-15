function register() {
  const username = document.getElementById("username").value;
  const password1 = document.getElementById("password1").value;
  const password2 = document.getElementById("password2").value;
  const msg = document.getElementById("message");

  if (password1 !== password2) {
    msg.style.color = "red";
    msg.innerText = "Passwords don't match.";
    return;
  }

  fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password1
    })
  })
  .then(res => res.json())
  .then(data => {
    const msg = document.getElementById("message");
    msg.style.color = data.message ? "green" : "red";
    msg.innerText = data.message || data.error || "Registration failed";
  })
  .catch(() => {
    document.getElementById("message").innerText = "Server error.";
  });
}
