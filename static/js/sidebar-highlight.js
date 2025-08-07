// Add CSS class to Developer Guides sidebar link
document.addEventListener("DOMContentLoaded", function () {
  // Function to find and highlight Developer Guides link
  function highlightDeveloperGuides() {
    // Find all menu list items (categories and links)
    const menuItems = document.querySelectorAll(".menu__list-item");

    menuItems.forEach((item) => {
      // Look for the category title within the list item
      const categoryLink = item.querySelector(".menu__link");
      if (categoryLink) {
        const linkText = categoryLink.textContent.trim();

        // Check if it's exactly "Developer Guides" and it's a category (has submenu)
        if (
          linkText === "Developer Guides" &&
          item.classList.contains("theme-doc-sidebar-item-category-level-1")
        ) {
          // Add our custom class to the category link only
          categoryLink.classList.add("developer-guides-cta");
        }
      }
    });
  }

  // Run immediately
  highlightDeveloperGuides();

  // Also run when the page changes (for SPA navigation)
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        highlightDeveloperGuides();
      }
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});
