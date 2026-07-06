document.addEventListener("DOMContentLoaded", () => {
  // Toggle header background on scroll
  const header = document.querySelector("header");
  if (header) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.style.backgroundColor = "rgba(4, 13, 10, 0.95)";
        header.style.borderBottom = "1px solid rgba(183, 228, 199, 0.2)";
      } else {
        header.style.backgroundColor = "rgba(4, 13, 10, 0.85)";
        header.style.borderBottom = "1px dashed rgba(183, 228, 199, 0.12)";
      }
    });
  }
});
