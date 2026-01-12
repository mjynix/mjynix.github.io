const buttons = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const id = btn.dataset.tab;
    tabs.forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  });
});
