document.addEventListener('DOMContentLoaded', () => {
  const contentArea = document.getElementById('content');
  const navLinks = document.querySelectorAll('.nav-link');

  // Function to load external module asynchronously
  async function loadModule(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Module failed to load.');
      const html = await response.text();
      contentArea.innerHTML = html;
    } catch {
      contentArea.innerHTML = `<div class="box"><p>Error loading content.</p></div>`;
    }
  }

  // Handle nav clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetModule = link.getAttribute('data-target');
      loadModule(targetModule);
    });
  });

  // Load default home screen initially
  loadModule('modules/home.html');
});
